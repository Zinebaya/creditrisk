#!/usr/bin/env python3
"""
Flask-Migrate Initialization Script for Credit-Risk Project
Execute this script to initialize and configure Flask-Migrate

Run with: python flask_migrate_init.py
"""

import os
import sys
import subprocess
import time
from pathlib import Path

class MigrationSetup:
    def __init__(self):
        self.project_root = Path("c:\\credit-risk")
        self.backend_dir = self.project_root / "backend"
        self.migrations_dir = self.backend_dir / "migrations"
        self.versions_dir = self.migrations_dir / "versions"
        self.db_file = self.project_root / "credit_risk.db"
        self.steps_completed = []
        self.steps_failed = []
    
    def print_header(self, title):
        """Print a formatted header"""
        width = 70
        print("\n" + "="*width)
        print(title.center(width))
        print("="*width)
    
    def print_step(self, step_num, description):
        """Print a step header"""
        print(f"\n[Step {step_num}] {description}")
        print("-" * 70)
    
    def run_command(self, cmd, cwd=None, show_output=True):
        """Run a shell command and capture output"""
        try:
            print(f"$ {cmd}")
            if cwd:
                print(f"  (in {cwd})")
            
            result = subprocess.run(
                cmd,
                shell=True,
                cwd=str(cwd) if cwd else None,
                capture_output=True,
                text=True,
                timeout=180
            )
            
            output = result.stdout + result.stderr
            
            if show_output and output:
                print(output)
            
            success = result.returncode == 0
            
            if success:
                print("✓ SUCCESS")
                self.steps_completed.append(f"Step {len(self.steps_completed)+1}")
            else:
                print(f"✗ FAILED (exit code: {result.returncode})")
                if output:
                    print(f"Error output:\n{output}")
                self.steps_failed.append(f"Step {len(self.steps_completed)+1}")
            
            return success, output
            
        except subprocess.TimeoutExpired:
            print("✗ FAILED (timeout after 180 seconds)")
            self.steps_failed.append(f"Step {len(self.steps_completed)+1}")
            return False, "Timeout"
        except Exception as e:
            print(f"✗ FAILED ({str(e)})")
            self.steps_failed.append(f"Step {len(self.steps_completed)+1}")
            return False, str(e)
    
    def step_1_install_requirements(self):
        """Step 1: Install requirements"""
        self.print_step(1, "Install requirements from requirements.txt")
        os.chdir(str(self.project_root))
        success, output = self.run_command(
            f"{sys.executable} -m pip install -r requirements.txt"
        )
        return success
    
    def step_2_init_migrations(self):
        """Step 2: Initialize Flask-Migrate"""
        self.print_step(2, "Initialize Flask-Migrate (flask db init)")
        os.environ['FLASK_APP'] = 'main.py'
        success, output = self.run_command(
            f"{sys.executable} -m flask db init",
            cwd=self.backend_dir
        )
        return success
    
    def step_3_create_migration(self):
        """Step 3: Create migration"""
        self.print_step(3, "Create migration (flask db migrate)")
        success, output = self.run_command(
            f'{sys.executable} -m flask db migrate -m "Add subscription columns to users"',
            cwd=self.backend_dir
        )
        return success
    
    def step_4_upgrade_database(self):
        """Step 4: Apply migration"""
        self.print_step(4, "Apply migration (flask db upgrade)")
        success, output = self.run_command(
            f"{sys.executable} -m flask db upgrade",
            cwd=self.backend_dir
        )
        return success
    
    def step_5_verify(self):
        """Step 5: Verify setup"""
        self.print_step(5, "Verification")
        
        os.chdir(str(self.project_root))
        
        print("\n📁 Checking directories and files:")
        
        checks = [
            ("Migrations folder", self.migrations_dir),
            ("Versions folder", self.versions_dir),
            ("Database file", self.db_file),
        ]
        
        results = {}
        for name, path in checks:
            exists = path.exists()
            status = "✓" if exists else "✗"
            results[name] = exists
            print(f"  {status} {name}: {path}")
        
        # List migration files
        if self.versions_dir.exists():
            print(f"\n📄 Migration files in {self.versions_dir}:")
            migration_files = sorted(self.versions_dir.glob("*.py"))
            if migration_files:
                for mf in migration_files:
                    print(f"  - {mf.name}")
                    # Show file size
                    size = mf.stat().st_size
                    print(f"    Size: {size} bytes")
            else:
                print("  (no migration files found)")
        
        # Check alembic.ini
        alembic_ini = self.migrations_dir / "alembic.ini"
        if alembic_ini.exists():
            print(f"\n✓ alembic.ini found ({alembic_ini.stat().st_size} bytes)")
        else:
            print(f"\n✗ alembic.ini NOT found")
            results["alembic.ini"] = False
        
        # Check env.py
        env_py = self.migrations_dir / "env.py"
        if env_py.exists():
            print(f"✓ env.py found ({env_py.stat().st_size} bytes)")
        else:
            print(f"✗ env.py NOT found")
            results["env.py"] = False
        
        all_verified = all(results.values())
        return all_verified
    
    def run_all(self):
        """Run all setup steps"""
        self.print_header("FLASK-MIGRATE INITIALIZATION")
        print(f"Project Root: {self.project_root}")
        print(f"Backend Directory: {self.backend_dir}")
        print(f"Expected Migrations: {self.migrations_dir}")
        
        # Run all steps
        results = []
        
        print("\n\n" + "#"*70)
        print("# INSTALLING DEPENDENCIES")
        print("#"*70)
        results.append(("Install Requirements", self.step_1_install_requirements()))
        
        if results[0][1]:
            print("\n\n" + "#"*70)
            print("# INITIALIZING MIGRATIONS")
            print("#"*70)
            results.append(("Initialize Migrations", self.step_2_init_migrations()))
        
        if len(results) > 1 and results[1][1]:
            print("\n\n" + "#"*70)
            print("# CREATING MIGRATION")
            print("#"*70)
            results.append(("Create Migration", self.step_3_create_migration()))
        
        if len(results) > 2 and results[2][1]:
            print("\n\n" + "#"*70)
            print("# APPLYING MIGRATION")
            print("#"*70)
            results.append(("Apply Migration", self.step_4_upgrade_database()))
        
        if len(results) > 3 and results[3][1]:
            print("\n\n" + "#"*70)
            print("# VERIFICATION")
            print("#"*70)
            results.append(("Verify Setup", self.step_5_verify()))
        
        # Print summary
        self.print_header("SUMMARY")
        
        print("\nStep Results:")
        for name, success in results:
            status = "✓ PASS" if success else "✗ FAIL"
            print(f"  {status}: {name}")
        
        all_success = all(success for _, success in results)
        
        if all_success:
            print("\n✓ ALL STEPS COMPLETED SUCCESSFULLY!")
            print("\nYou can now:")
            print("  1. Run the application: python run.py")
            print("  2. Create new migrations: python -m flask db migrate -m 'description'")
            print("  3. Apply migrations: python -m flask db upgrade")
            print("  4. Revert migrations: python -m flask db downgrade")
        else:
            print("\n✗ SOME STEPS FAILED!")
            print("Please review the error messages above and fix any issues.")
        
        self.print_header("END")
        
        return 0 if all_success else 1

if __name__ == "__main__":
    setup = MigrationSetup()
    exit_code = setup.run_all()
    sys.exit(exit_code)
