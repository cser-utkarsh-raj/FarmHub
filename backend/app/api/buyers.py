from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.user import User, UserRole, VerificationStatus
from backend.app.models.buyer_profile import BuyerProfile
from backend.app.models.inquiry import CropInquiry
from backend.app.schemas.buyers import (
    BuyerDirectoryItem,
    InquiryCreate,
    InquiryStatusUpdate,
    InquiryResponse
)
from backend.app.api.auth import get_current_user

router = APIRouter(tags=["Buyer Directory & Farmer Inquiries"])

@router.get("/buyers", response_model=List[BuyerDirectoryItem])
def list_buyers(
    crop: Optional[str] = Query(None, description="Crop required, e.g. Maize"),
    district: Optional[str] = Query(None, description="Operating district in Bihar, e.g. Purnia"),
    verified_only: bool = Query(False, description="Filter only verified buyers"),
    db: Session = Depends(get_db)
):
    """
    Returns buyer / distributor directory with structured verification status.
    Excludes sensitive private credentials.
    """
    query = db.query(BuyerProfile).filter(BuyerProfile.is_active == True)

    if district:
        query = query.filter(
            (BuyerProfile.district.ilike(f"%{district.strip()}%")) |
            (BuyerProfile.operating_regions_json.ilike(f"%{district.strip()}%"))
        )

    if verified_only:
        query = query.filter(BuyerProfile.verification_status != VerificationStatus.UNVERIFIED)

    profiles = query.all()
    results = []

    for p in profiles:
        crops_list = p.crops_purchased
        if crop:
            clean_crop = crop.strip().lower()
            if not any(clean_crop in c.lower() for c in crops_list):
                continue

        results.append(BuyerDirectoryItem(
            id=p.id,
            user_id=p.user_id,
            business_name=p.business_name,
            district=p.district,
            state=p.state,
            operating_regions=p.operating_regions,
            crops_purchased=crops_list,
            approx_monthly_quantity_quintals=p.approx_monthly_quantity_quintals,
            verification_status=p.verification_status,
            contact_method=p.contact_method
        ))

    return results

@router.post("/buyers/{buyer_user_id}/inquire", response_model=InquiryResponse)
def submit_crop_inquiry(
    buyer_user_id: int,
    payload: InquiryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Farmer sends a crop supply inquiry to a buyer.
    """
    # Verify buyer exists
    buyer = db.query(User).filter(User.id == buyer_user_id).first()
    if not buyer or buyer.role not in (UserRole.BUYER, UserRole.DISTRIBUTOR):
        raise HTTPException(status_code=404, detail="Target buyer/distributor not found.")

    inquiry = CropInquiry(
        farmer_id=current_user.id,
        buyer_id=buyer.id,
        crop=payload.crop,
        quantity_quintals=payload.quantity_quintals,
        expected_harvest_date=payload.expected_harvest_date,
        target_price_inr=payload.target_price_inr,
        notes=payload.notes,
        status="PENDING"
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    buyer_name = buyer.buyer_profile.business_name if buyer.buyer_profile else buyer.full_name
    return InquiryResponse(
        id=inquiry.id,
        farmer_id=inquiry.farmer_id,
        buyer_id=inquiry.buyer_id,
        farmer_name=current_user.full_name,
        farmer_phone=current_user.phone,
        buyer_business_name=buyer_name,
        crop=inquiry.crop,
        quantity_quintals=inquiry.quantity_quintals,
        expected_harvest_date=inquiry.expected_harvest_date,
        target_price_inr=inquiry.target_price_inr,
        notes=inquiry.notes,
        status=inquiry.status,
        buyer_response=inquiry.buyer_response,
        created_at=inquiry.created_at,
        updated_at=inquiry.updated_at
    )

@router.get("/inquiries", response_model=List[InquiryResponse])
def get_user_inquiries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns inquiries relevant to current authenticated user (sent or received).
    """
    if current_user.role == UserRole.FARMER:
        inquiries = db.query(CropInquiry).filter(CropInquiry.farmer_id == current_user.id).order_by(CropInquiry.created_at.desc()).all()
    else:
        inquiries = db.query(CropInquiry).filter(CropInquiry.buyer_id == current_user.id).order_by(CropInquiry.created_at.desc()).all()

    results = []
    for inq in inquiries:
        farmer = db.query(User).filter(User.id == inq.farmer_id).first()
        buyer = db.query(User).filter(User.id == inq.buyer_id).first()
        buyer_name = (buyer.buyer_profile.business_name if (buyer and buyer.buyer_profile) else (buyer.full_name if buyer else "Buyer"))

        results.append(InquiryResponse(
            id=inq.id,
            farmer_id=inq.farmer_id,
            buyer_id=inq.buyer_id,
            farmer_name=farmer.full_name if farmer else "Farmer",
            farmer_phone=farmer.phone if farmer else "",
            buyer_business_name=buyer_name,
            crop=inq.crop,
            quantity_quintals=inq.quantity_quintals,
            expected_harvest_date=inq.expected_harvest_date,
            target_price_inr=inq.target_price_inr,
            notes=inq.notes,
            status=inq.status,
            buyer_response=inq.buyer_response,
            created_at=inq.created_at,
            updated_at=inq.updated_at
        ))
    return results

@router.patch("/inquiries/{inquiry_id}/status", response_model=InquiryResponse)
def update_inquiry_status(
    inquiry_id: int,
    payload: InquiryStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Buyer updates inquiry status (ACCEPTED, DECLINED, CONTACTED) and optional message.
    """
    inquiry = db.query(CropInquiry).filter(CropInquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found.")

    if inquiry.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the recipient buyer can respond to this inquiry.")

    inquiry.status = payload.status
    if payload.buyer_response:
        inquiry.buyer_response = payload.buyer_response

    db.commit()
    db.refresh(inquiry)

    farmer = db.query(User).filter(User.id == inquiry.farmer_id).first()
    buyer = db.query(User).filter(User.id == inquiry.buyer_id).first()
    buyer_name = (buyer.buyer_profile.business_name if (buyer and buyer.buyer_profile) else buyer.full_name)

    return InquiryResponse(
        id=inquiry.id,
        farmer_id=inquiry.farmer_id,
        buyer_id=inquiry.buyer_id,
        farmer_name=farmer.full_name if farmer else "Farmer",
        farmer_phone=farmer.phone if farmer else "",
        buyer_business_name=buyer_name,
        crop=inquiry.crop,
        quantity_quintals=inquiry.quantity_quintals,
        expected_harvest_date=inquiry.expected_harvest_date,
        target_price_inr=inquiry.target_price_inr,
        notes=inquiry.notes,
        status=inquiry.status,
        buyer_response=inquiry.buyer_response,
        created_at=inquiry.created_at,
        updated_at=inquiry.updated_at
    )
