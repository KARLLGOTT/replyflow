from fastapi import APIRouter, Body
from app.schemas import DependencyAction

router = APIRouter()

@router.post("/set")
def set_dependency(
    dep_in: DependencyAction = Body(..., examples={"name": "feature_x", "value": "enabled"})
):
    return {"message": f"Set {dep_in.name} to {dep_in.value}"}

@router.get("/")
def dependencies_root():
    return {"message": "Dependencies router working"}
