import { Card } from "@/shared/components/ui/Card";
import type { UserStats } from "@/shared/types/gamification";

interface PatientStatsPanelProps {
  stats: UserStats;
}

// Reusa `UserStats` de shared/types/gamification.ts: `UserStatsOutput` do
// painel do cuidador não tem `user_id` (só o próprio paciente lê isso do
// seu dashboard), então o formato bate exato — nenhum tipo novo necessário.
export function PatientStatsPanel({ stats }: PatientStatsPanelProps) {
  return (
    <Card variant="canvas">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-body-sm text-muted">Nível</p>
          <p className="font-display text-title-lg">{stats.level_name}</p>
        </div>
        <p className="font-body text-body-sm text-muted">{stats.total_points} pontos</p>
      </div>
      <div className="mt-md grid grid-cols-2 gap-sm">
        <StatItem label="Sequência atual" value={`${stats.current_streak_days} dias`} />
        <StatItem label="Maior sequência" value={`${stats.longest_streak_days} dias`} />
        <StatItem label="Escovações registradas" value={String(stats.total_brushings)} />
        <StatItem label="Uso de fio dental" value={String(stats.total_flossings)} />
      </div>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-body text-caption text-muted">{label}</p>
      <p className="font-body text-body-md text-body-strong">{value}</p>
    </div>
  );
}
