import uvicorn
# Author: Pawan Simha
from fastapi import FastAPI, File, UploadFile, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from PIL import Image
import io
import cv2
import numpy as np
import os
import logging
import zipfile
import fitz  # PyMuPDF
from datetime import datetime
from typing import List

# Initialize Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("hagrid-production")

app = FastAPI()

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "An internal ML error occurred. Please check the image format."},
    )

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/invert-image")
async def invert_image(
    file: UploadFile = File(...),
    amount: float = Form(1.0),
    channels: str = Form("rgb") # e.g. "r,g,b" or "rb"
):
    """
    Invert image colors (Negative effect) with adjustable amount and channel selection.
    """
    input_data = await file.read()
    nparr = np.frombuffer(input_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Invert colors
    inverted_img = cv2.bitwise_not(img)

    # Channel-specific masking
    target_channels = [c.strip().lower() for c in channels.split(',')]
    if len(target_channels) < 3: # If not all channels are selected
        mask = np.copy(img)
        # OpenCV uses BGR
        if 'b' in target_channels: mask[:,:,0] = inverted_img[:,:,0]
        if 'g' in target_channels: mask[:,:,1] = inverted_img[:,:,1]
        if 'r' in target_channels: mask[:,:,2] = inverted_img[:,:,2]
        inverted_img = mask

    # Apply amount (blending)
    if amount < 1.0:
        inverted_img = cv2.addWeighted(inverted_img, amount, img, 1.0 - amount, 0)

    # Convert back to bytes
    res, thumb = cv2.imencode(".png", inverted_img)
    return Response(content=thumb.tobytes(), media_type="image/png")

@app.post("/image-to-pdf")
async def image_to_pdf(files: List[UploadFile] = File(...)):
    """
    Converts multiple images into a single PDF document.
    """
    images = []
    for file in files:
        data = await file.read()
        img = Image.open(io.BytesIO(data))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        images.append(img)
    
    if not images:
        return JSONResponse(status_code=400, content={"message": "No images uploaded"})
    
    pdf_io = io.BytesIO()
    images[0].save(pdf_io, format='PDF', save_all=True, append_images=images[1:])
    pdf_io.seek(0)
    
    return Response(
        content=pdf_io.getvalue(), 
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=converted.pdf"}
    )

@app.post("/pdf-to-image")
async def pdf_to_image(file: UploadFile = File(...), format: str = Form("png")):
    """
    Converts PDF pages into images. Returns a ZIP if multiple pages.
    """
    input_data = await file.read()
    doc = fitz.open(stream=input_data, filetype="pdf")
    
    images = []
    for page in doc:
        pix = page.get_pixmap()
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img_io = io.BytesIO()
        img.save(img_io, format=format.upper())
        images.append(img_io.getvalue())
    
    if len(images) == 1:
        return Response(content=images[0], media_type=f"image/{format}")
    
    # Create ZIP for multiple pages
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w') as zip_file:
        for i, img_data in enumerate(images):
            zip_file.writestr(f"page_{i+1}.{format}", img_data)
    
    zip_io.seek(0)
    return Response(
        content=zip_io.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=pdf_pages.zip"}
    )

@app.post("/bulk-convert")
async def bulk_convert(files: List[UploadFile] = File(...), format: str = Form("png")):
    """
    Converts multiple images to a target format and returns them in a ZIP.
    """
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w') as zip_file:
        for file in files:
            data = await file.read()
            img = Image.open(io.BytesIO(data))
            img_io = io.BytesIO()
            # Handle transparency for JPEG
            if format.lower() == 'jpeg' and img.mode in ('RGBA', 'LA'):
                img = img.convert('RGB')
            img.save(img_io, format=format.upper())
            zip_file.writestr(f"{os.path.splitext(file.filename)[0]}.{format}", img_io.getvalue())
    
    zip_io.seek(0)
    return Response(
        content=zip_io.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=converted_images.zip"}
    )

@app.post("/pencil-sketch")
async def pencil_sketch(file: UploadFile = File(...), intensity: float = Form(0.5)):
    """
    Applies a professional pencil sketch filter using OpenCV.
    """
    input_data = await file.read()
    nparr = np.frombuffer(input_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # 1. Convert to Gray
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Invert Gray Image
    inverted_gray = cv2.bitwise_not(gray_img)
    
    # 3. Apply Gaussian Blur
    # Intensity affects the blur radius
    blur_radius = int(intensity * 100)
    if blur_radius % 2 == 0: blur_radius += 1
    blurred_img = cv2.GaussianBlur(inverted_gray, (blur_radius, blur_radius), 0)
    
    # 4. Invert Blurred Image
    inverted_blurred = cv2.bitwise_not(blurred_img)
    
    # 5. Pencil Sketch (Color Dodge)
    sketch_img = cv2.divide(gray_img, inverted_blurred, scale=256.0)
    
    res, thumb = cv2.imencode(".png", sketch_img)
    return Response(content=thumb.tobytes(), media_type="image/png")

@app.post("/generate-ico")
async def generate_ico(
    file: UploadFile = File(...),
    sizes: str = Form("16,32,48,64,128,256")
):
    """
    Combines an image into a multi-resolution ICO file.
    """
    try:
        input_data = await file.read()
        img = Image.open(io.BytesIO(input_data))
        
        # Parse sizes
        size_list = []
        for s in sizes.split(','):
            try:
                val = int(s.strip())
                size_list.append((val, val))
            except ValueError:
                continue
        
        if not size_list:
            size_list = [(32, 32)]
            
        ico_io = io.BytesIO()
        # Pillow handles the internal formats (PNG for >256, BMP for others)
        img.save(ico_io, format='ICO', sizes=size_list)
        ico_io.seek(0)
        
        return Response(
            content=ico_io.getvalue(),
            media_type="image/x-icon",
            headers={"Content-Disposition": "attachment; filename=favicon.ico"}
        )
    except Exception as e:
        logger.error(f"ICO Generation Error: {e}")
        return JSONResponse(status_code=500, content={"message": "Failed to generate ICO file."})

# Serve the main index.html at root
@app.get("/")
async def read_index():
    return FileResponse('index.html')

# Serve all other static files relative to project root
# Order matters: API routes first, then static files
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"Starting Hagrid Production Server on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=True
    )
