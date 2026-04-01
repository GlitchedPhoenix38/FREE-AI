import httpx
import base64
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List

router = APIRouter(prefix="/sd-api", tags=["stable_diffusion"])

SD_API_URL = "http://localhost:7860"


async def check_sd_connection() -> dict:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{SD_API_URL}/sdapi/v1/ping")
            if response.status_code == 200:
                return {"connected": True, "status": "ok"}
            return {"connected": False, "status": "error"}
    except Exception:
        return {"connected": False, "status": "connection_failed"}


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
    check = await check_sd_connection()
    current_model = None
    
    if check["connected"]:
        current_model = await get_current_model()
    
    return {
        "connected": check["connected"],
        "url": SD_API_URL,
        "current_model": current_model
    }


@router.get("/models")
async def get_models():
    check = await check_sd_connection()
    if not check["connected"]:
        raise HTTPException(status_code=503, detail="Stable Diffusion API not connected")
    
    models = await get_sd_models()
    current = await get_current_model()
    
    return {
        "models": models,
        "current": current
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
    check = await check_sd_connection()
    if not check["connected"]:
        raise HTTPException(status_code=503, detail="Stable Diffusion API not connected")
    
    image_content = await image.read()
    
    if model:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                await client.post(
                    f"{SD_API_URL}/sdapi/v1/options",
                    json={"sd_model_checkpoint": model}
                )
        except Exception:
            pass
    
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
        "steps": steps,
        "cfg_scale": guidance_scale,
        "seed": seed if seed != -1 else -1,
    }
    
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{SD_API_URL}/sdapi/v1/img2img",
                json=payload
            )
            
            if response.status_code != 200:
                error_detail = response.text
                raise HTTPException(status_code=500, detail=f"Generation failed: {error_detail}")
            
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
    check = await check_sd_connection()
    if not check["connected"]:
        raise HTTPException(status_code=503, detail="Stable Diffusion API not connected")
    
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
