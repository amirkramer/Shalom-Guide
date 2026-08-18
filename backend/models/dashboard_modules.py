from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Dashboard_modules(Base):
    __tablename__ = "dashboard_modules"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    icon = Column(String, nullable=False)
    label = Column(String, nullable=False)
    path = Column(String, nullable=False)
    subtitle = Column(String, nullable=True)
    highlight = Column(Boolean, nullable=True)
    sort_order = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)