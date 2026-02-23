import cv2
import numpy as np
import io
import os
from PIL import Image
from anyio import to_thread
from fastapi import UploadFile

async def process_invert_image(input_data: bytes, amount: float, channels: str) -> bytes:
    return await to_thread.run_sync(_invert_image_sync, input_data, amount, channels)

def _invert_image_sync(input_data: bytes, amount: float, channels: str) -> bytes:
    nparr = np.frombuffer(input_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    inverted_img = cv2.bitwise_not(img)
    
    target_channels = [c.strip().lower() for c in channels.split(',')]
    if len(target_channels) < 3:
        mask = np.copy(img)
        if 'b' in target_channels: mask[:,:,0] = inverted_img[:,:,0]
        if 'g' in target_channels: mask[:,:,1] = inverted_img[:,:,1]
        if 'r' in target_channels: mask[:,:,2] = inverted_img[:,:,2]
        inverted_img = mask

    if amount < 1.0:
        inverted_img = cv2.addWeighted(inverted_img, amount, img, 1.0 - amount, 0)

    _, res = cv2.imencode(".png", inverted_img)
    return res.tobytes()

async def process_pencil_sketch(input_data: bytes, intensity: float) -> bytes:
    return await to_thread.run_sync(_pencil_sketch_sync, input_data, intensity)

def _pencil_sketch_sync(input_data: bytes, intensity: float) -> bytes:
    nparr = np.frombuffer(input_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    inverted_gray = cv2.bitwise_not(gray_img)
    
    blur_radius = int(intensity * 100)
    if blur_radius % 2 == 0: blur_radius += 1
    blurred_img = cv2.GaussianBlur(inverted_gray, (blur_radius, blur_radius), 0)
    
    inverted_blurred = cv2.bitwise_not(blurred_img)
    sketch_img = cv2.divide(gray_img, inverted_blurred, scale=256.0)
    
    _, res = cv2.imencode(".png", sketch_img)
    return res.tobytes()

async def generate_ico_file(input_data: bytes, sizes: str) -> bytes:
    return await to_thread.run_sync(_generate_ico_sync, input_data, sizes)

def _generate_ico_sync(input_data: bytes, sizes: str) -> bytes:
    img = Image.open(io.BytesIO(input_data))
    size_list = []
    for s in sizes.split(','):
        try:
            val = int(s.strip())
            size_list.append((val, val))
        except ValueError:
            continue
    
    if not size_list:
        size_list = [(32, 32)]
        
    ico_io = io.BytesIO()
    img.save(ico_io, format='ICO', sizes=size_list)
    return ico_io.getvalue()
