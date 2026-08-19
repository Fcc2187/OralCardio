from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_brushing_service
from app.api.headers import IdempotencyKey
from app.core.security import CurrentUser, get_current_user
from app.schemas.brushing import BrushingSessionOutput, BrushingSessionPatchInput
from app.schemas.common import Page
from app.services.brushing_service import BrushingService

router = APIRouter()


@router.post("/brushing-sessions", response_model=BrushingSessionOutput, status_code=201)
def start_brushing_session(
    idempotency_key: IdempotencyKey = None,
    current_user: CurrentUser = Depends(get_current_user),
    service: BrushingService = Depends(get_brushing_service),
) -> BrushingSessionOutput:
    return BrushingSessionOutput.from_record(
        service.start_session(current_user.id, idempotency_key)
    )


@router.patch(
    "/brushing-sessions/{session_id}",
    response_model=BrushingSessionOutput,
)
def update_brushing_session(
    session_id: UUID,
    payload: BrushingSessionPatchInput,
    current_user: CurrentUser = Depends(get_current_user),
    service: BrushingService = Depends(get_brushing_service),
) -> BrushingSessionOutput:
    if payload.complete:
        result = service.complete_session(session_id, current_user.id)
        return BrushingSessionOutput.from_record(result)

    # payload.zone é garantidamente não-nulo aqui: o validator do schema
    # exige exatamente um entre `zone` e `complete=true`.
    zone = payload.zone
    if zone is None:
        raise ValueError("Informe `zone` quando `complete` for false")
    session = service.mark_zone_completed(session_id, current_user.id, zone)
    return BrushingSessionOutput.from_record(session)


@router.get("/brushing-sessions", response_model=Page[BrushingSessionOutput])
def list_brushing_sessions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    service: BrushingService = Depends(get_brushing_service),
) -> Page[BrushingSessionOutput]:
    sessions = service.list_sessions(current_user.id, limit + 1, offset)
    items = [BrushingSessionOutput.from_record(session) for session in sessions]
    return Page.of(items, limit, offset)
