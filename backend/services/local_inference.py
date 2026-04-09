import torch
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
from PIL import Image
import io
import base64
from typing import Optional
import logging
import threading
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class DownloadProgress:
    total_size: int = 0
    downloaded: int = 0
    status: str = "idle"
    error: Optional[str] = None
    
    def get_progress(self) -> float:
        if self.total_size == 0:
            return 0
        return (self.downloaded / self.total_size) * 100
    
    def reset(self):
        self.total_size = 0
        self.downloaded = 0
        self.status = "idle"
        self.error = None


class LocalSDGenerator:
    def __init__(self, model_path: str = "runwayml/stable-diffusion-v1-5"):
        self.pipe = None
        self.model_path = model_path
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.loaded = False
        self.download_progress = DownloadProgress()
        
    def load_model(self, model_path: Optional[str] = None):
        if model_path:
            self.model_path = model_path
            
        if self.loaded:
            return True
            
        try:
            logger.info(f"Loading model {self.model_path} on {self.device}...")
            self.download_progress.status = "downloading"
            self.download_progress.total_size = 0
            self.download_progress.downloaded = 0
            
            def progress_callback(current, total, *args):
                self.download_progress.downloaded = current
                if total > 0:
                    self.download_progress.total_size = total
            
            self.pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
                self.model_path,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                safety_checker=None,
                requires_safety_checker=False,
                use_safetensors=True,
            )
            
            self.pipe.scheduler = DPMSolverMultistepScheduler.from_config(
                self.pipe.scheduler.config
            )
            
            self.pipe = self.pipe.to(self.device)
            
            if self.device == "cuda":
                try:
                    self.pipe.enable_xformers_memory_efficient_attention()
                except Exception:
                    pass
                
            self.loaded = True
            self.download_progress.status = "complete"
            self.download_progress.downloaded = self.download_progress.total_size
            logger.info("Model loaded successfully")
            return True
            
        except Exception as e:
            self.download_progress.status = "error"
            self.download_progress.error = str(e)
            logger.error(f"Failed to load model: {e}")
            return False
            
    def is_loaded(self) -> bool:
        return self.loaded and self.pipe is not None
    
    def get_download_status(self) -> dict:
        return {
            "status": self.download_progress.status,
            "progress": self.download_progress.get_progress(),
            "downloaded": self.download_progress.downloaded,
            "total": self.download_progress.total_size,
            "error": self.download_progress.error
        }
    
    def generate_img2img(
        self,
        image: Image.Image,
        prompt: str,
        negative_prompt: str = "",
        strength: float = 0.75,
        guidance_scale: float = 7.5,
        num_inference_steps: int = 25,
        seed: int = -1
    ) -> tuple[Image.Image, int]:
        if not self.is_loaded():
            raise RuntimeError("Model not loaded. Call load_model() first.")
            
        if seed == -1:
            seed = torch.randint(0, 2**32 - 1, (1,)).item()
            
        generator = torch.Generator(device=self.device).manual_seed(seed)
        
        result = self.pipe(
            prompt=prompt,
            image=image,
            negative_prompt=negative_prompt,
            strength=strength,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            generator=generator
        )
        
        return result.images[0], seed
    
    def generate_txt2img(
        self,
        prompt: str,
        negative_prompt: str = "",
        width: int = 512,
        height: int = 512,
        guidance_scale: float = 7.5,
        num_inference_steps: int = 25,
        seed: int = -1
    ) -> tuple[Image.Image, int]:
        if not self.is_loaded():
            raise RuntimeError("Model not loaded. Call load_model() first.")
            
        if seed == -1:
            seed = torch.randint(0, 2**32 - 1, (1,)).item()
            
        generator = torch.Generator(device=self.device).manual_seed(seed)
        
        result = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            generator=generator
        )
        
        return result.images[0], seed
    
    def unload(self):
        if self.pipe:
            del self.pipe
            self.pipe = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        self.loaded = False
        self.download_progress.reset()
        logger.info("Model unloaded")

local_generator = LocalSDGenerator()
