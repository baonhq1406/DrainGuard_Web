import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from .config import settings
from .routes import analyze, dashboard, datasets, models, records, system, map_environment

logger = logging.getLogger("drainguard")

# Keep the FastAPI instance separate so CORS can wrap the complete ASGI app.
# This also adds CORS headers to unhandled 500 responses, letting the browser
# expose the real backend error instead of masking it as a CORS failure.
api = FastAPI(title="DrainGuard AI API", version="1.0.0")

@api.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )

@api.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

@api.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Lỗi máy chủ không được xử lý tại %s %s: %s", request.method, request.url.path, exc)
    err_str = str(exc)
    if "Connection refused" in err_str or "could not connect to server" in err_str or "OperationalError" in type(exc).__name__:
        detail = "Không thể kết nối đến cơ sở dữ liệu (PostgreSQL Connection Refused). Vui lòng kiểm tra container database đang hoạt động."
    else:
        detail = f"Lỗi máy chủ nội bộ: {err_str}"
    return JSONResponse(
        status_code=500,
        content={"detail": detail},
    )

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
