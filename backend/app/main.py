from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .routes import analyze, dashboard, datasets, models, records, system, map_environment

app=FastAPI(title='DrainGuard AI API',version='1.0.0')
app.add_middleware(CORSMiddleware,allow_origins=[x.strip() for x in settings.cors_origins.split(',')],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
app.mount('/files/uploads',StaticFiles(directory=settings.upload_dir),name='uploads');app.mount('/files/outputs',StaticFiles(directory=settings.output_dir),name='outputs')
for route in (system.router,analyze.router,records.router,dashboard.router,models.router,datasets.router,map_environment.router):app.include_router(route,prefix='/api')
