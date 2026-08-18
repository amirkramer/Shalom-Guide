from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Shopping_offers(Base):
    __tablename__ = "shopping_offers"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    brand_id = Column(Integer, index=True, nullable=True)
    store_id = Column(Integer, index=True, nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    discount_percent = Column(Integer, nullable=True)
    coupon_code = Column(String, nullable=True)
    valid_until = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)