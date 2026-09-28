from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base

class Dataset(Base):
    __tablename__ = 'datasets'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160)); version: Mapped[str] = mapped_column(String(80))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    classes_json: Mapped[list] = mapped_column(JSON, default=list)
    task: Mapped[str] = mapped_column(String(40), default='segment')
    image_count: Mapped[int] = mapped_column(Integer, default=0); train_count: Mapped[int] = mapped_column(Integer, default=0)
    val_count: Mapped[int] = mapped_column(Integer, default=0); test_count: Mapped[int] = mapped_column(Integer, default=0)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True); storage_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow); updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIModel(Base):
    __tablename__ = 'ai_models'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160)); version: Mapped[str] = mapped_column(String(80))
    filename: Mapped[str] = mapped_column(String(255)); file_path: Mapped[str] = mapped_column(String(500)); file_size: Mapped[int] = mapped_column(Integer)
    task: Mapped[str | None] = mapped_column(String(40), nullable=True); classes_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
    imgsz: Mapped[int | None] = mapped_column(Integer, nullable=True); description: Mapped[str | None] = mapped_column(Text, nullable=True)
    training_dataset_id: Mapped[int | None] = mapped_column(ForeignKey('datasets.id'), nullable=True); metrics_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow); created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow); updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False); status: Mapped[str] = mapped_column(String(20), default='UPLOADED')

class AnalysisRecord(Base):
    __tablename__ = 'analysis_records'
    id: Mapped[int] = mapped_column(primary_key=True); created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    original_image: Mapped[str] = mapped_column(String(500)); annotated_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True); longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    drain_detected: Mapped[bool] = mapped_column(Boolean); drain_count: Mapped[int] = mapped_column(Integer); confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    blockage_percent: Mapped[float | None] = mapped_column(Float, nullable=True); status: Mapped[str] = mapped_column(String(30))
    model_id: Mapped[int] = mapped_column(Integer); model_name: Mapped[str] = mapped_column(String(160)); model_version: Mapped[str] = mapped_column(String(80)); model_task: Mapped[str | None] = mapped_column(String(40), nullable=True); model_classes_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
