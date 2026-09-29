from __future__ import annotations

import json
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

_CACHE: dict[str, tuple[float, dict]] = {}
CACHE_SECONDS = 300

def _key(latitude: float, longitude: float) -> str:
    return f"{latitude:.5f},{longitude:.5f}"

def _get_json(url: str) -> dict | list:
    request = Request(url, headers={"User-Agent": "DrainGuard-AI/1.0"})
    with urlopen(request, timeout=12) as response:
        return json.load(response)

def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))

def _rain_factor(mm_per_hour: float) -> float:
    # MVP heuristic: 0 mm/h = no rain contribution, 20+ mm/h = maximum.
    return _clamp(mm_per_hour / 20.0)

def _elevation_factor(elevation: float, elevations: list[float]) -> float:
    if len(elevations) < 2:
        return 0.5
    low, high = min(elevations), max(elevations)
    if high - low < 0.5:
        return 0.5
    # Lower local elevation -> higher flood-risk contribution.
    return _clamp((high - elevation) / (high - low))

def calculate_risk(blockage_percent: float | None, precipitation: float, elevation: float, elevations: list[float]) -> tuple[float | None, str]:
    if blockage_percent is None:
        return None, "INSUFFICIENT_DATA"
    blockage_factor = _clamp(blockage_percent / 100.0)
    rain_factor = _rain_factor(max(0.0, precipitation))
    elevation_factor = _elevation_factor(elevation, elevations)
    score = 100.0 * (0.50 * blockage_factor + 0.35 * rain_factor + 0.15 * elevation_factor)
    score = round(score, 1)
    if score >= 80:
        level = "CRITICAL"
    elif score >= 60:
        level = "HIGH"
    elif score >= 35:
        level = "MODERATE"
    else:
        level = "LOW"
    return score, level

def get_environment(points: list[tuple[float, float, float | None]]) -> list[dict]:
    unique: dict[str, tuple[float, float, float | None]] = {}
    for lat, lon, blockage in points:
        unique.setdefault(_key(lat, lon), (lat, lon, blockage))

    if not unique:
        return []

    now = time.time()
    missing = [(lat, lon) for lat, lon, _ in unique.values() if now - _CACHE.get(_key(lat, lon), (0, {}))[0] >= CACHE_SECONDS]

    fetched: dict[str, dict] = {}
    if missing:
        lats = ",".join(f"{lat:.6f}" for lat, _ in missing)
        lons = ",".join(f"{lon:.6f}" for _, lon in missing)
        params = urlencode({
            "latitude": lats,
            "longitude": lons,
            "current": "precipitation,rain",
            "hourly": "precipitation",
            "past_hours": "1",
            "forecast_hours": "4",
            "timezone": "Asia/Ho_Chi_Minh",
            "forecast_days": "1",
        })
        payload = _get_json("https://api.open-meteo.com/v1/forecast?" + params)
        items = payload if isinstance(payload, list) else [payload]
        if len(items) == 1 and len(missing) > 1 and isinstance(items[0], dict) and "results" in items[0]:
            items = items[0]["results"]

        for (lat, lon), item in zip(missing, items):
            if not isinstance(item, dict):
                continue
            current = item.get("current") or {}
            hourly = item.get("hourly") or {}
            values = [float(x) for x in (hourly.get("precipitation") or []) if x is not None]
            precipitation = float(current.get("precipitation") or (values[-1] if values else 0.0))
            rain = float(current.get("rain") or 0.0)
            forecast_3h = round(sum(values[-3:]), 1) if values else 0.0
            fetched[_key(lat, lon)] = {
                "latitude": lat,
                "longitude": lon,
                "elevation_m": round(float(item.get("elevation") or 0.0), 1),
                "precipitation_mm_h": round(precipitation, 1),
                "rain_mm_h": round(rain, 1),
                "forecast_3h_mm": forecast_3h,
                "weather_time": current.get("time"),
                "source": "Open-Meteo",
            }

        for key, value in fetched.items():
            _CACHE[key] = (now, value)

    environments = []
    all_items = {}
    for key, (_, value) in _CACHE.items():
        if key in unique and now - _CACHE[key][0] < CACHE_SECONDS:
            all_items[key] = dict(value)

    elevations = [float(x["elevation_m"]) for x in all_items.values()]
    for key, (lat, lon, blockage) in unique.items():
        item = all_items.get(key)
        if not item:
            item = {"latitude": lat, "longitude": lon, "elevation_m": None, "precipitation_mm_h": None, "rain_mm_h": None, "forecast_3h_mm": None, "weather_time": None, "source": "unavailable"}
        score, level = calculate_risk(
            blockage,
            float(item["precipitation_mm_h"] or 0.0),
            float(item["elevation_m"] or 0.0),
            elevations,
        ) if item.get("elevation_m") is not None and item.get("precipitation_mm_h") is not None else (None, "INSUFFICIENT_DATA")
        item["flood_risk_score"] = score
        item["flood_risk_level"] = level
        item["risk_method"] = "MVP: blockage + rainfall + local elevation"
        environments.append(item)

    return environments
