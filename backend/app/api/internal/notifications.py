import secrets

from fastapi import APIRouter, Depends, Header

from app.api.deps import get_notification_dispatch_service
from app.core.config import get_settings
from app.core.exceptions import AuthenticationError, ServiceUnavailableError
from app.schemas.notification import NotificationDispatchOutput
from app.services.notification_service import NotificationDispatchService

router = APIRouter(prefix="/internal/v1/notifications", include_in_schema=False)


def require_notification_dispatch_token(
    token: str | None = Header(default=None, alias="X-Notification-Dispatch-Token"),
) -> None:
    expected = get_settings().notification_dispatch_token
    if not expected:
        raise ServiceUnavailableError("Dispatcher de notificações não configurado")
    if token is None or not secrets.compare_digest(token, expected):
        raise AuthenticationError("Credencial do dispatcher inválida")


@router.post("/dispatch", response_model=NotificationDispatchOutput)
def dispatch_notifications(
    _: None = Depends(require_notification_dispatch_token),
    service: NotificationDispatchService = Depends(get_notification_dispatch_service),
) -> NotificationDispatchOutput:
    return NotificationDispatchOutput.from_summary(service.dispatch_once())

