import math
import time
from collections import OrderedDict
from collections.abc import Callable
from threading import Lock

from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

MAX_REQUEST_BODY_BYTES = 64 * 1024
PUBLIC_REQUESTS_PER_MINUTE = 60
_RATE_LIMITED_ROUTES = {
    ("GET", "/api/v1/health"),
    ("GET", "/api/v1/health/ready"),
    ("POST", "/api/v1/notifications/revocations"),
}


class _BodyTooLarge(HTTPException):
    def __init__(self, max_body_bytes: int) -> None:
        super().__init__(
            status_code=413,
            detail=f"Corpo da requisição excede {max_body_bytes} bytes.",
        )


class RequestLimitsMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        max_body_bytes: int = MAX_REQUEST_BODY_BYTES,
        requests_per_window: int = PUBLIC_REQUESTS_PER_MINUTE,
        window_seconds: float = 60,
        max_clients: int = 10_000,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._app = app
        self._max_body_bytes = max_body_bytes
        self._requests_per_window = requests_per_window
        self._window_seconds = window_seconds
        self._max_clients = max_clients
        self._clock = clock
        self._buckets: OrderedDict[str, tuple[float, int]] = OrderedDict()
        self._lock = Lock()

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return

        if (scope["method"], scope["path"]) in _RATE_LIMITED_ROUTES:
            retry_after = self._retry_after(scope)
            if retry_after is not None:
                await JSONResponse(
                    {"detail": "Muitas requisições. Tente novamente mais tarde."},
                    status_code=429,
                    headers={"Retry-After": str(retry_after)},
                )(scope, receive, send)
                return

        content_length = self._content_length(scope)
        if content_length is not None and content_length > self._max_body_bytes:
            await self._body_too_large_response(scope, receive, send)
            return

        received_bytes = 0
        response_started = False

        async def receive_limited() -> Message:
            nonlocal received_bytes
            message = await receive()
            if message["type"] == "http.request":
                received_bytes += len(message.get("body", b""))
                if received_bytes > self._max_body_bytes:
                    raise _BodyTooLarge(self._max_body_bytes)
            return message

        async def send_tracked(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self._app(scope, receive_limited, send_tracked)
        except _BodyTooLarge:
            if response_started:
                raise
            await self._body_too_large_response(scope, receive, send)

    def _retry_after(self, scope: Scope) -> int | None:
        client = scope.get("client")
        client_host = client[0] if client else "unknown"
        now = self._clock()

        with self._lock:
            bucket = self._buckets.pop(client_host, None)
            if bucket is None or now - bucket[0] >= self._window_seconds:
                window_started, request_count = now, 0
            else:
                window_started, request_count = bucket

            next_count = min(request_count + 1, self._requests_per_window)
            self._buckets[client_host] = (window_started, next_count)
            if len(self._buckets) > self._max_clients:
                self._buckets.popitem(last=False)

            if request_count < self._requests_per_window:
                return None
            return max(1, math.ceil(self._window_seconds - (now - window_started)))

    @staticmethod
    def _content_length(scope: Scope) -> int | None:
        for name, value in scope["headers"]:
            if name == b"content-length":
                try:
                    return int(value)
                except ValueError:
                    return None
        return None

    async def _body_too_large_response(
        self, scope: Scope, receive: Receive, send: Send
    ) -> None:
        await JSONResponse(
            {"detail": f"Corpo da requisição excede {self._max_body_bytes} bytes."},
            status_code=413,
        )(scope, receive, send)
