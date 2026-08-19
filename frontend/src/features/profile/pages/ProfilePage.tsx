import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/shared/auth/authContext";
import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { TextField } from "@/shared/components/ui/TextField";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { Screen } from "@/shared/components/layout/Screen";

import { userProfileQueryKey } from "@/shared/api/queryKeys";
import { useNotifications } from "@/features/notifications/notificationContext";

import { fetchUserProfile, updateUserProfile, type UserProfile } from "../api/userApi";

export function ProfilePage() {
  const query = useQuery({
    queryKey: userProfileQueryKey,
    queryFn: fetchUserProfile,
    staleTime: 30_000,
  });

  if (query.isPending) {
    return <LoadingFeedback message="Carregando seu perfil…" />;
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorFeedback message="Não foi possível carregar seu perfil. Tente novamente em instantes." />
      </Screen>
    );
  }

  return <ProfileForm profile={query.data} />;
}

function ProfileForm({ profile }: { profile: UserProfile }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [justSaved, setJustSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(userProfileQueryKey, updated);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJustSaved(false);
    mutation.mutate({ full_name: fullName, phone: phone || null });
  }

  async function handleSignOut() {
    await notifications.disable().catch(() => undefined);
    await signOut();
    navigate("/entrar", { replace: true });
  }

  return (
    <Screen title="Seu perfil">
      <form onSubmit={handleSubmit} className="flex flex-col gap-lg" noValidate>
        <TextField
          label="Nome completo"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <TextField label="E-mail" value={user?.email ?? ""} disabled />
        <TextField
          label="Telefone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />

        {mutation.isError ? (
          <ErrorFeedback message="Não foi possível salvar. Tente novamente." />
        ) : null}
        {justSaved ? (
          <p role="status" className="font-body text-body-sm text-success">
            Perfil atualizado.
          </p>
        ) : null}

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </form>

      <LinkButton to="/perfil/notificacoes" variant="secondary">
        Configurar notificações
      </LinkButton>
      <Button variant="secondary" onClick={handleSignOut}>
        Sair
      </Button>
    </Screen>
  );
}
