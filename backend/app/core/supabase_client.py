from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase_client() -> Client | None:
    """Retorna um client Supabase singleton, ou None se ainda não configurado.

    Retornar None (em vez de levantar erro) permite que a aplicação suba mesmo
    antes de o projeto Supabase existir; os repositórios tratam esse caso.
    """
    settings = get_settings()
    if not settings.is_supabase_configured:
        return None

    return create_client(settings.supabase_url, settings.supabase_anon_key)