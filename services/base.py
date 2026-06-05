from abc import ABC, abstractmethod
from typing import List, Optional, Tuple

class BaseImageProcessor(ABC):
    """Abstract Base Class defining interface contract for all Image transformation services."""
    
    @abstractmethod
    async def invert_image(
        self, 
        input_data: bytes, 
        amount: float, 
        channels: List[str], 
        color_space: str, 
        blend_mode: str
    ) -> bytes:
        """Invert targeted color channels of an image using specific color spaces and blend layers."""
        pass

    @abstractmethod
    async def pencil_sketch(
        self, 
        input_data: bytes, 
        intensity: float, 
        sketch_type: str, 
        line_thickness: int, 
        shadow_tint: str
    ) -> bytes:
        """Apply highly realistic pencil sketching to an image with controllable line parameters and tinting."""
        pass

    @abstractmethod
    async def generate_ico(
        self, 
        input_data: bytes, 
        sizes: List[int], 
        resize_filter: str
    ) -> bytes:
        """Generate high-quality multi-size Favicon/ICO documents with custom downsampling interpolation filters."""
        pass


class BaseDocProcessor(ABC):
    """Abstract Base Class defining interface contract for all PDF and batch document operations."""

    @abstractmethod
    async def image_to_pdf(
        self, 
        files_data: List[bytes], 
        page_size: str, 
        margin: int, 
        auto_rotate: bool
    ) -> bytes:
        """Convert a sequence of images into a single cohesive, high-fidelity PDF with custom dimensions and rotation."""
        pass

    @abstractmethod
    async def pdf_to_image(
        self, 
        pdf_data: bytes, 
        format: str, 
        pages: str, 
        dpi: int
    ) -> Tuple[bytes, bool]:
        """Convert selected pages of a PDF document to distinct high-resolution image formats, zipped if multiple."""
        pass

    @abstractmethod
    async def bulk_convert(
        self, 
        files: List[Tuple[str, bytes]], 
        format: str, 
        quality: int, 
        resize_width: Optional[int], 
        resize_height: Optional[int]
    ) -> bytes:
        """Transform multiple images concurrently with dimension scaling and targeted quality factors, packed into a ZIP archive."""
        pass
