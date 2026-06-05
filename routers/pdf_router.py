import time
from fastapi import APIRouter, File, UploadFile, Form, Response
from fastapi.responses import JSONResponse
from typing import List, Optional

from services.pdf_service import DocProcessor
from core.models import ImageToPdfRequest, PdfToImageRequest, BulkConvertRequest
from core.logger import TelemetryLogger

router = APIRouter(prefix="/api/doc", tags=["Document & Bulk Tools"])
doc_processor = DocProcessor()

@router.post("/image-to-pdf")
async def image_to_pdf(
    files: List[UploadFile] = File(...),
    page_size: str = Form("A4"),
    margin: int = Form(0),
    auto_rotate: bool = Form(True)
):
    """
    Compile a sequence of uploaded images into a single professional PDF.
    Supports letter, A4, margins, and auto rotation page formats.
    """
    start_time = time.perf_counter()
    try:
        # 1. Validate
        req = ImageToPdfRequest(
            page_size=page_size,
            margin=margin,
            auto_rotate=auto_rotate
        )
        
        # 2. Read all files
        files_data = []
        for file in files:
            files_data.append(await file.read())
            
        # 3. Process compiling PDF
        res = await doc_processor.image_to_pdf(
            files_data=files_data,
            page_size=req.page_size,
            margin=req.margin,
            auto_rotate=req.auto_rotate
        )
        
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        
        return Response(
            content=res,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=converted.pdf",
                "X-Processing-Time-Ms": str(duration_ms),
                "X-Output-Size-Bytes": str(len(res))
            }
        )
    except Exception as e:
        TelemetryLogger.error("Failed to compile images to PDF.", exc_info=True)
        raise e

@router.post("/pdf-to-image")
async def pdf_to_image(
    file: UploadFile = File(...),
    format: str = Form("png"),
    pages: str = Form("all"),
    dpi: int = Form(150)
):
    """
    Render target pages of a PDF document to image format.
    If multiple pages match selection, a ZIP archive containing all pages is returned.
    """
    start_time = time.perf_counter()
    try:
        # 1. Validate
        req = PdfToImageRequest(
            format=format,
            pages=pages,
            dpi=dpi
        )
        
        # 2. Read payload
        data = await file.read()
        
        # 3. Render pages
        res, is_zip = await doc_processor.pdf_to_image(
            pdf_data=data,
            format=req.format,
            pages=req.pages,
            dpi=req.dpi
        )
        
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        media_type = "application/zip" if is_zip else f"image/{req.format}"
        filename = "pdf_pages.zip" if is_zip else f"page_1.{req.format}"
        
        return Response(
            content=res,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-Processing-Time-Ms": str(duration_ms),
                "X-Output-Size-Bytes": str(len(res))
            }
        )
    except Exception as e:
        TelemetryLogger.error("Failed to render PDF to image.", exc_info=True, filename=file.filename)
        raise e

@router.post("/bulk-convert")
async def bulk_convert(
    files: List[UploadFile] = File(...),
    format: str = Form("png"),
    quality: int = Form(85),
    resize_width: Optional[int] = Form(None),
    resize_height: Optional[int] = Form(None)
):
    """
    Perform high-performance batch conversions across multiple images.
    Returns a ZIP bundle with scaled and format converted results.
    """
    start_time = time.perf_counter()
    try:
        # 1. Validate
        req = BulkConvertRequest(
            format=format,
            quality=quality,
            resize_width=resize_width,
            resize_height=resize_height
        )
        
        # 2. Read files
        files_to_process = []
        for file in files:
            files_to_process.append((file.filename, await file.read()))
            
        # 3. Run conversion
        res = await doc_processor.bulk_convert(
            files=files_to_process,
            format=req.format,
            quality=req.quality,
            resize_width=req.resize_width,
            resize_height=req.resize_height
        )
        
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        
        return Response(
            content=res,
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=converted_images.zip",
                "X-Processing-Time-Ms": str(duration_ms),
                "X-Output-Size-Bytes": str(len(res))
            }
        )
    except Exception as e:
        TelemetryLogger.error("Failed batch image conversion.", exc_info=True)
        raise e
