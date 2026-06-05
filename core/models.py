import re
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

class InvertImageRequest(BaseModel):
    amount: float = Field(default=1.0, ge=0.0, le=1.0, description="Inversion strength multiplier")
    channels: List[str] = Field(default_factory=lambda: ["r", "g", "b"], description="Channels to invert")
    color_space: str = Field(default="RGB", description="Target color space for transformation")
    blend_mode: str = Field(default="normal", description="Blend mode between original and inverted")

    @field_validator("channels", mode="before")
    @classmethod
    def parse_channels(cls, v):
        if isinstance(v, str):
            # Split comma separated channels e.g. "r,g,b"
            cleaned = [c.strip().lower() for c in v.split(",") if c.strip()]
            return cleaned
        return v

    @field_validator("channels")
    @classmethod
    def validate_channels(cls, v):
        allowed = {"r", "g", "b"}
        for ch in v:
            if ch not in allowed:
                raise ValueError(f"Invalid channel: {ch}. Allowed: r, g, b")
        return v

    @field_validator("color_space")
    @classmethod
    def validate_color_space(cls, v):
        val = v.upper().strip()
        allowed = {"RGB", "HSV", "LAB", "GRAY"}
        if val not in allowed:
            raise ValueError(f"Invalid color space: {val}. Allowed: {', '.join(allowed)}")
        return val

    @field_validator("blend_mode")
    @classmethod
    def validate_blend_mode(cls, v):
        val = v.lower().strip()
        allowed = {"normal", "multiply", "screen", "overlay"}
        if val not in allowed:
            raise ValueError(f"Invalid blend mode: {val}. Allowed: {', '.join(allowed)}")
        return val


class PencilSketchRequest(BaseModel):
    intensity: float = Field(default=0.5, ge=0.0, le=1.0, description="Sketch effect intensity/blur radius scaling")
    sketch_type: str = Field(default="gray", description="Type of sketch: 'gray' or 'color'")
    line_thickness: int = Field(default=1, ge=1, le=5, description="Thickness of the sketched lines")
    shadow_tint: str = Field(default="#000000", description="Hex color tint for shadows")

    @field_validator("sketch_type")
    @classmethod
    def validate_sketch_type(cls, v):
        val = v.lower().strip()
        if val not in {"gray", "color"}:
            raise ValueError(f"Invalid sketch_type: {val}. Allowed: 'gray', 'color'")
        return val

    @field_validator("shadow_tint")
    @classmethod
    def validate_shadow_tint(cls, v):
        val = v.strip()
        if not re.match(r"^#(?:[0-9a-fA-F]{3}){1,2}$", val):
            raise ValueError(f"Invalid hex color format: {val}")
        return val


class GenerateIcoRequest(BaseModel):
    sizes: List[int] = Field(default_factory=lambda: [16, 32, 48, 64, 128, 256], description="Sizes to embed in the ICO file")
    resize_filter: str = Field(default="lanczos", description="Resizing interpolation filter")

    @field_validator("sizes", mode="before")
    @classmethod
    def parse_sizes(cls, v):
        if isinstance(v, str):
            cleaned = []
            for item in v.split(","):
                item_str = item.strip()
                if item_str.isdigit():
                    cleaned.append(int(item_str))
            return cleaned
        return v

    @field_validator("sizes")
    @classmethod
    def validate_sizes(cls, v):
        if not v:
            raise ValueError("Sizes list cannot be empty")
        for size in v:
            if size <= 0 or size > 1024:
                raise ValueError(f"Invalid ICO size: {size}. Must be between 1 and 1024")
        return sorted(list(set(v)))

    @field_validator("resize_filter")
    @classmethod
    def validate_resize_filter(cls, v):
        val = v.lower().strip()
        allowed = {"lanczos", "bilinear", "nearest", "bicubic"}
        if val not in allowed:
            raise ValueError(f"Invalid filter: {val}. Allowed: {', '.join(allowed)}")
        return val


class ImageToPdfRequest(BaseModel):
    page_size: str = Field(default="A4", description="Output PDF Page Size target")
    margin: int = Field(default=0, ge=0, le=100, description="Page border margin in pixels")
    auto_rotate: bool = Field(default=True, description="Automatically rotate page to match image aspect ratio")

    @field_validator("page_size")
    @classmethod
    def validate_page_size(cls, v):
        val = v.upper().strip()
        allowed = {"A4", "LETTER", "ORIGINAL"}
        if val not in allowed:
            raise ValueError(f"Invalid page_size: {val}. Allowed: A4, LETTER, ORIGINAL")
        return val


class PdfToImageRequest(BaseModel):
    format: str = Field(default="png", description="Output image format")
    pages: str = Field(default="all", description="Pages to convert: 'all', '1,2', '1-3,5'")
    dpi: int = Field(default=150, ge=72, le=600, description="DPI rendering resolution")

    @field_validator("format")
    @classmethod
    def validate_format(cls, v):
        val = v.lower().strip()
        allowed = {"png", "jpeg", "webp"}
        if val not in allowed:
            raise ValueError(f"Invalid format: {val}. Allowed: {', '.join(allowed)}")
        return val

    @field_validator("pages")
    @classmethod
    def validate_pages_pattern(cls, v):
        val = v.lower().strip()
        if val == "all":
            return val
        # Check pattern: positive integers, comma-separated, or hyphens e.g. "1-5,7,9"
        if not re.match(r"^[0-9]+(?:-[0-9]+)?(?:,[0-9]+(?:-[0-9]+)?)*$", val):
            raise ValueError(f"Invalid page range specification: '{val}'. Use format like '1-3,5' or 'all'")
        return val


class BulkConvertRequest(BaseModel):
    format: str = Field(default="png", description="Target image conversion format")
    quality: int = Field(default=85, ge=1, le=100, description="Output compression quality")
    resize_width: Optional[int] = Field(default=None, ge=1, le=10000, description="Resize width constraint")
    resize_height: Optional[int] = Field(default=None, ge=1, le=10000, description="Resize height constraint")

    @field_validator("format")
    @classmethod
    def validate_format(cls, v):
        val = v.lower().strip()
        allowed = {"png", "jpeg", "webp", "bmp"}
        if val not in allowed:
            raise ValueError(f"Invalid format: {val}. Allowed: {', '.join(allowed)}")
        # Standardize jpeg/jpg
        if val == "jpg":
            return "jpeg"
        return val
