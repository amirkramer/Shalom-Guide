from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Featured_restaurants(Base):
    __tablename__ = "featured_restaurants"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    city = Column(String, nullable=False)
    rating = Column(Float, nullable=True)
    price_level = Column(Integer, nullable=True)
    image_url = Column(String, nullable=True)
    featured_section = Column(String, nullable=True)
    sort_order = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)