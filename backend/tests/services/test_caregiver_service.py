from dataclasses import replace
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


def test_invite_caregiver_allows_self_invite_guard_bypass_when_patient_email_is_none(
    email_spy: _SpyEmailSender, user_id: UUID, caregiver_email: str, caregiver_user_id: UUID
) -> None:
    # `CurrentUser.email` é `str | None`; o guard é `if patient_email and ...`.
    # Um JWT sem e-mail (improvável via Supabase Auth, mas não impossível)
    # não pode travar o convite com um erro de comparação — só não roda o
    # guard, que é o comportamento correto aqui.
    service = _patient_service(email_spy, caregiver_user_id, caregiver_email)

    caregiver = service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email=None,
        caregiver_email=caregiver_email,
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )

    assert caregiver.status == CaregiverStatus.PENDING


def test_invite_caregiver_normalizes_email_case_and_whitespace(
    email_spy: _SpyEmailSender, user_id: UUID, caregiver_user_id: UUID
) -> None:
    service = _patient_service(email_spy, caregiver_user_id, "joao@x.com")

    caregiver = service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email="  JOAO@X.com ",
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )

    assert caregiver.caregiver_email == "joao@x.com"
    assert email_spy.sent_to == ["joao@x.com"]

    with pytest.raises(ConflictError):
        service.invite_caregiver(
            patient_id=user_id,
            patient_name="Maria Silva",
            patient_email="maria@example.com",
            caregiver_email="joao@X.COM",
            can_view_reports=True,
            can_view_appointments=True,
            receive_alerts=True,
        )
    assert len(service.list_my_caregivers(user_id)) == 1


def test_reinviting_a_revoked_caregiver_reactivates_the_same_link(
    email_spy: _SpyEmailSender, user_id: UUID, caregiver_email: str, caregiver_user_id: UUID
) -> None:
    service = _patient_service(email_spy, caregiver_user_id, caregiver_email)
    original = service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email=caregiver_email,
        can_view_reports=True,
        can_view_appointments=True,
        receive_alerts=True,
    )
    service.revoke(original.id, user_id)

    reinvited = service.invite_caregiver(
        patient_id=user_id,
        patient_name="Maria Silva",
        patient_email="maria@example.com",
        caregiver_email=caregiver_email,
        can_view_reports=False,
        can_view_appointments=True,
        receive_alerts=False,
    )

    assert reinvited.id == original.id
    assert reinvited.status == CaregiverStatus.PENDING
    assert reinvited.caregiver_user_id is None
    assert reinvited.accepted_at is None
    assert reinvited.revoked_at is None
    assert reinvited.invited_at >= original.invited_at
    assert reinvited.can_view_reports is False
    assert reinvited.can_view_appointments is True
    assert reinvited.receive_alerts is False


def test_reinviting_a_pending_caregiver_still_conflicts(
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


def test_reinviting_an_active_caregiver_still_conflicts(
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
    # Simula a ativação (hoje um ato do lado cuidador, via
    # `CaregiverPanelService.accept_invitation`) mexendo direto no fake —
    # este teste só quer um vínculo `active` para provar que reconvite não
    # se aplica a esse estado.
    service._repository._links[caregiver.id] = replace(caregiver, status=CaregiverStatus.ACTIVE)

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
