import sys
from pathlib import Path

# Add backend directory to path to allow absolute prefix-free imports
backend_path = str(Path(__file__).resolve().parent / "backend")
if backend_path not in sys.path:
    sys.path.append(backend_path)

from main import app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
