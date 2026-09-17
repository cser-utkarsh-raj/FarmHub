from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.economics import EconomicsInput, EconomicsResult
from backend.app.services.economics_engine import calculate_crop_economics

router = APIRouter(prefix="/economics", tags=["Crop Economics Engine"])

@router.post("/calculate", response_model=EconomicsResult)
def calculate_economics(payload: EconomicsInput):
    """
    Calculates cost breakdown, gross revenue, net profit, margin, and multi-scenario projections
    (conservative, expected, high-price) for a crop in Bihar. Supports Bigha, Katha, Acre, and Hectare.
    """
    try:
        result = calculate_crop_economics(payload)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
