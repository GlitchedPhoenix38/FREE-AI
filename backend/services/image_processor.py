import io
from PIL import Image
from typing import Tuple

MAX_IMAGE_SIZE = 4096


def validate_image(file_content: bytes) -> Tuple[bool, str]:
    try:
        img = Image.open(io.BytesIO(file_content))
        img.verify()
        return True, "Valid image"
    except Exception as e:
        return False, f"Invalid image: {str(e)}"


def process_image(file_content: bytes) -> Tuple[bytes, Tuple[int, int]]:
    img = Image.open(io.BytesIO(file_content))
    
    if img.mode not in ("RGB", "RGBA", "L"):
        img = img.convert("RGB")
    
    original_size = img.size
    
    if max(original_size) > MAX_IMAGE_SIZE:
        ratio = MAX_IMAGE_SIZE / max(original_size)
        new_size = (int(original_size[0] * ratio), int(original_size[1] * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    
    output = io.BytesIO()
    img.save(output, format="PNG")
    
    return output.getvalue(), original_size


def get_image_info(file_content: bytes) -> dict:
    img = Image.open(io.BytesIO(file_content))
    return {
        "width": img.width,
        "height": img.height,
        "mode": img.mode,
        "format": img.format
    }
