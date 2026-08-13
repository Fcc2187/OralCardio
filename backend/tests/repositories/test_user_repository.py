from app.repositories.user_repository import SupabaseUserRepository


class _ClientThatMustNotBeCalled:
    def table(self, *_args: object, **_kwargs: object) -> None:
        raise AssertionError("client não deveria ser chamado com lista vazia de ids")


def test_list_by_ids_returns_empty_without_touching_client_for_empty_input() -> None:
    repository = SupabaseUserRepository(client=_ClientThatMustNotBeCalled())  # type: ignore[arg-type]

    assert repository.list_by_ids([]) == []
