# 📄 File: client/encrypt_and_send.py

import requests
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
import base64

# Load the public key (used for encryption)
with open("keys/public.pem", "r") as f:
    public_key = RSA.import_key(f.read())

def encrypt_message(message: str) -> str:
    cipher = PKCS1_OAEP.new(public_key)
    encrypted = cipher.encrypt(message.encode())
    return base64.b64encode(encrypted).decode()

if __name__ == "__main__":
    income = input("💬 Enter your monthly income: ")
    encrypted_income = encrypt_message(income)

    response = requests.post("http://localhost:8000/predict-limits", json={
        "encrypted_income": encrypted_income
    })

    print("🔐 Server Response:")
    print(response.json())
