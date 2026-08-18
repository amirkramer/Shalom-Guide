from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Emergency_services(Base):
    __tablename__ = "emergency_services"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    service_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    description = Column(String, nullable=True)
    color = Column(String, nullable=True)
    category = Column(String, nullable=True)
    priority = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)