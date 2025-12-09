from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import glob
import json
import yaml
import sys
import io
from typing import List
from pydantic import BaseModel
from PIL import Image

# Handle imports for both module and direct execution
import io

# Fix encoding for Windows console (cp1252 doesn't support Unicode)
# Force UTF-8 encoding for stdout/stderr
if sys.platform == 'win32':
    try:
        if hasattr(sys.stdout, 'buffer') and sys.stdout.encoding != 'utf-8':
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'buffer') and sys.stderr.encoding != 'utf-8':
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except:
        # If we can't change encoding, continue anyway
        pass

# Add current directory to Python path for direct execution
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

try:
    from backend.models import DatasetPath, AnnotationData, ClassUpdate
    from backend.yolo_handler import parse_yolo_file, save_yolo_file
except ImportError:
    # If running as script directly (packaged mode), use direct imports
    try:
        from models import DatasetPath, AnnotationData, ClassUpdate
        from yolo_handler import parse_yolo_file, save_yolo_file
    except ImportError as e:
        print(f"[ERROR] Import error: {e}")
        print(f"   Current directory: {os.getcwd()}")
        print(f"   Script location: {__file__}")
        print(f"   Backend dir: {_backend_dir}")
        print(f"   Python path: {sys.path}")
        raise

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
        # Validate inputs
        if not dataset_path or not isinstance(dataset_path, str):
            raise HTTPException(status_code=400, detail="Invalid dataset_path")
        if not image_path or not isinstance(image_path, str):
            raise HTTPException(status_code=400, detail="Invalid image_path")
        
        # derive label path
        if os.path.isabs(image_path):
            image_full_path = image_path
        else:
            image_full_path = os.path.join(dataset_path, "images", image_path)
        
        # Verify image exists
        if not os.path.exists(image_full_path):
            raise HTTPException(status_code=404, detail=f"Image not found: {image_full_path}")
        
        # Validate it's actually a file
        if not os.path.isfile(image_full_path):
            raise HTTPException(status_code=400, detail=f"Path is not a file: {image_full_path}")
            
        base_name = os.path.splitext(os.path.basename(image_full_path))[0]
        if not base_name:
            raise HTTPException(status_code=400, detail="Invalid image filename")
        
        # Try logic to find label dir
        if os.path.basename(os.path.dirname(image_full_path)) == "images":
            label_dir = os.path.join(os.path.dirname(os.path.dirname(image_full_path)), "labels")
        else:
            label_dir = os.path.dirname(image_full_path)
            
        label_file = os.path.join(label_dir, base_name + ".txt")
        
        boxes = parse_yolo_file(label_file)
        
        # Validate boxes is a list
        if not isinstance(boxes, list):
            boxes = []
        
        # Convert normalized to pixel
        try:
            with Image.open(image_full_path) as img:
                img_w, img_h = img.size
                
            # Validate image dimensions
            if img_w <= 0 or img_h <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid image dimensions: {img_w}x{img_h}")
                
            pixel_boxes = []
            for idx, box in enumerate(boxes):
                # Validate box structure
                if not isinstance(box, dict):
                    continue
                
                # Validate required fields
                required_fields = ['x', 'y', 'width', 'height', 'class_id']
                if not all(field in box for field in required_fields):
                    continue
                
                try:
                    # YOLO: x_center, y_center, w, h (normalized)
                    # Pixel: x_left, y_top, w, h
                    x_norm = float(box['x'])
                    y_norm = float(box['y'])
                    w_norm = float(box['width'])
                    h_norm = float(box['height'])
                    class_id = int(box['class_id'])
                except (ValueError, TypeError, KeyError):
                    continue
                
                # Validate normalized values are in range [0, 1]
                if not (0 <= x_norm <= 1 and 0 <= y_norm <= 1 and 0 <= w_norm <= 1 and 0 <= h_norm <= 1):
                    continue
                
                w = w_norm * img_w
                h = h_norm * img_h
                x_center = x_norm * img_w
                y_center = y_norm * img_h
                
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
        
        # Normalize dataset path for comparison
        dataset_path_normalized = os.path.normpath(os.path.abspath(dataset_path))
        
        for label_file in label_files:
            # Check if file is not empty
            if os.path.getsize(label_file) > 0:
                # If filtering by class, check if file contains that class
                if class_id is not None:
                    boxes = parse_yolo_file(label_file)
                    # Check if any box has the specified class_id
                    has_class = any(int(box.get('class_id', -1)) == int(class_id) for box in boxes)
                    if not has_class:
                        continue
                
                base_name = os.path.splitext(os.path.basename(label_file))[0]
                
                # Try to find corresponding image
                for ext in ['.jpg', '.jpeg', '.png', '.bmp', '.JPG', '.JPEG', '.PNG', '.BMP']:
                    image_path = os.path.join(images_dir, base_name + ext)
                    if os.path.exists(image_path):
                        # Return absolute path, normalized (same format as load_dataset)
                        abs_path = os.path.abspath(image_path)
                        # Normalize path for consistency (same as load_dataset)
                        if os.name == 'nt':  # Windows
                            abs_path = abs_path.replace('/', '\\')
                        annotated_images.append(abs_path)
                        break
        
        return {"annotated_images": annotated_images, "count": len(annotated_images)}
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
            
            # Validate data.boxes is a list
            if not isinstance(data.boxes, list):
                raise HTTPException(status_code=400, detail="boxes must be a list")
            
            for idx, box in enumerate(data.boxes):
                # Validate box object
                if not hasattr(box, 'x') or not hasattr(box, 'y') or not hasattr(box, 'width') or not hasattr(box, 'height') or not hasattr(box, 'class_id'):
                    validation_errors.append(f"Box {idx}: Missing required fields")
                    continue
                
                # Validate types
                try:
                    x_val = float(box.x) if box.x is not None else 0
                    y_val = float(box.y) if box.y is not None else 0
                    w_val = float(box.width) if box.width is not None else 0
                    h_val = float(box.height) if box.height is not None else 0
                    class_id_val = int(box.class_id) if box.class_id is not None else 0
                except (ValueError, TypeError) as e:
                    validation_errors.append(f"Box {idx}: Invalid type for coordinates ({e})")
                    continue
                
                # Validate box dimensions
                if w_val <= 0 or h_val <= 0:
                    validation_errors.append(f"Box {idx}: Invalid dimensions (width={w_val}, height={h_val})")
                    continue
                
                if x_val < 0 or y_val < 0:
                    validation_errors.append(f"Box {idx}: Negative position (x={x_val}, y={y_val})")
                
                # Validate image dimensions
                if img_w <= 0 or img_h <= 0:
                    raise HTTPException(status_code=400, detail=f"Invalid image dimensions: {img_w}x{img_h}")
                
                # Clamp box to image bounds
                x_left = max(0, min(x_val, img_w))
                y_top = max(0, min(y_val, img_h))
                width = max(0, min(w_val, img_w - x_left))
                height = max(0, min(h_val, img_h - y_top))
                
                if width <= 0 or height <= 0:
                    validation_errors.append(f"Box {idx}: Box outside image bounds")
                    continue
                
                # Check minimum size (at least 5x5 pixels)
                if width < 5 or height < 5:
                    validation_errors.append(f"Box {idx}: Too small (min 5x5 pixels required)")

                # Calculate normalized values with division by zero protection
                w_norm = width / img_w if img_w > 0 else 0
                h_norm = height / img_h if img_h > 0 else 0
                
                x_center_pixel = x_left + (width / 2)
                y_center_pixel = y_top + (height / 2)
                
                x_norm = x_center_pixel / img_w if img_w > 0 else 0
                y_norm = y_center_pixel / img_h if img_h > 0 else 0
                
                # Clamp 0-1 and validate
                w_norm = min(max(w_norm, 0), 1)
                h_norm = min(max(h_norm, 0), 1)
                x_norm = min(max(x_norm, 0), 1)
                y_norm = min(max(y_norm, 0), 1)
                
                # Final validation of normalized values
                if not (0 <= x_norm <= 1 and 0 <= y_norm <= 1 and 0 <= w_norm <= 1 and 0 <= h_norm <= 1):
                    validation_errors.append(f"Box {idx}: Normalized values out of range")
                    continue

                yolo_boxes.append({
                    "class_id": class_id_val,
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
try:
    from backend.exporter import export_coco, export_voc
except ImportError:
    from exporter import export_coco, export_voc

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

class ReportRequest(BaseModel):
    dataset_path: str

@app.post("/export_report")
def export_report_endpoint(data: ReportRequest):
    """Export a quality report for the dataset"""
    try:
        import json
        from datetime import datetime
        
        # Get annotated images
        annotated_res = get_annotated_images(dataset_path=data.dataset_path, class_id=None)
        annotated_images = set(annotated_res["annotated_images"])
        
        # Get all images
        images_res = load_dataset(DatasetPath(path=data.dataset_path))
        all_images = images_res["images"]
        
        # Load classes
        classes_res = load_classes(DatasetPath(path=data.dataset_path))
        classes = classes_res["classes"]
        
        # Count annotations per class
        class_counts = {}
        total_annotations = 0
        invalid_annotations = 0
        
        for img_path in annotated_images:
            try:
                ann_res = load_annotation(
                    dataset_path=data.dataset_path,
                    image_path=img_path
                )
                boxes = ann_res["boxes"]
                total_annotations += len(boxes)
                
                for box in boxes:
                    class_id = box.get("class_id", 0)
                    class_counts[class_id] = class_counts.get(class_id, 0) + 1
                    
                    # Check for invalid
                    if box.get("width", 0) <= 0 or box.get("height", 0) <= 0:
                        invalid_annotations += 1
            except:
                continue
        
        # Build report
        report = {
            "dataset_path": data.dataset_path,
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_images": len(all_images),
                "annotated_images": len(annotated_images),
                "unannotated_images": len(all_images) - len(annotated_images),
                "completion_percentage": (len(annotated_images) / len(all_images) * 100) if all_images else 0,
                "total_annotations": total_annotations,
                "invalid_annotations": invalid_annotations,
                "avg_annotations_per_image": total_annotations / len(annotated_images) if annotated_images else 0
            },
            "class_distribution": {
                cls["name"]: class_counts.get(cls["id"], 0) for cls in classes
            },
            "quality_metrics": {
                "invalid_annotation_rate": (invalid_annotations / total_annotations * 100) if total_annotations > 0 else 0,
                "annotation_coverage": (len(annotated_images) / len(all_images) * 100) if all_images else 0
            }
        }
        
        # Save report
        output_file = os.path.join(data.dataset_path, "quality_report.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        return {"status": "success", "file": output_file, "report": report}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@app.post("/delete_image")
def delete_image(dataset_path: str = Body(...), image_path: str = Body(...)):
    """Delete an image and its corresponding annotation file"""
    try:
        if not dataset_path or not image_path:
            raise HTTPException(status_code=400, detail="Dataset path and image path are required")
        
        # Determine full image path
        if os.path.isabs(image_path):
            image_full_path = image_path
        else:
            # Try images subdirectory first, then flat structure
            image_full_path = os.path.join(dataset_path, "images", image_path)
            if not os.path.exists(image_full_path):
                image_full_path = os.path.join(dataset_path, image_path)
        
        # Verify image exists
        if not os.path.exists(image_full_path):
            raise HTTPException(status_code=404, detail=f"Image not found: {image_full_path}")
        
        # Determine label file path
        base_name = os.path.splitext(os.path.basename(image_full_path))[0]
        
        if os.path.basename(os.path.dirname(image_full_path)) == "images":
            label_dir = os.path.join(os.path.dirname(os.path.dirname(image_full_path)), "labels")
        else:
            label_dir = os.path.dirname(image_full_path)
        
        label_file = os.path.join(label_dir, base_name + ".txt")
        
        deleted_files = []
        
        # Delete image file
        try:
            os.remove(image_full_path)
            deleted_files.append(image_full_path)
        except Exception as e:
            print(f"Warning: Could not delete image file {image_full_path}: {e}")
        
        # Delete annotation file if it exists
        if os.path.exists(label_file):
            try:
                os.remove(label_file)
                deleted_files.append(label_file)
            except Exception as e:
                print(f"Warning: Could not delete label file {label_file}: {e}")
        
        return {
            "status": "deleted",
            "image": image_full_path,
            "label": label_file if os.path.exists(label_file) else None,
            "deleted_files": deleted_files
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    import io
    
    # Fix encoding for Windows console (cp1252 doesn't support Unicode)
    # Force UTF-8 encoding for stdout/stderr
    if sys.platform == 'win32':
        if sys.stdout.encoding != 'utf-8':
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        if sys.stderr.encoding != 'utf-8':
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    
    # Verify we can run this
    print("Starting backend...")
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    print(f"Working directory: {os.getcwd()}")
    print(f"Script location: {__file__}")
    print(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'Not set')}")
    
    # Check if required modules are available
    try:
        import fastapi
        import uvicorn
        import PIL
        print("[OK] All required modules are available")
    except ImportError as e:
        print(f"[ERROR] Missing required module: {e}")
        print("Please install dependencies: pip install -r requirements.txt")
        sys.exit(1)
    
    uvicorn.run(app, host="127.0.0.1", port=8000)
