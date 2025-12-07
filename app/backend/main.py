from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import glob
import json
import yaml
from typing import List
from pydantic import BaseModel
from PIL import Image

from backend.models import DatasetPath, AnnotationData, ClassUpdate
from backend.yolo_handler import parse_yolo_file, save_yolo_file

app = FastAPI(title="Lama Worlds Annotation Studio Backend")

# CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "ok", 
        "app": "Lama Worlds Annotation Studio",
        "version": "1.0.0",
        "python_version": __import__('sys').version
    }

@app.post("/load_dataset")
def load_dataset(data: DatasetPath):
    path = data.path
    if not path or not isinstance(path, str):
        raise HTTPException(status_code=400, detail="Invalid path provided")
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Directory not found")
    
    # Check structure
    images_dir = os.path.join(path, "images")
    labels_dir = os.path.join(path, "labels")
    
    if not os.path.exists(images_dir):
        # Allow loading flat root if no subdirs
        images_dir = path
        labels_dir = path
    
    # List images - use case-insensitive search to avoid duplicates
    exts = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.JPG', '*.JPEG', '*.PNG', '*.BMP']
    images = set()  # Use set to automatically remove duplicates
    for ext in exts:
        found = glob.glob(os.path.join(images_dir, ext))
        images.update(found)
    
    # Convert to absolute paths and remove duplicates (case-insensitive on Windows)
    image_list = []
    seen_paths = set()
    for img in images:
        abs_path = os.path.abspath(img)
        # Normalize path for comparison (lowercase on Windows)
        normalized = abs_path.lower() if os.name == 'nt' else abs_path
        if normalized not in seen_paths:
            seen_paths.add(normalized)
            image_list.append(abs_path)
    
    image_list.sort()  # Sort for consistent ordering
    return {"images": image_list, "images_dir": images_dir, "labels_dir": labels_dir}

@app.post("/load_annotation")
def load_annotation(dataset_path: str = Body(...), image_path: str = Body(...)):
    try:
        # derive label path
        if os.path.isabs(image_path):
            image_full_path = image_path
        else:
            image_full_path = os.path.join(dataset_path, "images", image_path)
        
        # Verify image exists
        if not os.path.exists(image_full_path):
            raise HTTPException(status_code=404, detail=f"Image not found: {image_full_path}")
            
        base_name = os.path.splitext(os.path.basename(image_full_path))[0]
        
        # Try logic to find label dir
        if os.path.basename(os.path.dirname(image_full_path)) == "images":
            label_dir = os.path.join(os.path.dirname(os.path.dirname(image_full_path)), "labels")
        else:
            label_dir = os.path.dirname(image_full_path)
            
        label_file = os.path.join(label_dir, base_name + ".txt")
        
        boxes = parse_yolo_file(label_file)
        
        # Convert normalized to pixel
        try:
            with Image.open(image_full_path) as img:
                img_w, img_h = img.size
                
            pixel_boxes = []
            for box in boxes:
                # YOLO: x_center, y_center, w, h (normalized)
                # Pixel: x_left, y_top, w, h
                w = box['width'] * img_w
                h = box['height'] * img_h
                x_center = box['x'] * img_w
                y_center = box['y'] * img_h
                
                x_left = max(0, x_center - (w / 2))
                y_top = max(0, y_center - (h / 2))
                
                # Ensure box is within image bounds
                w = min(w, img_w - x_left)
                h = min(h, img_h - y_top)
                
                pixel_boxes.append({
                    "id": box['id'],
                    "class_id": box['class_id'],
                    "x": x_left,
                    "y": y_top,
                    "width": w,
                    "height": h,
                    "confidence": box['confidence']
                })
            return {"boxes": pixel_boxes, "label_file": label_file}
            
        except Exception as e:
            print(f"Error processing image {image_full_path}: {e}")
            raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/get_annotated_images")
def get_annotated_images(dataset_path: str = Body(...), class_id: int = Body(None)):
    """Return list of image paths that have annotation files, optionally filtered by class_id"""
    try:
        annotated_images = []
        
        # Determine labels directory
        labels_dir = os.path.join(dataset_path, "labels")
        if not os.path.exists(labels_dir):
            # Try flat structure
            labels_dir = dataset_path
        
        # Find all .txt files in labels directory
        label_files = glob.glob(os.path.join(labels_dir, "*.txt"))
        
        # Determine images directory
        images_dir = os.path.join(dataset_path, "images")
        if not os.path.exists(images_dir):
            images_dir = dataset_path
        
        for label_file in label_files:
            # Check if file is not empty
            if os.path.getsize(label_file) > 0:
                # If filtering by class, check if file contains that class
                if class_id is not None:
                    boxes = parse_yolo_file(label_file)
                    has_class = any(box.get('class_id') == class_id for box in boxes)
                    if not has_class:
                        continue
                
                base_name = os.path.splitext(os.path.basename(label_file))[0]
                
                # Try to find corresponding image
                for ext in ['.jpg', '.jpeg', '.png', '.bmp', '.JPG', '.JPEG', '.PNG', '.BMP']:
                    image_path = os.path.join(images_dir, base_name + ext)
                    if os.path.exists(image_path):
                        annotated_images.append(os.path.abspath(image_path))
                        break
        
        return {"annotated_images": annotated_images}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save_annotation")
def save_annotation_endpoint(data: AnnotationData):
    try:
        if not data.image_name or not data.dataset_path:
            raise HTTPException(status_code=400, detail="Image name and dataset path are required")
        
        # Determine full path
        if os.path.isabs(data.image_name):
            image_full_path = data.image_name
        else:
            # Try images subdirectory first, then flat structure
            image_full_path = os.path.join(data.dataset_path, "images", data.image_name)
            if not os.path.exists(image_full_path):
                image_full_path = os.path.join(data.dataset_path, data.image_name)

        # Verify image exists
        if not os.path.exists(image_full_path):
            raise HTTPException(status_code=404, detail=f"Image not found: {image_full_path}")

        base_name = os.path.splitext(os.path.basename(image_full_path))[0]
        
        # Label dir logic
        if os.path.basename(os.path.dirname(image_full_path)) == "images":
            label_dir = os.path.join(os.path.dirname(os.path.dirname(image_full_path)), "labels")
        else:
            label_dir = os.path.dirname(image_full_path)
            
        if not os.path.exists(label_dir):
            os.makedirs(label_dir, exist_ok=True)
            
        label_file = os.path.join(label_dir, base_name + ".txt")
        
        try:
            with Image.open(image_full_path) as img:
                img_w, img_h = img.size

            # Convert pixels to normalized YOLO with validation
            yolo_boxes = []
            validation_errors = []
            
            for idx, box in enumerate(data.boxes):
                # Box is x_left, y_top, w, h (pixels)
                # YOLO is x_center, y_center, w, h (normalized)
                
                # Validate box
                if box.width <= 0 or box.height <= 0:
                    validation_errors.append(f"Box {idx}: Invalid dimensions (width={box.width}, height={box.height})")
                    continue
                
                if box.x < 0 or box.y < 0:
                    validation_errors.append(f"Box {idx}: Negative position (x={box.x}, y={box.y})")
                
                # Clamp box to image bounds
                x_left = max(0, min(box.x, img_w))
                y_top = max(0, min(box.y, img_h))
                width = max(0, min(box.width, img_w - x_left))
                height = max(0, min(box.height, img_h - y_top))
                
                if width <= 0 or height <= 0:
                    validation_errors.append(f"Box {idx}: Box outside image bounds")
                    continue
                
                # Check minimum size (at least 5x5 pixels)
                if width < 5 or height < 5:
                    validation_errors.append(f"Box {idx}: Too small (min 5x5 pixels required)")

                w_norm = width / img_w
                h_norm = height / img_h
                
                x_center_pixel = x_left + (width / 2)
                y_center_pixel = y_top + (height / 2)
                
                x_norm = x_center_pixel / img_w
                y_norm = y_center_pixel / img_h
                
                # Clamp 0-1
                w_norm = min(max(w_norm, 0), 1)
                h_norm = min(max(h_norm, 0), 1)
                x_norm = min(max(x_norm, 0), 1)
                y_norm = min(max(y_norm, 0), 1)

                yolo_boxes.append({
                    "class_id": box.class_id,
                    "x": x_norm,
                    "y": y_norm,
                    "width": w_norm,
                    "height": h_norm
                })
            
            save_yolo_file(label_file, yolo_boxes)
            
            response = {"status": "saved", "file": label_file}
            if validation_errors:
                response["warnings"] = validation_errors
            
            return response
            
        except Exception as e:
            print(f"Error saving {label_file}: {e}")
            raise HTTPException(status_code=500, detail=f"Error saving annotation: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/save_classes")
def save_classes(data: ClassUpdate):
    try:
        # Save to classes.txt in dataset root
        if not os.path.exists(data.dataset_path):
            raise HTTPException(status_code=404, detail="Dataset path not found")
        
        path = os.path.join(data.dataset_path, "classes.txt")
        with open(path, 'w', encoding='utf-8') as f:
            for cls in data.classes:
                f.write(f"{cls.name.strip()}\n")
        return {"status": "saved", "file": path}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving classes: {str(e)}")

@app.post("/load_classes")
def load_classes(data: DatasetPath):
    try:
        path = os.path.join(data.path, "classes.txt")
        classes = []
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            for i, line in enumerate(lines):
                name = line.strip()
                if name:
                    # Generate color based on index for variety
                    colors = ["#00e0ff", "#56b0ff", "#ff6b6b", "#4ecdc4", "#ffe66d", "#a8e6cf", "#ff8b94", "#c7ceea"]
                    color = colors[i % len(colors)]
                    classes.append({"id": i, "name": name, "color": color})
        return {"classes": classes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading classes: {str(e)}")

@app.post("/import_yaml_classes")
async def import_yaml_classes(file: UploadFile = File(...)):
    try:
        # Read file content
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # Parse YAML
        try:
            yaml_data = yaml.safe_load(content_str)
        except yaml.YAMLError as e:
            raise HTTPException(status_code=400, detail=f"Invalid YAML format: {str(e)}")
        
        # Extract classes from YAML
        # YOLO format usually has 'names' key with list of class names
        classes = []
        if 'names' in yaml_data:
            names = yaml_data['names']
            if isinstance(names, list):
                colors = ["#00e0ff", "#56b0ff", "#ff6b6b", "#4ecdc4", "#ffe66d", "#a8e6cf", "#ff8b94", "#c7ceea"]
                for i, name in enumerate(names):
                    if name:  # Skip empty names
                        color = colors[i % len(colors)]
                        classes.append({"id": i, "name": str(name).strip(), "color": color})
            elif isinstance(names, dict):
                # Sometimes names is a dict with id: name mapping
                colors = ["#00e0ff", "#56b0ff", "#ff6b6b", "#4ecdc4", "#ffe66d", "#a8e6cf", "#ff8b94", "#c7ceea"]
                for class_id, name in names.items():
                    try:
                        idx = int(class_id)
                        color = colors[idx % len(colors)]
                        classes.append({"id": idx, "name": str(name).strip(), "color": color})
                    except ValueError:
                        continue
        else:
            raise HTTPException(status_code=400, detail="YAML file does not contain 'names' key")
        
        if not classes:
            raise HTTPException(status_code=400, detail="No classes found in YAML file")
        
        return {"classes": classes, "count": len(classes)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing YAML: {str(e)}")

# ... existing code ...
from backend.exporter import export_coco, export_voc

class ExportRequest(BaseModel):
    dataset_path: str
    format: str # coco, voc

@app.post("/export")
def export_dataset_endpoint(data: ExportRequest):
    if data.format == "coco":
        output_file = os.path.join(data.dataset_path, "output.json")
        try:
            res = export_coco(data.dataset_path, output_file)
            return {"status": "success", "file": res}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    elif data.format == "voc":
        output_dir = os.path.join(data.dataset_path, "voc_xmls")
        try:
            count = export_voc(data.dataset_path, output_dir)
            return {"status": "success", "count": count, "dir": output_dir}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    else:
        raise HTTPException(status_code=400, detail="Unknown format")

if __name__ == "__main__":
    import uvicorn
    # Verify we can run this
    print("Starting backend...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
