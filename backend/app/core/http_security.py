"""Headers de segurança para as respostas da API.

A CSP pertence ao host da PWA, que conhece os domínios finais de frontend,
Supabase e API. Aqui aplicamos somente headers seguros para JSON e endpoints
internos, sem inventar uma allowlist de produção em código.
"""

from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response


def register_http_security_headers(app: FastAPI) -> None:
    @app.middleware("http")
    async def add_security_headers(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("X-Frame-Options", "DENY")
        if request.url.path.startswith("/api/") or request.url.path.startswith("/internal/"):
            response.headers.setdefault("Cache-Control", "no-store")
        return response
