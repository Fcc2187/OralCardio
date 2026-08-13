from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.domain.enums import AppointmentStatus
from app.repositories.interfaces import (
    AppointmentRepository,
    BrushingRepository,
    CaregiverRepository,
    GamificationRepository,
    UserRepository,
)
from app.repositories.records import (
    AppointmentRecord,
    BrushingSessionRecord,
    CaregiverPatientView,
    CaregiverRecord,
    UserStatsRecord,
)


class CaregiverPanelService:
    """Tudo que o lado CUIDADOR faz: ver seus convites, aceitá-los, listar
    quem ele acompanha, e ler os dados desses pacientes.

    `CaregiverService` (irmã deste service) atende o lado PACIENTE. Antes os
    três primeiros métodos abaixo viviam lá — um único service servindo dois
    atores diferentes é uma violação de ISP; a separação evita injetar
    `UserRepository` no service do paciente só para resolver nome de
    paciente, que é uma necessidade exclusiva do painel do cuidador.

    Não reimplementa nenhuma regra de autorização para os dados clínicos: os
    repositórios injetados aqui operam com o client Supabase escopado ao JWT
    do CUIDADOR, então o RLS (`database/007_caregiver_access.sql`) já decide,
    no banco, se cada linha pode ser vista. Se o vínculo não existir, estiver
    revogado, ou a permissão granular estiver desligada, a consulta
    simplesmente volta vazia — este service só traduz isso em 404/lista
    vazia, sem duplicar a decisão de "quem pode ver o quê" em Python.
    """

    def __init__(
        self,
        caregiver_repository: CaregiverRepository,
        user_repository: UserRepository,
        gamification_repository: GamificationRepository,
        brushing_repository: BrushingRepository,
        appointment_repository: AppointmentRepository,
    ) -> None:
        self._caregiver_repository = caregiver_repository
        self._user_repository = user_repository
        self._gamification_repository = gamification_repository
        self._brushing_repository = brushing_repository
        self._appointment_repository = appointment_repository

    def list_pending_invitations(self) -> list[CaregiverRecord]:
        return self._caregiver_repository.list_pending_invitations_for_current_user()

    def accept_invitation(self, invitation_id: UUID) -> CaregiverRecord:
        return self._caregiver_repository.accept_invitation(invitation_id)

    def list_my_patients(self, caregiver_user_id: UUID) -> list[CaregiverPatientView]:
        links = self._caregiver_repository.list_active_patients_for_current_user(
            caregiver_user_id
        )

        # Resolução do nome em uma query só: coleta os patient_ids visíveis
        # e busca todos de uma vez, em vez de um SELECT por paciente.
        patients = self._user_repository.list_by_ids([link.patient_id for link in links])
        names_by_patient_id = {patient.id: patient.full_name for patient in patients}

        return [
            CaregiverPatientView(
                link=link, patient_name=names_by_patient_id.get(link.patient_id)
            )
            for link in links
        ]

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
