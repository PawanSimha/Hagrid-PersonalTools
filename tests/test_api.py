import io
import pytest

def test_invert_image_endpoint(client, dummy_png_bytes):
    # Call invert-image
    response = client.post(
        "/api/image/invert-image",
        data={
            "amount": "0.8",
            "channels": "r,g",
            "color_space": "RGB",
            "blend_mode": "overlay"
        },
        files={"file": ("test.png", dummy_png_bytes, "image/png")}
    )
    
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "image/png"
    
    # Assert observability headers
    assert "X-Processing-Time-Ms" in response.headers
    assert "X-Output-Size-Bytes" in response.headers
    assert int(response.headers["X-Output-Size-Bytes"]) > 0

def test_invert_image_validation_errors(client, dummy_png_bytes):
    # Call with invalid out-of-bounds amount (e.g., 2.5, must be <= 1.0)
    response = client.post(
        "/api/image/invert-image",
        data={
            "amount": "2.5",
            "channels": "r,g",
            "color_space": "INVALID_COLORSPACE"
        },
        files={"file": ("test.png", dummy_png_bytes, "image/png")}
    )
    
    assert response.status_code == 400
    json_data = response.json()
    assert json_data["status"] == "error"
    assert "validation_errors" in json_data["details"]

def test_pencil_sketch_endpoint(client, dummy_png_bytes):
    response = client.post(
        "/api/image/pencil-sketch",
        data={
            "intensity": "0.6",
            "sketch_type": "color",
            "line_thickness": "2",
            "shadow_tint": "#123456"
        },
        files={"file": ("test.png", dummy_png_bytes, "image/png")}
    )
    
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "image/png"
    assert "X-Processing-Time-Ms" in response.headers

def test_generate_ico_endpoint(client, dummy_png_bytes):
    response = client.post(
        "/api/image/generate-ico",
        data={
            "sizes": "16,48",
            "resize_filter": "bilinear"
        },
        files={"file": ("test.png", dummy_png_bytes, "image/png")}
    )
    
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "image/x-icon"
    assert "attachment; filename=favicon.ico" in response.headers["Content-Disposition"]

def test_image_to_pdf_endpoint(client, dummy_png_bytes, dummy_jpeg_bytes):
    files = [
        ("files", ("img1.png", dummy_png_bytes, "image/png")),
        ("files", ("img2.jpg", dummy_jpeg_bytes, "image/jpeg"))
    ]
    response = client.post(
        "/api/doc/image-to-pdf",
        data={
            "page_size": "A4",
            "margin": "15",
            "auto_rotate": "true"
        },
        files=files
    )
    
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "application/pdf"
    assert "attachment; filename=converted.pdf" in response.headers["Content-Disposition"]

def test_pdf_to_image_endpoint(client, dummy_pdf_bytes):
    response = client.post(
        "/api/doc/pdf-to-image",
        data={
            "format": "png",
            "pages": "1",
            "dpi": "100"
        },
        files={"file": ("doc.pdf", dummy_pdf_bytes, "application/pdf")}
    )
    
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "image/png"

def test_bulk_convert_endpoint(client, dummy_png_bytes):
    files = [
        ("files", ("img1.png", dummy_png_bytes, "image/png")),
        ("files", ("img2.png", dummy_png_bytes, "image/png"))
    ]
    response = client.post(
        "/api/doc/bulk-convert",
        data={
            "format": "webp",
            "quality": "90",
            "resize_width": "200"
        },
        files=files
    )
    
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "application/zip"
    assert "attachment; filename=converted_images.zip" in response.headers["Content-Disposition"]
