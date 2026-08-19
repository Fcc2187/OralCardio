from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.exceptions import (
    AuthenticationError,
    BusinessRuleViolationError,
    ConflictError,
    EntityNotFoundError,
    PermissionDeniedError,
    ServiceUnavailableError,
)

_STATUS_BY_EXCEPTION = {
    EntityNotFoundError: 404,
    ConflictError: 409,
    PermissionDeniedError: 403,
    BusinessRuleViolationError: 422,
    AuthenticationError: 401,
    ServiceUnavailableError: 503,
}


def _build_error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": message})


def register_exception_handlers(app: FastAPI) -> None:
    for exception_type, status_code in _STATUS_BY_EXCEPTION.items():

        def handler(
            request: Request, exc: Exception, status_code: int = status_code
        ) -> JSONResponse:
            return _build_error_response(status_code, str(exc))

        app.add_exception_handler(exception_type, handler)
