from datetime import datetime
from pydantic import BaseModel, Field

class DatasetIn(BaseModel):
    name: str = Field(min_length=1, max_length=160); version: str = Field(min_length=1, max_length=80)
    description: str | None = None; classes_json: list[str] = []; task: str = 'segment'
    image_count: int = Field(default=0, ge=0); train_count: int = Field(default=0, ge=0); val_count: int = Field(default=0, ge=0); test_count: int = Field(default=0, ge=0)
    source: str | None = None
class DatasetOut(DatasetIn):
    id: int; storage_path: str | None = None; created_at: datetime
    model_config = {'from_attributes': True}
class ModelOut(BaseModel):
    id: int; name: str; version: str; filename: str; file_size: int; task: str | None; classes_json: list | None; imgsz: int | None; description: str | None
    training_dataset_id: int | None; metrics_json: dict | None; uploaded_at: datetime; is_active: bool; status: str
    model_config = {'from_attributes': True}
