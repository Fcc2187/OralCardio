from uuid import UUID, uuid4

import pytest

from app.core.exceptions import BusinessRuleViolationError, ConflictError
from app.domain.enums import CaregiverStatus
from app.services.caregiver_service import CaregiverService
from tests.fakes.caregiver_repository import FakeCaregiverRepository


class _SpyEmailSender:
    def __init__(self) -> None:
        self.sent_to: list[str] = []

    def send_caregiver_invitation(self, *, to_email: str, patient_name: str) -> None:
        self.sent_to.append(to_email)


@pytest.fixture
def email_spy() -> _SpyEmailSender:
    return _SpyEmailSender()


@pytest.fixture
def caregiver_user_id() -> UUID:
    return uuid4()


@pytest.fixture
def caregiver_email() -> str:
    return "cuidador@example.com"


def _patient_service(
    email_spy: _SpyEmailSender, caregiver_user_id: UUID, caregiver_email: str
) -> CaregiverService:
    # O repositório fake também representa a identidade do "usuário atual"
    # das RPCs; para os testes do lado paciente, isso não é exercitado.
    repo = FakeCaregiverRepository(
        current_user_id=caregiver_user_id, current_user_email=caregiver_email
    )
    return CaregiverService(repo, email_spy)


def test_invite_caregiver_sends_notification(
    email_spy: _SpyEmailSender, user_id: UUID, caregiver_email: str, caregiver_user_id: UUID
) -> None:
    service = _patient_service(email_spy, caregiver_user_id, caregiver_email)

    caregiver = service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email=caregiver_email,
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )

    assert caregiver.status == CaregiverStatus.PENDING
    assert email_spy.sent_to == [caregiver_email]


def test_invite_caregiver_rejects_self_invite(
    email_spy: _SpyEmailSender, user_id: UUID, caregiver_user_id: UUID
) -> None:
    service = _patient_service(email_spy, caregiver_user_id, "maria@example.com")

    with pytest.raises(BusinessRuleViolationError):
        service.invite_caregiver(
            patient_id=user_id,
            patient_name="Maria Silva",
            patient_email="Maria@Example.com",
            caregiver_email="maria@example.com",
            can_view_reports=True,
            can_view_appointments=True,
            receive_alerts=True,
        )


def test_invite_caregiver_rejects_duplicate_invitation(
    email_spy: _SpyEmailSender, user_id: UUID, caregiver_email: str, caregiver_user_id: UUID
) -> None:
    service = _patient_service(email_spy, caregiver_user_id, caregiver_email)
    service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email=caregiver_email,
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )

    with pytest.raises(ConflictError):
        service.invite_caregiver(
            patient_id=user_id,
            patient_name="Maria Silva",
            patient_email="maria@example.com",
            caregiver_email=caregiver_email,
            can_view_reports=True,
            can_view_appointments=True,
            receive_alerts=True,
        )


def test_revoke_marks_link_as_revoked(
    email_spy: _SpyEmailSender, user_id: UUID, caregiver_email: str, caregiver_user_id: UUID
) -> None:
    service = _patient_service(email_spy, caregiver_user_id, caregiver_email)
    caregiver = service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email=caregiver_email,
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )

    revoked = service.revoke(caregiver.id, user_id)

    assert revoked.status == CaregiverStatus.REVOKED
    assert revoked.revoked_at is not None


def test_accept_invitation_fails_for_mismatched_email(
    email_spy: _SpyEmailSender, user_id: UUID, caregiver_user_id: UUID
) -> None:
    repo = FakeCaregiverRepository(
        current_user_id=caregiver_user_id, current_user_email="outro@example.com"
    )
    service = CaregiverService(repo, email_spy)
    caregiver = service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email="cuidador@example.com",
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )

    with pytest.raises(BusinessRuleViolationError):
        service.accept_invitation(caregiver.id)


def test_accept_invitation_succeeds_for_matching_email(
    email_spy: _SpyEmailSender, user_id: UUID, caregiver_email: str, caregiver_user_id: UUID
) -> None:
    repo = FakeCaregiverRepository(
        current_user_id=caregiver_user_id, current_user_email=caregiver_email
    )
    service = CaregiverService(repo, email_spy)
    caregiver = service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email=caregiver_email,
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )

    accepted = service.accept_invitation(caregiver.id)

    assert accepted.status == CaregiverStatus.ACTIVE
    assert accepted.caregiver_user_id == caregiver_user_id
