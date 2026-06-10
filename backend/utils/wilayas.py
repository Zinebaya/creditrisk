"""
Wilayas (provinces) of Algeria - complete list with codes
Used for validation and dropdown selection in client forms
"""
import re
from typing import Any, Dict, List

ALGERIAN_WILAYAS = [
    {"code": 1, "name": "Adrar"},
    {"code": 2, "name": "Chlef"},
    {"code": 3, "name": "Laghouat"},
    {"code": 4, "name": "Oum El Bouaghi"},
    {"code": 5, "name": "Batna"},
    {"code": 6, "name": "Béjaïa"},
    {"code": 7, "name": "Biskra"},
    {"code": 8, "name": "Béchar"},
    {"code": 9, "name": "Blida"},
    {"code": 10, "name": "Bouïra"},
    {"code": 11, "name": "Tamanrasset"},
    {"code": 12, "name": "Tébessa"},
    {"code": 13, "name": "Tlemcen"},
    {"code": 14, "name": "Tiaret"},
    {"code": 15, "name": "Tizi Ouzou"},
    {"code": 16, "name": "Alger"},
    {"code": 17, "name": "Djelfa"},
    {"code": 18, "name": "Jijel"},
    {"code": 19, "name": "Sétif"},
    {"code": 20, "name": "Saïda"},
    {"code": 21, "name": "Skikda"},
    {"code": 22, "name": "Sidi Bel Abbès"},
    {"code": 23, "name": "Annaba"},
    {"code": 24, "name": "Guelma"},
    {"code": 25, "name": "Constantine"},
    {"code": 26, "name": "Médéa"},
    {"code": 27, "name": "Mostaganem"},
    {"code": 28, "name": "M'Sila"},
    {"code": 29, "name": "Mascara"},
    {"code": 30, "name": "Ouargla"},
    {"code": 31, "name": "Oran"},
    {"code": 32, "name": "El Bayadh"},
    {"code": 33, "name": "Illizi"},
    {"code": 34, "name": "Bordj Bou Arréridj"},
    {"code": 35, "name": "Boumerdès"},
    {"code": 36, "name": "El Tarf"},
    {"code": 37, "name": "Tindouf"},
    {"code": 38, "name": "Tissemsilt"},
    {"code": 39, "name": "El Oued"},
    {"code": 40, "name": "Khenchela"},
    {"code": 41, "name": "Souk Ahras"},
    {"code": 42, "name": "Tipaza"},
    {"code": 43, "name": "Mila"},
    {"code": 44, "name": "Aïn Defla"},
    {"code": 45, "name": "Naâma"},
    {"code": 46, "name": "Aïn Témouchent"},
    {"code": 47, "name": "Ghardaïa"},
    {"code": 48, "name": "Relizane"},
    {"code": 49, "name": "El M'Ghair"},
    {"code": 50, "name": "El Meniaa"},
    {"code": 51, "name": "Ouled Djellal"},
    {"code": 52, "name": "Bordj Baji Mokhtar"},
    {"code": 53, "name": "Béni Abbès"},
    {"code": 54, "name": "In Salah"},
    {"code": 55, "name": "In Guezzam"},
    {"code": 56, "name": "Touggourt"},
    {"code": 57, "name": "Djanet"},
    {"code": 58, "name": "Timimoun"}
]

def get_wilayas_list() -> List[str]:
    """Return list of Algerian wilayas for dropdown/validation"""
    return sorted([w["name"] for w in ALGERIAN_WILAYAS])

def is_valid_wilaya(wilaya_name: str) -> bool:
    """Check if a wilaya name is valid (supports 'Name' or 'Code - Name')"""
    if not wilaya_name:
        return False
    
    name_clean = wilaya_name.strip()
    
    # Parse out "Code - " prefix if present (e.g. "16 - Alger")
    if " - " in name_clean:
        parts = name_clean.split(" - ", 1)
        name_clean = parts[1].strip()
    elif "-" in name_clean:
        m = re.match(r"^\d+\s*-\s*(.*)$", name_clean)
        if m:
            name_clean = m.group(1).strip()
            
    # Check lowercase case-insensitive match
    valid_names = {w["name"].lower() for w in ALGERIAN_WILAYAS}
    
    # Also support common accent variations (e.g. Naama vs Naâma, Beni vs Béni)
    extended_validations = {
        "naama": "naâma",
        "naâma": "naâma",
        "beni abbès": "béni abbès",
        "béni abbès": "béni abbès",
        "bouira": "bouïra",
        "bouïra": "bouïra",
        "bejaia": "béjaïa",
        "béjaïa": "béjaïa",
        "bechar": "béchar",
        "béchar": "béchar",
        "medea": "médéa",
        "médéa": "médéa",
        "msila": "m'sila",
        "m'sila": "m'sila",
        "saida": "saïda",
        "saïda": "saïda",
        "setif": "sétif",
        "sétif": "sétif",
        "guelma": "guelma",
        "relizane": "relizane",
        "ain defla": "aïn defla",
        "aïn defla": "aïn defla",
        "ain temouchent": "aïn témouchent",
        "aïn témouchent": "aïn témouchent",
        "ghardaia": "ghardaïa",
        "ghardaïa": "ghardaïa"
    }
    
    val = name_clean.lower()
    if val in valid_names:
        return True
        
    normalized_val = extended_validations.get(val, val)
    return normalized_val in valid_names

def get_wilaya_code(wilaya_name: str) -> int:
    """Get the code for a wilaya by name"""
    if not wilaya_name:
        return None
        
    name_clean = wilaya_name.strip()
    if " - " in name_clean:
        try:
            return int(name_clean.split(" - ", 1)[0].strip())
        except ValueError:
            name_clean = name_clean.split(" - ", 1)[1].strip()
    elif "-" in name_clean:
        m = re.match(r"^(\d+)\s*-\s*(.*)$", name_clean)
        if m:
            return int(m.group(1))
            
    for w in ALGERIAN_WILAYAS:
        if w["name"].lower() == name_clean.lower():
            return w["code"]
            
    # Check normalized
    for w in ALGERIAN_WILAYAS:
        # Simple accent removal/normalization for fallback comparison
        def norm(s): return s.lower().replace("é", "e").replace("ï", "i").replace("â", "a").replace("'", "")
        if norm(w["name"]) == norm(name_clean):
            return w["code"]
            
    return None

def get_wilaya_by_code(code: int) -> str:
    """Get the name of a wilaya by code"""
    for w in ALGERIAN_WILAYAS:
        if w["code"] == code:
            return w["name"]
    return None
