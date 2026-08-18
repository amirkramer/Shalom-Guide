from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String


class Restaurants(Base):
    __tablename__ = "restaurants"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)
    cuisine = Column(String, nullable=False)
    rating = Column(Float, nullable=True)
    reviews = Column(Integer, nullable=True)
    certification = Column(String, nullable=True)
    price_level = Column(Integer, nullable=True)
    distance = Column(Float, nullable=True)
    is_open = Column(Boolean, nullable=True)
    closes_at = Column(String, nullable=True)
    opens_at = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    city = Column(String, nullable=False)
    kids_menu = Column(Boolean, nullable=True)
    pet_friendly = Column(Boolean, nullable=True)
    shabbat_open = Column(Boolean, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)