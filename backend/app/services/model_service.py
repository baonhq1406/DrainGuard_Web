from pathlib import Path
from threading import RLock
import torch
from fastapi import HTTPException
from ultralytics import YOLO
from sqlalchemy.orm import Session
from ..models import AIModel
from ..config import settings
from .blockage_service import calculate, status_for
from .image_service import annotate

class ModelService:
    def __init__(self): self.model = None; self.model_id = None; self.lock = RLock()
    @staticmethod
    def classes(model) -> list[str]:
        names = model.names
        return [str(names[k]) for k in sorted(names)] if isinstance(names, dict) else [str(v) for v in names]
    def validate(self, record: AIModel) -> AIModel:
        try:
            loaded = YOLO(record.file_path); task = loaded.task
            if task not in {'detect', 'segment'}: raise ValueError(f'Task {task} không được hỗ trợ')
            record.task, record.classes_json, record.status = task, self.classes(loaded), 'READY'
        except Exception as exc:
            record.status = 'INVALID'; raise HTTPException(422, f'Model không hợp lệ: {exc}')
        return record
    def load_active(self, db: Session):
        active = db.query(AIModel).filter_by(is_active=True).first()
        with self.lock:
            if not active: self.model = self.model_id = None; return None
            if self.model_id != active.id: self.model = YOLO(active.file_path); self.model_id = active.id
        return active
    def infer(self, db: Session, record: AIModel, source: Path, destination: Path):
        with self.lock:
            if record.id == self.model_id and self.model is not None: model = self.model
            else: model = YOLO(record.file_path)
            outputs = model.predict(str(source), conf=settings.default_conf, imgsz=record.imgsz or settings.default_imgsz, device=0 if torch.cuda.is_available() else 'cpu', verbose=False)
        output = outputs[0]; classes = record.classes_json or self.classes(model); drain_indices = [i for i,c in enumerate(classes) if c.lower() == 'drain']; debris_indices = [i for i,c in enumerate(classes) if c.lower() == 'debris']
        drain_masks=[]; debris_masks=[]; drains=[]; confidence=None
        if output.boxes is not None:
            for index, box in enumerate(output.boxes):
                cls=int(box.cls[0]); conf=float(box.conf[0]); mask=None
                if output.masks is not None: mask=output.masks.data[index].cpu().numpy() > .5
                if cls in drain_indices:
                    confidence=max(confidence or 0, conf); drains.append({'confidence': round(conf,4)}); 
                    if mask is not None: drain_masks.append(mask)
                elif cls in debris_indices and mask is not None: debris_masks.append(mask)
        detected=bool(drains); blockage=None; per=[]
        if detected and debris_indices and record.task == 'segment' and drain_masks: per, blockage=calculate(drain_masks,debris_masks)
        for i,value in enumerate(per):
            if i < len(drains): drains[i]['blockage_percent']=value
        annotate(source, output, classes, destination, per)
        return {'drain_detected': detected,'drain_count':len(drains),'confidence':round(confidence,4) if confidence else None,'blockage_percent':blockage,'status':status_for(blockage,detected),'drains':drains,'classes':classes}

model_service = ModelService()
