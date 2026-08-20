from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.internal.notifications import router as internal_notification_router
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.http_security import register_http_security_headers
from app.core.logging import configure_logging, register_request_id_middleware
from app.core.vapid import validate_vapid_configuration

settings = get_settings()
configure_logging(settings.log_level)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Valida segredos operacionais antes de aceitar tráfego de produção."""
    if settings.env.value == "production":
        validate_vapid_configuration(
            settings.web_push_vapid_public_key,
            settings.web_push_vapid_private_key,
            settings.web_push_vapid_subject,
        )
    yield


app = FastAPI(
    title="OralCardio API",
    version="0.3.0",
    docs_url="/docs" if settings.api_docs_enabled else None,
    redoc_url="/redoc" if settings.api_docs_enabled else None,
    openapi_url="/openapi.json" if settings.api_docs_enabled else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.env.value == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_host_list)

register_request_id_middleware(app)
register_http_security_headers(app)
register_exception_handlers(app)

app.include_router(api_router)
app.include_router(internal_notification_router)
