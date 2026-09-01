# Recuperação de senha — especificação de design

**Status:** aprovado em conversa em 2026-09-01
**Modelo recomendado para implementação:** `gpt-5.6-sol`, reasoning `high`

## Objetivo

Permitir que um paciente solicite por e-mail um link de recuperação, defina uma
nova senha por esse link e volte à tela de entrada, usando o fluxo nativo do
Supabase Auth.

## Contexto atual

- O React chama o Supabase Auth diretamente por meio do `AuthProvider` para
  cadastro, entrada e saída.
- O FastAPI apenas valida access tokens do Supabase e não administra senhas.
- O PostgreSQL armazena o perfil público, enquanto as credenciais pertencem a
  `auth.users`, gerenciado pelo Supabase.
- O Vercel já reescreve rotas da SPA para `index.html`, permitindo abrir a rota
  de redefinição diretamente pelo link do e-mail.
- A tela de entrada já contém um bloco comentado para “Esqueceu sua senha?”.

## Escopo

### Incluído

- Solicitação de recuperação por e-mail.
- Página de definição da nova senha.
- Reutilização da política atual de senha.
- Estados acessíveis de carregamento, sucesso e erro.
- Testes unitários, de componentes e E2E mockado no frontend.
- Configuração e checklist operacional do Supabase Auth.

### Fora do escopo

- Endpoints novos no FastAPI.
- Migrations ou tabelas de tokens.
- Serviço próprio de e-mail ou tokens próprios.
- Nova dependência de frontend.
- CAPTCHA nesta entrega; os rate limits nativos do Supabase são suficientes
  para o primeiro release e CAPTCHA será considerado somente se houver abuso.
- Refatorações não relacionadas no módulo de autenticação.

## Arquitetura

O frontend continua dependendo do `AuthContext` como fachada de autenticação.
O `AuthProvider` encapsula duas novas chamadas do SDK já instalado:

- `requestPasswordReset(email)` chama
  `supabase.auth.resetPasswordForEmail()`;
- `updatePassword(password)` chama `supabase.auth.updateUser()`.

As páginas não acessam o cliente Supabase diretamente. Essa separação mantém as
responsabilidades existentes: as páginas cuidam da interação, o contexto
orquestra autenticação, o Supabase controla identidade e credenciais, e o
FastAPI continua cuidando apenas de autorização da API.

Não será criada uma variável `VITE_SITE_URL`. O redirect será
`${window.location.origin}/redefinir-senha`; o Supabase aceitará somente origens
presentes em sua allowlist.

## Rotas e componentes

### `/esqueci-senha`

- Rota pública agrupada com entrada e cadastro sob `RedirectIfAuthenticated`.
- Recebe somente um e-mail.
- Valida e normaliza o e-mail antes da chamada.
- Desabilita reenvio enquanto a requisição estiver em andamento.
- Após sucesso, mostra sempre a mensagem neutra:
  “Se existir uma conta para este e-mail, enviaremos as instruções de recuperação.”
- Oferece retorno para `/entrar`.

### `/redefinir-senha`

- Rota fora de `RedirectIfAuthenticated`, pois o link de recuperação cria uma
  sessão autenticada e o guard atual redirecionaria essa sessão para `/`.
- Aguarda o bootstrap do `AuthProvider`.
- Sem sessão válida, mostra que o link é inválido ou expirou e oferece nova
  solicitação em `/esqueci-senha`.
- Com sessão válida, recebe senha e confirmação com `autocomplete="new-password"`.
- Após atualização bem-sucedida, chama o fluxo existente de saída e redireciona
  para `/entrar`, exibindo confirmação de que a senha foi alterada.

### `/entrar`

- Reativa o link “Esqueceu sua senha?” apontando para `/esqueci-senha`.

## Fluxo de dados

1. O usuário informa o e-mail em `/esqueci-senha`.
2. O `AuthProvider` solicita ao Supabase o envio do e-mail com redirect para
   `${window.location.origin}/redefinir-senha`.
3. O Supabase envia um link de uso único e, ao abri-lo, estabelece uma sessão.
4. O SDK detecta a sessão na URL e o `AuthProvider` a sincroniza.
5. A página envia a nova senha pelo `AuthProvider` ao Supabase.
6. O frontend encerra a sessão de recuperação e retorna para `/entrar`.

## Validação e mensagens

A política de senha terá uma única implementação reutilizada por cadastro e
recuperação:

- mínimo de 8 caracteres;
- uma letra maiúscula;
- uma letra minúscula;
- um número;
- um caractere especial;
- rejeição da shortlist existente de senhas comuns;
- confirmação idêntica à nova senha.

Os erros conhecidos do Supabase continuam passando por `translateAuthError`.
Rate limit recebe a mensagem existente para aguardar e tentar novamente.
Falhas não mapeadas usam mensagem genérica e não expõem detalhes do provedor.
Uma solicitação válida nunca informa se o e-mail está cadastrado.

## Segurança

- Senhas, tokens e URLs completas de recuperação não são registrados em logs.
- Produção usa redirects exatos; wildcards ficam restritos a desenvolvimento ou
  previews explicitamente autorizados.
- A página de nova senha exige uma sessão reconhecida pelo Supabase.
- O frontend oferece validação antecipada, mas o Supabase permanece a fronteira
  responsável por aceitar ou rejeitar a senha.
- A redefinição bem-sucedida encerra a sessão antes de voltar à entrada.
- Nenhuma chave secreta adicional será exposta na Vercel.

## Configuração dos ambientes

No Supabase Auth:

- Site URL de produção: `https://oral-cardio.vercel.app`.
- Redirect de produção:
  `https://oral-cardio.vercel.app/redefinir-senha`.
- Redirect local: `http://localhost:5173/redefinir-senha`.
- O template de recuperação deve respeitar o redirect solicitado.
- O estado de SMTP deve ser verificado em
  **Authentication → Emails → SMTP Settings**.
- SMTP próprio é requisito de liberação para pacientes reais; o SMTP padrão
  pode ser usado apenas para desenvolvimento com as limitações do Supabase.

O Render e o PostgreSQL não recebem nenhuma configuração nova.

## Estratégia de testes

### Unitários

- Política de senha compartilhada preserva os casos atuais de cadastro.
- Recuperação rejeita senha fraca e confirmação divergente.
- Tradução de rate limit e senha fraca permanece estável.

### Componentes

- Tela de solicitação valida o e-mail, normaliza o valor, chama o contexto e
  mostra resposta neutra.
- Tela de redefinição trata carregamento, sessão ausente, validação e sucesso.
- Tela de entrada exibe um link acessível para `/esqueci-senha`.

### E2E mockado

- A rota de solicitação envia e-mail e redirect corretos ao endpoint Auth do
  Supabase e mostra a resposta neutra.
- As novas rotas são navegáveis e não têm violações críticas de acessibilidade.

### Verificação local

- `npm test`
- `npm run lint`
- `npm run build:production` com as variáveis de produção de teste configuradas.

### Verificação manual antes da produção

1. Solicitar recuperação para uma conta de teste que não seja de produção.
2. Abrir o link recebido no domínio da Vercel.
3. Confirmar que link expirado ou reutilizado falha de forma segura.
4. Definir uma senha válida e voltar para `/entrar`.
5. Confirmar que a senha antiga falha e a nova funciona.
6. Validar o fluxo em viewport móvel e desktop.

## Critérios de aceite

- O usuário alcança o pedido de recuperação a partir de `/entrar`.
- A resposta do pedido não revela a existência da conta.
- O link abre diretamente na Vercel e só permite atualização com sessão válida.
- Cadastro e recuperação aplicam a mesma política de senha.
- Depois da alteração, o usuário entra com a nova senha.
- Todos os testes e checks do frontend passam.
- Nenhum arquivo do backend ou migration é necessário.
