from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AnalysisRecord

router=APIRouter(prefix='/records',tags=['records'])

def serialize(x):
    return {'id':x.id,'created_at':x.created_at,'original_image_url':f'/files/uploads/{x.original_image}','annotated_image_url':f'/files/outputs/{x.annotated_image}' if x.annotated_image else None,'latitude':x.latitude,'longitude':x.longitude,'drain_detected':x.drain_detected,'drain_count':x.drain_count,'confidence':x.confidence,'blockage_percent':x.blockage_percent,'status':x.status,'model':{'id':x.model_id,'name':x.model_name,'version':x.model_version,'task':x.model_task,'classes':x.model_classes_json}}

@router.get('')
def list_records(status:str|None=None,model_id:int|None=None,q:str|None=None,limit:int=Query(50,le=100),db:Session=Depends(get_db)):
    query=db.query(AnalysisRecord)
    if status: query=query.filter_by(status=status)
    if model_id: query=query.filter_by(model_id=model_id)
    if q:
        term=f'%{q.strip()}%'
        query=query.filter(or_(AnalysisRecord.model_name.ilike(term),AnalysisRecord.model_version.ilike(term),AnalysisRecord.status.ilike(term)))
    return [serialize(x) for x in query.order_by(AnalysisRecord.created_at.desc()).limit(limit)]

@router.get('/{id}')
def get_record(id:int,db:Session=Depends(get_db)):
    x=db.get(AnalysisRecord,id)
    if not x: raise HTTPException(404,'Không tìm thấy phân tích.')
    return serialize(x)

@router.delete('/{id}')
def delete_record(id:int,db:Session=Depends(get_db)):
    x=db.get(AnalysisRecord,id)
    if not x: raise HTTPException(404,'Không tìm thấy phân tích.')
    db.delete(x); db.commit(); return {'success':True}
