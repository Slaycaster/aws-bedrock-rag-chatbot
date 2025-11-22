from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.models.user import User
from backend.auth_utils import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

class Token(BaseModel):
    access_token: str
    token_type: str

class AdminSetup(BaseModel):
    username: str
    password: str

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/setup-admin", status_code=status.HTTP_201_CREATED)
async def setup_admin(admin_data: AdminSetup, db: Session = Depends(get_db)):
    # Check if any user exists
    if db.query(User).first():
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    hashed_password = get_password_hash(admin_data.password)
    new_user = User(username=admin_data.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Admin created successfully"}

@router.get("/check-setup")
async def check_setup(db: Session = Depends(get_db)):
    # Returns True if an admin account exists
    return {"is_setup": db.query(User).first() is not None}
