import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.database import engine, Base
from backend.api import auth, admin, chat

# Create tables
Base.metadata.create_all(bind=engine)

# Check if running in production mode
IS_PRODUCTION = os.getenv("ENVIRONMENT", "production") == "production"

app = FastAPI(
    title="RAG Chatbot API",
    debug=not IS_PRODUCTION
)

# Production error handling middleware
@app.middleware("http")
async def production_error_handler(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        if IS_PRODUCTION:
            # In production, return generic error
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Something went wrong. Please try again later."}
            )
        else:
            # In development, show detailed error
            import traceback
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": str(e),
                    "traceback": traceback.format_exc()
                }
            )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"message": "RAG Chatbot API is running"}
