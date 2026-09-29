from fastapi import APIRouter, HTTPException, Query
from ..services.environment_service import get_environment

router = APIRouter(prefix='/map', tags=['map'])

@router.get('/environment')
def environment(
    latitudes: str = Query(..., description='Comma-separated WGS84 latitudes'),
    longitudes: str = Query(..., description='Comma-separated WGS84 longitudes'),
    blockages: str | None = Query(None, description='Comma-separated blockage percentages aligned with coordinates'),
):
    try:
        lats = [float(x) for x in latitudes.split(',') if x.strip()]
        lons = [float(x) for x in longitudes.split(',') if x.strip()]
        if len(lats) != len(lons) or not lats:
            raise ValueError('latitudes and longitudes must have equal non-zero length')
        if len(lats) > 100:
            raise ValueError('Maximum 100 locations per request')
        for lat, lon in zip(lats, lons):
            if not -90 <= lat <= 90 or not -180 <= lon <= 180:
                raise ValueError('Invalid coordinate')
        b = [None] * len(lats)
        if blockages is not None:
            raw = [x.strip() for x in blockages.split(',')]
            if len(raw) != len(lats):
                raise ValueError('blockages length must match coordinates')
            b = [None if x in {'', 'null', 'None'} else float(x) for x in raw]
        return {'items': get_environment(list(zip(lats, lons, b)))}
    except (ValueError, TypeError) as exc:
        raise HTTPException(400, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, 'Không lấy được dữ liệu môi trường từ dịch vụ thời tiết/địa hình.') from exc
