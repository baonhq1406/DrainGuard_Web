from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .routes import analyze, dashboard, datasets, models, records, system, map_environment

# Keep the FastAPI instance separate so CORS can wrap the complete ASGI app.
# This also adds CORS headers to unhandled 500 responses, letting the browser
# expose the real backend error instead of masking it as a CORS failure.
api = FastAPI(title="DrainGuard AI API", version="1.0.0")

api.mount("/files/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
api.mount("/files/outputs", StaticFiles(directory=settings.output_dir), name="outputs")

for route in (
    system.router,
    analyze.router,
    records.router,
    dashboard.router,
    models.router,
    datasets.router,
    map_environment.router,
):
    api.include_router(route, prefix="/api")

allowed_origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

# Preserve a usable local-development default if CORS_ORIGINS is empty.
if not allowed_origins:
    allowed_origins = ["http://localhost:3000"]

app = CORSMiddleware(
    app=api,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
