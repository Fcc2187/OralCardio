import json

from pywebpush import WebPushException, webpush

from app.domain.enums import PushDeliveryOutcome
from app.repositories.records import ClaimedNotificationDeliveryRecord
from app.services.interfaces import PushSendResult

_TRANSIENT_STATUS_CODES = {408, 425, 429}
_REVOKED_STATUS_CODES = {404, 410}


class VapidWebPushGateway:
    def __init__(self, private_key: str, subject: str) -> None:
        self._private_key = private_key
        self._subject = subject

    def send(self, delivery: ClaimedNotificationDeliveryRecord) -> PushSendResult:
        try:
            webpush(
                subscription_info={
                    "endpoint": delivery.endpoint,
                    "keys": {"p256dh": delivery.p256dh, "auth": delivery.auth_secret},
                },
                data=json.dumps(delivery.payload, ensure_ascii=False),
                vapid_private_key=self._private_key,
                vapid_claims={"sub": self._subject},
                ttl=86400,
                timeout=10,
            )
            return PushSendResult(PushDeliveryOutcome.SENT)
        except WebPushException as exc:
            status_code = exc.response.status_code if exc.response is not None else None
            error_code = f"web_push_{status_code or 'network'}"
            if status_code in _REVOKED_STATUS_CODES:
                return PushSendResult(PushDeliveryOutcome.REVOKED, error_code)
            if status_code is None or status_code in _TRANSIENT_STATUS_CODES or status_code >= 500:
                return PushSendResult(PushDeliveryOutcome.RETRY, error_code)
            return PushSendResult(PushDeliveryOutcome.DEAD, error_code)
        except (OSError, TimeoutError):
            return PushSendResult(PushDeliveryOutcome.RETRY, "web_push_network")

