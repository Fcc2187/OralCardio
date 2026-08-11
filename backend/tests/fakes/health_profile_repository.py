from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.domain.enums import CardiacCondition
from app.repositories.records import HealthProfileRecord


class FakeHealthProfileRepository:
    def __init__(self) -> None:
        self._profiles: dict[UUID, HealthProfileRecord] = {}

    def get_by_user_id(self, user_id: UUID) -> HealthProfileRecord | None:
        return self._profiles.get(user_id)

    def upsert(self, user_id: UUID, values: dict) -> HealthProfileRecord:
        existing = self._profiles.get(user_id)
        now = datetime.now(UTC)
        record = HealthProfileRecord(
            id=existing.id if existing else uuid4(),
            user_id=user_id,
            cardiac_condition=CardiacCondition(values["cardiac_condition"]),
            cardiac_condition_detail=values.get("cardiac_condition_detail"),
            has_pacemaker=values["has_pacemaker"],
            has_prosthetic_valve=values["has_prosthetic_valve"],
            medications=values.get("medications") or [],
            allergies=values.get("allergies") or [],
            last_dental_visit=values.get("last_dental_visit"),
            brushing_frequency_before=values.get("brushing_frequency_before"),
            dentist_name=values.get("dentist_name"),
            dentist_phone=values.get("dentist_phone"),
            cardiologist_name=values.get("cardiologist_name"),
            is_completed=values.get("is_completed", False),
            created_at=existing.created_at if existing else now,
            updated_at=now,
        )
        self._profiles[user_id] = record
        return record
