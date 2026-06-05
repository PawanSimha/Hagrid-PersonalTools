from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError

class HagridError(Exception):
    """Base Exception for Hagrid Application Errors."""
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}

class ValidationError(HagridError):
    """Raised when parameters fail system level constraint validation."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=400, details=details)

class InvalidFileFormatError(HagridError):
    """Raised when user uploaded file cannot be parsed or format is corrupt."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=400, details=details)

class FileProcessingError(HagridError):
    """Raised when core operations (OpenCV / PyMuPDF) encounter failures."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=500, details=details)

def register_exception_handlers(app: FastAPI):
    """Registers standard handlers mapping domain-specific errors to HTTP JSON responses."""
    
    @app.exception_handler(HagridError)
    async def hagrid_error_handler(request: Request, exc: HagridError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "message": exc.message,
                "details": exc.details
            }
        )

    @app.exception_handler(PydanticValidationError)
    async def pydantic_validation_error_handler(request: Request, exc: PydanticValidationError):
        errors_list = []
        for error in exc.errors():
            errors_list.append({
                "loc": " -> ".join(map(str, error["loc"])),
                "message": error["msg"],
                "type": error["type"]
            })
            
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Parameter validation failed.",
                "details": {"validation_errors": errors_list}
            }
        )
