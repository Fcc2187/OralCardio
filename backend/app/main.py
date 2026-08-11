from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.logging import configure_logging, register_request_id_middleware

settings = get_settings()
configure_logging(settings.log_level)

app = FastAPI(title="CardioCare Connect API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_request_id_middleware(app)
register_exception_handlers(app)

app.include_router(api_router)
