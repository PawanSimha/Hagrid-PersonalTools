<p align="center">
  <img src="images/logo.png" width="140" alt="Hagrid Logo">
</p>

<h1 align="center">Hagrid</h1>
<p align="center">
  <em>Local-first developer utility suite for image processing, document conversion, and developer tooling.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-2.0.0+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/OpenCV-4.10+-5C3EE8?style=flat-square&logo=opencv&logoColor=white" alt="OpenCV">
  <img src="https://img.shields.io/badge/license-GPLv3-blue?style=flat-square" alt="License">
</p>

---

## Quick Start

### One-Click (Windows)
Double-click `Hagrid.bat` -- it creates a venv, installs deps, starts the server, and opens your browser.

### Manual
```bash
git clone https://github.com/PawanSimha/Hagrid.git
cd Hagrid
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:8000**.

### Docker
```bash
docker compose up --build
```

Open **http://localhost:8000**.

---

## Features

### Image Processing (9 tools)
| Tool | Description |
|:---|:---|
| Image Compressor | Reduce file size with configurable quality |
| Format Converter | Convert between PNG, JPG, WebP, BMP |
| Image to ICO | Generate multi-resolution favicons |
| Pencil Sketch | AI-powered sketch effect |
| Image Inverter | Channel-aware inversion with blend modes |
| Aspect Ratio Cropper | Precision cropping for social platforms |
| Circle Crop | One-click circular masking |
| Border Radius | Adjustable rounded corners |
| Privacy Blur | Blur sensitive content |

### Document & Bulk (3 tools)
| Tool | Description |
|:---|:---|
| Image to PDF | Compile images into a single PDF |
| PDF to Image | Extract PDF pages as images |
| Bulk Converter | Batch-convert + resize images |

### Developer Utilities (5 tools)
| Tool | Description |
|:---|:---|
| Password Generator | High-entropy passwords |
| QR Generator | Custom QR codes |
| JSON Formatter | Validate, format, and minify JSON |
| Palette Extractor | Extract dominant colors from images |
| Image Collage | Combine images into a grid collage |

---

## Tech Stack

| Layer | Technology |
|:---|---:|
| Backend | Python 3.10+ / FastAPI |
| Frontend | HTML5, CSS3, Vanilla JS |
| Image Processing | OpenCV 4.x, NumPy, Pillow |
| Document Processing | PyMuPDF |
| Async Offloading | anyio `to_thread` |
| Runtime | Uvicorn |

---

## Project Structure

```
Hagrid/
├── app.py                  # FastAPI entry point (6 API routes + 404 catch-all)
├── Hagrid.bat              # One-click Windows launcher
├── core/                   # Logger, exceptions, models
├── routers/                # API route modules
├── services/               # Business logic (OpenCV, Pillow, PyMuPDF)
├── tests/                  # 23-test pytest suite
├── index.html              # Landing page with Plausible analytics + cookie consent
├── global.js               # Theme toggle, search, keyboard shortcuts
├── style.css               # Glassmorphism design system
├── images/                 # Brand assets
├── {Tool}/                 # 17 tool directories (static SPAs)
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Container orchestration
├── requirements.txt        # Version-pinned Python dependencies
├── .env.example            # Environment config template
├── robots.txt              # 2026 AI-aware crawler directives
├── sitemap.xml             # 20-URL SEO sitemap
├── manifest.json           # PWA manifest
└── LICENSE                 # GNU GPL v3
```

---

## API Endpoints

All endpoints return `X-Processing-Time-Ms` and `X-Output-Size-Bytes` headers.

### Image Routes (`/api/image/`)
| Method | Endpoint | Description |
|:---|:---|---:|
| POST | `/invert-image` | Invert color channels with blend modes |
| POST | `/pencil-sketch` | Apply pencil sketch effect |
| POST | `/generate-ico` | Generate multi-resolution favicon |

### Document Routes (`/api/doc/`)
| Method | Endpoint | Description |
|:---|:---|---:|
| POST | `/image-to-pdf` | Compile images into a PDF |
| POST | `/pdf-to-image` | Render PDF pages as images |
| POST | `/bulk-convert` | Batch image conversion + resize |

---

## Testing

```bash
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

---

## Author

**Pawan Simha R**
- GitHub: [@PawanSimha](https://github.com/PawanSimha)
- LinkedIn: [linkedin.com/in/pawansimha](https://linkedin.com/in/pawansimha)
- X: [@iampawansimha](https://x.com/iampawansimha)

---

## License

Distributed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for details.