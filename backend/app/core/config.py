from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Única fonte de configuração da aplicação, lida de variáveis de ambiente."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    env: str = "development"
    log_level: str = "INFO"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    cors_origins: str = "http://localhost:5173"
    web_push_vapid_public_key: str = ""
    web_push_vapid_private_key: str = ""
    web_push_vapid_subject: str = "mailto:contato@example.com"
    web_push_vapid_key_version: int = 1
    notification_dispatch_token: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_anon_key)

    @property
    def is_notification_dispatch_configured(self) -> bool:
        return bool(
            self.is_supabase_configured
            and self.supabase_service_role_key
            and self.web_push_vapid_public_key
            and self.web_push_vapid_private_key
            and self.web_push_vapid_subject
            and self.notification_dispatch_token
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
