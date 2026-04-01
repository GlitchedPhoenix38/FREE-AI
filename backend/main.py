from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import sd_api
import os

app = FastAPI(
    title="LocalMind API",
    description="Privacy-first AI Image Editor API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sd_api.router)


@app.get("/")
async def root():
    return {
        "name": "LocalMind API",
        "version": "1.0.0",
        "description": "Privacy-first AI Image Editor - All data stays on your machine"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
