import uvicorn
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from core.logger import get_logger
from routers import image_router, pdf_router

logger = get_logger()
app = FastAPI(title="Hagrid Professional Suite")

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
        content={"message": "An internal ML error occurred. Please check the file format."},
    )

# Enable CORS
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
    "Password-Generator", "Pencil-Sketch", "Privacy-Blur", "QR-Generator"
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

@app.get("/")
async def read_index():
    return FileResponse('index.html')

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"Starting Hagrid Optimized Server on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=True
    )
