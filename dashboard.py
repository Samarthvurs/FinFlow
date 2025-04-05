from fastapi import APIRouter
from app.utils import calculate_summary

dashboard_routes = APIRouter()

@dashboard_routes.get("/summary")
def get_summary(period: str):  # "weekly" or "monthly"
    summary = calculate_summary(period)
    return summary