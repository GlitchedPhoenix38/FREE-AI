import httpx
import base64
import json
import asyncio
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

router = APIRouter(prefix="/cloud", tags=["cloud_ai"])

async def download_and_encode_image(url: str) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        if response.status_code == 200:
            return base64.b64encode(response.content).decode("utf-8")
        raise HTTPException(status_code=500, detail="Failed to download image")

@router.post("/openai-edit")
async def openai_edit(
    request: dict,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    api_key = x_api_key
    if not api_key:
        raise HTTPException(status_code=400, detail="OpenAI API key not provided")
    
    image = request.get("image", "")
    prompt = request.get("prompt", "")
    size = request.get("size", "1024x1024")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "dall-e-3",
                "image": image,
                "prompt": prompt,
                "n": 1,
                "size": size
            }
            
            response = await client.post(
                "https://api.openai.com/v1/images/edits",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"OpenAI API error: {response.text}")
            
            result = response.json()
            
            if result.get("data") and len(result["data"]) > 0:
                image_url = result["data"][0].get("url")
                if image_url:
                    encoded = await download_and_encode_image(image_url)
                    return {
                        "success": True,
                        "image": f"data:image/png;base64,{encoded}",
                        "provider": "openai",
                        "parameters": {
                            "model": "dall-e-3",
                            "size": size
                        }
                    }
            
            raise HTTPException(status_code=500, detail="No image in response")
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="OpenAI request timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Failed to connect to OpenAI: {str(e)}")

@router.post("/replicate")
async def replicate_generate(
    request: dict,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    api_key = x_api_key
    if not api_key:
        raise HTTPException(status_code=400, detail="Replicate API key not provided")
    
    image = request.get("image", "")
    prompt = request.get("prompt", "")
    strength = request.get("strength", 0.75)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "Authorization": f"Token {api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "version": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                "input": {
                    "prompt": prompt,
                    "image": image,
                    "strength": strength,
                    "guidance_scale": 7.5
                }
            }
            
            create_response = await client.post(
                "https://api.replicate.com/v1/predictions",
                headers=headers,
                json=payload
            )
            
            if create_response.status_code not in (200, 201):
                raise HTTPException(status_code=500, detail=f"Replicate API error: {create_response.text}")
            
            prediction = create_response.json()
            prediction_url = prediction.get("urls", {}).get("get")
            
            if not prediction_url:
                prediction_url = f"https://api.replicate.com/v1/predictions/{prediction.get('id')}"
            
            for _ in range(90):
                await asyncio.sleep(3)
                status_response = await client.get(prediction_url, headers=headers)
                status_data = status_response.json()
                
                if status_data.get("status") == "succeeded":
                    output = status_data.get("output")
                    if output and len(output) > 0:
                        encoded = await download_and_encode_image(output[0])
                        return {
                            "success": True,
                            "image": f"data:image/png;base64,{encoded}",
                            "provider": "replicate",
                            "parameters": {
                                "model": "SDXL",
                                "strength": strength
                            }
                        }
                elif status_data.get("status") == "failed":
                    raise HTTPException(status_code=500, detail="Replicate generation failed")
            
            raise HTTPException(status_code=504, detail="Replicate request timeout - still processing")
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Replicate request timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Failed to connect to Replicate: {str(e)}")

@router.post("/leonardo")
async def leonardo_generate(
    request: dict,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    api_key = x_api_key
    if not api_key:
        raise HTTPException(status_code=400, detail="Leonardo.ai API key not provided")
    
    image = request.get("image", "")
    prompt = request.get("prompt", "")
    strength = request.get("strength", 0.75)
    model_id = request.get("modelId", "ac3cf714-f9b8-450e-a5e8-91f63ed6c7a3")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            init_image_id = await upload_to_leonardo(client, headers, image)
            
            payload = {
                "prompt": prompt,
                "strength": strength,
                "modelId": model_id,
                "init_image_id": init_image_id,
                "guidance_scale": 7,
                "prompt_strength": 0.8,
                "num_images": 1
            }
            
            create_response = await client.post(
                "https://cloud.leonardo.ai/api/v1/generation/image-editing",
                headers=headers,
                json=payload
            )
            
            if create_response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Leonardo API error: {create_response.text}")
            
            result = create_response.json()
            generation_id = result.get("generationsByPk", {}).get("id")
            
            if not generation_id:
                raise HTTPException(status_code=500, detail="No generation ID returned")
            
            for _ in range(90):
                await asyncio.sleep(4)
                status_response = await client.get(
                    f"https://cloud.leonardo.ai/api/v1/generation/{generation_id}",
                    headers=headers
                )
                status_data = status_response.json()
                
                generations = status_data.get("generationsByPk", {}).get("generations", [])
                
                for gen in generations:
                    if gen.get("status") == "COMPLETE":
                        image_url = gen.get("url")
                        if image_url:
                            encoded = await download_and_encode_image(image_url)
                            return {
                                "success": True,
                                "image": f"data:image/png;base64,{encoded}",
                                "provider": "leonardo",
                                "parameters": {
                                    "modelId": model_id,
                                    "strength": strength
                                }
                            }
                    elif gen.get("status") == "FAILED":
                        raise HTTPException(status_code=500, detail="Leonardo generation failed")
            
            raise HTTPException(status_code=504, detail="Leonardo request timeout")
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Leonardo request timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Failed to connect to Leonardo: {str(e)}")

async def upload_to_leonardo(client: httpx.AsyncClient, headers: dict, base64_image: str) -> str:
    import uuid
    
    image_data = base64_image.split(',')[1] if ',' in base64_image else base64_image
    image_bytes = base64.b64decode(image_data)
    
    files = {
        "file": (f"image_{uuid.uuid4()}.png", image_bytes, "image/png")
    }
    
    response = await client.post(
        "https://cloud.leonardo.ai/api/v1/init-image",
        headers={"Authorization": headers["Authorization"]},
        files=files
    )
    
    if response.status_code == 200:
        result = response.json()
        return result.get("initImages", [{}])[0].get("id", "")
    
    raise HTTPException(status_code=500, detail="Failed to upload image to Leonardo")
