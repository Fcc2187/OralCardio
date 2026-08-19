from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.application.contracts import (
    AchievementEvaluationDispatchSummary,
    BackgroundDispatchSummary,
    DispatchSummary,
)
from app.domain.notifications import (
    NotificationPreferencesUpdate,
    validate_push_endpoint,
    validate_push_subscription_keys,
)
from app.repositories.records import NotificationPreferencesRecord, PushSubscriptionRecord


class NotificationPreferencesInput(BaseModel):
    enabled: bool
    brushing_enabled: bool
    brushing_times: list[time] = Field(min_length=1, max_length=5)
    flossing_enabled: bool
    flossing_time: time
    appointments_enabled: bool
    appointment_lead_minutes: list[int] = Field(min_length=1, max_length=3)
    quiet_hours_start: time
    quiet_hours_end: time

    @field_validator(
        "brushing_times",
        "flossing_time",
        "quiet_hours_start",
        "quiet_hours_end",
    )
    @classmethod
    def require_minute_precision(cls, value: time | list[time]) -> time | list[time]:
        values = value if isinstance(value, list) else [value]
        if any(
            item.second != 0 or item.microsecond != 0 or item.tzinfo is not None
            for item in values
        ):
            raise ValueError("Os horários devem usar apenas horas e minutos, sem fuso")
        return value

    def to_domain(self) -> NotificationPreferencesUpdate:
        return NotificationPreferencesUpdate(
            enabled=self.enabled,
            brushing_enabled=self.brushing_enabled,
            brushing_times=tuple(self.brushing_times),
            flossing_enabled=self.flossing_enabled,
            flossing_time=self.flossing_time,
            appointments_enabled=self.appointments_enabled,
            appointment_lead_minutes=tuple(self.appointment_lead_minutes),
            quiet_hours_start=self.quiet_hours_start,
            quiet_hours_end=self.quiet_hours_end,
        )


class NotificationPreferencesOutput(BaseModel):
    enabled: bool
    brushing_enabled: bool
    brushing_times: list[time]
    flossing_enabled: bool
    flossing_time: time
    appointments_enabled: bool
    appointment_lead_minutes: list[int]
    quiet_hours_start: time
    quiet_hours_end: time
    consented_at: datetime | None

    @classmethod
    def from_record(
        cls, record: NotificationPreferencesRecord
    ) -> "NotificationPreferencesOutput":
        return cls(
            enabled=record.enabled,
            brushing_enabled=record.brushing_enabled,
            brushing_times=list(record.brushing_times),
            flossing_enabled=record.flossing_enabled,
            flossing_time=record.flossing_time,
            appointments_enabled=record.appointments_enabled,
            appointment_lead_minutes=list(record.appointment_lead_minutes),
            quiet_hours_start=record.quiet_hours_start,
            quiet_hours_end=record.quiet_hours_end,
            consented_at=record.consented_at,
        )


class VapidPublicKeyOutput(BaseModel):
    public_key: str
    key_version: int


class PushSubscriptionKeysInput(BaseModel):
    p256dh: str = Field(min_length=16, max_length=512)
    auth: str = Field(min_length=8, max_length=256)


class PushSubscriptionInput(BaseModel):
    endpoint: str = Field(min_length=1, max_length=4096, pattern=r"^https://")
    keys: PushSubscriptionKeysInput
    expiration_time: datetime | None = None
    device_label: str | None = Field(default=None, max_length=80)

    @model_validator(mode="after")
    def validate_subscription(self) -> "PushSubscriptionInput":
        if self.expiration_time is not None and (
            self.expiration_time.tzinfo is None
            or self.expiration_time.utcoffset() is None
        ):
            raise ValueError("A expiração da inscrição deve incluir o fuso horário")
        validate_push_endpoint(self.endpoint)
        validate_push_subscription_keys(self.keys.p256dh, self.keys.auth)
        return self


class PushSubscriptionOutput(BaseModel):
    id: UUID
    active: bool

    @classmethod
    def from_record(cls, record: PushSubscriptionRecord) -> "PushSubscriptionOutput":
        return cls(id=record.id, active=record.active)


class PushUnsubscribeInput(BaseModel):
    endpoint: str = Field(min_length=1, max_length=4096, pattern=r"^https://")

    @model_validator(mode="after")
    def validate_endpoint(self) -> "PushUnsubscribeInput":
        validate_push_endpoint(self.endpoint)
        return self


class PushUnsubscribeOutput(BaseModel):
    unsubscribed: bool


class TestNotificationOutput(BaseModel):
    job_id: UUID
    status: str = "queued"


class NotificationDispatchOutput(BaseModel):
    claimed: int
    sent: int
    retried: int
    revoked: int
    dead: int

    @classmethod
    def from_summary(cls, summary: DispatchSummary) -> "NotificationDispatchOutput":
        return cls(**summary.__dict__)


class AchievementEvaluationDispatchOutput(BaseModel):
    claimed: int
    succeeded: int
    retried: int

    @classmethod
    def from_summary(
        cls, summary: AchievementEvaluationDispatchSummary
    ) -> "AchievementEvaluationDispatchOutput":
        return cls(**summary.__dict__)


class BackgroundDispatchOutput(BaseModel):
    notifications: NotificationDispatchOutput
    achievement_evaluations: AchievementEvaluationDispatchOutput

    @classmethod
    def from_summary(cls, summary: BackgroundDispatchSummary) -> "BackgroundDispatchOutput":
        return cls(
            notifications=NotificationDispatchOutput.from_summary(summary.notifications),
            achievement_evaluations=AchievementEvaluationDispatchOutput.from_summary(
                summary.achievement_evaluations
            ),
        )
