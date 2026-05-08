from .auth import router as auth_router
from .users import router as users_router
from .generation import router as generation_router
from .dependencies import router as dependencies_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "users_router", 
    "generation_router",
    "dependencies_router",
    "admin_router"
]