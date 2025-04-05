from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt
from app.database.connection import users_db  # Simulated database

auth_routes = APIRouter()

class User(BaseModel):
    email: str
    password: str

@auth_routes.post("/signup")
def signup(user: User):
    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    users_db[user.email] = hashed_pw
    return {"message": "User registered successfully"}

@auth_routes.post("/login")
def login(user: User):
    stored_pw = users_db.get(user.email)
    if not stored_pw or not bcrypt.checkpw(user.password.encode(), stored_pw.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful"}