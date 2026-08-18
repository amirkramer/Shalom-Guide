from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Quick_access_items(Base):
    __tablename__ = "quick_access_items"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    icon = Column(String, nullable=False)
    label = Column(String, nullable=False)
    action = Column(String, nullable=False)
    sort_order = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)