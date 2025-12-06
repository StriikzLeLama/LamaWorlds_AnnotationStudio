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
