"""
Password validation module for enhanced security
Enforces password strength requirements
"""

import re
from typing import Tuple


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validate password meets security requirements:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - At least 1 special character
    
    Returns:
        (is_valid, error_message)
    """
    if not password:
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least 1 uppercase letter"

    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least 1 lowercase letter"

    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least 1 number"
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
        return False, "Password must contain at least 1 special character"
    
    return True, ""
