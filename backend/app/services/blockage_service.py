import numpy as np

def status_for(blockage: float | None, drain_detected: bool) -> str:
    if not drain_detected: return 'NO_DRAIN'
    if blockage is None: return 'MODEL_LIMITED'
    if blockage <= 20: return 'LOW'
    if blockage <= 50: return 'MODERATE'
    if blockage <= 75: return 'HIGH'
    return 'CRITICAL'

def calculate(drain_masks: list[np.ndarray], debris_masks: list[np.ndarray]) -> tuple[list[float | None], float | None]:
    if not drain_masks: return [], None
    if not debris_masks: return [0.0 for _ in drain_masks], 0.0
    debris = np.logical_or.reduce([m.astype(bool) for m in debris_masks])
    values = []
    total_overlap = total_area = 0
    for mask in drain_masks:
        area = int(mask.astype(bool).sum()); overlap = int(np.logical_and(mask, debris).sum())
        total_area += area; total_overlap += overlap
        values.append(round(min(100, max(0, overlap / area * 100)), 1) if area else None)
    return values, (round(min(100, max(0, total_overlap / total_area * 100)), 1) if total_area else None)
