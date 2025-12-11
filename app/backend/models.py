from pydantic import BaseModel
from typing import List, Optional

class DatasetPath(BaseModel):
    path: str

class BoundingBox(BaseModel):
    id: str
    class_id: int
    x: float
    y: float
    width: float
    height: float
    confidence: Optional[float] = 1.0

class AnnotationData(BaseModel):
    image_name: str
    boxes: List[BoundingBox]
    dataset_path: str

class ClassItem(BaseModel):
    id: int
    name: str
    color: str

class ClassUpdate(BaseModel):
    classes: List[ClassItem]
    dataset_path: str

class MergeDatasetsRequest(BaseModel):
    dataset_paths: List[str]
    output_path: str
    merge_classes: bool = True
    rename_conflicting_images: bool = True

class ExportProjectRequest(BaseModel):
    dataset_path: str
    output_path: str

class ImportProjectRequest(BaseModel):
    project_path: str
