import json
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AIModel
from ..schemas.common import ModelOut
from ..services.storage_service import save_upload
from ..services.model_service import model_service
from ..config import settings

router=APIRouter(prefix='/models', tags=['models'])
def item(db,id):
    found=db.get(AIModel,id)
    if not found: raise HTTPException(404,'Không tìm thấy model.')
    return found
@router.get('',response_model=list[ModelOut])
def list_models(db:Session=Depends(get_db)): return db.query(AIModel).order_by(AIModel.uploaded_at.desc()).all()
@router.get('/{id}',response_model=ModelOut)
def get_model(id:int,db:Session=Depends(get_db)): return item(db,id)
@router.post('/upload',response_model=ModelOut)
async def upload(file:UploadFile=File(...),name:str=Form(...),version:str=Form(...),description:str|None=Form(None),training_dataset_id:int|None=Form(None),imgsz:int|None=Form(None),metrics_json:str|None=Form(None),db:Session=Depends(get_db)):
    path, generated=await save_upload(file,settings.model_storage_dir,{'.pt'})
    safe=f'{name.lower().replace(" ","-")[:40]}-{version.lower().replace(" ","-")[:20]}_{uuid4().hex[:6]}.pt'; final=Path(settings.model_storage_dir)/safe; path.rename(final)
    try: metrics=json.loads(metrics_json) if metrics_json else None
    except json.JSONDecodeError: raise HTTPException(422,'metrics_json phải là JSON hợp lệ.')
    record=AIModel(name=name,version=version,filename=safe,file_path=str(final),file_size=final.stat().st_size,description=description,training_dataset_id=training_dataset_id,imgsz=imgsz,metrics_json=metrics)
    db.add(record); db.commit(); db.refresh(record)
    try: model_service.validate(record); db.commit(); db.refresh(record)
    except HTTPException:
        db.commit(); raise
    return record
@router.post('/{id}/validate',response_model=ModelOut)
def validate(id:int,db:Session=Depends(get_db)):
    record=item(db,id)
    try: model_service.validate(record); db.commit()
    except HTTPException: db.commit(); raise
    return record
@router.post('/{id}/activate',response_model=ModelOut)
def activate(id:int,db:Session=Depends(get_db)):
    record=item(db,id)
    if record.status not in {'READY','ACTIVE'}: raise HTTPException(409,'Model cần hợp lệ trước khi kích hoạt.')
    db.query(AIModel).filter(AIModel.is_active.is_(True)).update({AIModel.is_active:False,AIModel.status:'READY'})
    record.is_active=True; record.status='ACTIVE'; db.commit(); db.refresh(record); model_service.load_active(db); return record
@router.post('/{id}/test')
async def test(id:int,image:UploadFile=File(...),db:Session=Depends(get_db)):
    record=item(db,id)
    if record.status not in {'READY','ACTIVE'}: raise HTTPException(409,'Model chưa sẵn sàng để kiểm thử.')
    source,name=await save_upload(image,settings.upload_dir,{'.jpg','.jpeg','.png','.webp'},{'image/jpeg','image/png','image/webp'})
    target=Path(settings.output_dir)/f'test-{uuid4().hex}.jpg'; result=model_service.infer(db,record,source,target)
    return {'success':True,'model':ModelOut.model_validate(record).model_dump(),'result':result,'original_image_url':f'/files/uploads/{name}','annotated_image_url':f'/files/outputs/{target.name}'}
@router.get('/{id}/download')
def download(id:int,db:Session=Depends(get_db)):
    record=item(db,id); return FileResponse(record.file_path,filename=record.filename,media_type='application/octet-stream')
@router.delete('/{id}')
def archive(id:int,db:Session=Depends(get_db)):
    record=item(db,id)
    if record.is_active: raise HTTPException(409,'Không thể lưu trữ model đang active.')
    record.status='ARCHIVED'; db.commit(); return {'success':True}
