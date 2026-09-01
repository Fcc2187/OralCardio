# Password Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar solicitação e conclusão de recuperação de senha pelo fluxo nativo do Supabase Auth.

**Architecture:** O React mantém o `AuthContext` como fachada única do Supabase Auth. Duas páginas públicas coordenam solicitação e atualização, reutilizando a política de senha existente; FastAPI e PostgreSQL permanecem inalterados.

**Tech Stack:** React 18, TypeScript 5.7, React Router 7, Supabase JS 2, Vitest, Testing Library e Playwright.

**Spec:** `docs/superpowers/specs/2026-09-01-password-recovery-design.md`

## Global Constraints

- Usar `gpt-5.6-sol` com reasoning `high`.
- Não adicionar dependências.
- Não criar endpoints FastAPI nem migrations.
- Usar `${window.location.origin}/redefinir-senha` como redirect.
- Produção usa `https://oral-cardio.vercel.app/redefinir-senha` na allowlist do Supabase.
- Respostas de solicitação não podem revelar se o e-mail existe.
- Senhas, tokens e URLs de recuperação não podem aparecer em logs.
- CAPTCHA não faz parte desta entrega.
- Por instrução do usuário, não criar commits intermediários; criar um único commit somente após toda a verificação final passar.

---

### Task 1: Compartilhar validação de e-mail e nova senha

**Files:**
- Modify: `frontend/src/features/auth/authValidation.ts`
- Modify: `frontend/src/features/auth/authValidation.test.ts`

**Interfaces:**
- Produces: `PasswordResetRequestFieldErrors`, `NewPasswordFieldErrors`, `validatePasswordResetRequestFields({ email })` e `validateNewPasswordFields({ password, confirmPassword })`.
- Preserves: `validateSignInFields()` e `validateSignUpFields()` com as mensagens atuais.

- [ ] **Step 1: Escrever testes que falham para os novos contratos**

Adicionar aos imports e ao `describe` existente:

```ts
import {
  validateNewPasswordFields,
  validatePasswordResetRequestFields,
  validateSignInFields,
  validateSignUpFields,
} from "./authValidation";

it("validates a password reset e-mail", () => {
  expect(validatePasswordResetRequestFields({ email: "invalido" })).toEqual({
    email: "Informe um e-mail válido.",
  });
  expect(validatePasswordResetRequestFields({ email: " paciente@oralcardio.com " })).toEqual({});
});

it("applies the sign-up password policy to password recovery", () => {
  expect(validateNewPasswordFields({ password: "fraca", confirmPassword: "outra" })).toEqual({
    password: "A senha precisa ter pelo menos 8 caracteres.",
    confirmPassword: "As senhas não coincidem.",
  });
  expect(validateNewPasswordFields({
    password: "MinhaSenha!2026",
    confirmPassword: "MinhaSenha!2026",
  })).toEqual({});
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha esperada**

Run: `npm.cmd test -- src/features/auth/authValidation.test.ts`

Expected: FAIL porque as duas funções ainda não são exportadas.

- [ ] **Step 3: Extrair helpers privados e implementar os novos validadores**

Manter `EMAIL_PATTERN` e `COMMON_PASSWORDS`; extrair a política atual:

```ts
function validateEmail(email: string): string | undefined {
  return EMAIL_PATTERN.test(email.trim()) ? undefined : "Informe um e-mail válido.";
}

function validatePassword(password: string): string | undefined {
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "Esta senha é muito comum. Escolha outra senha.";
  }
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Inclua pelo menos uma letra maiúscula.";
  if (!LOWERCASE_LETTER_PATTERN.test(password)) return "Inclua pelo menos uma letra minúscula.";
  if (!DIGIT_PATTERN.test(password)) return "Inclua pelo menos um número.";
  if (!SPECIAL_CHARACTER_PATTERN.test(password)) return "Inclua pelo menos um caractere especial.";
  return undefined;
}

export interface PasswordResetRequestFieldValues { email: string }
export interface NewPasswordFieldValues { password: string; confirmPassword: string }
export type PasswordResetRequestFieldErrors = Partial<Record<"email", string>>;
export type NewPasswordFieldErrors = Partial<Record<keyof NewPasswordFieldValues, string>>;

export function validatePasswordResetRequestFields(
  { email }: PasswordResetRequestFieldValues,
): PasswordResetRequestFieldErrors {
  const error = validateEmail(email);
  return error ? { email: error } : {};
}

export function validateNewPasswordFields(
  { password, confirmPassword }: NewPasswordFieldValues,
): NewPasswordFieldErrors {
  const errors: NewPasswordFieldErrors = {};
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (password !== confirmPassword) errors.confirmPassword = "As senhas não coincidem.";
  return errors;
}
```

Alterar os validadores existentes para chamarem `validateEmail()` e `validatePassword()` sem mudar suas respostas.

- [ ] **Step 4: Executar a suíte de validação**

Run: `npm.cmd test -- src/features/auth/authValidation.test.ts`

Expected: PASS em todos os casos antigos e novos.

---

### Task 2: Expor recuperação no AuthContext

**Files:**
- Modify: `frontend/src/shared/auth/authContext.ts`
- Modify: `frontend/src/shared/auth/AuthProvider.tsx`
- Create: `frontend/src/shared/auth/AuthProvider.test.tsx`

**Interfaces:**
- Produces: `requestPasswordReset(email: string): Promise<void>`.
- Produces: `updatePassword(password: string): Promise<void>`.
- Consumes: `supabaseClient.auth.resetPasswordForEmail()` e `supabaseClient.auth.updateUser()`.

- [ ] **Step 1: Escrever testes do provider que falham**

Mockar `@/lib/supabaseClient`, renderizar `AuthProvider` dentro de um
`QueryClientProvider` e usar um consumidor do contexto. Verificar:

```ts
expect(resetPasswordForEmailMock).toHaveBeenCalledWith("ana@example.com", {
  redirectTo: `${window.location.origin}/redefinir-senha`,
});
expect(updateUserMock).toHaveBeenCalledWith({ password: "MinhaSenha!2026" });
```

Os mocks de bootstrap retornam sessão nula e uma subscription descartável:

```ts
getSessionMock.mockResolvedValue({ data: { session: null } });
onAuthStateChangeMock.mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});
resetPasswordForEmailMock.mockResolvedValue({ error: null });
updateUserMock.mockResolvedValue({ error: null });
```

- [ ] **Step 2: Executar o teste e confirmar a falha esperada**

Run: `npm.cmd test -- src/shared/auth/AuthProvider.test.tsx`

Expected: FAIL porque o contexto ainda não oferece os novos métodos.

- [ ] **Step 3: Adicionar os métodos ao contrato e provider**

Em `AuthContextValue`:

```ts
requestPasswordReset: (email: string) => Promise<void>;
updatePassword: (password: string) => Promise<void>;
```

Em `AuthProvider`:

```ts
async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  });
  if (error) throw error;
}

async function updatePassword(password: string): Promise<void> {
  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) throw error;
}
```

Adicionar ambos ao objeto `value`.

- [ ] **Step 4: Executar o teste do provider**

Run: `npm.cmd test -- src/shared/auth/AuthProvider.test.tsx`

Expected: PASS, incluindo propagação de erro do Supabase.

---

### Task 3: Implementar solicitação e link de recuperação

**Files:**
- Create: `frontend/src/features/auth/pages/ForgotPasswordPage.tsx`
- Create: `frontend/src/features/auth/pages/ForgotPasswordPage.test.tsx`
- Modify: `frontend/src/features/auth/pages/SignInPage.tsx`
- Modify: `frontend/src/features/auth/pages/SignInPage.test.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `requestPasswordReset(email)` e `validatePasswordResetRequestFields()`.
- Produces: rota `/esqueci-senha` e link acessível a partir de `/entrar`.

- [ ] **Step 1: Escrever testes de página que falham**

Os testes devem verificar:

```ts
expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
expect(requestPasswordReset).toHaveBeenCalledWith("ana@example.com");
expect(screen.getByText(
  "Se existir uma conta para este e-mail, enviaremos as instruções de recuperação.",
)).toBeInTheDocument();
expect(screen.getByRole("link", { name: "Esqueceu sua senha?" })).toHaveAttribute(
  "href",
  "/esqueci-senha",
);
```

Também verificar que erro do provider passa por `translateAuthError` e que o
botão fica desabilitado durante uma Promise pendente.

- [ ] **Step 2: Executar os testes e confirmar a falha esperada**

Run: `npm.cmd test -- src/features/auth/pages/ForgotPasswordPage.test.tsx src/features/auth/pages/SignInPage.test.tsx`

Expected: FAIL porque a página e o link ainda não existem.

- [ ] **Step 3: Implementar a página e registrar a rota**

A página usa `AuthLayout` no modo `sign-in`, `TextField`, `Button`,
`ErrorFeedback` e `LinkButton`. No submit:

```ts
const validationErrors = validatePasswordResetRequestFields({ email });
setFieldErrors(validationErrors);
if (Object.keys(validationErrors).length > 0) return;

setIsSubmitting(true);
try {
  await requestPasswordReset(email.trim());
  setWasRequested(true);
} catch (requestError) {
  setError(translateAuthError(requestError));
} finally {
  setIsSubmitting(false);
}
```

Em `App.tsx`, lazy-load da página e rota dentro de `RedirectIfAuthenticated`:

```tsx
<Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
```

Remover o comentário temporário da tela de entrada e usar:

```tsx
<Link to="/esqueci-senha">Esqueceu sua senha?</Link>
```

- [ ] **Step 4: Executar os testes das páginas**

Run: `npm.cmd test -- src/features/auth/pages/ForgotPasswordPage.test.tsx src/features/auth/pages/SignInPage.test.tsx`

Expected: PASS.

---

### Task 4: Implementar definição da nova senha

**Files:**
- Create: `frontend/src/features/auth/pages/ResetPasswordPage.tsx`
- Create: `frontend/src/features/auth/pages/ResetPasswordPage.test.tsx`
- Modify: `frontend/src/shared/components/ui/Feedback.tsx`
- Modify: `frontend/src/features/auth/pages/SignInPage.tsx`
- Modify: `frontend/src/features/auth/pages/SignInPage.test.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `session`, `isLoading`, `updatePassword(password)` e `signOut()`.
- Produces: rota `/redefinir-senha` e estado de navegação `{ passwordReset: true }`.
- Produces: `SuccessFeedback({ message })`.

- [ ] **Step 1: Escrever testes de fluxo que falham**

Cobrir quatro estados:

```ts
// bootstrap
expect(screen.getByText("Validando link…")).toBeInTheDocument();

// sem sessão
expect(screen.getByText("Este link de recuperação é inválido ou expirou.")).toBeInTheDocument();

// validação
expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();

// sucesso
expect(updatePassword).toHaveBeenCalledWith("MinhaSenha!2026");
expect(signOut).toHaveBeenCalled();
expect(screen.getByText("Senha alterada com sucesso. Entre novamente.")).toBeInTheDocument();
```

No teste de sucesso, renderizar também uma rota `/entrar` com `SignInPage` para
validar o estado de navegação.

- [ ] **Step 2: Executar o teste e confirmar a falha esperada**

Run: `npm.cmd test -- src/features/auth/pages/ResetPasswordPage.test.tsx src/features/auth/pages/SignInPage.test.tsx`

Expected: FAIL porque rota, página e feedback ainda não existem.

- [ ] **Step 3: Implementar feedback, página e rota**

Adicionar em `Feedback.tsx`:

```tsx
export function SuccessFeedback({ message }: FeedbackProps) {
  return (
    <div role="status" className="rounded-md border border-success/30 bg-success/10 p-lg text-center">
      <p className="font-body text-body-md text-success">{message}</p>
    </div>
  );
}
```

A página espera `isLoading`, rejeita sessão nula, valida com
`validateNewPasswordFields()` e executa:

```ts
await updatePassword(password);
await signOut();
navigate("/entrar", { replace: true, state: { passwordReset: true } });
```

Registrar `/redefinir-senha` fora de `RedirectIfAuthenticated`:

```tsx
<Route path="/redefinir-senha" element={<ResetPasswordPage />} />
```

Em `SignInPage`, ler `location.state` e renderizar:

```tsx
{state?.passwordReset ? (
  <SuccessFeedback message="Senha alterada com sucesso. Entre novamente." />
) : null}
```

- [ ] **Step 4: Executar os testes do fluxo de atualização**

Run: `npm.cmd test -- src/features/auth/pages/ResetPasswordPage.test.tsx src/features/auth/pages/SignInPage.test.tsx`

Expected: PASS.

---

### Task 5: Cobrir integração da SPA e documentar operação

**Files:**
- Modify: `frontend/e2e/authentication.spec.ts`
- Modify: `docs/deployment.md`

**Interfaces:**
- Consumes: rotas `/esqueci-senha` e `/redefinir-senha`.
- Documents: Site URL, redirects e gate de SMTP.

- [ ] **Step 1: Escrever E2E mockado de regressão**

Adicionar um teste que intercepta `**/auth/v1/recover**`, valida o corpo e o
query parameter e retorna sucesso:

```ts
await page.route("**/auth/v1/recover**", async (route) => {
  const url = new URL(route.request().url());
  expect(url.searchParams.get("redirect_to")).toBe(
    `${new URL(page.url()).origin}/redefinir-senha`,
  );
  expect(route.request().postDataJSON().email).toBe("ana@example.com");
  await route.fulfill({ contentType: "application/json", body: "{}" });
});
```

Navegar para `/esqueci-senha`, enviar o formulário e validar a resposta neutra.
Adicionar uma checagem de acessibilidade das duas novas rotas, com a rota de
redefinição sem sessão exibindo o estado de link inválido.

- [ ] **Step 2: Executar o E2E de autenticação**

Run: `npm.cmd run test:e2e -- e2e/authentication.spec.ts`

Expected: PASS, porque as Tasks 3 e 4 já entregaram as duas rotas.

- [ ] **Step 3: Atualizar o runbook de deploy**

Em `docs/deployment.md`, registrar os valores exatos:

```text
Site URL: https://oral-cardio.vercel.app
Redirect de produção: https://oral-cardio.vercel.app/redefinir-senha
Redirect local: http://localhost:5173/redefinir-senha
```

Registrar que SMTP próprio é gate de produção e que o teste manual usa uma
conta descartável, cobrindo link válido, expirado e reutilizado.

- [ ] **Step 4: Executar novamente o E2E de autenticação**

Run: `npm.cmd run test:e2e -- e2e/authentication.spec.ts`

Expected: PASS em desktop e mobile configurados pelo projeto.

---

### Task 6: Verificação completa e commit único

**Files:**
- Verify: todos os arquivos citados nas Tasks 1–5
- Include: `docs/superpowers/specs/2026-09-01-password-recovery-design.md`
- Include: `docs/superpowers/plans/2026-09-01-password-recovery.md`

**Interfaces:**
- Consumes: feature completa e testes.
- Produces: uma árvore verificada e um único commit final.

- [ ] **Step 1: Executar toda a suíte unitária**

Run: `npm.cmd test`

Expected: PASS, nenhum teste ignorado por falha.

- [ ] **Step 2: Executar lint**

Run: `npm.cmd run lint`

Expected: exit code 0.

- [ ] **Step 3: Executar build de produção**

Run: `npm.cmd run build:production`

Expected: exit code 0 com as variáveis de produção de teste já configuradas no ambiente. Se não estiverem disponíveis no shell, executar `npm.cmd run build` e registrar que o check de ambiente permanece para a Vercel.

- [ ] **Step 4: Executar E2E de autenticação**

Run: `npm.cmd run test:e2e -- e2e/authentication.spec.ts`

Expected: PASS em todos os projetos Playwright configurados.

- [ ] **Step 5: Revisar diff e higiene**

Run: `git diff --check`

Expected: sem whitespace errors, segredos, logs de senha/token, arquivos de
build ou alterações em backend/database.

- [ ] **Step 6: Criar o único commit, somente se todos os passos anteriores passarem**

```bash
git add frontend/src frontend/e2e/authentication.spec.ts docs/deployment.md docs/superpowers
git commit -m "feat(auth): add password recovery flow"
```

Expected: um commit contendo somente a feature, testes e documentação aprovados.
