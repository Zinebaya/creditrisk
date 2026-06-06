#!/usr/bin/env python3
import sys
from pathlib import Path

# Add backend to path
backend_path = str(Path(__file__).resolve().parent / "backend")
sys.path.append(backend_path)

try:
    from services.db import DatabaseService
    
    # Check if method exists
    print("✅ DatabaseService imported successfully")
    print(f"Methods: {[m for m in dir(DatabaseService) if not m.startswith('_')]}")
    
    if hasattr(DatabaseService, 'get_user_by_id'):
        print("✅ get_user_by_id method EXISTS")
    else:
        print("❌ get_user_by_id method NOT FOUND")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
