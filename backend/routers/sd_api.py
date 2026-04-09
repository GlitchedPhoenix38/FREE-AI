import httpx
import base64
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from typing import Optional, List
from PIL import Image
import threading
import queue

router = APIRouter(prefix="/sd-api", tags=["stable_diffusion"])

SD_API_URL = "http://localhost:7860"

from services.local_inference import local_generator

_model_loading = False
_download_queue = queue.Queue()
_progress_thread = None


def format_bytes(bytes_val):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_val < 1024:
            return f"{bytes_val:.1f}{unit}"
        bytes_val /= 1024
    return f"{bytes_val:.1f}TB"


async def check_sd_connection() -> dict:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{SD_API_URL}/sdapi/v1/ping")
            if response.status_code == 200:
                return {"connected": True, "status": "ok", "type": "automatic1111"}
            return {"connected": False, "status": "error", "type": None}
    except Exception:
        return {"connected": False, "status": "connection_failed", "type": None}


async def check_local_connection() -> dict:
    if local_generator.is_loaded():
        return {"connected": True, "status": "ok", "type": "local"}
    return {"connected": False, "status": "not_loaded", "type": "local"}


async def get_sd_models() -> List[str]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{SD_API_URL}/sdapi/v1/sd-models")
            if response.status_code == 200:
                models = response.json()
                return [m.get("title", m.get("model_name", "unknown")) for m in models]
            return []
    except Exception:
        return []


async def get_current_model() -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{SD_API_URL}/sdapi/v1/options")
            if response.status_code == 200:
                options = response.json()
                return options.get("sd_model_checkpoint", "default")
            return None
    except Exception:
        return None


@router.get("/status")
async def get_status():
    auto_check = await check_sd_connection()
    local_check = await check_local_connection()
    
    connected = auto_check["connected"] or local_check["connected"]
    download_status = local_generator.get_download_status()
    
    return {
        "connected": connected,
        "automatic1111": auto_check["connected"],
        "local": local_check["connected"],
        "local_loaded": local_generator.is_loaded(),
        "url": SD_API_URL,
        "current_model": await get_current_model() if auto_check["connected"] else None,
        "device": "cuda" if local_generator.device == "cuda" else "cpu",
        "download": download_status
    }


@router.get("/download-progress")
async def get_download_progress():
    progress = local_generator.get_download_status()
    return {
        "status": progress["status"],
        "progress": round(progress["progress"], 1),
        "downloaded": progress["downloaded"],
        "total": progress["total"],
        "downloaded_formatted": format_bytes(progress["downloaded"]),
        "total_formatted": format_bytes(progress["total"]),
        "error": progress["error"]
    }


@router.post("/load-local-model")
async def load_local_model(model_path: str = Form(default="runwayml/stable-diffusion-v1-5")):
    global _model_loading
    
    if local_generator.is_loaded():
        return JSONResponse({
            "success": True, 
            "message": "Model already loaded", 
            "loaded": True
        })
    
    if _model_loading:
        return JSONResponse({
            "success": False, 
            "message": "Model is already being loaded", 
            "loading": True
        })
    
    _model_loading = True
    local_generator.download_progress.status = "starting"
    local_generator.download_progress.reset()
    local_generator.download_progress.status = "downloading"
    
    def load_in_background():
        try:
            local_generator.load_model(model_path)
        except Exception as e:
            local_generator.download_progress.status = "error"
            local_generator.download_progress.error = str(e)
        finally:
            global _model_loading
            _model_loading = False
    
    thread = threading.Thread(target=load_in_background)
    thread.daemon = True
    thread.start()
    
    return JSONResponse({
        "success": True, 
        "message": "Model loading started",
        "loading": True
    })


@router.get("/models")
async def get_models():
    check = await check_sd_connection()
    if check["connected"]:
        models = await get_sd_models()
        current = await get_current_model()
        return {
            "models": models,
            "current": current,
            "type": "automatic1111"
        }
    
    return {
        "models": [],
        "current": None,
        "type": "none",
        "message": "No backend connected. Use /load-local-model to load local model."
    }


@router.post("/set-model")
async def set_model(model_name: str = Form(...)):
    check = await check_sd_connection()
    if not check["connected"]:
        raise HTTPException(status_code=503, detail="Stable Diffusion API not connected")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SD_API_URL}/sdapi/v1/options",
                json={"sd_model_checkpoint": model_name}
            )
            if response.status_code == 200:
                return {"success": True, "model": model_name}
            raise HTTPException(status_code=500, detail="Failed to set model")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Failed to connect to Stable Diffusion")


def image_to_base64(img: Image.Image) -> str:
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


@router.post("/generate")
async def generate_image(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: str = Form(default=""),
    strength: float = Form(default=0.75, ge=0.1, le=1.0),
    steps: int = Form(default=25, ge=1, le=150),
    guidance_scale: float = Form(default=7.5, ge=1.0, le=30.0),
    seed: int = Form(default=-1),
    model: Optional[str] = Form(default=None)
):
    auto_check = await check_sd_connection()
    
    if auto_check["connected"]:
        if model:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    await client.post(
                        f"{SD_API_URL}/sdapi/v1/options",
                        json={"sd_model_checkpoint": model}
                    )
            except Exception:
                pass
        
        image_content = await image.read()
        base64_image = base64.b64encode(image_content).decode("utf-8")
        
        payload = {
            "init_images": [base64_image],
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "strength": strength,
            "steps": steps,
            "cfg_scale": guidance_scale,
            "seed": seed if seed != -1 else -1,
            "sampler_name": "Euler a",
            "denoising_strength": strength,
            "include_init_images": True,
        }
        
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{SD_API_URL}/sdapi/v1/img2img",
                    json=payload
                )
                
                if response.status_code != 200:
                    raise HTTPException(status_code=500, detail=f"Generation failed: {response.text}")
                
                result = response.json()
                
                if "images" in result and len(result["images"]) > 0:
                    generated_image = result["images"][0]
                    return {
                        "success": True,
                        "image": f"data:image/png;base64,{generated_image}",
                        "seed": result.get("parameters", {}).get("seed", seed),
                        "parameters": {
                            "prompt": prompt,
                            "negative_prompt": negative_prompt,
                            "strength": strength,
                            "steps": steps,
                            "guidance_scale": guidance_scale,
                            "seed": seed if seed != -1 else -1
                        }
                    }
                else:
                    raise HTTPException(status_code=500, detail="No image in response")
                    
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Generation timeout - try reducing steps or image size")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Failed to connect to Stable Diffusion: {str(e)}")
    
    if not local_generator.is_loaded():
        download_status = local_generator.get_download_status()
        if download_status["status"] == "downloading":
            raise HTTPException(
                status_code=503, 
                detail=f"Still downloading model... {round(download_status['progress'], 1)}% complete. Please wait."
            )
        raise HTTPException(
            status_code=503, 
            detail="No AI backend connected. Click 'Load Local Model' to download and start offline generation."
        )
    
    image_content = await image.read()
    pil_image = Image.open(io.BytesIO(image_content)).convert("RGB")
    
    try:
        generated_image, used_seed = local_generator.generate_img2img(
            image=pil_image,
            prompt=prompt,
            negative_prompt=negative_prompt,
            strength=strength,
            guidance_scale=guidance_scale,
            num_inference_steps=steps,
            seed=seed
        )
        
        return {
            "success": True,
            "image": f"data:image/png;base64,{image_to_base64(generated_image)}",
            "seed": used_seed,
            "parameters": {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "strength": strength,
                "steps": steps,
                "guidance_scale": guidance_scale,
                "seed": used_seed
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/txt2img")
async def txt2img(
    prompt: str = Form(...),
    negative_prompt: str = Form(default=""),
    steps: int = Form(default=25, ge=1, le=150),
    guidance_scale: float = Form(default=7.5, ge=1.0, le=30.0),
    width: int = Form(default=512, ge=256, le=1024),
    height: int = Form(default=512, ge=256, le=1024),
    seed: int = Form(default=-1),
    model: Optional[str] = Form(default=None)
):
    auto_check = await check_sd_connection()
    
    if auto_check["connected"]:
        if model:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    await client.post(
                        f"{SD_API_URL}/sdapi/v1/options",
                        json={"sd_model_checkpoint": model}
                    )
            except Exception:
                pass
        
        payload = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "steps": steps,
            "cfg_scale": guidance_scale,
            "width": width,
            "height": height,
            "seed": seed if seed != -1 else -1,
            "sampler_name": "Euler a",
        }
        
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{SD_API_URL}/sdapi/v1/txt2img",
                    json=payload
                )
                
                if response.status_code != 200:
                    raise HTTPException(status_code=500, detail=f"Generation failed: {response.text}")
                
                result = response.json()
                
                if "images" in result and len(result["images"]) > 0:
                    generated_image = result["images"][0]
                    return {
                        "success": True,
                        "image": f"data:image/png;base64,{generated_image}",
                        "seed": result.get("parameters", {}).get("seed", seed),
                        "parameters": {
                            "prompt": prompt,
                            "negative_prompt": negative_prompt,
                            "steps": steps,
                            "guidance_scale": guidance_scale,
                            "width": width,
                            "height": height,
                            "seed": seed if seed != -1 else -1
                        }
                    }
                else:
                    raise HTTPException(status_code=500, detail="No image in response")
                    
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Generation timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Failed to connect: {str(e)}")
    
    if not local_generator.is_loaded():
        raise HTTPException(
            status_code=503, 
            detail="No AI backend connected. Call /load-local-model first to load local model."
        )
    
    try:
        generated_image, used_seed = local_generator.generate_txt2img(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            guidance_scale=guidance_scale,
            num_inference_steps=steps,
            seed=seed
        )
        
        return {
            "success": True,
            "image": f"data:image/png;base64,{image_to_base64(generated_image)}",
            "seed": used_seed,
            "parameters": {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "steps": steps,
                "guidance_scale": guidance_scale,
                "width": width,
                "height": height,
                "seed": used_seed
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
