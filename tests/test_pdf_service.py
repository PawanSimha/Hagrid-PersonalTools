import pytest
import io
import zipfile
from PIL import Image

from services.pdf_service import DocProcessor
from core.exceptions import InvalidFileFormatError, FileProcessingError

@pytest.mark.asyncio
async def test_image_to_pdf_happy_path(dummy_png_bytes, dummy_jpeg_bytes):
    processor = DocProcessor()
    
    result = await processor.image_to_pdf(
        files_data=[dummy_png_bytes, dummy_jpeg_bytes],
        page_size="A4",
        margin=10,
        auto_rotate=True
    )
    
    assert isinstance(result, bytes)
    assert len(result) > 0
    
    # Read back using PyMuPDF to check page count
    import fitz
    doc = fitz.open(stream=result, filetype="pdf")
    assert len(doc) == 2
    doc.close()

@pytest.mark.asyncio
async def test_image_to_pdf_layouts(dummy_png_bytes):
    processor = DocProcessor()
    
    for size in ["A4", "LETTER", "ORIGINAL"]:
        result = await processor.image_to_pdf(
            files_data=[dummy_png_bytes],
            page_size=size,
            margin=5,
            auto_rotate=True
        )
        assert len(result) > 0

@pytest.mark.asyncio
async def test_image_to_pdf_corrupt_data():
    processor = DocProcessor()
    
    with pytest.raises(InvalidFileFormatError):
        await processor.image_to_pdf(
            files_data=[b"corrupt_image_data_block"],
            page_size="A4",
            margin=0,
            auto_rotate=False
        )

@pytest.mark.asyncio
async def test_pdf_to_image_single_page(dummy_pdf_bytes):
    processor = DocProcessor()
    
    # Render single page PDF to PNG
    img_data, is_zip = await processor.pdf_to_image(
        pdf_data=dummy_pdf_bytes,
        format="png",
        pages="1",
        dpi=150
    )
    
    assert not is_zip
    assert isinstance(img_data, bytes)
    assert len(img_data) > 0
    
    # Verify image opens
    img = Image.open(io.BytesIO(img_data))
    assert img.format == "PNG"

@pytest.mark.asyncio
async def test_pdf_to_image_multiple_pages(dummy_png_bytes):
    processor = DocProcessor()
    
    # Build 2-page PDF
    pdf_bytes = await processor.image_to_pdf(
        files_data=[dummy_png_bytes, dummy_png_bytes],
        page_size="ORIGINAL",
        margin=0,
        auto_rotate=False
    )
    
    # Render both pages
    zip_data, is_zip = await processor.pdf_to_image(
        pdf_data=pdf_bytes,
        format="jpeg",
        pages="all",
        dpi=72
    )
    
    assert is_zip
    assert isinstance(zip_data, bytes)
    assert len(zip_data) > 0
    
    # Verify it is a valid zip containing 2 images
    with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
        namelist = z.namelist()
        assert "page_1.jpeg" in namelist
        assert "page_2.jpeg" in namelist

@pytest.mark.asyncio
async def test_pdf_to_image_range_selector(dummy_png_bytes):
    processor = DocProcessor()
    
    # Build a 3-page PDF
    pdf_bytes = await processor.image_to_pdf(
        files_data=[dummy_png_bytes, dummy_png_bytes, dummy_png_bytes],
        page_size="ORIGINAL",
        margin=0,
        auto_rotate=False
    )
    
    # Test range filtering "1,3" -> pages 1 and 3 (index 0 and 2)
    zip_data, is_zip = await processor.pdf_to_image(
        pdf_data=pdf_bytes,
        format="png",
        pages="1,3",
        dpi=96
    )
    
    assert is_zip
    with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
        namelist = z.namelist()
        assert "page_1.png" in namelist
        assert "page_3.png" in namelist
        assert "page_2.png" not in namelist

@pytest.mark.asyncio
async def test_pdf_to_image_invalid_range(dummy_pdf_bytes):
    processor = DocProcessor()
    
    with pytest.raises(InvalidFileFormatError):
        await processor.pdf_to_image(
            pdf_data=dummy_pdf_bytes,
            format="png",
            pages="5-10", # Single page PDF, page 5 is out of bounds
            dpi=150
        )

@pytest.mark.asyncio
async def test_bulk_convert_happy_path(dummy_png_bytes, dummy_jpeg_bytes):
    processor = DocProcessor()
    
    files = [("image1.png", dummy_png_bytes), ("image2.jpg", dummy_jpeg_bytes)]
    zip_data = await processor.bulk_convert(
        files=files,
        format="webp",
        quality=80,
        resize_width=150,
        resize_height=150
    )
    
    assert isinstance(zip_data, bytes)
    assert len(zip_data) > 0
    
    # Verify contents of zip
    with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
        namelist = z.namelist()
        assert "image1.webp" in namelist
        assert "image2.webp" in namelist
        
        # Verify sizes inside zip
        with z.open("image1.webp") as f:
            img = Image.open(f)
            assert img.size == (150, 150)
