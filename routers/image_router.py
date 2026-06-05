import time
from fastapi import APIRouter, File, UploadFile, Form, Response
from fastapi.responses import JSONResponse

from services.image_service import ImageProcessor
from core.models import InvertImageRequest, PencilSketchRequest, GenerateIcoRequest
from core.logger import TelemetryLogger

router = APIRouter(prefix="/api/image", tags=["Image Tools"])
image_processor = ImageProcessor()

@router.post("/invert-image")
async def invert_image(
    file: UploadFile = File(...),
    amount: float = Form(1.0),
    channels: str = Form("rgb"),
    color_space: str = Form("RGB"),
    blend_mode: str = Form("normal")
):
    """
    Invert targeted color channels of an uploaded image.
    Supports advanced color spaces (RGB, HSV, LAB, GRAY) and blend modes (multiply, screen, overlay).
    """
    start_time = time.perf_counter()
    try:
        # 1. Pydantic parameter level validation
        req = InvertImageRequest(
            amount=amount,
            channels=channels,
            color_space=color_space,
            blend_mode=blend_mode
        )
        
        # 2. Read file payload
        data = await file.read()
        
        # 3. Process image using engine
        res = await image_processor.invert_image(
            input_data=data,
            amount=req.amount,
            channels=req.channels,
            color_space=req.color_space,
            blend_mode=req.blend_mode
        )
        
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        
        # 4. Construct response with observability headers
        return Response(
            content=res,
            media_type="image/png",
            headers={
                "X-Processing-Time-Ms": str(duration_ms),
                "X-Output-Size-Bytes": str(len(res))
            }
        )
    except Exception as e:
        TelemetryLogger.error("Failed to invert image.", exc_info=True, filename=file.filename)
        # Exception handler middleware will catch custom HagridErrors.
        # For general uncaught errors, we let them bubble or catch here.
        raise e

@router.post("/pencil-sketch")
async def pencil_sketch(
    file: UploadFile = File(...),
    intensity: float = Form(0.5),
    sketch_type: str = Form("gray"),
    line_thickness: int = Form(1),
    shadow_tint: str = Form("#000000")
):
    """
    Apply pencil sketch effect to an uploaded image.
    Exposes professional sketch controls including gray/color, stroke thickness, and shadow color tinting.
    """
    start_time = time.perf_counter()
    try:
        # 1. Validate
        req = PencilSketchRequest(
            intensity=intensity,
            sketch_type=sketch_type,
            line_thickness=line_thickness,
            shadow_tint=shadow_tint
        )
        
        # 2. Read file payload
        data = await file.read()
        
        # 3. Process sketch
        res = await image_processor.pencil_sketch(
            input_data=data,
            intensity=req.intensity,
            sketch_type=req.sketch_type,
            line_thickness=req.line_thickness,
            shadow_tint=req.shadow_tint
        )
        
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        
        return Response(
            content=res,
            media_type="image/png",
            headers={
                "X-Processing-Time-Ms": str(duration_ms),
                "X-Output-Size-Bytes": str(len(res))
            }
        )
    except Exception as e:
        TelemetryLogger.error("Failed to apply pencil sketch.", exc_info=True, filename=file.filename)
        raise e

@router.post("/generate-ico")
async def generate_ico(
    file: UploadFile = File(...),
    sizes: str = Form("16,32,48,64,128,256"),
    resize_filter: str = Form("lanczos")
):
    """
    Generate a high-quality multi-resolution ICO document.
    Allows specifying resizing interpolation filter.
    """
    start_time = time.perf_counter()
    try:
        # 1. Validate
        req = GenerateIcoRequest(
            sizes=sizes,
            resize_filter=resize_filter
        )
        
        # 2. Read payload
        data = await file.read()
        
        # 3. Process generating ICO
        res = await image_processor.generate_ico(
            input_data=data,
            sizes=req.sizes,
            resize_filter=req.resize_filter
        )
        
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        
        return Response(
            content=res,
            media_type="image/x-icon",
            headers={
                "Content-Disposition": "attachment; filename=favicon.ico",
                "X-Processing-Time-Ms": str(duration_ms),
                "X-Output-Size-Bytes": str(len(res))
            }
        )
    except Exception as e:
        TelemetryLogger.error("Failed to generate ICO.", exc_info=True, filename=file.filename)
        raise e
