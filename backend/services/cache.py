import json, hashlib, logging
from typing import Any, Dict, Optional
import redis
logger=logging.getLogger(__name__)
class CacheClient:
    def __init__(self, redis_url: str):
        self.client=None
        if redis_url:
            try:
                self.client=redis.from_url(redis_url, decode_responses=True)
                self.client.ping()
            except Exception:
                logger.warning("redis_unavailable_cache_disabled")
                self.client=None
    def build_key(self,prefix:str,payload:Dict[str,Any])->str:
        return f"{prefix}:{hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()}"
    def get_prediction(self,payload:Dict[str,Any])->Optional[Dict[str,Any]]:
        if not self.client: return None
        raw=self.client.get(self.build_key("prediction",payload)); return json.loads(raw) if raw else None
    def set_prediction(self,payload:Dict[str,Any],result:Dict[str,Any],ttl:int=3600)->None:
        if self.client: self.client.set(self.build_key("prediction",payload),json.dumps(result),ex=ttl)
    def save_batch_result(self,batch_id:str,records:Dict[str,Any],ttl:int=3600)->None:
        if self.client: self.client.set(f"batch:{batch_id}",json.dumps(records),ex=ttl)
    def get_batch_result(self,batch_id:str)->Optional[Dict[str,Any]]:
        if not self.client: return None
        raw=self.client.get(f"batch:{batch_id}"); return json.loads(raw) if raw else None
