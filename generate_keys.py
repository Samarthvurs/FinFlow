# 📄 File: generate_keys.py

from Crypto.PublicKey import RSA

# Generate private key
private_key = RSA.generate(2048)
with open("keys/private.pem", "wb") as f:
    f.write(private_key.export_key())

# Generate public key
public_key = private_key.publickey()
with open("keys/public.pem", "wb") as f:
    f.write(public_key.export_key())
    
print("✅ RSA key pair generated in 'keys/' folder.")
