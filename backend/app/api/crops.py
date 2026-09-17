from typing import List
from fastapi import APIRouter, HTTPException
from backend.app.services.crops_catalog import list_all_crops, get_crop_by_name
from backend.app.schemas.crops import CropDetail

router = APIRouter(prefix="/crops", tags=["Bihar Crops Catalog"])

@router.get("", response_model=List[CropDetail])
def get_crops():
    """Returns the list of Bihar V1 supported crops with ICAR/BAU benchmarks."""
    return list_all_crops()

@router.get("/{crop_name}", response_model=CropDetail)
def get_crop(crop_name: str):
    crop = get_crop_by_name(crop_name)
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_name}' not found in Bihar V1 catalog.")
    return crop
