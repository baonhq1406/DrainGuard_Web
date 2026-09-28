from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AIModel, AnalysisRecord
from ..services.storage_service import save_upload, IMAGE_EXTS, IMAGE_TYPES
from ..services.model_service import model_service
from ..config import settings
router=APIRouter(tags=['analyze'])
@router.post('/analyze')
async def analyze(image:UploadFile=File(...),latitude:float|None=Form(None),longitude:float|None=Form(None),db:Session=Depends(get_db)):
    model=db.query(AIModel).filter_by(is_active=True).first()
    if not model: raise HTTPException(503,'Chưa có AI model active. Hãy upload và kích hoạt model trong AI Models.')
    source,name=await save_upload(image,settings.upload_dir,IMAGE_EXTS,IMAGE_TYPES); target=Path(settings.output_dir)/f'{uuid4().hex}.jpg'
    result=model_service.infer(db,model,source,target)
    record=AnalysisRecord(original_image=name,annotated_image=target.name,latitude=latitude,longitude=longitude,model_id=model.id,model_name=model.name,model_version=model.version,model_task=model.task,model_classes_json=model.classes_json,**{k:result[k] for k in ['drain_detected','drain_count','confidence','blockage_percent','status']})
    db.add(record);db.commit();db.refresh(record)
    return {'success':True,'analysis_id':record.id,'timestamp':record.created_at,'model':{'id':model.id,'name':model.name,'version':model.version,'task':model.task,'classes':model.classes_json},'result':{k:result[k] for k in ['drain_detected','drain_count','confidence','blockage_percent','status']},'location':{'latitude':latitude,'longitude':longitude},'original_image_url':f'/files/uploads/{name}','annotated_image_url':f'/files/outputs/{target.name}','drains':result['drains']}
