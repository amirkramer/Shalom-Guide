from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String


class Shopping_brands(Base):
    __tablename__ = "shopping_brands"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=True)
    description = Column(String, nullable=True)
    short_description = Column(String, nullable=True)
    category_ids = Column(String, nullable=True)  # comma-separated slugs matching frontend's category list
    style_tags = Column(String, nullable=True)
    price_level = Column(Integer, nullable=True)  # 1-4
    israeli_brand = Column(Boolean, nullable=True)
    made_in_israel = Column(Boolean, nullable=True)
    verification_status = Column(String, nullable=True)  # "verified" | "unverified"
    sustainability_tags = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    online_store_url = Column(String, nullable=True)
    instagram_url = Column(String, nullable=True)
    is_featured = Column(Boolean, nullable=True)
    sponsored = Column(Boolean, nullable=True)
    logo_url = Column(String, nullable=True)
    city = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)
