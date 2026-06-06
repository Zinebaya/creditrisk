"""
Wilayas (provinces) of Algeria - complete list with codes
Used for validation and dropdown selection in client forms
"""

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
    {"code": 28, "name": "M'sila"},
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
    {"code": 45, "name": "Naama"},
    {"code": 46, "name": "Aïn Témouchent"},
    {"code": 47, "name": "Ghardaïa"},
    {"code": 48, "name": "Relizane"},
    {"code": 49, "name": "Draa El Mizan"},
    {"code": 50, "name": "Laghouat"},
    {"code": 51, "name": "Touggourt"},
    {"code": 52, "name": "Djanet"},
    {"code": 53, "name": "Beni Abbès"},
    {"code": 54, "name": "Béni Bahdel"},
    {"code": 55, "name": "Béni Douala"},
    {"code": 56, "name": "Béni Saf"},
    {"code": 57, "name": "Mers El Kébir"},
    {"code": 58, "name": "Sidi Khettab"},
]

def get_wilayas_list():
    """Return list of Algerian wilayas for dropdown/validation"""
    return sorted([w["name"] for w in ALGERIAN_WILAYAS])

def is_valid_wilaya(wilaya_name: str) -> bool:
    """Check if a wilaya name is valid"""
    valid_names = {w["name"] for w in ALGERIAN_WILAYAS}
    return wilaya_name in valid_names if wilaya_name else False

def get_wilaya_code(wilaya_name: str) -> int:
    """Get the code for a wilaya by name"""
    for w in ALGERIAN_WILAYAS:
        if w["name"] == wilaya_name:
            return w["code"]
    return None

def get_wilaya_by_code(code: int) -> str:
    """Get the name of a wilaya by code"""
    for w in ALGERIAN_WILAYAS:
        if w["code"] == code:
            return w["name"]
    return None
