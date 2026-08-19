/**
 * Coordena o encerramento de sessão sem acoplar o transporte HTTP ao Supabase
 * ou a features concretas. Providers podem registrar limpezas obrigatórias
 * (por exemplo, revogar a inscrição Push) antes de a sessão desaparecer.
 */
type BeforeSignOut = () => Promise<void> | void;

let signOutHandler: (() => Promise<void>) | null = null;
const beforeSignOutHandlers = new Set<BeforeSignOut>();

export function configureSessionSignOut(handler: (() => Promise<void>) | null): void {
  signOutHandler = handler;
}

export function registerBeforeSignOut(handler: BeforeSignOut): () => void {
  beforeSignOutHandlers.add(handler);
  return () => beforeSignOutHandlers.delete(handler);
}

export async function runBeforeSignOutHandlers(): Promise<void> {
  // Um cleanup não pode impedir o logout. Cada handler é responsável por
  // deixar o recurso em seu estado local mais seguro mesmo se a rede falhar.
  await Promise.allSettled([...beforeSignOutHandlers].map((handler) => handler()));
}

export async function requestSessionSignOut(): Promise<void> {
  if (signOutHandler) await signOutHandler();
}
