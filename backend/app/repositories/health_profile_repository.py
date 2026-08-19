from uuid import UUID

from app.domain.enums import CardiacCondition
from app.repositories.base import SupabaseRepository
from app.repositories.parsing import parse_date, parse_required_datetime
from app.repositories.records import HealthProfileRecord

_TABLE = "health_profiles"


def _to_record(row: dict) -> HealthProfileRecord:
    return HealthProfileRecord(
        id=UUID(row["id"]),
        user_id=UUID(row["user_id"]),
        cardiac_condition=CardiacCondition(row["cardiac_condition"]),
        cardiac_condition_detail=row.get("cardiac_condition_detail"),
        has_pacemaker=row["has_pacemaker"],
        has_prosthetic_valve=row["has_prosthetic_valve"],
        medications=row.get("medications") or [],
        allergies=row.get("allergies") or [],
        last_dental_visit=parse_date(row.get("last_dental_visit")),
        brushing_frequency_before=row.get("brushing_frequency_before"),
        dentist_name=row.get("dentist_name"),
        dentist_phone=row.get("dentist_phone"),
        cardiologist_name=row.get("cardiologist_name"),
        is_completed=row["is_completed"],
        created_at=parse_required_datetime(row["created_at"]),
        updated_at=parse_required_datetime(row["updated_at"]),
    )


class SupabaseHealthProfileRepository(SupabaseRepository):
    def get_by_user_id(self, user_id: UUID) -> HealthProfileRecord | None:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .eq("user_id", str(user_id))
                .maybe_single()
                .execute()
            )
            return self._maybe_single_data(response)

        row = self._run("Perfil de saúde", operation)
        return _to_record(row) if row else None

    def upsert(self, user_id: UUID, values: dict) -> HealthProfileRecord:
        def operation():
            response = self._client.rpc(
                "upsert_health_profile_v2",
                {
                    "p_cardiac_condition": values["cardiac_condition"],
                    "p_cardiac_condition_detail": values["cardiac_condition_detail"],
                    "p_has_pacemaker": values["has_pacemaker"],
                    "p_has_prosthetic_valve": values["has_prosthetic_valve"],
                    "p_medications": values["medications"],
                    "p_allergies": values["allergies"],
                    "p_last_dental_visit": values["last_dental_visit"],
                    "p_brushing_frequency_before": values["brushing_frequency_before"],
                    "p_dentist_name": values["dentist_name"],
                    "p_dentist_phone": values["dentist_phone"],
                    "p_cardiologist_name": values["cardiologist_name"],
                },
            ).execute()
            return response.data

        rows = self._run("Perfil de saúde", operation)
        return _to_record(rows[0])
