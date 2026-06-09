# Product Requirements Document: Hagrid

| Metadata | Value |
|:---|---:|
| **Product Name** | Hagrid Professional Utility Suite |
| **Version** | 2.0.0 |
| **Status** | Stable / Maintained |
| **Target Release** | v2.0.0 (live) |
| **Author / Owner** | Pawan Simha R |
| **Repository** | [github.com/PawanSimha/Hagrid](https://github.com/PawanSimha/Hagrid) |
| **License** | GNU GPL v3.0 |

---

## Executive Summary

Hagrid is a free, open-source, local-first developer utility suite that bundles 17+ browser-based tools for image processing, document conversion, and developer productivity into a single FastAPI-powered application. Unlike SaaS alternatives that require uploading sensitive data to remote servers, Hagrid processes everything on the user's machine with zero network egress. It eliminates tool fragmentation by providing a unified dashboard with search, dark/light theme, and keyboard shortcuts, all without requiring sign-up or exposing user data to third parties.

---

## Problem Statement

Developers routinely encounter three categories of friction in their daily workflows:

1. **Privacy Leakage via SaaS Tools.** Every image compression, format conversion, or PDF export sent to a web service exposes potentially sensitive data (screenshots with credentials, internal documents, client assets) to third-party servers. Hagrid solves this by processing everything locally.

2. **Tool Fragmentation.** Tasks like favicon generation, JSON formatting, QR code creation, and image filtering exist across different websites, each with different UX patterns, ads, and usage limits. Hagrid consolidates 17 tools into one consistent interface.

3. **No Lightweight Offline Alternative.** Desktop applications like Photoshop or GIMP are overpowered for simple operations (invert, resize, format convert). CLI tools like ImageMagick have a steep learning curve. Hagrid offers a middle ground: a browser-based UI with zero configuration beyond `pip install`.

---

## Target Personas

| Persona | Description | Primary Use Case | Technical Level | Auth Required |
|:---|---|:---|---:|---:|
| **Individual Developer** | Full-stack or frontend engineer frequently processing images, generating favicons, or converting documents for web projects | Bulk image conversion, ICO generation, JSON formatting | Intermediate-Advanced | None |
| **Design-Engineer Hybrid** | Designer who also codes; needs quick visual filters (pencil sketch, color inversion, palette extraction) without launching heavy design tools | Pencil sketch, palette extraction, aspect-ratio cropping | Intermediate | None |
| **Privacy-Conscious Power User** | Anyone handling sensitive screenshots (passwords, PII, internal dashboards) who refuses to upload to third-party services | Privacy blur, local image-to-PDF, offline QR generation | Beginner-Intermediate | None |

**Authentication:** Zero user authentication. Deliberate design choice -- the server binds to `127.0.0.1` by default, eliminating attack surface and deployment complexity.

---

## Success Metrics (OKRs / KPIs)

| KPI | Target | Measurement Method | Current Baseline |
|:---|---|:---|---:|
| **Time-to-Value (first operation)** | < 30 seconds from launch | User timing (clone to first result) | ~15 seconds (pip install + startup) |
| **Image Inversion Latency (1000x1000 px)** | < 500 ms | Server-side `X-Processing-Time-Ms` header | ~120 ms |
| **Pencil Sketch Latency (1000x1000 px)** | < 800 ms | Server-side `X-Processing-Time-Ms` header | ~200 ms |
| **PDF Compilation (5 images -> PDF)** | < 3 seconds | Server-side timing | ~1.5 seconds |
| **Test Suite Pass Rate** | 100% | `pytest` CI gate | 23/23 passing |
| **Number of Tools Available** | >= 15 | Manual count | 17 |
| **Zero Data Exfiltration** | 100% local processing | Code audit | Confirmed -- no external API calls in services/ |

---

## Core Features & Requirements (MoSCoW Method)

### P0, Must Have (Currently Implemented)

| Feature | Module | Endpoint / Route | Description |
|:---|---|:---|---:|
| Image Color Inversion | `image_service.py` / `image_router.py` | `POST /api/image/invert-image` | Channel-aware inversion (R/G/B) across 4 color spaces (RGB, HSV, LAB, GRAY) with blend modes (normal, multiply, screen, overlay) and opacity weighting |
| Pencil Sketch Filter | `image_service.py` / `image_router.py` | `POST /api/image/pencil-sketch` | Dodge-blend sketch with configurable intensity, gray/color output, line thickness, and hex shadow tint |
| Multi-Resolution ICO Generation | `image_service.py` / `image_router.py` | `POST /api/image/generate-ico` | Converts any image to favicon.ico with custom size list and resampling filter |
| Image-to-PDF Compilation | `pdf_service.py` / `pdf_router.py` | `POST /api/doc/image-to-pdf` | Composes multiple images into a single PDF with page-size selection (A4, Letter, Original), margins, and auto-rotate |
| PDF-to-Image Rendering | `pdf_service.py` / `pdf_router.py` | `POST /api/doc/pdf-to-image` | Renders selected PDF pages to PNG/JPEG/WebP at configurable DPI (72-600); returns ZIP for multi-page |
| Bulk Image Conversion | `pdf_service.py` / `pdf_router.py` | `POST /api/doc/bulk-convert` | Batch format conversion with optional resize and quality control; returns ZIP bundle |
| Frontend Dashboard | `index.html` | `GET /` | 17-tool grid with real-time search, dark mode toggle, keyboard shortcuts |
| Client-Side Tools (17 SPAs) | Tool directories | Static mounts `/{ToolName}/` | Individual tool interfaces -- Canvas API, drag-and-drop, format conversion, preview, download |
| Structured Logging | `core/logger.py` | Middleware | Request-level timing, operation-level `TelemetryLogger.trace()` context manager |
| Security Headers | `app.py` middleware | Every response | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-XSS-Protection` |
| Pydantic Validation | `core/models.py` | Route-level validation | Field-level validation, strict ranges, allowed values, hex color format, error response schema |
| Error Handling | `core/exceptions.py` | Global exception handlers | Domain-specific error hierarchy (HagridError -> ValidationError / InvalidFileFormatError / FileProcessingError), structured JSON error responses |
| PWA Support | `manifest.json` | Static file | "Add to Home Screen", standalone display, theme_color, maskable icons |
| SEO / GEO Optimization | `index.html` headers + JSON-LD | Static page | Open Graph tags, Twitter card, JSON-LD SoftwareApplication schema, canonical URL, AI crawler meta tags |
| 404 Error Page | `404.html` | Static route | Branded error page with primary-color 404, navigation back to home |
| Privacy Policy Page | `privacy-policy.html` | Static route | 6-section disclosure covering data collection, browser storage, third-party services |
| Contact Form | `contact.html` | Static route | Formspree-powered contact form with email, subject, message fields |

### P1, Should Have (High Priority)

| Feature | Rationale | Code Status |
|:---|---|:---|
| **Comprehensive Test Suite** | Regression safety for new tools and refactors | **Done** -- 23 tests covering services + API (7 integration, 8 image unit, 8 PDF unit) |
| **Docker / One-Command Setup** | Eliminate Python environment setup friction | **Done** -- `Dockerfile` + `docker-compose.yml` + `Hagrid.bat` (Windows) |
| **Environment Configuration** | Allow custom host/port without editing source code | **Done** -- `.env.example` with `HOST`, `PORT`, `LOG_LEVEL`, `ALLOWED_ORIGINS`, `SECRET_KEY`, `MAX_UPLOAD_SIZE`, `UVICORN_RELOAD` |
| **Async Offloading** | Prevent CPU-bound OpenCV/NumPy operations from blocking the event loop | **Done** -- `anyio.to_thread.run_sync()` in all service methods |
| **Observability Headers** | Allow clients to monitor processing time and output size | **Done** -- `X-Processing-Time-Ms`, `X-Output-Size-Bytes` on every response |

### P2, Could Have (Future Enhancements)

| Feature | Rationale | Estimated Effort |
|:---|---|:---|
| **AI Background Removal** | Integrate `rembg` for one-click subject isolation | Medium |
| **Image Upscaling** | Add Real-ESRGAN or similar for AI upscaling | High |
| **CLI Mode** | Headless operation for CI/CD pipelines | Medium |
| **Export History** | Log of recent operations with re-download | Low |
| **Collage Layout Templates** | Preset grid layouts for Image Collage tool | Low |
| **i18n Support** | Multi-language UI | Medium |

---

## AI & Technical Constraints

### Processing Constraints

| Constraint | Specification | Source |
|:---|---|:---|
| **Image Decoding** | Any format supported by OpenCV `imdecode` (PNG, JPEG, WebP, BMP, TIFF) | `image_service.py` |
| **Max Image Dimensions** | No hard cap; limited by available RAM | Implicit |
| **PDF Page Count** | Arbitrary; tested with 1-10 pages | `pdf_service.py` |
| **DPI Range (PDF Export)** | 72-600 | `core/models.py` -- `PdfToImageRequest.dpi` |
| **ICO Size Range** | 1-1024 pixels per side | `core/models.py` -- `GenerateIcoRequest.sizes` |
| **Blend Modes** | `normal`, `multiply`, `screen`, `overlay` | `core/models.py` |
| **Color Spaces** | `RGB`, `HSV`, `LAB`, `GRAY` | `core/models.py` |
| **Shadow Tint Format** | Hex `#RGB` or `#RRGGBB` | `core/models.py` |
| **Compression Quality** | 1-100 (JPEG/WebP only) | `core/models.py` |
| **Resize Dimensions** | 1-10000 pixels | `core/models.py` |

### Security Constraints

| Constraint | Implementation | Source |
|:---|---|:---|
| **Network Binding** | Default `127.0.0.1` (localhost-only); configurable via `.env` | `app.py` |
| **Data Locality** | 14 of 17 tools are fully client-side (Canvas API); 3 API tools (invert, sketch, ICO) + 3 PDF tools run on local server only | Architecture |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security: max-age=31536000` | `app.py` middleware |
| **Input Validation** | All API parameters validated via Pydantic v2 with strict ranges, allowed values, and format validation | `core/models.py` |
| **File Validation** | OpenCV/Pillow decode checks raising `InvalidFileFormatError` | `services/image_service.py`, `services/pdf_service.py` |
| **Static File Whitelisting** | Only 17 explicitly listed tool directories are mounted | `app.py` tools list |
| **CORS** | Wide-open (`*`) -- appropriate for local-first design where backend and frontend are same origin | `app.py` |
| **No Authentication** | Deliberate zero-auth design | Architecture decision |
| **404 Catch-All** | Unknown non-API routes serve `404.html` instead of JSON | `app.py` -- Starlette HTTPException handler |

### Dependency Constraints

| Dependency | Version Requirement | Purpose |
|:---|---|:---|
| Python | >= 3.10 | Type hints, pattern matching |
| FastAPI | Any | ASGI web framework |
| OpenCV | >= 4.5 (cv2) | Image decoding, color-space transforms, blending |
| PyMuPDF | Any (`fitz`) | PDF document parsing and rendering |
| Pillow | Any (PIL) | ICO generation, image-to-PDF compilation |
| NumPy | Any | Array operations for pixel manipulation |
| python-multipart | Any | File upload parsing |
| anyio | Any | CPU-bound task offloading to thread pool |

---

## User Journey / Flow

### Primary Flow: Developer Processes a Set of Images

```
1. Launch
   ├── git clone + pip install + python app.py
   │   └── Server starts on 127.0.0.1:8000
   └── Open http://127.0.0.1:8000
       └── Dashboard loads with 17-tool grid + search bar

2. Select Tool
   ├── User clicks "Bulk Image Converter" card
   ├── Browser navigates to /Bulk-Converter/index.html
   └── Tool SPA loads with drop zone + controls

3. Configure & Upload
   ├── User selects target format (e.g., WebP)
   ├── Sets quality slider (e.g., 85/100)
   ├── Optionally sets resize dimensions
   ├── Uploads multiple images via drag-and-drop
   └── Clicks "Convert"

4. Server-Side Processing
   ├── POST /api/doc/bulk-convert (multipart form)
   ├── FastAPI validates using BulkConvertRequest (Pydantic)
   ├── DocProcessor.bulk_convert() offloaded via anyio.to_thread
   │   └── Each image: open -> optionally resize -> format-convert -> write to ZIP
   ├── Response returns application/zip with X-Processing-Time-Ms
   └── Browser triggers file download

5. Result
   └── User receives converted_images.zip
       └── No data left on server; no external network calls
```

### Secondary Flow: Image Editing (Color Inversion)

```
1. User opens "Image Inverter" tool
2. Uploads an image via drag-and-drop
3. Adjusts parameters: color space (HSV), channels (V only), blend mode (screen), amount (0.7)
4. Clicks "Invert"
5. POST /api/image/invert-image -> ImageProcessor.invert_image()
   └── OpenCV: BGR -> HSV, V channel inverted (255 - V), merge, HSV -> BGR conversion
       ├── Screen blend applied with 0.7 opacity weighting
       └── Encoded as PNG -> returned
6. Preview updates in-browser; user clicks "Download"
```

---

## Out of Scope (Non-Goals)

| Feature | Reason for Exclusion |
|:---|---|
| **User Accounts / Authentication** | Contradicts the local-first, zero-friction design philosophy |
| **Cloud Sync or Storage** | Data must never leave the user's machine by design |
| **Mobile Native Apps** | Web-based UI works across devices; native apps add maintenance burden |
| **Real-Time Collaboration** | Not a multi-user tool; each instance is single-user by design |
| **Payment / Subscription** | Fully open-source (GPL v3); no monetization layer |
| **Video Processing** | Scope limited to images and PDFs; video introduces FFmpeg dependency chain |
| **Database Persistence** | No session state, user data, or history is stored; in-memory processing only |
| **CI/CD Pipeline** | No headless CLI mode currently; would require architectural changes |
| **Macros / Automation Scripting** | Not a programmable platform; each operation is initiated explicitly via the UI |
