from fastapi import APIRouter, File, UploadFile, Form, Response
from fastapi.responses import JSONResponse
from services.image_service import process_invert_image, process_pencil_sketch, generate_ico_file
from core.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/api/image", tags=["Image Tools"])

@router.post("/invert-image")
async def invert_image(
    file: UploadFile = File(...),
    amount: float = Form(1.0),
    channels: str = Form("rgb")
):
    try:
        data = await file.read()
        res = await process_invert_image(data, amount, channels)
        return Response(content=res, media_type="image/png")
    except Exception as e:
        logger.error(f"Invert Error: {e}")
        return JSONResponse(status_code=500, content={"message": "Failed to invert image."})

@router.post("/pencil-sketch")
async def pencil_sketch(file: UploadFile = File(...), intensity: float = Form(0.5)):
    try:
        data = await file.read()
        res = await process_pencil_sketch(data, intensity)
        return Response(content=res, media_type="image/png")
    except Exception as e:
        logger.error(f"Sketch Error: {e}")
        return JSONResponse(status_code=500, content={"message": "Failed to apply pencil sketch."})

@router.post("/generate-ico")
async def generate_ico(
    file: UploadFile = File(...),
    sizes: str = Form("16,32,48,64,128,256")
):
    try:
        data = await file.read()
        res = await generate_ico_file(data, sizes)
        return Response(
            content=res,
            media_type="image/x-icon",
            headers={"Content-Disposition": "attachment; filename=favicon.ico"}
        )
    except Exception as e:
        logger.error(f"ICO Error: {e}")
        return JSONResponse(status_code=500, content={"message": "Failed to generate ICO."})
