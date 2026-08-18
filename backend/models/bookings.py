from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String


class Bookings(Base):
    __tablename__ = "bookings"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    tour_id = Column(Integer, index=True, nullable=False)
    guide_id = Column(Integer, index=True, nullable=False)
    booking_date = Column(Date, nullable=False)
    total_price = Column(Float, nullable=False)
    commission_amount = Column(Float, nullable=False)
    guide_amount = Column(Float, nullable=False)
    status = Column(String(50), nullable=True, default='pending', server_default='pending')
    payment_session_id = Column(String(300), index=True, nullable=True)
    guide_paid = Column(Boolean, nullable=True, default=False, server_default='false')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)