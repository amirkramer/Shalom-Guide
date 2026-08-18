from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Taxi_info(Base):
    __tablename__ = "taxi_info"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    distance_range = Column(String, nullable=False)
    distance_label = Column(String, nullable=True)
    price_min = Column(Float, nullable=False)
    price_max = Column(Float, nullable=False)
    currency = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)