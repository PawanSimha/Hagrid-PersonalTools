# Context Map - Hagrid Professional Utility Suite

## System Overview & Strategic Intent

Hagrid is a **free, open-source, local-first developer utility suite** that bundles 17+ browser-based tools for image processing, document conversion, and developer productivity into a single FastAPI-powered application. All processing is executed on the user's machine with zero network egress, eliminating the privacy risks inherent in SaaS alternatives.

**Core operational goals:**
1. Provide 17+ utility tools under one unified dashboard with consistent UX
2. Guarantee zero data leaves the user's machine (local-first by design)
3. Maintain sub-500ms processing latency for standard operations
4. Require zero authentication, zero sign-up, zero cookies
5. Be deployable via `pip install && python app.py` (or Docker) with no external service dependencies

**Target audience:** Individual developers, design-engineer hybrids, and privacy-conscious power users who need quick image/document operations without uploading sensitive data to third parties.

---

## Production Tech Stack

| Layer | Technology | Version | Key Dependencies |
|---|---|---|---|
| **Backend Framework** | FastAPI | 2.0.0 (project) | uvicorn, starlette, h11, python-multipart |
| **Async Server** | uvicorn | - | - |
| **Image Processing** | OpenCV (cv2) | - | numpy |
| **Image Processing** | Pillow (PIL) | 12.2.0 | - |
| **PDF Processing** | PyMuPDF (fitz) | - | - |
| **Numeric Engine** | NumPy | <3.0.0 | - |
| **Validation** | Pydantic | (bundled with FastAPI) | - |
| **Testing** | pytest | - | pytest-asyncio, FastAPI TestClient |
| **Frontend** | Vanilla HTML5 + CSS3 + JS | - | No frameworks |
| **Design System** | Custom CSS with custom properties | - | 1187 lines, glassmorphism, dark/light |
| **Containerization** | Docker / Docker Compose | - | Multi-stage, health check, non-root |
| **Packaging** | PyInstaller | - | For standalone executable builds |
| **License** | GNU GPL v3.0 | - | - |

---

## Core Architectural Design Patterns

**1. Layered Service Architecture (Backend)**

```
HTTP Request → app.py (middleware) → routers/ (API contract) → services/ (business logic) → core/ (models, exceptions, logger)
```

- **`app.py`**: Entrypoint. Registers middleware (CORS, security headers, telemetry, exception handlers), mounts static SPAs via whitelist, declares API routes.
- **`routers/`**: Thin HTTP layer. Accepts `UploadFile`, `Form` params, validates via Pydantic, delegates to services, returns `Response` with observability headers.
- **`services/`**: Pure business logic. Uses `anyio.to_thread.run_sync()` to offload blocking OpenCV/Pillow/PyMuPDF calls to a thread pool (non-async worker threads). Each service method has a synchronous `_sync` twin wrapped in `TelemetryLogger.trace()`.
- **`core/base.py`**: Abstract base classes defining interface contracts (`BaseImageProcessor`, `BaseDocProcessor`).
- **`core/exceptions.py`**: Domain-specific exception hierarchy: `HagridError` → `ValidationError` (400), `InvalidFileFormatError` (400), `FileProcessingError` (500).
- **`core/models.py`**: Pydantic models for request validation with `@field_validator` and `@model_validator` decorators.
- **`core/logger.py`**: `TelemetryLogger` static class wrapping Python logging with structured format and a `trace()` context manager for automatic duration measurement.

**2. Component-Driven Frontend (Static SPA Pattern)**

Each tool is a self-contained subdirectory (`Tool-Name/index.html` + `script.js` + optional `style.css`). All tools share:
- **`style.css`** (root): Global design system with CSS custom properties, dark/light theme via `[data-theme="dark"]`, responsive breakpoints, glassmorphism cards, pill-shaped nav.
- **`global.js`** (root): Theme toggle (localStorage-persisted), search/filter for homepage tool grid, keyboard shortcuts (Ctrl+S download, Ctrl+O upload, `/` search focus, `R` reset).

Data flow: User uploads file in browser → browser-side canvas preview (client-side processing for basic ops) → optional POST to FastAPI `/api/image/*` or `/api/doc/*` for server-side CV/PDF processing → response consumed as blob.

**3. State Management**
- **No global application state.** No database, no cache, no sessions.
- Theme preference: `localStorage` key `"theme"` → `"light"` or `"dark"`.
- All file processing state is ephemeral (request-scoped).
- Rate limiting (if enabled) is in-memory per-process.

**4. Static Serving Pattern**

FastAPI mounts each tool subdirectory as a `StaticFiles(directory=..., html=True)` mount, enabling direct browser navigation to `/Tool-Name/`. Root-level assets (`style.css`, `global.js`, `manifest.json`, `robots.txt`, `sitemap.xml`, `images/`) are served via explicit `@app.get()` routes.

---

## Folder Architecture & Mapping

```
Hagrid/
├── app.py                          # FastAPI entrypoint: middleware, router registration, static mounts, 404 catch-all
├── Hagrid.bat                      # One-click Windows launcher (venv + install + start + browser)
├── requirements.txt                # Python dependencies (version-pinned)
├── .env.example                    # Env template (HOST, PORT, LOG_LEVEL)
├── .gitignore                      # Ignores .venv, __pycache__, .env, build artifacts
│
├── core/                           # Shared backend foundation
│   ├── __init__.py
│   ├── logger.py                   # TelemetryLogger: structured stdout logging + trace context manager
│   ├── exceptions.py               # Domain exception hierarchy (HagridError → subclasses)
│   └── models.py                   # Pydantic request models with field validators
│
├── routers/                        # Thin HTTP layer: validates, delegates, responds
│   ├── __init__.py
│   ├── image_router.py             # POST /api/image/invert-image, /pencil-sketch, /generate-ico
│   └── pdf_router.py               # POST /api/doc/image-to-pdf, /pdf-to-image, /bulk-convert
│
├── services/                       # Pure business logic: OpenCV/Pillow/PyMuPDF operations
│   ├── __init__.py
│   ├── base.py                     # Abstract base classes (BaseImageProcessor, BaseDocProcessor)
│   ├── image_service.py            # ImageProcessor: invert, pencil sketch, ICO generation
│   └── pdf_service.py              # DocProcessor: image-to-pdf, pdf-to-image, bulk convert
│
├── tests/                          # pytest test suite (23+ tests)
│   ├── __init__.py
│   ├── conftest.py                 # Fixtures: TestClient, dummy PNG/JPEG/PDF generators
│   ├── test_api.py                 # E2E API tests via TestClient
│   ├── test_image_service.py       # Unit tests for ImageProcessor
│   └── test_pdf_service.py         # Unit tests for DocProcessor
│
├── index.html                      # Hub/landing page with search, tool grid, SEO metadata
├── 404.html                        # Error page with full meta tag suite
├── contact.html                    # Contact form page
├── privacy-policy.html             # Privacy disclosure page
├── style.css                       # Global design system (1187 lines): glassmorphism, dark/light, responsive
├── global.js                       # Theme toggle, search filter, keyboard shortcuts (102 lines)
├── manifest.json                   # PWA manifest
├── robots.txt                      # Crawler directives
├── sitemap.xml                     # 20-URL sitemap
├── images/                         # Static assets (logo.png)
│   └── logo.png                    # Brand logo (512x512)
│
├── Tool-Name/                      # 17 tool SPAs: each is a self-contained subdirectory (x17)
│   ├── index.html                  # Tool page with full SEO meta tags, OG, Twitter, AI directives
│   ├── script.js                   # Client-side logic for the tool
│   └── style.css (some tools)      # Tool-specific styles (Image-to-ICO, Circle-Crop, Border-Radius)
│
├── Dockerfile                      # Multi-stage Docker build (slim, non-root, health check)
├── docker-compose.yml              # Docker Compose orchestration
├── .dockerignore
│
├── PRD.md                          # Product Requirements Document
├── README.md                       # Project documentation
├── LICENSE                         # GNU GPL v3.0
└── context.md                      # THIS FILE: architecture context and session state
```

The 17 tool directories:
`Aspect-Ratio-Cropper`, `Border-Radius`, `Bulk-Converter`, `Circle-Crop`, `Format-Converter`, `Image-Collage`, `Image-Compressor`, `Image-Inverter`, `Image-to-ICO`, `Image-to-PDF`, `JSON-Formatter`, `PDF-to-Image`, `Palette-Extractor`, `Password-Generator`, `Pencil-Sketch`, `Privacy-Blur`, `QR-Generator`

---

## Engineering Guardrails & Anti-Patterns

### Style Conventions

| Rule | Enforcement |
|---|---|
| **Python naming** | snake_case for functions/vars, PascalCase for classes, UPPER_CASE for constants |
| **JS naming** | camelCase for variables/functions, PascalCase for classes/constructors |
| **CSS** | kebab-case for custom properties (`--bg-main`), BEM-like class naming |
| **Indentation** | Python: 4 spaces; JS/CSS: 4 spaces (except Border-Radius which uses 2-space: maintain per-file consistency) |
| **Relative units** | Use `rem`/`em` for typography, `%`/`vw`/`vh` for layout, `px` only for borders/shadows |
| **Async pattern** | All service methods must be `async def` and delegate blocking work via `await to_thread.run_sync(self._sync_method, ...)` |
| **Exception handling** | Raise domain-specific exceptions from `core/exceptions.py`, never raw `Exception` in service code |
| **Validation** | Use Pydantic `BaseModel` with `@field_validator` for all API param validation, never manual `if` checks in routers |
| **Logging** | Use `TelemetryLogger` static methods, never `print()` or raw `logging` calls outside `core/logger.py` |
| **Import order** | Standard library → Third-party → Local (separated by blank line) |

### Strict Anti-Patterns

- **Never hardcode secrets or API keys.** Use `.env` + `os.getenv()`. The `.env` file is in `.gitignore`.
- **Never bypass the router → service → core layering.** Routers must not contain business logic. Services must not contain HTTP concerns.
- **Never import router modules from service modules.** Dependency direction: `app.py → routers/ → services/ → core/` (one-way).
- **Never use client-side fetching for critical processing.** Heavy CV/PDF operations require the FastAPI backend, don't reimplement them in JS.
- **Never add auth middleware or user accounts.** The project is deliberately zero-auth. If needed, use network-level restrictions (bind to `127.0.0.1`).
- **Never add database dependencies.** All state is ephemeral or localStorage-persisted. No SQL, no Redis, no filesystem persistence.
- **Never use `uvicorn.run()` with `reload=True` in production.** The dev-mode `reload=True` in `app.py:137` must be removed for deployment.
- **Never inline CSS in JS or HTML** unless it is a single exceptional override (e.g., 404.html inline styles). Use the global `style.css` design system.
- **Never commit `__pycache__/`, `.venv/`, `.pytest_cache/`, `.env`, or `dist/`**, they are in `.gitignore`.
- **Never introduce unversioned external CSS/JS** unless backed by a SRI integrity hash and `crossorigin` attribute.
- **Never process files on the main thread.** All CV/PDF operations must use `to_thread.run_sync()` to avoid blocking the async event loop.
- **Never serve files outside the whitelist.** The `tools` list in `app.py` is the exclusive allowlist for static mounts.
- **Never use mutable default arguments in Pydantic models.** Use `default_factory` (e.g., `Field(default_factory=list)`).

---

## Active Session State & Milestone Checklist

### [x] Completed Features (Milestones Reached)

- [x] **17 Tool SPAs deployed**: All tools functional with client-side preview + optional server-side processing
- [x] **FastAPI backend with 6 API routes**: `invert-image`, `pencil-sketch`, `generate-ico`, `image-to-pdf`, `pdf-to-image`, `bulk-convert`
- [x] **Layered backend architecture**: `core/` (models, exceptions, logger), `routers/`, `services/` with abstract base classes
- [x] **Async offloading**: All blocking CV/PDF ops routed through `anyio.to_thread.run_sync()`
- [x] **Pydantic validation**: All API params validated with `@field_validator` decorators
- [x] **Domain exception hierarchy**: `HagridError` → `ValidationError`, `InvalidFileFormatError`, `FileProcessingError`
- [x] **Structured telemetry**: `TelemetryLogger` with automatic `trace()` context manager for duration measurement
- [x] **Security middleware**: HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection headers
- [x] **CORS middleware**: Configurable via `ALLOWED_ORIGINS` env var
- [x] **Global exception handler**: Catch-all 500 handler with structured JSON response
- [x] **23+ pytest suite**: E2E API tests + service-level unit tests with fixtures
- [x] **Docker multi-stage build**: Slim production image, non-root user, health check
- [x] **SEO metadata suite**: All 21 HTML pages: author (`Pawan Simha R`), description, keywords, Open Graph, Twitter Cards, AI crawler directives, JSON-LD (homepage), robots, canonical
- [x] **Dark/light theme**: `localStorage`-persisted via `global.js`, CSS custom property swap
- [x] **Keyboard shortcuts**: Ctrl+S (download), Ctrl+O (upload), `/` (search focus), R (reset)
- [x] **Responsive design**: 6 breakpoints (380px-1440px+), pill-shaped nav, 44px touch targets
- [x] **GPL v3.0 License**: Fully applied with project metadata
- [x] **PRD & README**: Comprehensive documentation up to date
- [x] **Docker infrastructure**: Multi-stage Dockerfile, docker-compose.yml, .dockerignore
- [x] **404 catch-all route**: Non-API unknown paths serve custom 404.html
- [x] **`.env` configuration**: All vars consumed by app.py, .env.example fully documented
- [x] **SRI integrity hashes**: Embedded in Plausible and qrcode.min.js CDN references
- [x] **Zero em dashes**: Project-wide audit, all replaced
- [x] **Author standardization**: "Pawan Simha R" across all 55+ source files
- [x] **Remove `uvicorn reload=True`**: Now configurable via `UVICORN_RELOAD` env var (defaults to false)

### [ ] Upcoming Implementations (Next Steps)

- [ ] **Service Worker**: Add PWA offline caching for core HTML/JS/CSS assets
- [ ] **Redis-backed rate limiter**: Replace in-memory per-process limiter for multi-worker Docker Compose
- [ ] **CI/CD pipeline**: GitHub Actions auto-deploy to Railway/VPS on push to main
- [ ] **Front-end tests**: Playwright or Cypress for visual regression and E2E browser tests
- [ ] **Tool page template unification**: Port remaining tool pages to consistent workspace+sidebar layout pattern
