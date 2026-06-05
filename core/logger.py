import logging
import os
import time
import sys
from contextlib import contextmanager
from typing import Generator

# Structured Logger Setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("hagrid-professional")

class TelemetryLogger:
    """Enterprise-grade telemetry logger wrapping standard logger with execution metrics."""
    
    @staticmethod
    def info(msg: str, **kwargs):
        extra_str = f" | {kwargs}" if kwargs else ""
        logger.info(f"{msg}{extra_str}")

    @staticmethod
    def error(msg: str, exc_info=True, **kwargs):
        extra_str = f" | {kwargs}" if kwargs else ""
        logger.error(f"{msg}{extra_str}", exc_info=exc_info)

    @staticmethod
    def warning(msg: str, **kwargs):
        extra_str = f" | {kwargs}" if kwargs else ""
        logger.warning(f"{msg}{extra_str}")

    @staticmethod
    @contextmanager
    def trace(operation_name: str, **context) -> Generator[None, None, None]:
        """A context manager to automatically measure, trace, and log execution timing."""
        start_time = time.perf_counter()
        TelemetryLogger.info(f"START: {operation_name}", **context)
        try:
            yield
            duration = (time.perf_counter() - start_time) * 1000.0
            TelemetryLogger.info(
                f"SUCCESS: {operation_name}", 
                duration_ms=round(duration, 2), 
                **context
            )
        except Exception as e:
            duration = (time.perf_counter() - start_time) * 1000.0
            TelemetryLogger.error(
                f"FAILURE: {operation_name}",
                exc_info=True,
                duration_ms=round(duration, 2),
                error=str(e),
                **context
            )
            raise

def get_logger():
    return logger
