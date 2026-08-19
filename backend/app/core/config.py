import math
import os
from functools import lru_cache

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Única fonte de configuração da aplicação, lida de variáveis de ambiente."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    env: str = "development"
    log_level: str = "INFO"
    supabase_url: str = ""
    supabase_publishable_key: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"),
    )
    supabase_secret_key: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
    )
    cors_origins: str = "http://localhost:5173"
    web_push_vapid_public_key: str = ""
    web_push_vapid_private_key: str = ""
    web_push_vapid_subject: str = "mailto:contato@example.com"
    web_push_vapid_key_version: int = 1
    notification_dispatch_token: str = ""
    notification_dispatch_batch_size: int = Field(default=50, ge=1, le=500)
    notification_dispatch_lease_seconds: int = Field(default=300, ge=30, le=3600)
    notification_dispatch_workers: int = Field(default=10, ge=1, le=50)
    notification_push_timeout_seconds: int = Field(default=10, ge=1, le=60)
    achievement_dispatch_batch_size: int = Field(default=10, ge=1, le=100)
    achievement_dispatch_lease_seconds: int = Field(default=300, ge=30, le=3600)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_publishable_key)

    @property
    def is_privileged_supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_secret_key)

    @property
    def is_notification_dispatch_configured(self) -> bool:
        return bool(
            self.is_supabase_configured
            and self.is_privileged_supabase_configured
            and self.web_push_vapid_public_key
            and self.web_push_vapid_private_key
            and self.web_push_vapid_subject
            and self.notification_dispatch_token
        )

    @model_validator(mode="after")
    def validate_production_configuration(self) -> "Settings":
        if self.env.lower() != "production":
            return self

        if not self.is_notification_dispatch_configured:
            raise ValueError("A configuração completa do Supabase e Web Push é obrigatória")
        if len(self.notification_dispatch_token) < 32:
            raise ValueError("NOTIFICATION_DISPATCH_TOKEN deve ter ao menos 32 caracteres")
        if "*" in self.cors_origin_list:
            raise ValueError("CORS_ORIGINS não pode conter '*' em produção")
        worst_case_send_seconds = (
            math.ceil(
                self.notification_dispatch_batch_size
                / self.notification_dispatch_workers
            )
            * self.notification_push_timeout_seconds
        )
        if self.notification_dispatch_lease_seconds < worst_case_send_seconds + 30:
            raise ValueError(
                "NOTIFICATION_DISPATCH_LEASE_SECONDS é insuficiente para o lote configurado"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    # A suíte automatizada deve ser hermética e nunca consumir segredos do .env local.
    if os.getenv("ENV", "").lower() == "test":
        return Settings(_env_file=None)
    return Settings()
