from fastapi import APIRouter, Body
from app.schemas import GenerationInput

router = APIRouter()

@router.post("/generate")
def generate_text(
    gen_in: GenerationInput = Body(..., examples={"prompt":"Hello world","max_tokens":50})
):
    return {"generated": f"Output for prompt: {gen_in.prompt} with max_tokens {gen_in.max_tokens}"}

@router.get("/")
def generation_root():
    return {"message": "Generation router working"}
