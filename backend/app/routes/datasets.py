from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Dataset
from ..schemas.common import DatasetIn, DatasetOut
router=APIRouter(prefix='/datasets',tags=['datasets'])
def found(db,id):
    x=db.get(Dataset,id)
    if not x: raise HTTPException(404,'Không tìm thấy dataset.')
    return x
@router.get('',response_model=list[DatasetOut])
def all(db:Session=Depends(get_db)): return db.query(Dataset).order_by(Dataset.created_at.desc()).all()
@router.get('/{id}',response_model=DatasetOut)
def one(id:int,db:Session=Depends(get_db)): return found(db,id)
@router.post('',response_model=DatasetOut)
def create(data:DatasetIn,db:Session=Depends(get_db)):
    x=Dataset(**data.model_dump());db.add(x);db.commit();db.refresh(x);return x
@router.put('/{id}',response_model=DatasetOut)
def update(id:int,data:DatasetIn,db:Session=Depends(get_db)):
    x=found(db,id)
    for k,v in data.model_dump().items():setattr(x,k,v)
    db.commit();db.refresh(x);return x
@router.delete('/{id}')
def delete(id:int,db:Session=Depends(get_db)):
    db.delete(found(db,id));db.commit();return {'success':True}
