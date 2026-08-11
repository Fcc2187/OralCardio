import logging
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response

REQUEST_ID_HEADER = "X-Request-ID"


def configure_logging(log_level: str) -> None:
    logging.basicConfig(
        level=log_level.upper(),
        format="%(asctime)s %(levelname)s %(name)s [%(request_id)s] %(message)s",
    )
    logging.setLogRecordFactory(_request_id_log_record_factory())


def _request_id_log_record_factory() -> Callable[..., logging.LogRecord]:
    base_factory = logging.getLogRecordFactory()

    def factory(*args: object, **kwargs: object) -> logging.LogRecord:
        record = base_factory(*args, **kwargs)
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return record

    return factory


def register_request_id_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def add_request_id(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER, str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers[REQUEST_ID_HEADER] = request_id
        return response