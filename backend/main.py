from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from backend.routes.diagnose import router as diagnose_router
from backend.routes.auth import router as auth_router

load_dotenv()

app = FastAPI(title="Engine Eye API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnose_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "Engine Eye API is running!"}

@app.head("/")
def root_head():
    return {}