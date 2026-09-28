from collections import Counter
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AnalysisRecord, AIModel
from .records import serialize
router=APIRouter(prefix='/dashboard',tags=['dashboard'])
@router.get('/stats')
def stats(db:Session=Depends(get_db)):
    rows=db.query(AnalysisRecord.status,func.count()).group_by(AnalysisRecord.status).all(); counts=dict(rows)
    return {'total_analyses':sum(counts.values()),'total_drains':db.query(func.coalesce(func.sum(AnalysisRecord.drain_count),0)).scalar(),'statuses':{k:counts.get(k,0) for k in ['LOW','MODERATE','HIGH','CRITICAL','MODEL_LIMITED','NO_DRAIN']},'active_model':next(({'id':m.id,'name':m.name,'version':m.version,'classes':m.classes_json} for m in db.query(AIModel).filter_by(is_active=True)),None)}
@router.get('/recent')
def recent(db:Session=Depends(get_db)): return [serialize(x) for x in db.query(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(10)]
@router.get('/timeline')
def timeline(db:Session=Depends(get_db)):
    start=datetime.utcnow()-timedelta(days=13); rows=db.query(AnalysisRecord).filter(AnalysisRecord.created_at>=start).all(); bucket=Counter(x.created_at.date().isoformat() for x in rows)
    return [{'date':(start+timedelta(days=i)).date().isoformat(),'count':bucket.get((start+timedelta(days=i)).date().isoformat(),0)} for i in range(14)]
