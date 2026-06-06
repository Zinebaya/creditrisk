#!/usr/bin/env python3
"""
Flask-Migrate initialization script for credit-risk project
Performs all migration setup steps in sequence
"""
import os
import sys
import subprocess
from pathlib import Path

def run_command(cmd, description, cwd=None):
    """Execute a command and report results"""
    print(f"\n{'='*70}")
    print(f"[STEP] {description}")
    print(f"{'='*70}")
    print(f"Command: {cmd}")
    print(f"Working directory: {cwd or os.getcwd()}")
    print("-" * 70)
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=180
        )
        
        output = result.stdout
        error = result.stderr
        
        if result.returncode == 0:
            print(f"Status: SUCCESS")
        else:
            print(f"Status: FAILED (exit code: {result.returncode})")
        
        if output:
            print(f"\nOutput:\n{output}")
        if error:
            print(f"\nError:\n{error}")
        
        return result.returncode == 0, output, error
    
    except subprocess.TimeoutExpired:
        print(f"Status: FAILED (timeout after 180 seconds)")
        return False, "", "Command timeout"
    except Exception as e:
        print(f"Status: FAILED (exception: {str(e)})")
        return False, "", str(e)

def main():
    """Execute all Flask-Migrate initialization steps"""
    
    project_root = Path("c:\\credit-risk")
    backend_dir = project_root / "backend"
    
    print(f"\n{'='*70}")
    print("FLASK-MIGRATE INITIALIZATION FOR CREDIT-RISK PROJECT")
    print(f"{'='*70}")
    print(f"Project root: {project_root}")
    print(f"Backend directory: {backend_dir}")
    
    all_success = True
    
    # Step 1: Install requirements
    print(f"\n\n{'#'*70}")
    print("# STEP 1: Install requirements")
    print(f"{'#'*70}")
    success, out, err = run_command(
        "python -m pip install -r requirements.txt",
        "Installing dependencies from requirements.txt",
        cwd=str(project_root)
    )
    all_success = all_success and success
    
    # Step 2: Initialize migrations
    print(f"\n\n{'#'*70}")
    print("# STEP 2: Initialize Flask-Migrate")
    print(f"{'#'*70}")
    
    os.environ['FLASK_APP'] = 'main.py'
    
    success, out, err = run_command(
        f"python -m flask db init",
        "Initializing migrations (flask db init)",
        cwd=str(backend_dir)
    )
    all_success = all_success and success
    
    # Step 3: Create migration
    print(f"\n\n{'#'*70}")
    print("# STEP 3: Create migration")
    print(f"{'#'*70}")
    
    success, out, err = run_command(
        f'python -m flask db migrate -m "Add subscription columns to users"',
        "Creating migration (flask db migrate)",
        cwd=str(backend_dir)
    )
    all_success = all_success and success
    
    # Step 4: Apply migration
    print(f"\n\n{'#'*70}")
    print("# STEP 4: Apply migration")
    print(f"{'#'*70}")
    
    success, out, err = run_command(
        f"python -m flask db upgrade",
        "Applying migration (flask db upgrade)",
        cwd=str(backend_dir)
    )
    all_success = all_success and success
    
    # Step 5: Verify results
    print(f"\n\n{'#'*70}")
    print("# STEP 5: Verification")
    print(f"{'#'*70}")
    
    print("\n[VERIFICATION] Checking migration directories and files...")
    
    migrations_dir = backend_dir / "migrations"
    versions_dir = migrations_dir / "versions"
    db_file = project_root / "credit_risk.db"
    
    checks = [
        (migrations_dir.exists(), f"Migrations folder exists: {migrations_dir}"),
        (versions_dir.exists(), f"Versions folder exists: {versions_dir}"),
        (db_file.exists(), f"Database file exists: {db_file}"),
    ]
    
    for check, description in checks:
        status = "✓ YES" if check else "✗ NO"
        print(f"  {status}: {description}")
    
    if versions_dir.exists():
        print(f"\n[VERIFICATION] Migration files in versions folder:")
        migration_files = list(versions_dir.glob("*.py"))
        if migration_files:
            for mf in sorted(migration_files):
                print(f"  - {mf.name}")
        else:
            print(f"  (no migration files found)")
    
    # Summary
    print(f"\n\n{'='*70}")
    print("FLASK-MIGRATE INITIALIZATION SUMMARY")
    print(f"{'='*70}")
    if all_success:
        print("Status: ✓ ALL STEPS COMPLETED SUCCESSFULLY")
    else:
        print("Status: ✗ SOME STEPS FAILED (see details above)")
    print(f"{'='*70}\n")
    
    return 0 if all_success else 1

if __name__ == "__main__":
    sys.exit(main())
