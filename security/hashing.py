import hashlib

def hashing_password(password):
    encoded=password.encode()
    hashed=hashlib.sha256(encoded).hexdigest()
    return hashed