import logging
from typing import Protocol

logger = logging.getLogger(__name__)


class EmailSender(Protocol):
    """Contrato para envio de e-mail transacional.

    Isolado atrás de uma interface para que a regra de negócio do convite de
    cuidador (CaregiverService) não dependa de qual provedor está por trás —
    trocar a implementação por um provedor real (Resend, SendGrid, SMTP...)
    não exige tocar em nenhum service.
    """

    def send_caregiver_invitation(self, *, to_email: str, patient_name: str) -> None: ...


class LoggingEmailSender:
    """Implementação padrão: registra a intenção de envio em log estruturado.

    Nunca inclui dado clínico — apenas o e-mail do destinatário e o nome do
    paciente, o mínimo necessário para operar o convite manualmente enquanto
    nenhum provedor de e-mail real está configurado.
    """

    def send_caregiver_invitation(self, *, to_email: str, patient_name: str) -> None:
        logger.info(
            "Convite de cuidador pendente de envio: destinatário=%s paciente=%s",
            to_email,
            patient_name,
        )
