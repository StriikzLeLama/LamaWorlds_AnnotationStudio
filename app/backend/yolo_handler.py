import os

def parse_yolo_file(file_path):
    boxes = []
    if not os.path.exists(file_path):
        return boxes
    
    with open(file_path, 'r') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        parts = line.strip().split()
        if len(parts) >= 5:
            class_id = int(parts[0])
            x_center = float(parts[1])
            y_center = float(parts[2])
            width = float(parts[3])
            height = float(parts[4])
            conf = 1.0
            if len(parts) > 5:
                conf = float(parts[5])
            
            boxes.append({
                "id": f"box_{i}",
                "class_id": class_id,
                "x": x_center,
                "y": y_center,
                "width": width,
                "height": height,
                "confidence": conf
            })
    return boxes

def save_yolo_file(file_path, boxes):
    lines = []
    for box in boxes:
        # YOLO format: class x_center y_center width height
        line = f"{box['class_id']} {box['x']} {box['y']} {box['width']} {box['height']}\n"
        lines.append(line)
        
    with open(file_path, 'w') as f:
        f.writelines(lines)
