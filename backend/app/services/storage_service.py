from pathlib import Path
from uuid import uuid4
from fastapi import HTTPException, UploadFile
from ..config import settings

IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp'}
async def save_upload(upload: UploadFile, target_dir: str, allowed_exts: set[str], allowed_types: set[str] | None = None) -> tuple[Path, str]:
    ext = Path(upload.filename or '').suffix.lower()
    if ext not in allowed_exts or (allowed_types and upload.content_type not in allowed_types):
        raise HTTPException(415, 'Định dạng tệp không được hỗ trợ.')
    content = await upload.read()
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f'Tệp vượt quá {settings.max_upload_mb} MB.')
    name = f'{uuid4().hex}{ext}'; path = Path(target_dir) / name
    path.write_bytes(content)
    return path, name
