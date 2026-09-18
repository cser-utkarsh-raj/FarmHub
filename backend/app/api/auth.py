from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.ratelimit import auth_rate_limit, limiter
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    oauth2_scheme
)
from backend.app.models.user import User, UserRole, VerificationStatus
from backend.app.models.farmer_profile import FarmerProfile
from backend.app.models.buyer_profile import BuyerProfile
from backend.app.schemas.auth import (
    UserCreate,
    UserLogin,
    Token,
    UserResponse,
    FarmerProfileResponse,
    BuyerProfileResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication & Profiles"])

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id_int).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or disabled.",
        )
    return user

def require_role(*roles: UserRole):
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires role in {[r.value for r in roles]}"
            )
        return user
    return role_checker

@router.post("/register", response_model=Token)
@limiter.limit(auth_rate_limit)
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    # Check phone uniqueness
    existing_user = db.query(User).filter(User.phone == payload.phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this mobile number is already registered."
        )

    if payload.email:
        existing_email = db.query(User).filter(User.email == payload.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email is already registered.",
            )

    # Verification status: phone is verified upon registration in V1 flow
    user = User(
        phone=payload.phone,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        verification_status=VerificationStatus.PHONE_VERIFIED,
        is_active=True
    )
    db.add(user)

    # Create associated profile based on role
    if payload.role == UserRole.FARMER:
        profile = FarmerProfile(
            user_id=user.id,
            district=payload.district or "Patna",
            state="Bihar",
            land_area=payload.land_area or 1.0,
            local_land_unit=payload.local_land_unit or "bigha",
            irrigation_availability=payload.irrigation_availability if payload.irrigation_availability is not None else True,
            irrigation_type="borewell_diesel"
        )
        profile.crops = payload.crops or ["Maize"]
        db.add(profile)

    elif payload.role in (UserRole.DISTRIBUTOR, UserRole.BUYER):
        business_title = payload.business_name or f"{payload.full_name} Traders"
        profile = BuyerProfile(
            user_id=user.id,
            business_name=business_title,
            district=payload.district or "Patna",
            state="Bihar",
            contact_phone=payload.phone,
            verification_status=VerificationStatus.PHONE_VERIFIED
        )
        profile.operating_regions = payload.operating_regions or [payload.district or "Patna"]
        profile.crops_purchased = payload.crops_purchased or ["Maize", "Wheat", "Potato"]
        db.add(profile)

    try:
        db.flush()
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this mobile number or email is already registered.",
        )
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        verification_status=user.verification_status
    )

@router.post("/login", response_model=Token)
@limiter.limit(auth_rate_limit)
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == payload.phone).first()
    if not user or not verify_password(payload.password, user.hashed_password) or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid mobile number or password.",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        verification_status=user.verification_status
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
