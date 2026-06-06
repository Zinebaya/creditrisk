import sys
from pathlib import Path

# Add backend directory to path to allow absolute prefix-free imports
backend_path = str(Path(__file__).resolve().parent / "backend")
if backend_path not in sys.path:
    # Append backend path to avoid shadowing top-level packages (like root `api`)
    # inserting at index 0 can cause backend packages to shadow project-level packages.
    sys.path.append(backend_path)

from api.app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
