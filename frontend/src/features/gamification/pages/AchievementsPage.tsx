import { useQuery } from "@tanstack/react-query";

import { fetchAchievements, fetchUserStats } from "@/shared/api/gamificationApi";
import { gamificationAchievementsQueryKey, gamificationStatsQueryKey } from "@/shared/api/queryKeys";
import { Badge } from "@/shared/components/ui/Badge";
import { Card } from "@/shared/components/ui/Card";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";
import { cn } from "@/shared/utils/cn";

export function AchievementsPage() {
  const statsQuery = useQuery({
    queryKey: gamificationStatsQueryKey,
    queryFn: fetchUserStats,
    staleTime: 30_000,
  });
  const achievementsQuery = useQuery({
    queryKey: gamificationAchievementsQueryKey,
    queryFn: fetchAchievements,
    staleTime: 30_000,
  });

  if (statsQuery.isPending || achievementsQuery.isPending) {
    return <LoadingFeedback message="Carregando suas conquistas…" />;
  }

  if (statsQuery.isError || achievementsQuery.isError) {
    return (
      <Screen>
        <ErrorFeedback message="Não foi possível carregar suas conquistas. Tente novamente em instantes." />
      </Screen>
    );
  }

  const stats = statsQuery.data;
  const achievements = achievementsQuery.data;

  return (
    <Screen title="Conquistas" backTo="/" backLabel="Início">
      <Card variant="coral">
        <p className="font-body text-body-sm font-medium">{stats.level_name}</p>
        <p className="mt-xs text-display-sm">{stats.total_points} pontos</p>
        <p className="mt-xs font-body text-body-sm">
          {stats.current_streak_days} {stats.current_streak_days === 1 ? "dia" : "dias"} seguidos
          · recorde de {stats.longest_streak_days}
        </p>
      </Card>

      <div className="flex flex-col gap-md">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            variant="canvas"
            className={cn("flex items-center gap-md", !achievement.unlocked && "opacity-50")}
          >
            <span aria-hidden="true" className="text-display-sm">
              {achievement.icon}
            </span>
            <div className="flex flex-1 flex-col">
              <p className="font-display text-title-md">{achievement.name}</p>
              <p className="font-body text-body-sm text-muted">{achievement.description}</p>
            </div>
            <Badge variant={achievement.unlocked ? "coral" : "neutral"}>
              {achievement.unlocked ? "Desbloqueada" : `+${achievement.points_reward}`}
            </Badge>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
