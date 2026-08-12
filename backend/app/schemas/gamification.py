from datetime import date, datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.enums import AchievementConditionType
from app.repositories.records import AchievementRecord, UserStatsRecord
from app.services.gamification_service import AchievementStatus

ResultT = TypeVar("ResultT")


class UserStatsOutput(BaseModel):
    total_points: int
    level: int
    level_name: str
    current_streak_days: int
    longest_streak_days: int
    total_brushings: int
    total_flossings: int
    last_brushing_date: date | None
    last_flossing_date: date | None

    @classmethod
    def from_record(cls, record: UserStatsRecord) -> "UserStatsOutput":
        return cls(
            total_points=record.total_points,
            level=record.level,
            level_name=record.level_name,
            current_streak_days=record.current_streak_days,
            longest_streak_days=record.longest_streak_days,
            total_brushings=record.total_brushings,
            total_flossings=record.total_flossings,
            last_brushing_date=record.last_brushing_date,
            last_flossing_date=record.last_flossing_date,
        )


class AchievementOutput(BaseModel):
    id: UUID
    name: str
    description: str
    icon: str
    condition_type: AchievementConditionType
    condition_value: int
    points_reward: int
    unlocked: bool
    earned_at: datetime | None

    @classmethod
    def from_status(cls, status: AchievementStatus) -> "AchievementOutput":
        achievement = status.achievement
        return cls(
            id=achievement.id,
            name=achievement.name,
            description=achievement.description,
            icon=achievement.icon,
            condition_type=achievement.condition_type,
            condition_value=achievement.condition_value,
            points_reward=achievement.points_reward,
            unlocked=status.unlocked,
            earned_at=status.earned_at,
        )


class UnlockedAchievementOutput(BaseModel):
    """Representa uma conquista no instante em que acabou de ser desbloqueada.

    Deliberadamente mais enxuto que `AchievementOutput`: uma notificação de
    "você acabou de ganhar isso" não precisa da condição de desbloqueio nem
    de um `earned_at` (o próprio fato de estar nesta lista já significa
    "agora").
    """

    id: UUID
    name: str
    description: str
    icon: str
    points_reward: int

    @classmethod
    def from_record(cls, record: AchievementRecord) -> "UnlockedAchievementOutput":
        return cls(
            id=record.id,
            name=record.name,
            description=record.description,
            icon=record.icon,
            points_reward=record.points_reward,
        )


def unlocked_achievements_output(
    records: list[AchievementRecord],
) -> list[UnlockedAchievementOutput]:
    return [UnlockedAchievementOutput.from_record(record) for record in records]


class WithUnlockedAchievements(BaseModel, Generic[ResultT]):
    """Envelope de resposta para mutações que podem desbloquear conquistas
    como efeito colateral (completar escovação, registrar fio dental,
    concluir módulo, completar perfil de saúde, agendar consulta).

    Mantém o recurso principal (`data`) livre dessa preocupação transversal
    — nenhum schema de domínio (BrushingSessionOutput, AppointmentOutput...)
    precisa saber que conquistas existem. O cliente lê `unlocked_achievements`
    para anunciar a conquista na hora, sem precisar comparar o catálogo antes
    e depois da chamada.
    """

    data: ResultT
    unlocked_achievements: list[UnlockedAchievementOutput] = Field(default_factory=list)
