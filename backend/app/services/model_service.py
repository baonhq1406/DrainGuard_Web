from pathlib import Path
from threading import RLock
import torch
from fastapi import HTTPException
from ultralytics import YOLO
from sqlalchemy.orm import Session
from ..models import AIModel
from ..config import BASE_DIR, settings
from .blockage_service import calculate, status_for
from .image_service import annotate

class ModelService:
    def __init__(self):
        self.model = None
        self.model_id = None
        self.model_mtime = None
        self.lock = RLock()

    def _resolve_model_path(self, file_path: str) -> Path:
        p = Path(file_path)
        if p.is_file():
            return p
        storage_p = Path(settings.model_storage_dir) / p.name
        if storage_p.is_file():
            return storage_p
        base_p = Path(BASE_DIR) / file_path
        if base_p.is_file():
            return base_p
        # Fallback: check if yolo26l-seg.pt was placed directly in model_storage_dir
        seg_p = Path(settings.model_storage_dir) / 'yolo26l-seg.pt'
        if seg_p.is_file():
            return seg_p
        return p

    @staticmethod
    def classes(model) -> list[str]:
        names = model.names
        return [str(names[k]) for k in sorted(names)] if isinstance(names, dict) else [str(v) for v in names]

    def validate(self, record: AIModel) -> AIModel:
        try:
            model_path = self._resolve_model_path(record.file_path)
            loaded = YOLO(str(model_path))
            task = loaded.task
            if task not in {'detect', 'segment'}:
                raise ValueError(f'Task {task} không được hỗ trợ')
            record.task, record.classes_json, record.status = task, self.classes(loaded), 'READY'
        except Exception as exc:
            record.status = 'INVALID'
            raise HTTPException(422, f'Model không hợp lệ: {exc}')
        return record

    def load_active(self, db: Session):
        active = db.query(AIModel).filter_by(is_active=True).first()
        with self.lock:
            if not active:
                self.model = self.model_id = self.model_mtime = None
                return None
            model_path = self._resolve_model_path(active.file_path)
            if not model_path.is_file():
                self.model = self.model_id = self.model_mtime = None
                return None
            mtime = model_path.stat().st_mtime
            if self.model_id != active.id or self.model_mtime != mtime or self.model is None:
                self.model = YOLO(str(model_path))
                self.model_id = active.id
                self.model_mtime = mtime
                # Auto-sync task & classes if the .pt file was swapped to yolo26l-seg.pt
                actual_task = getattr(self.model, 'task', None)
                if actual_task in {'detect', 'segment'} and active.task != actual_task:
                    active.task = actual_task
                    active.classes_json = self.classes(self.model)
                    db.commit()
                    db.refresh(active)
        return active

    def infer(self, db: Session, record: AIModel, source: Path, destination: Path):
        model_path = self._resolve_model_path(record.file_path)
        if not model_path.is_file():
            raise HTTPException(404, f'Không tìm thấy file mô hình tại {record.file_path}')
        mtime = model_path.stat().st_mtime
        with self.lock:
            if record.id == self.model_id and self.model_mtime == mtime and self.model is not None:
                model = self.model
            else:
                model = YOLO(str(model_path))
                self.model = model
                self.model_id = record.id
                self.model_mtime = mtime
            outputs = model.predict(
                str(source),
                conf=settings.default_conf,
                imgsz=record.imgsz or settings.default_imgsz,
                device=0 if torch.cuda.is_available() else 'cpu',
                verbose=False,
            )
        output = outputs[0]
        actual_task = getattr(model, 'task', record.task)
        if actual_task in {'detect', 'segment'} and record.task != actual_task:
            record.task = actual_task
            db.commit()

        classes = record.classes_json or self.classes(model)
        drain_indices = [i for i, c in enumerate(classes) if c.lower() == 'drain']
        debris_indices = [i for i, c in enumerate(classes) if c.lower() == 'debris']
        drain_masks = []
        debris_masks = []
        drains = []
        confidence = None
        if output.boxes is not None:
            for index, box in enumerate(output.boxes):
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                mask = None
                if output.masks is not None and index < len(output.masks.data):
                    mask = output.masks.data[index].cpu().numpy() > 0.5
                if cls in drain_indices:
                    confidence = max(confidence or 0, conf)
                    drains.append({'confidence': round(conf, 4)})
                    if mask is not None:
                        drain_masks.append(mask)
                elif cls in debris_indices and mask is not None:
                    debris_masks.append(mask)
        detected = bool(drains)
        blockage = None
        per = []
        if detected and debris_indices and (actual_task == 'segment' or output.masks is not None) and drain_masks:
            per, blockage = calculate(drain_masks, debris_masks)
        for i, value in enumerate(per):
            if i < len(drains):
                drains[i]['blockage_percent'] = value
        annotate(source, output, classes, destination, per)
        return {
            'drain_detected': detected,
            'drain_count': len(drains),
            'confidence': round(confidence, 4) if confidence else None,
            'blockage_percent': blockage,
            'status': status_for(blockage, detected),
            'drains': drains,
            'classes': classes,
        }

model_service = ModelService()
