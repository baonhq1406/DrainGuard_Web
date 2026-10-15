from pathlib import Path
import cv2
import numpy as np

def annotate(source: Path, result, classes: list[str], destination: Path, per_drain: list[float | None] | None = None) -> None:
    image = cv2.imread(str(source))
    if image is None:
        raise ValueError(f"Không thể đọc file ảnh: {source}")
    overlay = image.copy()

    # 1. Render instance segmentation masks & crisp polygon contours (for yolo26l-seg.pt)
    if result.masks is not None and result.boxes is not None:
        masks_data = result.masks.data.cpu().numpy()
        boxes_cls = result.boxes.cls.cpu().numpy()
        for index, mask in enumerate(masks_data):
            if index >= len(boxes_cls):
                break
            cls = int(boxes_cls[index])
            cls_name = classes[cls] if cls < len(classes) else 'unknown'
            is_drain = cls_name.lower() == 'drain'
            # BGR colors: Cyan-Blue for drain grate, Vivid Red-Orange for debris
            fill_color = (255, 200, 0) if is_drain else (0, 65, 255)
            contour_color = (255, 242, 0) if is_drain else (60, 120, 255)

            mask_uint8 = cv2.resize(
                (mask > 0.5).astype(np.uint8),
                (image.shape[1], image.shape[0]),
                interpolation=cv2.INTER_NEAREST,
            )
            binary = mask_uint8.astype(bool)
            overlay[binary] = fill_color

            contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(image, contours, -1, contour_color, 2, lineType=cv2.LINE_AA)

    image = cv2.addWeighted(overlay, 0.42, image, 0.58, 0)

    # 2. Render bounding boxes and telemetry labels (debris first, drain on top)
    if result.boxes is not None:
        drain_items = []
        debris_items = []
        drain_idx = 0
        for index, box in enumerate(result.boxes):
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            cls_name = classes[cls] if cls < len(classes) else 'object'
            if cls_name.lower() == 'drain':
                pct_val = per_drain[drain_idx] if (per_drain and drain_idx < len(per_drain)) else None
                drain_items.append((x1, y1, x2, y2, cls_name, conf, pct_val))
                drain_idx += 1
            else:
                debris_items.append((x1, y1, x2, y2, cls_name, conf))

        for x1, y1, x2, y2, cls_name, conf in debris_items:
            label = f"{cls_name} {conf:.0%}"
            box_color = (40, 90, 255)
            cv2.rectangle(image, (x1, y1), (x2, y2), box_color, 2)
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            ty = max(th + 6, y1 - 4)
            cv2.rectangle(image, (x1, ty - th - 5), (x1 + tw + 8, ty + 3), (18, 12, 8), -1)
            cv2.putText(
                image,
                label,
                (x1 + 4, ty - 1),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1,
                lineType=cv2.LINE_AA,
            )

        for x1, y1, x2, y2, cls_name, conf, pct_val in drain_items:
            pct_str = f" | Tac: {pct_val:.1f}%" if pct_val is not None else ""
            label = f"DRAIN {conf:.0%}{pct_str}"
            box_color = (255, 220, 0)
            cv2.rectangle(image, (x1, y1), (x2, y2), box_color, 2)
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            ty = max(th + 8, y1 - 6)
            cv2.rectangle(image, (x1, ty - th - 6), (x1 + tw + 12, ty + 4), (35, 22, 6), -1)
            cv2.rectangle(image, (x1, ty - th - 6), (x1 + tw + 12, ty + 4), box_color, 1)
            cv2.putText(
                image,
                label,
                (x1 + 6, ty - 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 245, 180),
                2,
                lineType=cv2.LINE_AA,
            )

    destination.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(destination), image)
