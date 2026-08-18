from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class App_languages(Base):
    __tablename__ = "app_languages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    code = Column(String, nullable=False)
    flag = Column(String, nullable=True)
    name = Column(String, nullable=False)
    sort_order = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)