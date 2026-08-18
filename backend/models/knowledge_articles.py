from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Knowledge_articles(Base):
    __tablename__ = "knowledge_articles"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    content = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    read_time = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)