import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from config.config import settings

LOG_FILE_PATH = Path(settings.LOG_DIR) / "backend.log"
LOG_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)

def configure_logging() -> None:
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s"
    )

    file_handler = RotatingFileHandler(LOG_FILE_PATH, maxBytes=5_242_880, backupCount=5)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(console_handler)


def get_logger(name: str) -> logging.Logger:
    """Get or create a logger instance."""
    return logging.getLogger(name)
