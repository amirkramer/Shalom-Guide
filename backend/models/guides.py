from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String


class Guides(Base):
    __tablename__ = "guides"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    bio = Column(String(2000), nullable=False)
    photo_url = Column(String(500), nullable=True)
    languages = Column(String(500), nullable=False)
    specialties = Column(String(500), nullable=True)
    cities = Column(String(500), nullable=False)
    paypal_email = Column(String(200), nullable=False)
    rating = Column(Float, nullable=True, default=0, server_default='0')
    total_reviews = Column(Integer, nullable=True, default=0, server_default='0')
    is_active = Column(Boolean, nullable=True, default=True, server_default='true')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)