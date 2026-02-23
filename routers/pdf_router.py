from fastapi import APIRouter, File, UploadFile, Form, Response, JSONResponse
from typing import List
from services.pdf_service import process_image_to_pdf, process_pdf_to_image, process_bulk_convert
from core.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/api/doc", tags=["Document & Bulk Tools"])

@router.post("/image-to-pdf")
async def image_to_pdf(files: List[UploadFile] = File(...)):
    try:
        files_data = []
        for file in files:
            files_data.append(await file.read())
        
        res = await process_image_to_pdf(files_data)
        if not res:
            return JSONResponse(status_code=400, content={"message": "No images uploaded"})
            
        return Response(
            content=res, 
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=converted.pdf"}
        )
    except Exception as e:
        logger.error(f"Image-to-PDF error: {e}")
        return JSONResponse(status_code=500, content={"message": "Failed to convert images to PDF."})

@router.post("/pdf-to-image")
async def pdf_to_image(file: UploadFile = File(...), format: str = Form("png")):
    try:
        data = await file.read()
        res, is_zip = await process_pdf_to_image(data, format)
        
        media_type = "application/zip" if is_zip else f"image/{format}"
        filename = "pdf_pages.zip" if is_zip else f"page_1.{format}"
        
        return Response(
            content=res,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"PDF-to-Image error: {e}")
        return JSONResponse(status_code=500, content={"message": "Failed to convert PDF to images."})

@router.post("/bulk-convert")
async def bulk_convert(files: List[UploadFile] = File(...), format: str = Form("png")):
    try:
        files_to_process = []
        for file in files:
            files_to_process.append((file.filename, await file.read()))
            
        res = await process_bulk_convert(files_to_process, format)
        return Response(
            content=res,
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=converted_images.zip"}
        )
    except Exception as e:
        logger.error(f"Bulk Convert error: {e}")
        return JSONResponse(status_code=500, content={"message": "Failed to batch convert images."})
