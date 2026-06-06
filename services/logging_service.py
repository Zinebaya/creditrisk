import logging
import os


def configure_logging():
    level = logging.INFO
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s %(message)s"
    )

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    console.setLevel(level)

    os.makedirs("logs", exist_ok=True)
    file_handler = logging.FileHandler("logs/app.log")
    file_handler.setFormatter(formatter)
    file_handler.setLevel(level)

    root = logging.getLogger()
    root.setLevel(level)
    if not root.handlers:
        root.addHandler(console)
        root.addHandler(file_handler)


def get_logger(name: str):
    return logging.getLogger(name)
