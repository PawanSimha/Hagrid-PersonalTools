import io
import fitz  # PyMuPDF
import zipfile
import os
from PIL import Image
from typing import List
from anyio import to_thread
from fastapi import UploadFile

async def process_image_to_pdf(files_data: List[bytes]) -> bytes:
    return await to_thread.run_sync(_image_to_pdf_sync, files_data)

def _image_to_pdf_sync(files_data: List[bytes]) -> bytes:
    images = []
    for data in files_data:
        img = Image.open(io.BytesIO(data))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        images.append(img)
    
    if not images:
        return None
    
    pdf_io = io.BytesIO()
    images[0].save(pdf_io, format='PDF', save_all=True, append_images=images[1:])
    return pdf_io.getvalue()

async def process_pdf_to_image(pdf_data: bytes, format: str) -> bytes:
    return await to_thread.run_sync(_pdf_to_image_sync, pdf_data, format)

def _pdf_to_image_sync(pdf_data: bytes, format: str) -> bytes:
    doc = fitz.open(stream=pdf_data, filetype="pdf")
    images = []
    for page in doc:
        pix = page.get_pixmap()
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img_io = io.BytesIO()
        img.save(img_io, format=format.upper())
        images.append(img_io.getvalue())
    
    if len(images) == 1:
        return images[0], False
    
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w') as zip_file:
        for i, img_data in enumerate(images):
            zip_file.writestr(f"page_{i+1}.{format}", img_data)
    return zip_io.getvalue(), True

async def process_bulk_convert(files: List[tuple], format: str) -> bytes:
    return await to_thread.run_sync(_bulk_convert_sync, files, format)

def _bulk_convert_sync(files: List[tuple], format: str) -> bytes:
    # files is a list of (filename, data)
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w') as zip_file:
        for filename, data in files:
            img = Image.open(io.BytesIO(data))
            img_io = io.BytesIO()
            if format.lower() == 'jpeg' and img.mode in ('RGBA', 'LA'):
                img = img.convert('RGB')
            img.save(img_io, format=format.upper())
            zip_file.writestr(f"{os.path.splitext(filename)[0]}.{format}", img_io.getvalue())
    return zip_io.getvalue()
