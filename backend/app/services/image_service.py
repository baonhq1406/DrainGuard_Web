from pathlib import Path
import cv2, numpy as np

def annotate(source: Path, result, classes: list[str], destination: Path, per_drain: list[float | None] | None = None) -> None:
    image = cv2.imread(str(source)); overlay = image.copy()
    if result.masks is not None and result.boxes is not None:
        for index, mask in enumerate(result.masks.data.cpu().numpy()):
            cls = int(result.boxes.cls[index]); color = (255, 180, 0) if classes[cls].lower() == 'drain' else (0, 80, 255)
            binary = cv2.resize(mask.astype(np.uint8), (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST).astype(bool)
            overlay[binary] = color
    image = cv2.addWeighted(overlay, .35, image, .65, 0)
    if result.boxes is not None:
        for index, box in enumerate(result.boxes):
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int); cls = int(box.cls[0]); conf = float(box.conf[0])
            label = f'{classes[cls]} {conf:.0%}'
            cv2.rectangle(image, (x1,y1), (x2,y2), (255,255,255), 2); cv2.putText(image, label, (x1, max(22,y1-8)), cv2.FONT_HERSHEY_SIMPLEX, .6, (255,255,255), 2)
    cv2.imwrite(str(destination), image)
