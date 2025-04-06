import uvicorn
from backend.backend import app

if __name__ == "__main__":
    uvicorn.run(
        "backend.backend:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 