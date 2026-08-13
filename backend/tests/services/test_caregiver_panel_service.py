from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest

from app.core.exceptions import BusinessRuleViolationError
from app.domain.enums import CaregiverStatus
from app.repositories.records import CaregiverRecord, UserRecord, UserStatsRecord
from app.services.caregiver_panel_service import CaregiverPanelService
from app.services.caregiver_service import CaregiverService
from tests.fakes.appointment_repository import FakeAppointmentRepository
from tests.fakes.brushing_repository import FakeBrushingRepository
from tests.fakes.caregiver_repository import FakeCaregiverRepository
from tests.fakes.gamification_repository import FakeGamificationRepository
from tests.fakes.user_repository import FakeUserRepository


class _SpyEmailSender:
    def send_caregiver_invitation(self, *, to_email: str, patient_name: str) -> None:
        pass


def _panel_service(
    caregiver_repo: FakeCaregiverRepository,
    user_repo: FakeUserRepository | None = None,
) -> CaregiverPanelService:
    dummy_stats = UserStatsRecord(
        user_id=uuid4(),
        total_points=0,
        level=1,
        level_name="Semente",
        current_streak_days=0,
        longest_streak_days=0,
        total_brushings=0,
        total_flossings=0,
        last_brushing_date=None,
        last_flossing_date=None,
    )
    return CaregiverPanelService(
        caregiver_repository=caregiver_repo,
        user_repository=user_repo or FakeUserRepository(),
        gamification_repository=FakeGamificationRepository(dummy_stats),
        brushing_repository=FakeBrushingRepository(),
        appointment_repository=FakeAppointmentRepository(),
    )


def _make_user(user_id: UUID, full_name: str) -> UserRecord:
    now = datetime.now(UTC)
    return UserRecord(
        id=user_id,
        full_name=full_name,
        avatar_url=None,
        phone=None,
        date_of_birth=None,
        created_at=now,
        updated_at=now,
    )


def _make_link(
    patient_id: UUID,
    caregiver_email: str,
    caregiver_user_id: UUID | None,
    status: CaregiverStatus,
) -> CaregiverRecord:
    now = datetime.now(UTC)
    return CaregiverRecord(
        id=uuid4(),
        patient_id=patient_id,
        caregiver_email=caregiver_email,
        caregiver_user_id=caregiver_user_id,
        status=status,
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
        invited_at=now,
        accepted_at=now if status == CaregiverStatus.ACTIVE else None,
        revoked_at=None,
    )


@pytest.fixture
def user_id() -> UUID:
    return uuid4()


@pytest.fixture
def caregiver_user_id() -> UUID:
    return uuid4()


@pytest.fixture
def caregiver_email() -> str:
    return "cuidador@example.com"


def test_accept_invitation_fails_for_mismatched_email(
    user_id: UUID, caregiver_user_id: UUID
) -> None:
    repo = FakeCaregiverRepository(
        current_user_id=caregiver_user_id, current_user_email="outro@example.com"
    )
    patient_service = CaregiverService(repo, _SpyEmailSender())
    caregiver = patient_service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email="cuidador@example.com",
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )

    panel_service = _panel_service(repo)
    with pytest.raises(BusinessRuleViolationError):
        panel_service.accept_invitation(caregiver.id)


def test_accept_invitation_succeeds_for_matching_email(
    user_id: UUID, caregiver_email: str, caregiver_user_id: UUID
) -> None:
    repo = FakeCaregiverRepository(
        current_user_id=caregiver_user_id, current_user_email=caregiver_email
    )
    patient_service = CaregiverService(repo, _SpyEmailSender())
    caregiver = patient_service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email=caregiver_email,
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )

    panel_service = _panel_service(repo)
    accepted = panel_service.accept_invitation(caregiver.id)

    assert accepted.status == CaregiverStatus.ACTIVE
    assert accepted.caregiver_user_id == caregiver_user_id


def test_list_pending_invitations_matches_current_user_email(caregiver_user_id: UUID) -> None:
    repo = FakeCaregiverRepository(
        current_user_id=caregiver_user_id, current_user_email="cuidador@example.com"
    )
    patient_service = CaregiverService(repo, _SpyEmailSender())
    patient_service.invite_caregiver(
        patient_id=uuid4(),
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email="cuidador@example.com",
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )
    patient_service.invite_caregiver(
        patient_id=uuid4(),
        patient_name="José Souza",
        patient_email="jose@example.com",
        caregiver_email="outro-cuidador@example.com",
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )

    invitations = _panel_service(repo).list_pending_invitations()

    assert [i.caregiver_email for i in invitations] == ["cuidador@example.com"]


def test_list_my_patients_excludes_links_where_current_user_is_the_patient(
    caregiver_user_id: UUID,
) -> None:
    """Prova da correção da Fase A.2: antes, `list_active_patients_for_
    current_user` só filtrava `status='active'` e confiava no RLS — que tem
    duas políticas permissivas em OR (`patient_id = auth.uid()` OU
    `caregiver_user_id = auth.uid()`), então os PRÓPRIOS cuidadores do
    usuário vazavam na lista "meus pacientes".
    """
    repo = FakeCaregiverRepository(current_user_id=caregiver_user_id, current_user_email="c@x.com")
    link_as_caregiver = _make_link(
        patient_id=uuid4(),
        caregiver_email="c@x.com",
        caregiver_user_id=caregiver_user_id,
        status=CaregiverStatus.ACTIVE,
    )
    link_as_patient = _make_link(
        patient_id=caregiver_user_id,
        caregiver_email="alguem@x.com",
        caregiver_user_id=uuid4(),
        status=CaregiverStatus.ACTIVE,
    )
    repo._links = {link_as_caregiver.id: link_as_caregiver, link_as_patient.id: link_as_patient}

    result = _panel_service(repo).list_my_patients(caregiver_user_id)

    assert [view.link.id for view in result] == [link_as_caregiver.id]


def test_list_my_patients_resolves_patient_name_when_visible_and_none_when_not(
    caregiver_user_id: UUID,
) -> None:
    visible_patient_id = uuid4()
    hidden_patient_id = uuid4()
    repo = FakeCaregiverRepository(current_user_id=caregiver_user_id, current_user_email="c@x.com")
    visible_link = _make_link(
        patient_id=visible_patient_id,
        caregiver_email="c@x.com",
        caregiver_user_id=caregiver_user_id,
        status=CaregiverStatus.ACTIVE,
    )
    hidden_link = _make_link(
        patient_id=hidden_patient_id,
        caregiver_email="c@x.com",
        caregiver_user_id=caregiver_user_id,
        status=CaregiverStatus.ACTIVE,
    )
    repo._links = {visible_link.id: visible_link, hidden_link.id: hidden_link}
    # `hidden_patient_id` não está no repositório de usuários — simula o RLS
    # de `users_select_caregiver` bloqueando a leitura (as duas permissões
    # granulares desligadas para esse paciente).
    user_repo = FakeUserRepository(
        {visible_patient_id: _make_user(visible_patient_id, "Maria Silva")}
    )

    result = _panel_service(repo, user_repo).list_my_patients(caregiver_user_id)

    names_by_link_id = {view.link.id: view.patient_name for view in result}
    assert names_by_link_id[visible_link.id] == "Maria Silva"
    assert names_by_link_id[hidden_link.id] is None
