from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Transport_routes(Base):
    __tablename__ = "transport_routes"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    route_number = Column(String, nullable=False)
    from_city = Column(String, nullable=False)
    to_city = Column(String, nullable=False)
    departure = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    stops = Column(Integer, nullable=True)
    price = Column(Float, nullable=True)
    operator = Column(String, nullable=True)
    type = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)