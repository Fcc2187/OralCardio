from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    limit: int
    offset: int
    has_more: bool

    @classmethod
    def of(cls, items: list[T], limit: int, offset: int) -> "Page[T]":
        return cls(
            items=items[:limit],
            limit=limit,
            offset=offset,
            has_more=len(items) > limit,
        )


class CursorPage(BaseModel, Generic[T]):
    items: list[T]
    limit: int
    next_cursor: str | None
