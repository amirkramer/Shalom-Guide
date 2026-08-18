from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String


class Tours(Base):
    __tablename__ = "tours"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    guide_id = Column(Integer, index=True, nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(String(2000), nullable=False)
    city = Column(String(100), nullable=False)
    duration_hours = Column(Float, nullable=False)
    price_ils = Column(Float, nullable=False)
    max_participants = Column(Integer, nullable=True, default=10, server_default='10')
    is_active = Column(Boolean, nullable=True, default=True, server_default='true')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)