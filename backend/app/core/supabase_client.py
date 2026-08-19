from functools import lru_cache

from supabase import Client, create_client

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

    return create_client(settings.supabase_url, settings.supabase_anon_key)


def create_user_scoped_client(access_token: str) -> Client:
    """Cria um client Supabase que envia o JWT do usuário em cada requisição.

    Isso faz o PostgREST avaliar `auth.uid()` como o usuário autenticado, então
    as políticas de RLS do banco passam a valer de verdade — a última linha de
    defesa contra um filtro `user_id` esquecido no código da aplicação.
    """
    settings = get_settings()
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client


def create_notification_dispatch_client() -> Client:
    """Cria o client privilegiado usado somente pelo worker de notificações."""
    settings = get_settings()
    if not settings.is_notification_dispatch_configured:
        raise RuntimeError("Dispatcher de notificações não configurado")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
