from uuid import UUID

from app.domain.enums import CardiacCondition
from app.repositories.interfaces import HealthProfileRepository
from app.repositories.records import HealthProfileRecord
from app.services.interfaces import PostMutationAchievementEvaluator


class HealthProfileService:
    def __init__(
        self,
        repository: HealthProfileRepository,
        gamification_service: PostMutationAchievementEvaluator,
    ) -> None:
        self._repository = repository
        self._gamification_service = gamification_service

    def get_profile(self, user_id: UUID) -> HealthProfileRecord | None:
        return self._repository.get_by_user_id(user_id)

    def submit_questionnaire(
        self,
        user_id: UUID,
        cardiac_condition: CardiacCondition,
        cardiac_condition_detail: str | None,
        has_pacemaker: bool,
        has_prosthetic_valve: bool,
        medications: list[str],
        allergies: list[str],
        last_dental_visit: str | None,
        brushing_frequency_before: int | None,
        dentist_name: str | None,
        dentist_phone: str | None,
        cardiologist_name: str | None,
    ) -> HealthProfileRecord:
        # is_completed é derivado no servidor: se os campos obrigatórios do
        # questionário chegaram até aqui, é porque já passaram pela validação
        # do schema de entrada — o cliente nunca decide esse valor.
        values = {
            "cardiac_condition": cardiac_condition.value,
            "cardiac_condition_detail": cardiac_condition_detail,
            "has_pacemaker": has_pacemaker,
            "has_prosthetic_valve": has_prosthetic_valve,
            "medications": medications,
            "allergies": allergies,
            "last_dental_visit": last_dental_visit,
            "brushing_frequency_before": brushing_frequency_before,
            "dentist_name": dentist_name,
            "dentist_phone": dentist_phone,
            "cardiologist_name": cardiologist_name,
            "is_completed": True,
        }

        profile = self._repository.upsert(user_id, values)
        self._gamification_service.evaluate_after_mutation(user_id)
        return profile
