from app.api.routes.transactions import router as transactions_router
from app.api.routes.auth import router as auth_router
from app.api.routes.assistant import router as assistant_router
from app.api.routes.wikipedia import router as wikipedia_router

__all__ = ["transactions_router", "auth_router", "assistant_router", "wikipedia_router"]
