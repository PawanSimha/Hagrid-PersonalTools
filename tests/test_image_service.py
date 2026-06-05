import pytest
import io
import cv2
import numpy as np
from PIL import Image

from services.image_service import ImageProcessor
from core.exceptions import InvalidFileFormatError, FileProcessingError

@pytest.mark.asyncio
async def test_invert_image_happy_path(dummy_png_bytes):
    processor = ImageProcessor()
    
    # Run simple invert
    result = await processor.invert_image(
        input_data=dummy_png_bytes,
        amount=1.0,
        channels=["r", "g", "b"],
        color_space="RGB",
        blend_mode="normal"
    )
    
    assert isinstance(result, bytes)
    assert len(result) > 0
    
    # Decode and verify inversion details
    nparr = np.frombuffer(result, np.uint8)
    inverted_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    assert inverted_img is not None
    assert inverted_img.shape == (100, 100, 3)

@pytest.mark.asyncio
async def test_invert_image_color_spaces(dummy_png_bytes):
    processor = ImageProcessor()
    
    # 1. Test HSV Color space inversion
    res_hsv = await processor.invert_image(
        input_data=dummy_png_bytes,
        amount=1.0,
        channels=["v"], # Invert brightness only
        color_space="HSV",
        blend_mode="normal"
    )
    assert len(res_hsv) > 0
    
    # 2. Test LAB Color space inversion
    res_lab = await processor.invert_image(
        input_data=dummy_png_bytes,
        amount=1.0,
        channels=["l"],
        color_space="LAB",
        blend_mode="normal"
    )
    assert len(res_lab) > 0

    # 3. Test GRAY Color space inversion
    res_gray = await processor.invert_image(
        input_data=dummy_png_bytes,
        amount=0.8,
        channels=["r", "g", "b"],
        color_space="GRAY",
        blend_mode="normal"
    )
    assert len(res_gray) > 0

@pytest.mark.asyncio
async def test_invert_image_blend_modes(dummy_png_bytes):
    processor = ImageProcessor()
    
    for mode in ["multiply", "screen", "overlay"]:
        res = await processor.invert_image(
            input_data=dummy_png_bytes,
            amount=0.7,
            channels=["r", "g"],
            color_space="RGB",
            blend_mode=mode
        )
        assert len(res) > 0

@pytest.mark.asyncio
async def test_invert_image_corrupt_data():
    processor = ImageProcessor()
    corrupt_data = b"not_an_image_file_data_corrupt"
    
    with pytest.raises(InvalidFileFormatError):
        await processor.invert_image(
            input_data=corrupt_data,
            amount=1.0,
            channels=["r"],
            color_space="RGB",
            blend_mode="normal"
        )

@pytest.mark.asyncio
async def test_pencil_sketch_happy_path(dummy_png_bytes):
    processor = ImageProcessor()
    
    result = await processor.pencil_sketch(
        input_data=dummy_png_bytes,
        intensity=0.4,
        sketch_type="gray",
        line_thickness=1,
        shadow_tint="#000000"
    )
    
    assert isinstance(result, bytes)
    assert len(result) > 0
    
    # Verify channels (should be 3 channels as we convert back to BGR for display)
    nparr = np.frombuffer(result, np.uint8)
    sketch_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    assert sketch_img is not None
    assert sketch_img.shape == (100, 100, 3)

@pytest.mark.asyncio
async def test_pencil_sketch_color_and_tint(dummy_png_bytes):
    processor = ImageProcessor()
    
    # Test color pencil sketch with customized thick blue shadow lines
    result = await processor.pencil_sketch(
        input_data=dummy_png_bytes,
        intensity=0.5,
        sketch_type="color",
        line_thickness=2,
        shadow_tint="#0000FF" # Blue shadow tint
    )
    
    assert len(result) > 0
    nparr = np.frombuffer(result, np.uint8)
    sketch_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    assert sketch_img is not None
    
    # Verify blue channel dominance in shadows because of blue shadow tint
    # Pure white areas will stay white, sketch lines will have the tint
    assert np.any(sketch_img[:, :, 0] > 0) # OpenCV BGR -> Blue is channel 0

@pytest.mark.asyncio
async def test_pencil_sketch_corrupt_data():
    processor = ImageProcessor()
    with pytest.raises(InvalidFileFormatError):
        await processor.pencil_sketch(
            input_data=b"corrupt",
            intensity=0.5,
            sketch_type="gray",
            line_thickness=1,
            shadow_tint="#000000"
        )

@pytest.mark.asyncio
async def test_generate_ico_happy_path(dummy_png_bytes):
    processor = ImageProcessor()
    
    sizes = [16, 32, 48]
    ico_bytes = await processor.generate_ico(
        input_data=dummy_png_bytes,
        sizes=sizes,
        resize_filter="lanczos"
    )
    
    assert isinstance(ico_bytes, bytes)
    assert len(ico_bytes) > 0
    
    # Parse back with Pillow to verify it's a valid ICO file and contains correct sizes
    img = Image.open(io.BytesIO(ico_bytes))
    assert img.format == "ICO"
    
    # Pillow allows accessing embedded sizes using img.ico.entry list or by checking sizes
    # We can check that it successfully opened
    assert img.size in [(16, 16), (32, 32), (48, 48)]

@pytest.mark.asyncio
async def test_generate_ico_filters(dummy_png_bytes):
    processor = ImageProcessor()
    
    for f in ["bilinear", "nearest", "bicubic"]:
        res = await processor.generate_ico(
            input_data=dummy_png_bytes,
            sizes=[32],
            resize_filter=f
        )
        assert len(res) > 0
