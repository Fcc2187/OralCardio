from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.domain.enums import AppointmentStatus
from app.repositories.interfaces import (
    AppointmentRepository,
    BrushingRepository,
    GamificationRepository,
)
from app.repositories.records import AppointmentRecord, BrushingSessionRecord, UserStatsRecord


class CaregiverPanelService:
    """Leitura dos dados do paciente pelo lado do cuidador.

    Não reimplementa nenhuma regra de autorização: os repositórios injetados
    aqui operam com o client Supabase escopado ao JWT do CUIDADOR, então o
    RLS (`database/007_caregiver_access.sql`) já decide, no banco, se cada
    linha pode ser vista. Se o vínculo não existir, estiver revogado, ou a
    permissão granular estiver desligada, a consulta simplesmente volta
    vazia — este service só traduz isso em 404/lista vazia, sem duplicar a
    decisão de "quem pode ver o quê" em Python.
    """

    def __init__(
        self,
        gamification_repository: GamificationRepository,
        brushing_repository: BrushingRepository,
        appointment_repository: AppointmentRepository,
    ) -> None:
        self._gamification_repository = gamification_repository
        self._brushing_repository = brushing_repository
        self._appointment_repository = appointment_repository

    def get_patient_stats(self, patient_id: UUID) -> UserStatsRecord:
        stats = self._gamification_repository.get_stats(patient_id)
        if stats is None:
            raise EntityNotFoundError("Estatísticas do paciente", str(patient_id))
        return stats

    def list_patient_brushing_sessions(
        self, patient_id: UUID, limit: int, offset: int
    ) -> list[BrushingSessionRecord]:
        return self._brushing_repository.list_by_user(patient_id, limit, offset)

    def list_patient_appointments(
        self, patient_id: UUID, limit: int, offset: int, status: AppointmentStatus | None
    ) -> list[AppointmentRecord]:
        return self._appointment_repository.list_by_user(patient_id, limit, offset, status)
