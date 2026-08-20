from fastapi import APIRouter, Depends

from app.api.deps import get_push_revocation_service
from app.schemas.notification import PushRevocationInput, PushUnsubscribeOutput
from app.services.notification_service import PushRevocationService

router = APIRouter(prefix="/notifications")


@router.post("/revocations", response_model=PushUnsubscribeOutput)
def revoke_with_device_token(
    payload: PushRevocationInput,
    service: PushRevocationService = Depends(get_push_revocation_service),
) -> PushUnsubscribeOutput:
    """Endpoint sem JWT que aceita exclusivamente uma capability de revogação."""
    return PushUnsubscribeOutput(
        unsubscribed=service.revoke_with_token(payload.endpoint, payload.revocation_token)
    )
