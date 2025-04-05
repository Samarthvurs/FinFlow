from fastapi import APIRouter
from pydantic import BaseModel

limits_routes = APIRouter()

class LimitPayload(BaseModel):
    income: int
    manual_limits: dict  # Optional: {"Food": 5000, "Transport": 3000}

@limits_routes.post("/set-limits")
def set_limits(payload: LimitPayload):
    if payload.manual_limits:
        return {"message": "Manual limits set successfully", "limits": payload.manual_limits}
    # Assume AI-based prediction for income
    predicted_limits = predict_limits(payload.income)  # Implement AI logic separately
    return {"message": "AI-based limits set successfully", "limits": predicted_limits}