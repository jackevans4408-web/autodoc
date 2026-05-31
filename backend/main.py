from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from backend.routes.diagnose import router as diagnose_router

load_dotenv()

app = FastAPI(title="AutoDoc API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnose_router)

@app.get("/")
def root():
    return {"message": "AutoDoc API is running!"}