from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.repositories.interfaces import UserRepository
from app.repositories.records import UserRecord


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository

    def get_profile(self, user_id: UUID) -> UserRecord:
        user = self._repository.get_by_id(user_id)
        if user is None:
            raise EntityNotFoundError("Usuário", str(user_id))
        return user

    def update_profile(
        self, user_id: UUID, changes: dict[str, object]
    ) -> UserRecord:
        if not changes:
            return self.get_profile(user_id)
        return self._repository.update(user_id, changes)
