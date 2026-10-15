from pathlib import Path
from uuid import uuid4
from fastapi import HTTPException, UploadFile
from ..config import settings

IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp'}

async def save_upload(upload: UploadFile, target_dir: str, allowed_exts: set[str], allowed_types: set[str] | None = None) -> tuple[Path, str]:
    ext = Path(upload.filename or '').suffix.lower()
    if ext not in allowed_exts:
        raise HTTPException(415, f'Định dạng phần mở rộng tệp ({ext or "không có"}) không được hỗ trợ. Vui lòng chọn tệp: {", ".join(sorted(allowed_exts))}')
    content_type = upload.content_type.split(';')[0].strip().lower() if upload.content_type else ''
    if allowed_types and content_type and content_type not in allowed_types and content_type != 'application/octet-stream':
        raise HTTPException(415, f'Loại tệp ({content_type}) không được hỗ trợ.')
    content = await upload.read()
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f'Tệp vượt quá {settings.max_upload_mb} MB.')
    target_path = Path(target_dir)
    target_path.mkdir(parents=True, exist_ok=True)
    name = f'{uuid4().hex}{ext}'
    path = target_path / name
    path.write_bytes(content)
    return path, name
