import redis


class CacheClient:
    def __init__(self, redis_url: str):
        self.client = None
        if redis_url:
            try:
                self.client = redis.Redis.from_url(redis_url, decode_responses=True)
                self.client.ping()
            except Exception:
                self.client = None

    def get(self, key: str):
        if not self.client:
            return None
        try:
            return self.client.get(key)
        except Exception:
            return None

    def set(self, key: str, value: str, ttl: int):
        if not self.client:
            return
        try:
            self.client.set(key, value, ex=ttl)
        except Exception:
            pass

