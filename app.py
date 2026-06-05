
import uvicorn
import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from core.logger import TelemetryLogger
from core.exceptions import register_exception_handlers
from routers import image_router, pdf_router

app = FastAPI(
    title="Hagrid Professional Suite",
    description="High-performance production-grade image and document processing toolkit.",
    version="2.0.0"
)

# 1. Register Central Exception Handlers (Domain-specific & Pydantic)
register_exception_handlers(app)

# 2. General Fallback Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    TelemetryLogger.error(f"Unhandled Global Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An unexpected server error occurred during processing. Please review your file format and dimensions.",
            "details": {"error_type": type(exc).__name__, "error_msg": str(exc)}
        },
    )

# 3. Global Telemetry & Security Middleware
@app.middleware("http")
async def add_security_headers_and_telemetry(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    method = request.method
    
    start_time = time.perf_counter()
    TelemetryLogger.info(f"Incoming Request: {method} {path} from IP {client_ip}")
    
    try:
        response = await call_next(request)
        
        # Add Standard Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        duration = round((time.perf_counter() - start_time) * 1000.0, 2)
        TelemetryLogger.info(
            f"Request Completed: {method} {path} - Status {response.status_code} in {duration}ms"
        )
        return response
    except Exception as e:
        duration = round((time.perf_counter() - start_time) * 1000.0, 2)
        TelemetryLogger.error(
            f"Request Failed: {method} {path} - Failed in {duration}ms with error: {e}",
            exc_info=True
        )
        raise

# 4. Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTER ROUTERS ---
app.include_router(image_router.router)
app.include_router(pdf_router.router)

# --- WHITELISTED STATIC SERVING ---
tools = [
    "Aspect-Ratio-Cropper", "Border-Radius", "Bulk-Converter", "Circle-Crop",
    "Format-Converter", "Image-Compressor", "Image-Inverter", "Image-to-ICO",
    "Image-to-PDF", "JSON-Formatter", "PDF-to-Image", "Palette-Extractor",
    "Password-Generator", "Pencil-Sketch", "Privacy-Blur", "QR-Generator", "Image-Collage"
]

for tool in tools:
    if os.path.isdir(tool):
        app.mount(f"/{tool}", StaticFiles(directory=tool, html=True), name=tool)

if os.path.exists("images"):
    app.mount("/images", StaticFiles(directory="images"), name="images")

@app.get("/style.css")
async def get_style(): return FileResponse("style.css")

@app.get("/global.js")
async def get_global_js(): return FileResponse("global.js")

@app.get("/manifest.json")
async def get_manifest(): return FileResponse("manifest.json")

@app.get("/robots.txt")
async def get_robots(): return FileResponse("robots.txt")

@app.get("/sitemap.xml")
async def get_sitemap(): return FileResponse("sitemap.xml")

@app.get("/404.html")
async def get_404(): return FileResponse("404.html")

@app.get("/contact.html")
async def get_contact(): return FileResponse("contact.html")

@app.get("/privacy-policy.html")
async def get_privacy_policy(): return FileResponse("privacy-policy.html")

@app.get("/index.html")
async def get_index_redirect():
    return RedirectResponse(url="/", status_code=301)

@app.get("/")
async def read_index():
    return FileResponse('index.html')

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    
    TelemetryLogger.info(f"Starting Hagrid Optimized Server on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=True
    )
