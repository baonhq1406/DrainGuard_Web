import torch
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AIModel
from ..services.model_service import model_service
router=APIRouter(tags=['system'])
@router.get('/health')
def health(): return {'status':'ok'}
@router.get('/system')
def system(db:Session=Depends(get_db)):
    database='ok'
    try:db.execute(text('SELECT 1'))
    except Exception:database='unavailable'
    cuda=torch.cuda.is_available(); active=db.query(AIModel).filter_by(is_active=True).first()
    return {'backend':'ok','database':database,'cuda_available':cuda,'gpu_name':torch.cuda.get_device_name(0) if cuda else None,'device':'cuda:0' if cuda else 'cpu','model_loaded':model_service.model_id==getattr(active,'id',None),'active_model_id':getattr(active,'id',None),'model_task':getattr(active,'task',None),'model_classes':getattr(active,'classes_json',None)}
@router.get('/system/model')
def active(db:Session=Depends(get_db)):
    x=db.query(AIModel).filter_by(is_active=True).first()
    return None if not x else {'id':x.id,'name':x.name,'version':x.version,'task':x.task,'classes':x.classes_json,'status':x.status}
