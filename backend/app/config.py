from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / '.env', extra='ignore')
    database_url: str = 'postgresql+psycopg://drainguard:drainguard_dev@localhost:5432/drainguard'
    model_storage_dir: str = str(BASE_DIR / 'model_storage')
    upload_dir: str = str(BASE_DIR / 'uploads')
    output_dir: str = str(BASE_DIR / 'outputs')
    default_conf: float = 0.25
    default_imgsz: int = 1024
    max_upload_mb: int = 20
    cors_origins: str = 'http://localhost:3000'

settings = Settings()
for directory in (settings.model_storage_dir, settings.upload_dir, settings.output_dir):
    Path(directory).mkdir(parents=True, exist_ok=True)
