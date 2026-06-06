import re
from typing import Any, Dict, List
from flask import Request
REQUIRED_FEATURES = ["loan_amnt","annual_inc","dti","fico_range_high","revol_util","open_acc","total_acc","inq_last_6mths","delinq_2yrs","acc_now_delinq"]
def validate_json_payload(payload: Dict[str, Any], required_fields: List[str] = None) -> Dict[str, Any]:
    required_fields = required_fields or REQUIRED_FEATURES
    missing=[f for f in required_fields if f not in payload]
    if missing: raise ValueError(f"Missing required fields: {', '.join(missing)}")
    cleaned={f: float(payload[f]) for f in required_fields}
    if "client_id" in payload: cleaned["client_id"] = int(payload["client_id"])
    return cleaned
def parse_request_json(request: Request) -> Dict[str, Any]:
    data=request.get_json(force=True,silent=True)
    if not data: raise ValueError("Invalid or missing JSON payload")
    return data
def validate_phone_format(phone:str)->bool:
    return re.match(r"^(\+213|0|00)(5|6|7|1|2|3)[0-9]{8,12}$", re.sub(r"[\s-]", "", phone or "")) is not None
