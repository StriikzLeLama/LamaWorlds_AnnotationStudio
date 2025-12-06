import os
import json
import xml.etree.ElementTree as ET
from PIL import Image

def export_coco(dataset_path, output_file):
    images_dir = os.path.join(dataset_path, "images")
    labels_dir = os.path.join(dataset_path, "labels")
    
    coco = {
        "images": [],
        "annotations": [],
        "categories": [],
        "info": {"description": "Exported from Lama Worlds Annotation Studio"}
    }
    
    # Load classes
    class_map = {}
    classes_file = os.path.join(dataset_path, "classes.txt")
    if os.path.exists(classes_file):
        with open(classes_file, 'r') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                name = line.strip()
                if name:
                    coco["categories"].append({"id": i, "name": name, "supercategory": "none"})
                    class_map[i] = name
    
    ann_id = 1
    img_id = 1
    
    for filename in os.listdir(images_dir):
        if not filename.lower().endswith(('.jpg', '.png', '.jpeg')):
            continue
            
        # Get dimensions
        img_path = os.path.join(images_dir, filename)
        try:
            with Image.open(img_path) as img:
                w, h = img.size
        except:
            continue
            
        coco["images"].append({
            "id": img_id,
            "file_name": filename,
            "width": w,
            "height": h
        })
        
        # Load annotation
        basename = os.path.splitext(filename)[0]
        label_path = os.path.join(labels_dir, basename + ".txt")
        if os.path.exists(label_path):
            with open(label_path, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        cls_id = int(parts[0])
                        x_cen = float(parts[1])
                        y_cen = float(parts[2])
                        width = float(parts[3])
                        height = float(parts[4])
                        
                        # COCO: x_top_left, y_top_left, width, height (pixels)
                        abs_w = width * w
                        abs_h = height * h
                        abs_x = (x_cen * w) - (abs_w / 2)
                        abs_y = (y_cen * h) - (abs_h / 2)
                        
                        coco["annotations"].append({
                            "id": ann_id,
                            "image_id": img_id,
                            "category_id": cls_id,
                            "bbox": [abs_x, abs_y, abs_w, abs_h],
                            "area": abs_w * abs_h,
                            "iscrowd": 0
                        })
                        ann_id += 1
                        
        img_id += 1
        
    with open(output_file, 'w') as f:
        json.dump(coco, f, indent=4)
        
    return output_file

def export_voc(dataset_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    images_dir = os.path.join(dataset_path, "images")
    labels_dir = os.path.join(dataset_path, "labels")
    
    count = 0
    for filename in os.listdir(images_dir):
        if not filename.lower().endswith(('.jpg', '.png', '.jpeg')):
            continue
            
        basename = os.path.splitext(filename)[0]
        label_path = os.path.join(labels_dir, basename + ".txt")
        
        if not os.path.exists(label_path):
            continue
            
        img_path = os.path.join(images_dir, filename)
        try:
            with Image.open(img_path) as img:
                w, h = img.size
                depth = len(img.getbands())
        except:
            continue
            
        root = ET.Element("annotation")
        ET.SubElement(root, "folder").text = "images"
        ET.SubElement(root, "filename").text = filename
        
        size = ET.SubElement(root, "size")
        ET.SubElement(size, "width").text = str(w)
        ET.SubElement(size, "height").text = str(h)
        ET.SubElement(size, "depth").text = str(depth)
        
        with open(label_path, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    cls_id = int(parts[0])
                    x_cen = float(parts[1])
                    y_cen = float(parts[2])
                    width = float(parts[3])
                    height = float(parts[4])
                    
                    obj = ET.SubElement(root, "object")
                    ET.SubElement(obj, "name").text = str(cls_id) # Should map to name if possible
                    ET.SubElement(obj, "pose").text = "Unspecified"
                    ET.SubElement(obj, "truncated").text = "0"
                    ET.SubElement(obj, "difficult").text = "0"
                    
                    bndbox = ET.SubElement(obj, "bndbox")
                    
                    xmin = int((x_cen - width/2) * w)
                    ymin = int((y_cen - height/2) * h)
                    xmax = int((x_cen + width/2) * w)
                    ymax = int((y_cen + height/2) * h)
                    
                    ET.SubElement(bndbox, "xmin").text = str(max(0, xmin))
                    ET.SubElement(bndbox, "ymin").text = str(max(0, ymin))
                    ET.SubElement(bndbox, "xmax").text = str(min(w, xmax))
                    ET.SubElement(bndbox, "ymax").text = str(min(h, ymax))
                    
        tree = ET.ElementTree(root)
        tree.write(os.path.join(output_dir, basename + ".xml"))
        count += 1
        
    return count
