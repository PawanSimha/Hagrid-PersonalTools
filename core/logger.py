import logging
import os

# Initialize Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("hagrid-production")

def get_logger():
    return logger
