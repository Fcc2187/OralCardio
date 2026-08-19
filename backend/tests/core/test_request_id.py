import logging
import re

from fastapi import FastAPI
from starlette.testclient import TestClient

from app.core.logging import configure_logging, register_request_id_middleware


def _test_app() -> FastAPI:
    app = FastAPI()
    register_request_id_middleware(app)

    @app.get("/")
    def root() -> dict[str, bool]:
        logging.getLogger("request-id-test").info("inside_request")
        return {"ok": True}

    return app


def test_request_id_is_propagated_to_response_and_logs(caplog) -> None:
    configure_logging("INFO")
    caplog.set_level(logging.INFO, logger="request-id-test")

    response = TestClient(_test_app()).get("/", headers={"X-Request-ID": "client-123"})

    assert response.headers["X-Request-ID"] == "client-123"
    record = next(record for record in caplog.records if record.message == "inside_request")
    assert record.request_id == "client-123"


def test_invalid_request_id_is_replaced() -> None:
    response = TestClient(_test_app()).get("/", headers={"X-Request-ID": "invalid id"})

    assert response.headers["X-Request-ID"] != "invalid id"
    assert re.fullmatch(r"[0-9a-f-]{36}", response.headers["X-Request-ID"])
