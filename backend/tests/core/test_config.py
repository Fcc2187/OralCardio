import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_settings_accept_new_supabase_key_names() -> None:
    settings = Settings(
        _env_file=None,
        SUPABASE_URL="https://project.supabase.co",
        SUPABASE_PUBLISHABLE_KEY="sb_publishable_test",
        SUPABASE_SECRET_KEY="sb_secret_test",
    )

    assert settings.supabase_publishable_key == "sb_publishable_test"
    assert settings.supabase_secret_key == "sb_secret_test"


def test_settings_keep_legacy_supabase_key_aliases_during_rollout() -> None:
    settings = Settings(
        _env_file=None,
        SUPABASE_ANON_KEY="legacy-anon",
        SUPABASE_SERVICE_ROLE_KEY="legacy-service-role",
    )

    assert settings.supabase_publishable_key == "legacy-anon"
    assert settings.supabase_secret_key == "legacy-service-role"


def test_production_rejects_incomplete_dispatcher_configuration() -> None:
    with pytest.raises(ValidationError, match="configuração completa"):
        Settings(_env_file=None, env="production")


def test_production_rejects_lease_shorter_than_worst_case_batch() -> None:
    with pytest.raises(ValidationError, match="insuficiente"):
        Settings(
            _env_file=None,
            env="production",
            supabase_url="https://project.supabase.co",
            SUPABASE_PUBLISHABLE_KEY="sb_publishable_test",
            SUPABASE_SECRET_KEY="sb_secret_test",
            cors_origins="https://app.example.com",
            allowed_hosts="api.example.com",
            web_push_vapid_public_key="public",
            web_push_vapid_private_key="private",
            web_push_vapid_subject="mailto:ops@example.com",
            notification_dispatch_token="x" * 32,
            notification_dispatch_batch_size=100,
            notification_dispatch_workers=1,
            notification_push_timeout_seconds=10,
            notification_dispatch_lease_seconds=300,
        )


def test_production_rejects_non_public_cors_origin() -> None:
    with pytest.raises(ValidationError, match="CORS_ORIGINS"):
        Settings(
            _env_file=None,
            env="production",
            supabase_url="https://project.supabase.co",
            SUPABASE_PUBLISHABLE_KEY="sb_publishable_test",
            SUPABASE_SECRET_KEY="sb_secret_test",
            cors_origins="http://localhost:5173",
            allowed_hosts="api.example.com",
            web_push_vapid_public_key="public",
            web_push_vapid_private_key="private",
            web_push_vapid_subject="mailto:ops@example.com",
            notification_dispatch_token="x" * 32,
        )


def test_production_disables_api_docs() -> None:
    with pytest.raises(ValidationError, match="EXPOSE_API_DOCS"):
        Settings(
            _env_file=None,
            env="production",
            supabase_url="https://project.supabase.co",
            SUPABASE_PUBLISHABLE_KEY="sb_publishable_test",
            SUPABASE_SECRET_KEY="sb_secret_test",
            cors_origins="https://app.example.com",
            allowed_hosts="api.example.com",
            expose_api_docs=True,
            web_push_vapid_public_key="public",
            web_push_vapid_private_key="private",
            web_push_vapid_subject="mailto:ops@example.com",
            notification_dispatch_token="x" * 32,
        )
