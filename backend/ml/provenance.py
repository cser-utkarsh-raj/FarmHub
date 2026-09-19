from hashlib import sha256

def digest_bytes(data: bytes) -> str:
    return sha256(data).hexdigest()
