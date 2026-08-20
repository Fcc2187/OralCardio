import math
import os
from enum import StrEnum
from functools import lru_cache

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(StrEnum):
    DEVELOPMENT = "development"
    TEST = "test"
    STAGING = "staging"
    PRODUCTION = "production"


class Settings(BaseSettings):
    """Única fonte de configuração da aplicação, lida de variáveis de ambiente."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    env: Environment = Environment.DEVELOPMENT
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
    allowed_hosts: str = "localhost,127.0.0.1,testserver"
    expose_api_docs: bool | None = None
    supabase_timeout_seconds: int = Field(default=15, ge=1, le=60)
    web_push_vapid_public_key: str = ""
    web_push_vapid_private_key: str = ""
    web_push_vapid_subject: str = "mailto:contato@example.com"
    web_push_vapid_key_version: int = 1
    notification_dispatch_token: str = ""
    notification_dispatch_batch_size: int = Field(default=50, ge=1, le=500)
    notification_dispatch_lease_seconds: int = Field(default=300, ge=30, le=900)
    notification_dispatch_workers: int = Field(default=10, ge=1, le=50)
    notification_push_timeout_seconds: int = Field(default=10, ge=1, le=60)
    achievement_dispatch_batch_size: int = Field(default=10, ge=1, le=100)
    achievement_dispatch_lease_seconds: int = Field(default=300, ge=30, le=900)

    @field_validator("env", mode="before")
    @classmethod
    def normalize_environment(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_host_list(self) -> list[str]:
        return [host.strip() for host in self.allowed_hosts.split(",") if host.strip()]

    @property
    def api_docs_enabled(self) -> bool:
        """Mantém a documentação local e a fecha em produção por padrão."""
        if self.expose_api_docs is not None:
            return self.expose_api_docs
        return self.env is not Environment.PRODUCTION

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
        if self.env is not Environment.PRODUCTION:
            return self

        if not self.is_notification_dispatch_configured:
            raise ValueError("A configuração completa do Supabase e Web Push é obrigatória")
        if len(self.notification_dispatch_token) < 32:
            raise ValueError("NOTIFICATION_DISPATCH_TOKEN deve ter ao menos 32 caracteres")
        if "*" in self.cors_origin_list:
            raise ValueError("CORS_ORIGINS não pode conter '*' em produção")
        if not self.cors_origin_list:
            raise ValueError("CORS_ORIGINS deve conter ao menos a origem pública do frontend")
        if not self.allowed_host_list or "*" in self.allowed_host_list:
            raise ValueError(
                "ALLOWED_HOSTS deve listar apenas hosts públicos específicos em produção"
            )
        if self.expose_api_docs:
            raise ValueError("EXPOSE_API_DOCS não pode ser ativado em produção")
        for origin in self.cors_origin_list:
            self._validate_public_https_url(origin, "CORS_ORIGINS")
        self._validate_public_https_url(self.supabase_url, "SUPABASE_URL")
        for host in self.allowed_host_list:
            if "://" in host or "/" in host or "@" in host:
                raise ValueError(
                    "ALLOWED_HOSTS deve conter apenas nomes de host, sem protocolo ou caminho"
                )
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

    @staticmethod
    def _validate_public_https_url(value: str, variable_name: str) -> None:
        from urllib.parse import urlparse

        parsed = urlparse(value)
        forbidden_hosts = {"localhost", "127.0.0.1", "::1"}
        if (
            parsed.scheme != "https"
            or not parsed.hostname
            or parsed.hostname.lower() in forbidden_hosts
            or parsed.username
            or parsed.password
            or parsed.path not in {"", "/"}
            or parsed.params
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError(
                f"{variable_name} deve conter uma URL HTTPS pública, sem credenciais ou caminho"
            )


@lru_cache
def get_settings() -> Settings:
    # A suíte automatizada deve ser hermética e nunca consumir segredos do .env local.
    if os.getenv("ENV", "").lower() == "test":
        return Settings(_env_file=None)
    return Settings()
