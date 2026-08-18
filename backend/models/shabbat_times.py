from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Shabbat_times(Base):
    __tablename__ = "shabbat_times"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    city = Column(String, nullable=False)
    parasha = Column(String, nullable=False)
    candle_lighting = Column(String, nullable=False)
    havdalah = Column(String, nullable=False)
    date_friday = Column(String, nullable=True)
    hebrew_date = Column(String, nullable=True)
    is_current = Column(Boolean, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)