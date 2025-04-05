# 📄 File: api/crypto_utils.py

from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
import base64

with open("keys/private.pem", "r") as f:
    PRIVATE_KEY = RSA.import_key(f.read())

def decrypt_message(encrypted_base64: str) -> str:
    try:
        encrypted_bytes = base64.b64decode(encrypted_base64)
        cipher = PKCS1_OAEP.new(PRIVATE_KEY)
        decrypted = cipher.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception as e:
        raise ValueError(f"Decryption failed: {e}")
