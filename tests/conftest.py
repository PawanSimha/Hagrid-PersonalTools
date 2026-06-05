import pytest
import io
import cv2
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from app import app

@pytest.fixture(scope="session")
def client():
    """Provides a synchronous FastAPI TestClient to verify API endpoints."""
    with TestClient(app) as c:
        yield c

@pytest.fixture
def dummy_png_bytes():
    """Generates a simple 100x100 RGB color block image in PNG format."""
    # Create a 100x100 blue canvas with a red diagonal line
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    img[:, :] = [255, 0, 0] # BGR Blue
    cv2.line(img, (0, 0), (99, 99), (0, 0, 255), 3) # Red line
    
    success, encoded = cv2.imencode(".png", img)
    assert success
    return encoded.tobytes()

@pytest.fixture
def dummy_jpeg_bytes():
    """Generates a simple 100x100 green block image in JPEG format."""
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    img[:, :] = [0, 255, 0] # BGR Green
    success, encoded = cv2.imencode(".jpg", img)
    assert success
    return encoded.tobytes()

@pytest.fixture
def dummy_pdf_bytes(dummy_png_bytes):
    """Generates a valid 1-page PDF document containing our dummy image."""
    img = Image.open(io.BytesIO(dummy_png_bytes))
    pdf_io = io.BytesIO()
    img.save(pdf_io, format="PDF")
    return pdf_io.getvalue()
