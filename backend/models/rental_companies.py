from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String


class Rental_companies(Base):
    __tablename__ = "rental_companies"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)
    flag = Column(String, nullable=True)
    price_from = Column(Float, nullable=False)
    vehicle_type = Column(String, nullable=True)
    rating = Column(Float, nullable=True)
    website_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    locations = Column(String, nullable=True)
    is_local = Column(Boolean, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)