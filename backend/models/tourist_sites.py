from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String


class Tourist_sites(Base):
    __tablename__ = "tourist_sites"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    city = Column(String, nullable=False)
    region = Column(String, nullable=True)
    hours = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    description = Column(String, nullable=True)
    audio_guide = Column(Boolean, nullable=True)
    accessible = Column(Boolean, nullable=True)
    faith = Column(String, nullable=True)
    dress_code = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    highlights = Column(String, nullable=True)
    unesco = Column(Boolean, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)