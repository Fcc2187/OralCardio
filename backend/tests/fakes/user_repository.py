from dataclasses import replace
from uuid import UUID

from app.repositories.records import UserRecord


class FakeUserRepository:
    def __init__(self, users: dict[UUID, UserRecord] | None = None) -> None:
        self._users = dict(users or {})

    def get_by_id(self, user_id: UUID) -> UserRecord | None:
        return self._users.get(user_id)

    def update(
        self, user_id: UUID, full_name: str | None, phone: str | None, avatar_url: str | None
    ) -> UserRecord:
        current = self._users[user_id]
        updated = replace(
            current,
            full_name=full_name if full_name is not None else current.full_name,
            phone=phone if phone is not None else current.phone,
            avatar_url=avatar_url if avatar_url is not None else current.avatar_url,
        )
        self._users[user_id] = updated
        return updated
