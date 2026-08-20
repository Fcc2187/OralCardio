import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationPreferencesQueryKey } from "@/shared/api/queryKeys";
import { Screen } from "@/shared/components/layout/Screen";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Checkbox } from "@/shared/components/ui/Checkbox";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { TextField } from "@/shared/components/ui/TextField";

import {
  fetchNotificationPreferences,
  requestTestNotification,
  updateNotificationPreferences,
} from "../api/notificationApi";
import { useNotifications } from "../notificationContext";
import type { NotificationPreferences, PushPermissionState } from "../types";
import { validateNotificationPreferences } from "../validateNotificationPreferences";

const APPOINTMENT_LEADS = [
  { value: 120, label: "2 horas antes" },
  { value: 1440, label: "24 horas antes" },
  { value: 2880, label: "2 dias antes" },
  { value: 10080, label: "7 dias antes" },
] as const;

function shortTime(value: string): string {
  return value.slice(0, 5);
}

function permissionDescription(
  permission: PushPermissionState,
  hasSubscription: boolean,
): string {
  if (permission === "unsupported") {
    return "Este navegador ou endereço não oferece notificações Web Push.";
  }
  if (permission === "install-required") {
    return "No iPhone ou iPad, abra o menu Compartilhar, escolha “Adicionar à Tela de Início” e abra o OralCardio pelo novo ícone.";
  }
  if (permission === "denied") {
    return "As notificações estão bloqueadas nas configurações do navegador ou do sistema.";
  }
  if (permission === "granted" && hasSubscription) {
    return "Este dispositivo está pronto para receber notificações.";
  }
  return "Ative este dispositivo para receber seus lembretes mesmo com o aplicativo fechado.";
}

export function NotificationSettingsPage() {
  const query = useQuery({
    queryKey: notificationPreferencesQueryKey,
    queryFn: fetchNotificationPreferences,
  });

  if (query.isPending) return <LoadingFeedback message="Carregando notificações…" />;
  if (query.isError) {
    return (
      <Screen backTo="/perfil">
        <ErrorFeedback message="Não foi possível carregar suas preferências." />
      </Screen>
    );
  }
  return <NotificationSettingsForm initialValue={query.data} />;
}

function NotificationSettingsForm({ initialValue }: { initialValue: NotificationPreferences }) {
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const [testQueued, setTestQueued] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => setValue(initialValue), [initialValue]);

  const saveMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (updated) => {
      queryClient.setQueryData(notificationPreferencesQueryKey, updated);
      setValue(updated);
      setSaved(true);
    },
  });
  const testMutation = useMutation({
    mutationFn: requestTestNotification,
    onSuccess: () => setTestQueued(true),
  });

  function update<K extends keyof NotificationPreferences>(
    key: K,
    nextValue: NotificationPreferences[K],
  ) {
    setSaved(false);
    setValidationError(null);
    setValue((current) => ({ ...current, [key]: nextValue }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateNotificationPreferences(value);
    if (error) {
      setValidationError(error);
      return;
    }
    saveMutation.mutate(value);
  }

  function toggleLead(lead: number, checked: boolean) {
    if (checked && !value.appointment_lead_minutes.includes(lead) && value.appointment_lead_minutes.length >= 3) {
      setValidationError("Escolha no máximo três antecedências de consulta.");
      return;
    }
    if (!checked && value.appointment_lead_minutes.length === 1) {
      setValidationError("Escolha pelo menos uma antecedência de consulta.");
      return;
    }
    const next = checked
      ? [...value.appointment_lead_minutes, lead]
      : value.appointment_lead_minutes.filter((item) => item !== lead);
    update("appointment_lead_minutes", [...new Set(next)].sort((a, b) => b - a));
  }

  return (
    <Screen title="Notificações" backTo="/perfil">
      <Card variant="canvas">
        <h2 className="text-title-md">Este dispositivo</h2>
        <p className="mt-xs font-body text-body-sm text-muted">
          {notifications.error && notifications.hasSubscription
            ? "A inscrição local existe, mas a sincronização precisa ser concluída."
            : permissionDescription(notifications.permission, notifications.hasSubscription)}
        </p>
        {notifications.error ? (
          <p role="alert" className="mt-sm font-body text-body-sm text-error">
            {notifications.error}
          </p>
        ) : null}
        {notifications.permission !== "unsupported" &&
        notifications.permission !== "install-required" &&
        notifications.permission !== "denied" ? (
          <Button
            className="mt-md"
            variant={
              notifications.hasSubscription && !notifications.error ? "secondary" : "primary"
            }
            disabled={notifications.isBusy}
            onClick={() =>
              void (notifications.hasSubscription && !notifications.error
                ? notifications.disable()
                : notifications.enable()
              ).catch(() => undefined)
            }
          >
            {notifications.isBusy
              ? "Atualizando…"
              : notifications.hasSubscription && !notifications.error
                ? "Desativar neste dispositivo"
                : notifications.hasSubscription
                  ? "Tentar sincronizar novamente"
                  : "Ativar neste dispositivo"}
          </Button>
        ) : null}

        {notifications.hasSubscription ? (
          <Button
            className="mt-sm"
            variant="secondary"
            disabled={testMutation.isPending}
            onClick={() => {
              setTestQueued(false);
              testMutation.mutate();
            }}
          >
            {testMutation.isPending ? "Enfileirando…" : "Enviar notificação de teste"}
          </Button>
        ) : null}
        {testQueued ? (
          <p role="status" className="mt-sm font-body text-body-sm text-success">
            Teste enfileirado. A entrega pode levar até um minuto.
          </p>
        ) : null}
        {testMutation.isError ? (
          <ErrorFeedback message="Não foi possível enfileirar a notificação de teste." />
        ) : null}
      </Card>

      <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
        <Card variant="cream">
          <Checkbox
            label="Usar lembretes"
            checked={value.enabled}
            onChange={(event) => update("enabled", event.target.checked)}
          />
          <p className="mt-xs font-body text-body-sm text-muted">
            Os lembretes ficam desativados até você autorizar explicitamente.
          </p>
        </Card>

        <Card variant="canvas">
          <Checkbox
            label="Lembrar de escovar"
            checked={value.brushing_enabled}
            disabled={!value.enabled}
            onChange={(event) => update("brushing_enabled", event.target.checked)}
          />
          <div className="mt-md flex flex-col gap-sm">
            {value.brushing_times.map((reminderTime, index) => (
              <div key={`${index}-${reminderTime}`} className="flex items-end gap-sm">
                <TextField
                  label={`Horário ${index + 1}`}
                  type="time"
                  value={shortTime(reminderTime)}
                  disabled={!value.enabled || !value.brushing_enabled}
                  onChange={(event) => {
                    const next = [...value.brushing_times];
                    next[index] = event.target.value;
                    update("brushing_times", next);
                  }}
                />
                {value.brushing_times.length > 1 ? (
                  <Button
                    type="button"
                    fullWidth={false}
                    variant="secondary"
                    disabled={!value.enabled || !value.brushing_enabled}
                    onClick={() =>
                      update(
                        "brushing_times",
                        value.brushing_times.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
          {value.brushing_times.length < 5 ? (
            <Button
              type="button"
              className="mt-sm"
              variant="secondary"
              disabled={!value.enabled || !value.brushing_enabled}
              onClick={() => update("brushing_times", [...value.brushing_times, "12:00"])}
            >
              Adicionar horário
            </Button>
          ) : null}
        </Card>

        <Card variant="canvas">
          <Checkbox
            label="Lembrar do fio dental"
            checked={value.flossing_enabled}
            disabled={!value.enabled}
            onChange={(event) => update("flossing_enabled", event.target.checked)}
          />
          <div className="mt-md">
            <TextField
              label="Horário"
              type="time"
              value={shortTime(value.flossing_time)}
              disabled={!value.enabled || !value.flossing_enabled}
              onChange={(event) => update("flossing_time", event.target.value)}
            />
          </div>
        </Card>

        <Card variant="canvas">
          <Checkbox
            label="Lembrar das consultas"
            checked={value.appointments_enabled}
            disabled={!value.enabled}
            onChange={(event) => update("appointments_enabled", event.target.checked)}
          />
          <fieldset className="mt-md flex flex-col gap-xs" disabled={!value.enabled || !value.appointments_enabled}>
            <legend className="font-body text-body-sm font-medium">Avisar com antecedência</legend>
            {APPOINTMENT_LEADS.map(({ value: lead, label }) => (
              <Checkbox
                key={lead}
                label={label}
                checked={value.appointment_lead_minutes.includes(lead)}
                disabled={
                  !value.enabled ||
                  !value.appointments_enabled ||
                  (!value.appointment_lead_minutes.includes(lead) &&
                    value.appointment_lead_minutes.length >= 3) ||
                  (value.appointment_lead_minutes.includes(lead) &&
                    value.appointment_lead_minutes.length === 1)
                }
                onChange={(event) => toggleLead(lead, event.target.checked)}
              />
            ))}
          </fieldset>
        </Card>

        <Card variant="canvas">
          <h2 className="text-title-md">Horário silencioso</h2>
          <p className="mt-xs font-body text-body-sm text-muted">
            Lembretes de hábitos devem ficar fora deste período. Todos os horários seguem Brasília (São Paulo).
          </p>
          <div className="mt-md grid grid-cols-2 gap-sm">
            <TextField
              label="Início"
              type="time"
              value={shortTime(value.quiet_hours_start)}
              onChange={(event) => update("quiet_hours_start", event.target.value)}
            />
            <TextField
              label="Fim"
              type="time"
              value={shortTime(value.quiet_hours_end)}
              onChange={(event) => update("quiet_hours_end", event.target.value)}
            />
          </div>
        </Card>

        {validationError ? <ErrorFeedback message={validationError} /> : null}
        {saveMutation.isError ? (
          <ErrorFeedback
            message={
              saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Não foi possível salvar as preferências."
            }
          />
        ) : null}
        {saved ? (
          <p role="status" className="font-body text-body-sm text-success">
            Preferências de notificação atualizadas.
          </p>
        ) : null}
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Salvando…" : "Salvar lembretes"}
        </Button>
      </form>
    </Screen>
  );
}
