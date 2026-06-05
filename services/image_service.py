import io
import cv2
import numpy as np
from PIL import Image
from typing import List, Optional
from anyio import to_thread

from services.base import BaseImageProcessor
from core.exceptions import InvalidFileFormatError, FileProcessingError
from core.logger import TelemetryLogger

class ImageProcessor(BaseImageProcessor):
    """Production-grade image processing implementation using OpenCV and Pillow."""

    async def invert_image(
        self, 
        input_data: bytes, 
        amount: float, 
        channels: List[str], 
        color_space: str, 
        blend_mode: str
    ) -> bytes:
        return await to_thread.run_sync(
            self._invert_image_sync, input_data, amount, channels, color_space, blend_mode
        )

    def _invert_image_sync(
        self, 
        input_data: bytes, 
        amount: float, 
        channels: List[str], 
        color_space: str, 
        blend_mode: str
    ) -> bytes:
        with TelemetryLogger.trace(
            "invert_image_sync", 
            channels=channels, 
            color_space=color_space, 
            blend_mode=blend_mode,
            amount=amount
        ):
            # 1. Decode Image
            nparr = np.frombuffer(input_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise InvalidFileFormatError("Uploaded image file is corrupt or has an unsupported format.")
            
            original_h, original_w, original_c = img.shape
            TelemetryLogger.info(f"Loaded image size: {original_w}x{original_h} with {original_c} channels")

            # 2. Process based on Color Space
            color_space_upper = color_space.upper().strip()
            if color_space_upper == "HSV":
                work_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
                h, s, v = cv2.split(work_img)
                
                # Invert requested channels
                if "h" in channels or "r" in channels: # Fallback r/g/b matching to h/s/v if client sent default
                    h = np.uint8((h + 90) % 180)
                if "s" in channels or "g" in channels:
                    s = np.uint8(255 - s)
                if "v" in channels or "b" in channels:
                    v = np.uint8(255 - v)
                
                processed_hsv = cv2.merge([h, s, v])
                inverted = cv2.cvtColor(processed_hsv, cv2.COLOR_HSV2BGR)

            elif color_space_upper == "LAB":
                work_img = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
                l, a, b = cv2.split(work_img)
                
                if "l" in channels or "r" in channels:
                    l = np.uint8(255 - l)
                if "a" in channels or "g" in channels:
                    a = np.uint8(255 - a)
                if "b" in channels or "b" in channels:
                    b = np.uint8(255 - b)
                
                processed_lab = cv2.merge([l, a, b])
                inverted = cv2.cvtColor(processed_lab, cv2.COLOR_LAB2BGR)

            elif color_space_upper == "GRAY":
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                inverted_gray = cv2.bitwise_not(gray)
                inverted = cv2.cvtColor(inverted_gray, cv2.COLOR_GRAY2BGR)

            else:  # RGB / BGR
                # BGR order in OpenCV
                bgr_channels = cv2.split(img)
                b, g, r = bgr_channels[0], bgr_channels[1], bgr_channels[2]
                
                if "b" in channels:
                    b = np.uint8(255 - b)
                if "g" in channels:
                    g = np.uint8(255 - g)
                if "r" in channels:
                    r = np.uint8(255 - r)
                    
                inverted = cv2.merge([b, g, r])

            # 3. Blend Modes Implementation
            # Ensure float conversion for calculations
            orig_f = img.astype(np.float32)
            inv_f = inverted.astype(np.float32)
            blend_mode_lower = blend_mode.lower().strip()
            
            if blend_mode_lower == "multiply":
                blend_result = (orig_f * inv_f) / 255.0
            elif blend_mode_lower == "screen":
                blend_result = 255.0 - ((255.0 - orig_f) * (255.0 - inv_f)) / 255.0
            elif blend_mode_lower == "overlay":
                mask = orig_f < 128.0
                blend_result = np.empty_like(orig_f)
                # Overlay formula
                blend_result[mask] = (2.0 * orig_f[mask] * inv_f[mask]) / 255.0
                blend_result[~mask] = 255.0 - (2.0 * (255.0 - orig_f[~mask]) * (255.0 - inv_f[~mask])) / 255.0
            else:  # "normal"
                blend_result = inv_f

            # Apply amount opacity weighting
            if amount < 1.0:
                final_f = (blend_result * amount) + (orig_f * (1.0 - amount))
            else:
                final_f = blend_result

            # Clip and cast back to uint8
            final_img = np.clip(final_f, 0, 255).astype(np.uint8)

            # 4. Encode Response
            success, res = cv2.imencode(".png", final_img)
            if not success:
                raise FileProcessingError("Failed to encode processed image back to PNG format.")
                
            return res.tobytes()

    async def pencil_sketch(
        self, 
        input_data: bytes, 
        intensity: float, 
        sketch_type: str, 
        line_thickness: int, 
        shadow_tint: str
    ) -> bytes:
        return await to_thread.run_sync(
            self._pencil_sketch_sync, input_data, intensity, sketch_type, line_thickness, shadow_tint
        )

    def _pencil_sketch_sync(
        self, 
        input_data: bytes, 
        intensity: float, 
        sketch_type: str, 
        line_thickness: int, 
        shadow_tint: str
    ) -> bytes:
        with TelemetryLogger.trace(
            "pencil_sketch_sync", 
            intensity=intensity, 
            sketch_type=sketch_type, 
            line_thickness=line_thickness,
            shadow_tint=shadow_tint
        ):
            nparr = np.frombuffer(input_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise InvalidFileFormatError("Uploaded image file is corrupt or has an unsupported format.")

            # Calculate blur kernel size based on intensity
            # Blur size must be odd and greater than 0
            blur_radius = int(intensity * 100)
            if blur_radius % 2 == 0:
                blur_radius += 1
            if blur_radius < 3:
                blur_radius = 3

            # Apply thickness factor (using line_thickness parameter)
            if line_thickness > 1:
                # Dilation can expand edges before sketching to increase pencil stroke thickness
                kernel = np.ones((line_thickness, line_thickness), np.uint8)
                img = cv2.erode(img, kernel, iterations=1) # Erode makes dark edges thicker in BGR

            # Grayscale channel for division
            gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            inverted_gray = cv2.bitwise_not(gray_img)
            blurred_img = cv2.GaussianBlur(inverted_gray, (blur_radius, blur_radius), 0)
            inverted_blurred = cv2.bitwise_not(blurred_img)
            
            # The dodge blend operation (sketch effect)
            sketch_gray = cv2.divide(gray_img, inverted_blurred, scale=256.0)

            # Determine Output Type
            sketch_type_lower = sketch_type.lower().strip()
            if sketch_type_lower == "color":
                # Re-apply color back by multiplying sketch mask with the color channels
                # Convert sketch_gray to 3 channels [0.0, 1.0] and multiply element-wise with original
                sketch_mask_3ch = cv2.cvtColor(sketch_gray, cv2.COLOR_GRAY2BGR).astype(np.float32) / 255.0
                img_f = img.astype(np.float32)
                sketch_colored = (img_f * sketch_mask_3ch)
                sketch_out = np.clip(sketch_colored, 0, 255).astype(np.uint8)
            else:
                # Standard Grayscale sketch
                sketch_out = cv2.cvtColor(sketch_gray, cv2.COLOR_GRAY2BGR)

            # Apply shadow tint if it is not default black
            shadow_tint_clean = shadow_tint.strip()
            if shadow_tint_clean != "#000000":
                # Convert Hex to BGR
                # Remove '#' if present
                hex_val = shadow_tint_clean.lstrip('#')
                if len(hex_val) == 3:
                    hex_val = "".join([c*2 for c in hex_val])
                r_tint = int(hex_val[0:2], 16)
                g_tint = int(hex_val[2:4], 16)
                b_tint = int(hex_val[4:6], 16)
                # BGR tuple
                bgr_tint = np.array([b_tint, g_tint, r_tint], dtype=np.float32)

                # Interpolate between white/original sketch color and shadow tint based on brightness
                sketch_f = sketch_out.astype(np.float32)
                # normalized mask: 1.0 at full white, 0.0 at absolute black lines
                sketch_normalized = sketch_f / 255.0
                # Where sketch is white (1.0), output is white/original. Where sketch is black (0.0), output is tint color.
                tinted_f = (sketch_normalized * sketch_f) + ((1.0 - sketch_normalized) * bgr_tint)
                sketch_out = np.clip(tinted_f, 0, 255).astype(np.uint8)

            # Encode Response
            success, res = cv2.imencode(".png", sketch_out)
            if not success:
                raise FileProcessingError("Failed to encode processed sketch image back to PNG.")
                
            return res.tobytes()

    async def generate_ico(
        self, 
        input_data: bytes, 
        sizes: List[int], 
        resize_filter: str
    ) -> bytes:
        return await to_thread.run_sync(
            self._generate_ico_sync, input_data, sizes, resize_filter
        )

    def _generate_ico_sync(
        self, 
        input_data: bytes, 
        sizes: List[int], 
        resize_filter: str
    ) -> bytes:
        with TelemetryLogger.trace(
            "generate_ico_sync", 
            sizes=sizes, 
            resize_filter=resize_filter
        ):
            try:
                img = Image.open(io.BytesIO(input_data))
            except Exception as e:
                raise InvalidFileFormatError(f"Uploaded image is corrupt or cannot be opened: {e}")

            # Map filter
            filter_map = {
                "lanczos": Image.Resampling.LANCZOS,
                "bilinear": Image.Resampling.BILINEAR,
                "nearest": Image.Resampling.NEAREST,
                "bicubic": Image.Resampling.BICUBIC
            }
            resample_method = filter_map.get(resize_filter.lower().strip(), Image.Resampling.LANCZOS)

            # Generate target sizes
            size_tuples = [(s, s) for s in sizes]
            
            ico_io = io.BytesIO()
            try:
                # Pillow's ICO format saver takes a list of target sizes and automatically resizes and bundles them
                # Using the designated resampling filter
                img.save(ico_io, format='ICO', sizes=size_tuples, resample=resample_method)
            except Exception as e:
                raise FileProcessingError(f"Pillow failed to compile multi-size ICO document: {e}")

            return ico_io.getvalue()
