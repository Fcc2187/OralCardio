"""Entrypoint ASGI para deploy serverless da OralCardio API na Vercel."""

from app.main import app

__all__ = ["app"]
