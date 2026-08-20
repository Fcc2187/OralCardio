from fastapi import APIRouter, Depends

from app.api.deps import get_notification_service
from app.core.security import CurrentUser, get_current_user
from app.schemas.notification import (
    NotificationPreferencesInput,
    NotificationPreferencesOutput,
    PushSubscriptionInput,
    PushSubscriptionOutput,
    PushUnsubscribeInput,
    PushUnsubscribeOutput,
    TestNotificationOutput,
    VapidPublicKeyOutput,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications")


@router.get("/preferences", response_model=NotificationPreferencesOutput)
def get_preferences(
    current_user: CurrentUser = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
) -> NotificationPreferencesOutput:
    return NotificationPreferencesOutput.from_record(
        service.get_preferences(current_user.id)
    )


@router.put("/preferences", response_model=NotificationPreferencesOutput)
def update_preferences(
    payload: NotificationPreferencesInput,
    current_user: CurrentUser = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
) -> NotificationPreferencesOutput:
    return NotificationPreferencesOutput.from_record(
        service.update_preferences(current_user.id, payload.to_domain())
    )


@router.get("/vapid-public-key", response_model=VapidPublicKeyOutput)
def get_vapid_public_key(
    _: CurrentUser = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
) -> VapidPublicKeyOutput:
    public_key, version = service.get_vapid_public_key()
    return VapidPublicKeyOutput(public_key=public_key, key_version=version)


@router.post("/subscriptions", response_model=PushSubscriptionOutput, status_code=201)
def subscribe(
    payload: PushSubscriptionInput,
    _: CurrentUser = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
) -> PushSubscriptionOutput:
    record = service.subscribe(
        endpoint=payload.endpoint,
        p256dh=payload.keys.p256dh,
        auth_secret=payload.keys.auth,
        expiration_time=payload.expiration_time,
        device_label=payload.device_label,
        revocation_token=payload.revocation_token,
    )
    return PushSubscriptionOutput.from_record(record)


@router.delete("/subscriptions/current", response_model=PushUnsubscribeOutput)
def unsubscribe(
    payload: PushUnsubscribeInput,
    _: CurrentUser = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
) -> PushUnsubscribeOutput:
    return PushUnsubscribeOutput(unsubscribed=service.unsubscribe(payload.endpoint))


@router.post("/test", response_model=TestNotificationOutput, status_code=202)
def request_test_notification(
    _: CurrentUser = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
) -> TestNotificationOutput:
    return TestNotificationOutput(job_id=service.request_test_notification())
