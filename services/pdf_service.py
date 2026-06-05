import io
import os
import re
import fitz  # PyMuPDF
import zipfile
from PIL import Image
from typing import List, Tuple, Optional
from anyio import to_thread

from services.base import BaseDocProcessor
from core.exceptions import InvalidFileFormatError, FileProcessingError
from core.logger import TelemetryLogger

class DocProcessor(BaseDocProcessor):
    """Production-grade PDF and batch document operations implementation using PyMuPDF and Pillow."""

    async def image_to_pdf(
        self, 
        files_data: List[bytes], 
        page_size: str, 
        margin: int, 
        auto_rotate: bool
    ) -> bytes:
        return await to_thread.run_sync(
            self._image_to_pdf_sync, files_data, page_size, margin, auto_rotate
        )

    def _image_to_pdf_sync(
        self, 
        files_data: List[bytes], 
        page_size: str, 
        margin: int, 
        auto_rotate: bool
    ) -> bytes:
        with TelemetryLogger.trace(
            "image_to_pdf_sync", 
            page_size=page_size, 
            margin=margin, 
            auto_rotate=auto_rotate,
            file_count=len(files_data)
        ):
            if not files_data:
                raise InvalidFileFormatError("No image files provided for PDF conversion.")

            composed_pages = []
            
            for index, data in enumerate(files_data):
                try:
                    img = Image.open(io.BytesIO(data))
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                except Exception as e:
                    raise InvalidFileFormatError(f"File index {index} is not a valid or readable image: {e}")

                img_w, img_h = img.size
                
                # 1. Determine base page sizes (in standard points, 1 point = 1/72 inch)
                page_size_upper = page_size.upper().strip()
                if page_size_upper == "A4":
                    base_w, base_h = 595, 842
                elif page_size_upper == "LETTER":
                    base_w, base_h = 612, 792
                else:  # ORIGINAL
                    base_w, base_h = img_w, img_h

                # 2. Handle Auto-Rotation (if landscape image meets portrait layout)
                if auto_rotate and page_size_upper in ("A4", "LETTER"):
                    is_img_landscape = img_w > img_h
                    is_page_portrait = base_w < base_h
                    if is_img_landscape == is_page_portrait:
                        # Swap page orientation
                        base_w, base_h = base_h, base_w

                # 3. Calculate Printable Area considering margin
                printable_w = base_w - (2 * margin)
                printable_w = max(10, printable_w)
                
                printable_h = base_h - (2 * margin)
                printable_h = max(10, printable_h)

                # 4. Scale Image keeping Aspect Ratio
                ratio = min(printable_w / img_w, printable_h / img_h)
                new_w = int(img_w * ratio)
                new_h = int(img_h * ratio)
                
                # Ensure sizes are non-zero
                new_w = max(1, new_w)
                new_h = max(1, new_h)

                resized_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

                # 5. Create blank white page and center the image
                page_img = Image.new('RGB', (base_w, base_h), color=(255, 255, 255))
                
                paste_x = (base_w - new_w) // 2
                paste_y = (base_h - new_h) // 2
                
                page_img.paste(resized_img, (paste_x, paste_y))
                composed_pages.append(page_img)

            if not composed_pages:
                raise FileProcessingError("Failed to compose any pages for PDF document.")

            pdf_io = io.BytesIO()
            try:
                # Save as multi-page PDF document
                composed_pages[0].save(
                    pdf_io, 
                    format='PDF', 
                    save_all=True, 
                    append_images=composed_pages[1:]
                )
            except Exception as e:
                raise FileProcessingError(f"Pillow failed to compile PDF pages: {e}")

            return pdf_io.getvalue()

    async def pdf_to_image(
        self, 
        pdf_data: bytes, 
        format: str, 
        pages: str, 
        dpi: int
    ) -> Tuple[bytes, bool]:
        return await to_thread.run_sync(
            self._pdf_to_image_sync, pdf_data, format, pages, dpi
        )

    def _pdf_to_image_sync(
        self, 
        pdf_data: bytes, 
        format: str, 
        pages: str, 
        dpi: int
    ) -> Tuple[bytes, bool]:
        with TelemetryLogger.trace(
            "pdf_to_image_sync", 
            format=format, 
            pages=pages, 
            dpi=dpi
        ):
            try:
                doc = fitz.open(stream=pdf_data, filetype="pdf")
            except Exception as e:
                raise InvalidFileFormatError(f"Invalid or corrupt PDF document: {e}")

            page_count = len(doc)
            TelemetryLogger.info(f"Opened PDF document. Total pages: {page_count}")

            # 1. Parse target pages range
            pages_clean = pages.lower().strip()
            target_indices = []
            
            if pages_clean == "all":
                target_indices = list(range(page_count))
            else:
                # Split comma parts
                parts = pages_clean.split(",")
                for part in parts:
                    part = part.strip()
                    if "-" in part:
                        start_str, end_str = part.split("-")
                        try:
                            start = int(start_str.strip())
                            end = int(end_str.strip())
                            # Convert 1-indexed to 0-indexed and include bounds
                            for idx in range(start - 1, end):
                                if 0 <= idx < page_count:
                                    target_indices.append(idx)
                        except ValueError:
                            continue
                    else:
                        try:
                            idx = int(part) - 1
                            if 0 <= idx < page_count:
                                target_indices.append(idx)
                        except ValueError:
                            continue

            # Remove duplicates and sort
            target_indices = sorted(list(set(target_indices)))

            if not target_indices:
                raise InvalidFileFormatError(
                    f"Selected page range '{pages}' does not match any pages. Total pages: {page_count}"
                )

            # 2. Render each page using matrix scaling for High DPI
            # Standard PDF resolution is 72 points per inch
            zoom = dpi / 72.0
            matrix = fitz.Matrix(zoom, zoom)

            rendered_images = []
            for idx in target_indices:
                try:
                    page = doc[idx]
                    pix = page.get_pixmap(matrix=matrix)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    
                    img_io = io.BytesIO()
                    img.save(img_io, format=format.upper())
                    rendered_images.append((idx + 1, img_io.getvalue()))
                except Exception as e:
                    raise FileProcessingError(f"Failed to render page {idx + 1}: {e}")

            doc.close()

            if not rendered_images:
                raise FileProcessingError("No pages rendered successfully.")

            # 3. Format Response: Single image vs ZIP bundle
            if len(rendered_images) == 1:
                # Return single page bytes directly
                return rendered_images[0][1], False

            # ZIP pack multiple files
            zip_io = io.BytesIO()
            with zipfile.ZipFile(zip_io, 'w') as zip_file:
                for page_num, img_data in rendered_images:
                    zip_file.writestr(f"page_{page_num}.{format}", img_data)
                    
            return zip_io.getvalue(), True

    async def bulk_convert(
        self, 
        files: List[Tuple[str, bytes]], 
        format: str, 
        quality: int, 
        resize_width: Optional[int], 
        resize_height: Optional[int]
    ) -> bytes:
        return await to_thread.run_sync(
            self._bulk_convert_sync, files, format, quality, resize_width, resize_height
        )

    def _bulk_convert_sync(
        self, 
        files: List[Tuple[str, bytes]], 
        format: str, 
        quality: int, 
        resize_width: Optional[int], 
        resize_height: Optional[int]
    ) -> bytes:
        with TelemetryLogger.trace(
            "bulk_convert_sync", 
            format=format, 
            quality=quality, 
            resize_width=resize_width,
            resize_height=resize_height,
            file_count=len(files)
        ):
            if not files:
                raise InvalidFileFormatError("No files uploaded for batch conversion.")

            format_upper = format.upper().strip()
            zip_io = io.BytesIO()
            
            with zipfile.ZipFile(zip_io, 'w') as zip_file:
                for filename, data in files:
                    try:
                        img = Image.open(io.BytesIO(data))
                    except Exception as e:
                        TelemetryLogger.warning(f"Skipping corrupted file '{filename}': {e}")
                        continue

                    # 1. Dimension Scaling
                    img_w, img_h = img.size
                    target_w = resize_width
                    target_h = resize_height

                    if target_w is not None or target_h is not None:
                        # Scaling layout composition
                        if target_w is not None and target_h is not None:
                            new_size = (target_w, target_h)
                        elif target_w is not None:
                            # Scale height proportionally
                            scale_ratio = target_w / img_w
                            new_size = (target_w, max(1, int(img_h * scale_ratio)))
                        else:
                            # Scale width proportionally
                            scale_ratio = target_h / img_h
                            new_size = (max(1, int(img_w * scale_ratio)), target_h)

                        img = img.resize(new_size, Image.Resampling.LANCZOS)

                    # 2. Transparent background handling for format changes (e.g. RGBA -> JPEG)
                    if format_upper == "JPEG" and img.mode in ("RGBA", "LA"):
                        # Composition on white background
                        background = Image.new("RGB", img.size, (255, 255, 255))
                        # Paste using alpha channel mask
                        background.paste(img, mask=img.split()[3] if img.mode == "RGBA" else img.split()[1])
                        img = background
                    elif img.mode != "RGB" and format_upper in ("JPEG", "BMP"):
                        img = img.convert("RGB")

                    # 3. Save to stream with compression adjustments
                    img_io = io.BytesIO()
                    save_kwargs = {}
                    if format_upper in ("JPEG", "WEBP"):
                        save_kwargs["quality"] = quality

                    img.save(img_io, format=format_upper, **save_kwargs)
                    
                    # Store in ZIP
                    base_name = os.path.splitext(filename)[0]
                    target_filename = f"{base_name}.{format.lower()}"
                    zip_file.writestr(target_filename, img_io.getvalue())

            return zip_io.getvalue()
