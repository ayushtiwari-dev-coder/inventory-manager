# LOCATION: org_credential_manager.py
############################################################
import re
from typing import Optional

def validate_org_name(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError('Organization name cannot be empty or pure whitespace')
    
    # Ensure regex checks alphanumeric, space, and hyphen
    if not re.match(r"^[a-zA-Z0-9\s-]+$", stripped):
        raise ValueError('Organization name can only contain alphanumeric characters, spaces, and dashes')
    
    return stripped

def validate_owner_gmail(value: Optional[str]) -> Optional[str]:
    if value is None or value.strip() == "":
        return None
        
    clean_email = value.strip().lower()
    email_regex = r"^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
    if not re.match(email_regex, clean_email):
        raise ValueError('Invalid email syntax formatting provided')
        
    return clean_email