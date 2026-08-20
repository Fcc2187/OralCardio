from datetime import datetime, time
from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.domain.enums import HabitNotificationType, NotificationType
from app.repositories.base import SupabaseRepository
from app.repositories.parsing import parse_datetime, parse_required_datetime
from app.repositories.records import (
    ClaimedNotificationDeliveryRecord,
    NotificationPreferencesRecord,
    PushSubscriptionRecord,
)

_PREFERENCES_TABLE = "notification_preferences"
_SCHEDULES_TABLE = "habit_notification_schedules"


def _parse_time(value: str) -> time:
    return time.fromisoformat(value)


class SupabaseNotificationRepository(SupabaseRepository):
    def get_preferences(self, user_id: UUID) -> NotificationPreferencesRecord:
        def preferences_operation():
            response = (
                self._client.table(_PREFERENCES_TABLE)
                .select("*")
                .eq("user_id", str(user_id))
                .maybe_single()
                .execute()
            )
            return self._maybe_single_data(response)

        row = self._run("Preferências de notificação", preferences_operation)
        if row is None:
            raise EntityNotFoundError("Preferências de notificação")

        def schedules_operation():
            response = (
                self._client.table(_SCHEDULES_TABLE)
                .select("habit_type, local_time, target_ordinal")
                .eq("user_id", str(user_id))
                .eq("enabled", True)
                .order("target_ordinal")
                .execute()
            )
            return response.data

        schedules = self._run("Horários de notificação", schedules_operation)
        brushing_times = tuple(
            _parse_time(schedule["local_time"])
            for schedule in schedules
            if schedule["habit_type"] == HabitNotificationType.BRUSHING.value
        )
        flossing_times = [
            _parse_time(schedule["local_time"])
            for schedule in schedules
            if schedule["habit_type"] == HabitNotificationType.FLOSSING.value
        ]
        if not brushing_times or len(flossing_times) != 1:
            raise EntityNotFoundError("Horários de notificação")

        return NotificationPreferencesRecord(
            id=UUID(row["id"]),
            user_id=UUID(row["user_id"]),
            enabled=row["enabled"],
            brushing_enabled=row["brushing_enabled"],
            brushing_times=brushing_times,
            flossing_enabled=row["flossing_enabled"],
            flossing_time=flossing_times[0],
            appointments_enabled=row["appointments_enabled"],
            appointment_lead_minutes=tuple(row["appointment_lead_minutes"]),
            quiet_hours_start=_parse_time(row["quiet_hours_start"]),
            quiet_hours_end=_parse_time(row["quiet_hours_end"]),
            consented_at=parse_datetime(row.get("consented_at")),
            created_at=parse_required_datetime(row["created_at"]),
            updated_at=parse_required_datetime(row["updated_at"]),
        )

    def update_preferences(
        self,
        user_id: UUID,
        *,
        enabled: bool,
        brushing_enabled: bool,
        brushing_times: tuple[str, ...],
        flossing_enabled: bool,
        flossing_time: str,
        appointments_enabled: bool,
        appointment_lead_minutes: tuple[int, ...],
        quiet_hours_start: str,
        quiet_hours_end: str,
    ) -> NotificationPreferencesRecord:
        def operation():
            self._client.rpc(
                "update_notification_preferences",
                {
                    "p_enabled": enabled,
                    "p_brushing_enabled": brushing_enabled,
                    "p_brushing_times": list(brushing_times),
                    "p_flossing_enabled": flossing_enabled,
                    "p_flossing_time": flossing_time,
                    "p_appointments_enabled": appointments_enabled,
                    "p_appointment_lead_minutes": list(appointment_lead_minutes),
                    "p_quiet_hours_start": quiet_hours_start,
                    "p_quiet_hours_end": quiet_hours_end,
                },
            ).execute()

        self._run("Preferências de notificação", operation)
        return self.get_preferences(user_id)

    def upsert_subscription(
        self,
        *,
        endpoint: str,
        p256dh: str,
        auth_secret: str,
        expiration_time: datetime | None,
        device_label: str | None,
        vapid_key_version: int,
        revocation_token: str,
    ) -> PushSubscriptionRecord:
        def operation():
            response = self._client.rpc(
                "upsert_push_subscription",
                {
                    "p_endpoint": endpoint,
                    "p_p256dh": p256dh,
                    "p_auth_secret": auth_secret,
                    "p_expiration_time": (
                        expiration_time.isoformat() if expiration_time else None
                    ),
                    "p_device_label": device_label,
                    "p_vapid_key_version": vapid_key_version,
                    "p_revocation_token": revocation_token,
                },
            ).execute()
            return response.data

        rows = self._run("Inscrição de notificação", operation)
        row = rows[0]
        return PushSubscriptionRecord(
            id=UUID(row["subscription_id"]), active=row["active"]
        )

    def unsubscribe(self, endpoint: str) -> bool:
        def operation():
            response = self._client.rpc(
                "unsubscribe_push_subscription", {"p_endpoint": endpoint}
            ).execute()
            return response.data

        return bool(self._run("Inscrição de notificação", operation))

    def request_test_notification(self) -> UUID:
        def operation():
            response = self._client.rpc("request_test_notification", {}).execute()
            return response.data

        return UUID(self._run("Notificação de teste", operation))


class SupabaseNotificationRevocationRepository(SupabaseRepository):
    """Adapter privilegiado para uma capability que só pode desligar Push."""

    def revoke_with_token(self, endpoint: str, revocation_token: str) -> bool:
        def operation():
            response = self._client.rpc(
                "revoke_push_subscription_with_token",
                {"p_endpoint": endpoint, "p_revocation_token": revocation_token},
            ).execute()
            return response.data

        return bool(self._run("Revogação de inscrição de notificação", operation))


class SupabaseNotificationDispatchRepository(SupabaseRepository):
    def claim_due_deliveries(
        self, batch_size: int, lease_seconds: int, now: datetime
    ) -> list[ClaimedNotificationDeliveryRecord]:
        def operation():
            response = self._client.rpc(
                "claim_due_notification_deliveries",
                {
                    "p_batch_size": batch_size,
                    "p_lease_seconds": lease_seconds,
                    "p_now": now.isoformat(),
                },
            ).execute()
            return response.data

        rows = self._run("Fila de notificações", operation)
        return [
            ClaimedNotificationDeliveryRecord(
                delivery_id=UUID(row["delivery_id"]),
                job_id=UUID(row["job_id"]),
                notification_type=NotificationType(row["notification_type"]),
                endpoint=row["endpoint"],
                p256dh=row["p256dh"],
                auth_secret=row["auth_secret"],
                payload=row["payload"],
                attempt_count=row["attempt_count"],
                lease_token=UUID(row["lease_token"]),
            )
            for row in rows
        ]

    def complete_delivery(
        self,
        delivery_id: UUID,
        lease_token: UUID,
        outcome: str,
        error_code: str | None,
        retry_at: datetime | None,
    ) -> None:
        def operation():
            self._client.rpc(
                "complete_notification_delivery",
                {
                    "p_delivery_id": str(delivery_id),
                    "p_lease_token": str(lease_token),
                    "p_outcome": outcome,
                    "p_error_code": error_code,
                    "p_retry_at": retry_at.isoformat() if retry_at else None,
                },
            ).execute()

        self._run("Entrega de notificação", operation)
