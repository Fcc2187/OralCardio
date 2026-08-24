from fastapi import APIRouter, Depends

from app.api.deps import get_push_revocation_repository
from app.repositories.interfaces import NotificationRevocationRepository
from app.schemas.notification import PushRevocationInput, PushUnsubscribeOutput

router = APIRouter(prefix="/notifications")


@router.post("/revocations", response_model=PushUnsubscribeOutput)
def revoke_with_device_token(
    payload: PushRevocationInput,
    repository: NotificationRevocationRepository = Depends(get_push_revocation_repository),
) -> PushUnsubscribeOutput:
    """Endpoint sem JWT que aceita exclusivamente uma capability de revogação."""
    return PushUnsubscribeOutput(
        unsubscribed=repository.revoke_with_token(payload.endpoint, payload.revocation_token)
    )
