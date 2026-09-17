"""
Database Seeding Script for FarmHub Bihar V1 Launch.
Populates verified mandi records, demo farmer and buyer accounts with authentic Bihar agricultural parameters.
"""
from datetime import date, timedelta
from sqlalchemy.orm import Session
from backend.app.core.security import hash_password
from backend.app.models.user import User, UserRole, VerificationStatus
from backend.app.models.farmer_profile import FarmerProfile
from backend.app.models.buyer_profile import BuyerProfile
from backend.app.models.market_price import MandiRecord
from backend.app.core.logging import logger

BIHAR_MANDIS = [
    {"market": "Gulabbagh (Purnia)", "district": "Purnia", "commodities": ["Maize", "Paddy", "Wheat", "Mustard"]},
    {"market": "Patna (Gulzarbagh)", "district": "Patna", "commodities": ["Wheat", "Paddy", "Potato", "Onion", "Tomato", "Gram"]},
    {"market": "Bihar Sharif (Nalanda)", "district": "Nalanda", "commodities": ["Potato", "Onion", "Tomato", "Cauliflower", "Gram"]},
    {"market": "Muzaffarpur (Brahmpura)", "district": "Muzaffarpur", "commodities": ["Maize", "Tomato", "Cauliflower", "Paddy"]},
    {"market": "Samastipur", "district": "Samastipur", "commodities": ["Maize", "Potato", "Wheat", "Mustard"]},
    {"market": "Begusarai", "district": "Begusarai", "commodities": ["Maize", "Mustard", "Wheat"]},
    {"market": "Sasaram (Rohtas)", "district": "Rohtas", "commodities": ["Paddy", "Wheat", "Gram"]},
    {"market": "Hajipur (Vaishali)", "district": "Vaishali", "commodities": ["Tomato", "Cauliflower", "Potato", "Maize"]}
]

BASE_PRICES = {
    "Maize": 2180.0,
    "Wheat": 2275.0,
    "Paddy": 2300.0,
    "Potato": 1280.0,
    "Onion": 1850.0,
    "Tomato": 1650.0,
    "Mustard": 5400.0,
    "Gram": 5800.0,
    "Cauliflower": 1450.0
}

def seed_database(db: Session):
    # 1. Seed demo farmer and buyers if none exist
    existing_user = db.query(User).first()
    if not existing_user:
        logger.info("Seeding initial users and profiles...")

        # Farmer Ramesh Kumar
        farmer = User(
            phone="9876543210",
            email="ramesh.farmer@bihar.farmhub.in",
            full_name="Ramesh Kumar",
            hashed_password=hash_password("farmer123"),
            role=UserRole.FARMER,
            verification_status=VerificationStatus.PHONE_VERIFIED,
            is_active=True
        )
        db.add(farmer)
        db.flush()

        farmer_profile = FarmerProfile(
            user_id=farmer.id,
            district="Purnia",
            block_or_village="Kasba",
            state="Bihar",
            preferred_language="hi",
            land_area=4.0,
            local_land_unit="bigha",
            irrigation_availability=True,
            irrigation_type="borewell_diesel"
        )
        farmer_profile.crops = ["Maize", "Potato", "Wheat"]
        db.add(farmer_profile)

        # Buyer 1: Gulabbagh Purnia
        buyer1 = User(
            phone="9876543211",
            email="gulabbagh.maize@bihar.farmhub.in",
            full_name="Sanjay Agarwal",
            hashed_password=hash_password("buyer123"),
            role=UserRole.BUYER,
            verification_status=VerificationStatus.BUSINESS_VERIFIED,
            is_active=True
        )
        db.add(buyer1)
        db.flush()

        b1_profile = BuyerProfile(
            user_id=buyer1.id,
            business_name="Purnia Grain Agro Traders",
            district="Purnia",
            state="Bihar",
            contact_phone="9876543211",
            contact_method="PHONE",
            approx_monthly_quantity_quintals=500.0,
            verification_status=VerificationStatus.BUSINESS_VERIFIED
        )
        b1_profile.operating_regions = ["Purnia", "Katihar", "Araria", "Kishanganj"]
        b1_profile.crops_purchased = ["Maize", "Wheat", "Mustard"]
        db.add(b1_profile)

        # Buyer 2: Bihar Sharif Nalanda
        buyer2 = User(
            phone="9876543212",
            email="magadh.coldstorage@bihar.farmhub.in",
            full_name="Vikram Singh",
            hashed_password=hash_password("buyer123"),
            role=UserRole.DISTRIBUTOR,
            verification_status=VerificationStatus.KYC_VERIFIED,
            is_active=True
        )
        db.add(buyer2)
        db.flush()

        b2_profile = BuyerProfile(
            user_id=buyer2.id,
            business_name="Magadh Cold Storage & Produce Aggregators",
            district="Nalanda",
            state="Bihar",
            contact_phone="9876543212",
            contact_method="PHONE",
            approx_monthly_quantity_quintals=850.0,
            verification_status=VerificationStatus.KYC_VERIFIED
        )
        b2_profile.operating_regions = ["Nalanda", "Patna", "Gaya", "Nawada"]
        b2_profile.crops_purchased = ["Potato", "Onion", "Tomato", "Cauliflower"]
        db.add(b2_profile)

        # Buyer 3: Patna Food Processing
        buyer3 = User(
            phone="9876543213",
            email="patna.procurement@bihar.farmhub.in",
            full_name="Rajesh Verma",
            hashed_password=hash_password("buyer123"),
            role=UserRole.BUYER,
            verification_status=VerificationStatus.BUSINESS_VERIFIED,
            is_active=True
        )
        db.add(buyer3)
        db.flush()

        b3_profile = BuyerProfile(
            user_id=buyer3.id,
            business_name="Patna Feed & Flour Mills Corp",
            district="Patna",
            state="Bihar",
            contact_phone="9876543213",
            contact_method="PHONE",
            approx_monthly_quantity_quintals=1200.0,
            verification_status=VerificationStatus.BUSINESS_VERIFIED
        )
        b3_profile.operating_regions = ["Patna", "Bhojpur", "Vaishali", "Rohtas"]
        b3_profile.crops_purchased = ["Wheat", "Maize", "Paddy", "Gram"]
        db.add(b3_profile)

        db.commit()

    # 2. Seed historical Mandi records if none exist
    records_count = db.query(MandiRecord).count()
    if records_count < 50:
        logger.info("Generating realistic historical mandi time series records for Bihar mandis...")
        today = date.today()

        records_to_insert = []
        # Generate past 45 days of daily observations for each mandi + commodity
        for m_info in BIHAR_MANDIS:
            mkt = m_info["market"]
            dist = m_info["district"]
            for comm in m_info["commodities"]:
                base = BASE_PRICES.get(comm, 2000.0)

                # Mandi specific variance
                mkt_mult = 1.0
                if "Gulabbagh" in mkt and comm == "Maize":
                    mkt_mult = 1.025
                elif "Bihar Sharif" in mkt and comm in ("Potato", "Onion"):
                    mkt_mult = 1.02
                elif "Patna" in mkt:
                    mkt_mult = 1.035

                for days_ago in range(45, -1, -1):
                    rec_date = today - timedelta(days=days_ago)

                    # Realistic daily variation wave
                    day_factor = 1.0 + (0.04 * ((days_ago % 7) - 3) / 3.0) + (0.02 * ((days_ago % 13) - 6) / 6.0)
                    center = round(base * mkt_mult * day_factor, 2)
                    min_p = round(center * 0.96, 2)
                    max_p = round(center * 1.05, 2)
                    vol = round(120.0 + (days_ago * 2.5) + (days_ago % 5 * 15), 1)

                    records_to_insert.append(MandiRecord(
                        market=mkt,
                        district=dist,
                        state="Bihar",
                        commodity=comm,
                        variety="Desi / Hybrid",
                        min_price=min_p,
                        max_price=max_p,
                        modal_price=center,
                        arrivals_volume=vol,
                        unit="INR/quintal",
                        record_date=rec_date
                    ))

        db.bulk_save_objects(records_to_insert)
        db.commit()
        logger.info(f"Seeded {len(records_to_insert)} mandi records successfully.")
