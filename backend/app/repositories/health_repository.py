from supabase import Client


class SupabaseHealthRepository:
    """Implementação concreta de HealthRepository usando o client Supabase."""

    def __init__(self, client: Client | None) -> None:
        self._client = client

    def ping(self) -> bool:
        if self._client is None:
            return False

        try:
            self._client.table("achievements").select("id").limit(1).execute()
            return True
        except Exception:
            return False