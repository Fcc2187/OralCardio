from functools import lru_cache

from supabase import Client, ClientOptions, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase_client() -> Client | None:
    """Retorna um client Supabase anônimo singleton, ou None se ainda não configurado.

    Usado apenas para operações que não exigem RLS por usuário: o health check
    e a validação de token (SupabaseTokenVerifier). Toda operação sobre dados
    de um paciente deve usar `create_user_scoped_client`.
    """
    settings = get_settings()
    if not settings.is_supabase_configured:
        return None

    return create_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )


def create_user_scoped_client(access_token: str) -> Client:
    """Cria um client Supabase que envia o JWT do usuário em cada requisição.

    Isso faz o PostgREST avaliar `auth.uid()` como o usuário autenticado, então
    as políticas de RLS do banco passam a valer de verdade — a última linha de
    defesa contra um filtro `user_id` esquecido no código da aplicação.
    """
    settings = get_settings()
    client = create_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )
    client.postgrest.auth(access_token)
    return client


@lru_cache
def get_privileged_supabase_client() -> Client | None:
    """Client servidor-servidor; nunca deve ser exposto nem receber JWT de usuário."""
    settings = get_settings()
    if not settings.is_privileged_supabase_configured:
        return None
    return create_client(
        settings.supabase_url,
        settings.supabase_secret_key,
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )


def create_background_job_client() -> Client:
    """Obtém o client privilegiado usado somente pelo worker interno."""
    client = get_privileged_supabase_client()
    if client is None:
        raise RuntimeError("Client privilegiado do Supabase não configurado")
    return client
