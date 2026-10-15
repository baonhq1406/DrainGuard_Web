from pathlib import Path
import cv2
import numpy as np

def annotate(source: Path, result, classes: list[str], destination: Path, per_drain: list[float | None] | None = None) -> None:
    image = cv2.imread(str(source))
    if image is None:
        raise ValueError(f"Không thể đọc file ảnh: {source}")
    overlay = image.copy()
    if result.masks is not None and result.boxes is not None:
        masks_data = result.masks.data.cpu().numpy()
        boxes_cls = result.boxes.cls.cpu().numpy()
        for index, mask in enumerate(masks_data):
            if index >= len(boxes_cls):
                break
            cls = int(boxes_cls[index])
            cls_name = classes[cls] if cls < len(classes) else 'unknown'
            color = (255, 180, 0) if cls_name.lower() == 'drain' else (0, 80, 255)
            binary = cv2.resize(mask.astype(np.uint8), (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST).astype(bool)
            overlay[binary] = color
    image = cv2.addWeighted(overlay, .35, image, .65, 0)
    if result.boxes is not None:
        for index, box in enumerate(result.boxes):
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            cls_name = classes[cls] if cls < len(classes) else 'object'
            label = f'{cls_name} {conf:.0%}'
            cv2.rectangle(image, (x1, y1), (x2, y2), (255, 255, 255), 2)
            cv2.putText(image, label, (x1, max(22, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, .6, (255, 255, 255), 2)
    destination.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(destination), image)
