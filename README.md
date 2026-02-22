<h1 align="center">
  <img src="images/logo.png" alt="Logo" width="100"><br>
  Hagrid - Professional Developer Utility Suite 🧙‍♂️
</h1>

<p align="center">
  <b>A high-performance, single-process utility suite featuring 15 professional-grade tools for image processing, document transformation, and AI-powered enhancement!</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-Production-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/OpenCV-Computer%20Vision-white?logo=opencv" alt="OpenCV">
  <img src="https://img.shields.io/badge/Pillow-Imaging-blue" alt="Pillow">
  <img src="https://img.shields.io/badge/JavaScript-Vanilla-yellow?logo=javascript" alt="JS">
</p>

---

## 📌 Overview

Hagrid is a high-performance, comprehensive developer toolkit designed for speed, privacy, and versatility. Unlike online tools, Hagrid processes everything **locally**, ensuring your data never leaves your machine. It bundles 15+ essential tools into a single, sleek Glassmorphism interface.

---

## ✨ Key Features

- ⚡ **Lightweight & Fast**: Optimized single-process server with zero external API latency.
- 🔐 **Privacy First**: 100% local processing for sensitive documents and images.
- 🛠️ **Developer Utilities**: Instant JSON formatting, secure password generation, and QR codes.
- 🖼️ **Creative Filters**: Professional OpenCV filters like Pencil Sketch and Inversion.
- 📥 **Document Transformation**: Bulk Image-to-PDF, PDF-to-Image, and high-fidelity compression.
- 📱 **Fully Responsive**: Immersive UI that works seamlessly across all devices.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python (FastAPI), Uvicorn |
| **Logic** | OpenCV, NumPy, Pillow, PyMuPDF |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Packaging** | PyInstaller (for portability) |
| **Styling** | Modern Glassmorphism & Immersive Dark Mode |

---

## 📁 Project Structure

```
Hagrid/
├── 🖱️ run_hagrid.bat                           # One-click launch
├── 🛠️ setup.bat                                # Auto-installer (Dependencies)
├── app.py                                       # FastAPI production backend
├── requirements.txt                             # Python dependencies
├── index.html                                   # Main Dashboard
├── global.js                                    # Core frontend logic
├── style.css                                    # Immersive global styling
├── images/
│   ├── logo.png                                 # Project Branding
│   └── logo.ico                                 # System Favicon
└── [Utility Modules]/                           # 15+ Dedicated tool templates
```

---

## 🚀 Quick Start

### Option 1 — Easy Launch (Windows)
1. **Double-click `setup.bat`** (Run once to install dependencies).
2. **Double-click `run_hagrid.bat`** to launch the suite.
3. Your browser will open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** automatically.

### Option 2 — Manual Installation
1. **Set up Environment**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
2. **Install Requirements**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Start the Suite**:
   ```bash
   python app.py
   ```

---

## 📋 Requirements

```
fastapi
uvicorn
opencv-python
pillow
pymupdf
numpy
python-multipart
```

---

## 👤 Author

**Pawan Simha**
- GitHub: [@PawanSimha](https://github.com/PawanSimha)
- LinkedIn: [linkedin.com/in/pawansimha](https://linkedin.com/in/pawansimha)
- X (Twitter): [@iampawansimha](https://x.com/iampawansimha)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).