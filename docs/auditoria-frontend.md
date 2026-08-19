# Auditoria técnica do frontend — OralCardio

**Data da auditoria:** 19/08/2026  
**Escopo:** `frontend/` completo, incluindo código React/TypeScript, autenticação,
contratos HTTP, estado e cache, PWA/Web Push, acessibilidade, desempenho,
configuração, testes e dependências. Os contratos do backend foram consultados
quando isso era necessário para confirmar o comportamento do frontend.

## Objetivo e limites

Esta é uma auditoria estática e automatizada do estado atual do repositório.
Ela identifica defeitos reproduzíveis, riscos de produção e dívida arquitetural,
mas não constitui certificação absoluta de segurança. Segurança de produção
também depende do provedor de hospedagem, variáveis efetivamente publicadas,
headers HTTP, navegadores reais e testes com a infraestrutura implantada.

## Status de implementação — 19/08/2026

As correções exclusivamente de frontend foram executadas nesta rodada. Foram
implementados: idempotência por intenção nos fluxos críticos, timeout HTTP,
logout coordenado, proteção de rota em erro, pausa/isolamento de conquistas,
validação de produção, PWA navigation fallback, calendário de São Paulo,
validações de formulário/notificações, timer monotônico, recuperação local de
escovação, contraste, foco/semântica, safe areas, Error Boundary, CI e testes
adicionais.

Permanecem dependentes de backend ou do provedor de hospedagem: revogação
remota garantida de Push após token inválido (FRONT-002), renovação Push sem
janela aberta (FRONT-014), schemas completos gerados do OpenAPI (FRONT-008),
cursor de paginação (FRONT-016), headers/CSP do host (FRONT-023), code splitting
mais granular (FRONT-024) e PATCH semântico com `null` (FRONT-028). Esses itens
não foram simulados ou substituídos no frontend, para não criar contratos
falsos com a API atual.

## Resultado executivo

Foram encontrados **30 pontos acionáveis**:

| Gravidade | Quantidade | Interpretação |
|---|---:|---|
| Alta | 5 | Corrigir antes de disponibilizar o produto a pacientes reais |
| Média | 21 | Corrigir antes da produção ou programar imediatamente no primeiro ciclo de estabilização |
| Baixa | 4 | Hardening, qualidade e manutenção preventiva |

Não foi encontrada vulnerabilidade conhecida no lockfile pelo `npm audit`.
Os riscos de maior gravidade estão nos fluxos de negócio e integração, não nas
dependências: idempotência, isolamento entre usuários, entrega de conquistas,
proteção de rotas e configuração de produção.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `npm run lint` | Aprovado, sem erros |
| `npm test` | 20 arquivos e 98 testes aprovados |
| `npm run build` | Aprovado, incluindo service worker PWA |
| TypeScript estrito | Aprovado como parte do build |
| `npm audit --json` | 0 vulnerabilidades conhecidas em 634 dependências |
| Árvore Vite/Vitest | Vite `6.4.3` deduplicado; não há mais duas cópias incompatíveis |
| CI do frontend | Ausente; existe somente workflow do backend |
| Cobertura | Não é medida e não há limite mínimo |
| Testes E2E | Ausentes |

O build analisado gerou aproximadamente 510 kB de JavaScript antes de gzip e
um precache PWA de 522,91 KiB. Ele também incorporou
`http://localhost:8000` como URL da API, pois a configuração atual só exige
que a variável exista e não valida se ela é própria para produção.

## Pontos positivos preservados

- Organização por feature e chamadas de rede isoladas em módulos `api/`.
- TypeScript com `strict`, sem `any`, `@ts-ignore` ou `dangerouslySetInnerHTML`
  no código de aplicação.
- Conteúdo educacional é interpretado como texto e não como HTML de admin.
- Payload e destino de notificações Push são validados como mesma origem no
  service worker.
- Cache do React Query é limpo quando o identificador do usuário muda.
- Componentes básicos já associam labels, mensagens de erro e foco visível.
- Timer e controller de escovação estão separados, uma boa base para aplicar
  SRP e testes determinísticos.
- O mapa da boca não depende apenas de cor e possui descrição acessível.
- Lockfile íntegro, build reproduzível no ambiente analisado e auditoria de
  dependências limpa.

---

## Achados de alta gravidade

### FRONT-001 — A chave de idempotência não acompanha a operação lógica

**Categoria:** integridade de dados, concorrência  
**Evidência:** `frontend/src/shared/api/httpClient.ts`, funções
`createIdempotencyKey()` e `httpClient.post()`.

Cada chamada `POST` cria uma chave nova dentro do cliente HTTP. Se o backend
confirmar a operação, mas a resposta se perder, a tentativa manual seguinte
terá outra chave e será considerada uma nova operação. Isso pode duplicar uma
consulta, uma sessão ou um registro de fio dental e, neste último caso,
duplicar pontos. O header existe, porém não protege a situação para a qual a
idempotência é necessária.

**Correção recomendada:**

1. Gerar a chave no início do caso de uso, não no transporte.
2. Permitir que `post()` receba uma `idempotencyKey` obrigatória nas mutações
   idempotentes.
3. Preservar a mesma chave em timeout, reconexão e retry da mesma intenção.
4. Gerar uma nova chave somente após sucesso definitivo ou quando o usuário
   iniciar intencionalmente outra atividade.
5. Adicionar teste de resposta perdida: o retry deve retornar o primeiro
   resultado sem criar outro registro ou pontuar novamente.

### FRONT-002 — Logout pode deixar uma assinatura Push ligada ao usuário anterior

**Categoria:** privacidade, isolamento de sessão  
**Evidência:**
`frontend/src/features/notifications/NotificationSubscriptionProvider.tsx`,
`frontend/src/features/notifications/pushSubscriptionManager.ts` e
`frontend/src/shared/api/httpClient.ts`.

O logout disparado por um `401` chama diretamente o Supabase e remove o token.
Depois disso, o provider tenta somente o unsubscribe local com
`notifyServer=false`. Se essa remoção local falhar, o endpoint permanece ativo
no navegador e no servidor. Já no logout explícito, uma falha do servidor é
seguida da remoção local; com isso o frontend perde o endpoint necessário para
repetir a revogação. Em dispositivo compartilhado, o usuário anterior pode
continuar recebendo notificações até uma reconciliação ou falha definitiva do
serviço Push.

**Correção recomendada:**

1. Criar um único `SignOutUseCase` usado por Perfil, respostas `401` e troca de
   conta.
2. Revogar no backend antes de invalidar a sessão e tornar a operação
   idempotente.
3. Não descartar o identificador da assinatura enquanto houver revogação
   pendente; manter uma fila/tombstone durável e segura para retry.
4. Prever endpoint para revogar todas as assinaturas do usuário/dispositivo.
5. Limpar todo estado do provider na troca de usuário.
6. Testar logout offline, erro 401, falha de unsubscribe e troca rápida de
   contas no mesmo navegador.

### FRONT-003 — Conquista pode ser confirmada sem ser vista e vazar entre sessões

**Categoria:** regra de negócio, isolamento de usuário, acessibilidade  
**Evidência:** `AchievementUnlockProvider.tsx` e
`useAchievementUnlockToasts.ts`.

O claim de conquistas e o temporizador de seis segundos continuam sem verificar
`document.visibilityState`. Se o app estiver em segundo plano na virada do dia
ou for ocultado logo após o claim, a conquista pode ser automaticamente
confirmada sem ter sido apresentada. Além disso, a fila local de toasts não é
apagada quando `activeUserId` muda; a conquista de uma conta pode aparecer na
sessão seguinte e o acknowledge será tentado com o usuário errado.

**Correção recomendada:**

1. Fazer claim somente quando a página estiver visível.
2. Pausar o tempo de exibição enquanto a página estiver oculta e só confirmar
   após exibição efetiva ou fechamento explícito.
3. Associar cada item da fila ao `userId` que o reivindicou.
4. Limpar fila, timers, leases locais e mutações pendentes em toda troca de
   usuário.
5. Testar virada da meia-noite em background, troca de conta com toast aberto,
   reconexão e falha do acknowledge.

### FRONT-004 — Falha ao consultar o perfil é interpretada como onboarding incompleto

**Categoria:** autorização de fluxo, disponibilidade  
**Evidência:** `frontend/src/shared/auth/ProtectedRoute.tsx`.

Após o loading, a rota usa `healthProfileQuery.data?.is_completed ?? false` e
não trata `isError`. Uma indisponibilidade da API redireciona um paciente já
cadastrado para o questionário, em vez de mostrar erro e retry. Além da
experiência incorreta, o usuário pode reenviar dados clínicos pensando que
perdeu o perfil.

**Correção recomendada:** tratar explicitamente `isError`, exibir uma tela de
falha com `refetch` e só redirecionar quando uma resposta válida confirmar
`is_completed === false`. Incluir o caso de erro nos testes de `ProtectedRoute`.

### FRONT-005 — Build de produção aceita API local ou insegura

**Categoria:** configuração, disponibilidade, segurança de transporte  
**Evidência:** `frontend/src/config/env.ts`, `.env.example` e artefato gerado
pelo build analisado.

As variáveis são validadas apenas por presença. O build passou normalmente e
incorporou `http://localhost:8000`; uma publicação desse artefato não consegue
acessar o backend do usuário. A mesma lacuna permite HTTP em produção, criando
mixed content ou tráfego sem TLS.

**Correção recomendada:**

1. Validar todas as variáveis com schema na inicialização/build.
2. Em `import.meta.env.PROD`, exigir HTTPS, recusar `localhost`, endereços
   privados e URLs com credenciais ou path inesperado.
3. Validar também a origem do Supabase e o formato da chave pública.
4. Criar uma etapa de CI que construa com variáveis de staging e faça smoke
   test do artefato.
5. Documentar variáveis distintas para desenvolvimento, staging e produção.

> A chave `anon`/publishable do Supabase é pública por desenho e não é tratada
> como segredo. A `service_role` nunca deve entrar em variável `VITE_*`.

---

## Achados de média gravidade

### FRONT-006 — Requisições não possuem timeout nem cancelamento

**Categoria:** resiliência  
**Evidência:** `frontend/src/shared/api/httpClient.ts` e uso de
`navigator.serviceWorker.ready` em `pushSubscriptionManager.ts`.

`fetch()` e a espera pelo service worker podem permanecer pendentes por tempo
indefinido em redes móveis problemáticas. Botões ficam bloqueados e o usuário
não recebe retry. Também não há propagação de `AbortSignal` do React Query ao
transporte.

**Correção recomendada:** aceitar `AbortSignal`, aplicar timeout por operação
com `AbortSignal.timeout()` ou controller compatível e distinguir timeout,
offline, cancelamento e erro HTTP nas mensagens. Consultas canceladas por
unmount não devem continuar consumindo rede.

### FRONT-007 — Falha ao restaurar a sessão deixa a aplicação travada

**Categoria:** autenticação, disponibilidade  
**Evidência:** `frontend/src/shared/auth/AuthProvider.tsx`.

`supabaseClient.auth.getSession().then(...)` não tem `catch` nem `finally`. Se
storage, IndexedDB ou o SDK falhar, `isLoading` nunca volta para `false` e a
aplicação permanece em “Verificando sua sessão…”.

**Correção recomendada:** encapsular o bootstrap em função cancelável com
`try/catch/finally`, limpar a sessão/token em falha segura e exibir erro
recuperável. Proteger também contra corrida entre o resultado inicial e um
evento de autenticação mais recente.

### FRONT-008 — Tipos da API não validam dados em runtime

**Categoria:** contrato, arquitetura  
**Evidência:** `httpClient.ts` retorna `(await response.json()) as T` e os DTOs
são escritos manualmente nas features.

O TypeScript confia em qualquer JSON recebido. Campo ausente, `null` inesperado
ou nova variante do backend atravessa o limite e vira `undefined`, `NaN` ou
falha de renderização. A normalização criada para os contadores do dashboard é
um sinal de que esse risco já aconteceu.

**Correção recomendada:** gerar o client e os tipos a partir do OpenAPI do
FastAPI e validar respostas críticas em runtime (por exemplo, com schema
gerado ou Zod). O adapter HTTP deve devolver DTO válido ou um erro de contrato
observável, nunca um cast irrestrito.

### FRONT-009 — `noValidate` desativa regras que não foram reimplementadas

**Categoria:** validação, qualidade de dados  
**Evidência:** formulários de autenticação, onboarding, perfil, agenda e
notificações.

Os formulários usam `noValidate`, mas várias constraints continuam apenas no
HTML. Exemplos: cadastro aceita nome vazio/espaços e não valida e-mail ou
tamanho da senha localmente; perfil aceita nome vazio; limites `maxLength` da
agenda não são checados pelos builders; `Number()` do questionário pode gerar
`NaN`, serializado como `null`; uma visita ao dentista no futuro só falha no
servidor.

**Correção recomendada:** criar um schema puro por formulário, compartilhado
entre montagem do payload e mensagens por campo. Normalizar com `trim`, rejeitar
valores não finitos, validar datas e comprimentos e manter o backend como
segunda barreira. Se não houver motivo para desativar validação nativa, remover
`noValidate`.

### FRONT-010 — Tela de notificações permite estados que o domínio rejeita

**Categoria:** regra de negócio, UX  
**Evidência:** `NotificationSettingsPage.tsx` versus
`backend/app/domain/notifications.py`.

A UI permite horários de escovação repetidos, zero ou quatro antecedências de
consulta, início e fim silenciosos iguais e lembretes dentro do período
silencioso. O backend aceita somente 1–3 antecedências, horários únicos e
combinações fora do silêncio. O resultado é erro genérico depois de o usuário
preencher toda a tela.

**Correção recomendada:** extrair um validador de domínio puro no frontend,
bloquear combinações inválidas antes do envio, mostrar o erro no campo/grupo
correspondente e testar a matriz com as mesmas invariantes do backend.

### FRONT-011 — Timer de escovação mede callbacks, não tempo decorrido

**Categoria:** regra de negócio, mobile  
**Evidência:** `frontend/src/features/brushing/useBrushingTimer.ts`.

O timer soma um segundo por callback de `setInterval`. Navegadores reduzem ou
congelam timers com tela bloqueada ou aba em background; assim, dois minutos
reais podem demorar muito mais e a contagem deixa de representar o tempo
decorrido.

**Correção recomendada:** usar relógio monotônico (`performance.now`) e
recalcular o estado a partir de timestamps. Definir explicitamente a política
para background: pausar e informar ou reconciliar o tempo. Considerar Screen
Wake Lock como melhoria progressiva, sempre com fallback, e testar throttling,
pausa e retomada.

### FRONT-012 — “Progresso preservado” existe apenas na memória

**Categoria:** consistência, recuperação de falhas  
**Evidência:** `useBrushingSessionController.ts` e `BrushingTimerPage.tsx`.

`sessionId`, zonas, fila e erros vivem somente em refs. Reload, atualização da
PWA, fechamento ou descarte da aba perde o progresso e deixa sessão incompleta
no backend. Além disso, qualquer erro ao concluir — inclusive 401 ou falha de
rede — dispara novamente PATCH das cinco zonas antes de outra conclusão,
amplificando requisições e tratando erros diferentes como se fossem “zona
ausente”.

**Correção recomendada:** modelar o fluxo como máquina de estados persistível,
salvar sessão/zona/instantes em storage versionado, restaurar com confirmação
do backend e repetir somente tarefas efetivamente pendentes. Reprocessar as
cinco zonas apenas para um erro de domínio específico e testado.

### FRONT-013 — PWA não define fallback de navegação SPA

**Categoria:** PWA, implantação  
**Evidência:** `frontend/src/sw.ts`; não há `NavigationRoute`,
`navigateFallback` nem configuração de rewrite do host no repositório.

O precache conhece `index.html`, mas uma navegação direta/offline para
`/agenda/123`, inclusive aberta por notificação, não é automaticamente atendida
por esse arquivo. Online, o resultado também depende de uma regra externa da
plataforma que não está versionada.

**Correção recomendada:** adicionar fallback de navegação no service worker
com allow/denylist apropriada e versionar o rewrite SPA do provedor de
hosting. Testar reload de cada rota, abertura por Push e cold start offline.

### FRONT-014 — Renovação Push depende de uma janela aberta

**Categoria:** confiabilidade de notificações  
**Evidência:** handler `pushsubscriptionchange` em `frontend/src/sw.ts`.

O service worker apenas envia mensagem para clients existentes. Se nenhuma
janela estiver aberta, nada é renovado; as notificações ficam interrompidas
até o próximo acesso e reconciliação do app, sem telemetria para detectar o
período perdido.

**Correção recomendada:** quando suportado, renovar e registrar a assinatura
no próprio evento; manter reconciliação robusta no próximo startup como
fallback. Registrar estado/versão VAPID necessário ao SW e monitorar
assinaturas expiradas ou sem `last_seen` recente.

### FRONT-015 — Calendário de São Paulo não é uma dependência única

**Categoria:** tempo, arquitetura  
**Evidência:** `dateTimeLocal.ts`, `formatDate.ts`, agenda, educação e
`AchievementUnlockProvider.tsx`.

Conquistas usam `America/Sao_Paulo`, mas formulários e rótulos da agenda usam o
fuso do dispositivo; outros casos usam `Date.now()` diretamente. Um aparelho
configurado em outro fuso pode mostrar “Hoje/Amanhã” diferente da data de
negócio e interpretar horário sem deixar o fuso claro. Os horários de
notificação também não informam visualmente que seguem São Paulo.

**Correção recomendada:** criar uma porta `BusinessClock`/`BusinessCalendar`
injetável, com `America/Sao_Paulo` centralizado, e separar explicitamente
“instante UTC” de “hora civil de São Paulo”. Todas as telas devem declarar a
política de fuso e os testes devem cobrir meia-noite e aparelho em outro fuso.

### FRONT-016 — Agenda pode duplicar itens e envelhece sem recalcular grupos

**Categoria:** paginação, estado derivado  
**Evidência:** `useAppointmentQueries.ts` e `AppointmentsListPage.tsx`.

Paginação por offset é concatenada sem deduplicar IDs. Inserções ou alterações
entre páginas podem repetir ou pular consultas. Além disso,
`groupAppointments(allItems, Date.now())` só recalcula quando `allItems` muda;
uma PWA aberta pode manter uma consulta em “Próximas” depois do horário ou da
virada do dia.

**Correção recomendada:** preferir cursor estável no backend; como proteção,
deduplicar por ID no frontend. Agendar a próxima fronteira temporal ou
invalidar/recalcular ao recuperar foco, mudar visibilidade e atravessar a
meia-noite.

### FRONT-017 — Métrica de leitura inclui loading e tempo em background

**Categoria:** analytics de produto, resiliência  
**Evidência:** `EducationModulePage.tsx` e `useModuleStart.ts`.

O relógio começa antes de o módulo carregar e continua quando a aba está
oculta. Uma falha em `/start` também grava o ID no guard local antes da chamada
e não tenta novamente durante aquela montagem. Isso produz dados de leitura
inflados e perda silenciosa de bookkeeping.

**Correção recomendada:** iniciar após renderização do conteúdo, acumular
somente intervalos visíveis/ativos, limitar valores anômalos e tornar start e
complete idempotentes. Em falha, remover o guard ou agendar retry com backoff.

### FRONT-018 — Cores de status não atendem contraste WCAG AA

**Categoria:** acessibilidade  
**Evidência:** tokens em `globals.css`, `Card.tsx`, `Badge.tsx`,
`AchievementToastStack.tsx` e mensagens `text-success`.

Texto branco sobre `#cc785c` tem contraste aproximado de **3,28:1**, mas é
usado em badges e textos de 14 px, que exigem 4,5:1. Texto verde `#5db872`
sobre `#faf9f5` tem aproximadamente **2,33:1**. O comentário dos tokens diz que
o coral claro seria reservado a texto grande, porém componentes reutilizáveis
violam essa própria regra.

**Correção recomendada:** usar `primary-action`/tom mais escuro para superfícies
com texto branco, ou texto escuro compatível no coral; criar um verde de texto
com 4,5:1. Adicionar testes automatizados com axe e verificação de contraste
dos pares do design system.

### FRONT-019 — Navegação SPA e algumas ações quebram semântica/foco

**Categoria:** acessibilidade  
**Evidência:** `SignUpPage.tsx`, `Screen.tsx` e `ConfirmAction.tsx`.

A tela “Quase lá” ainda renderiza `<Link><Button/></Link>`, HTML interativo
aninhado que o próprio `LinkButton` foi criado para evitar. Mudanças de rota
não atualizam foco nem título do documento; leitores de tela podem não perceber
a nova tela. Na confirmação inline, o botão focado é removido sem mover o foco
para a pergunta ou para a ação seguinte.

**Correção recomendada:** usar `LinkButton`, implementar gerenciador de foco e
título por rota, anunciar transições e devolver/mover o foco nas confirmações.
Cobrir navegação por teclado e leitor de tela em testes de componente/E2E.

### FRONT-020 — Safe areas não estão dimensionadas corretamente

**Categoria:** mobile, acessibilidade  
**Evidência:** `BottomNav.tsx`, `AppShell.tsx` e
`AchievementToastStack.tsx`.

A navegação tem altura fixa de 64 px e padding inferior de safe area dentro do
box. Em iPhones com indicador de início, o padding consome a altura útil e pode
reduzir os alvos abaixo dos 44 px planejados. O conteúdo principal não soma a
safe area ao espaço reservado, e o toast superior não usa
`safe-area-inset-top`.

**Correção recomendada:** dimensionar a barra como
`64px + env(safe-area-inset-bottom)`, refletir o mesmo valor no padding do
conteúdo e aplicar inset superior aos overlays. Validar em iPhone com notch,
modo standalone e orientação horizontal.

### FRONT-021 — Falta boundary global e observabilidade do navegador

**Categoria:** operação, confiabilidade  
**Evidência:** `main.tsx` monta a árvore sem Error Boundary e não há captura
central de exceções ou rejeições.

Uma exceção de renderização ou contrato pode deixar a PWA em branco. Os erros
vistos pelo paciente não geram correlação com request, versão do frontend ou
rota, dificultando investigar problemas reais.

**Correção recomendada:** adicionar Error Boundary no topo e boundaries por
rota crítica, tela de recuperação/reload seguro, identificação da release e
telemetria sem PII. Capturar erros globais e falhas de rede com sanitização,
amostragem e correlação fornecida pelo backend.

### FRONT-022 — Frontend não participa do CI e fluxos críticos não têm cobertura suficiente

**Categoria:** qualidade, regressão  
**Evidência:** `.github/workflows/` contém apenas `backend-quality.yml`.

Os checks locais passam, mas nenhum bloqueia push/PR do frontend. Não há
cobertura nem E2E. Estão sem teste integrado suficiente: bootstrap/logout e
troca de usuário, provider de Push, provider de conquistas, configurações de
notificação, formulários completos, agenda paginada, service worker e rotas
offline.

**Correção recomendada:** criar workflow com instalação via `npm ci`, lint,
typecheck/build, testes, `npm audit` e cache. Adicionar cobertura com limites
graduais e E2E em Chromium, WebKit e viewport móvel, priorizando os cinco
achados altos. Executar smoke test do PWA construído, não somente do Vite dev.

### FRONT-023 — Política de segurança HTTP não está versionada

**Categoria:** hardening web  
**Evidência:** não há configuração de hosting ou documentação executável para
CSP e demais headers no repositório.

Não é possível confirmar proteção contra framing, injeção de scripts, downgrade
de transporte ou vazamento de referrer. Como a sessão Supabase fica disponível
ao JavaScript, reduzir o impacto de um futuro XSS é especialmente importante.

**Correção recomendada:** versionar no provedor uma CSP restritiva com
`default-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
`frame-ancestors 'none'` e allowlists explícitas em `connect-src`; configurar
HSTS, Referrer-Policy e Permissions-Policy. Implantar primeiro em
`Report-Only`, revisar relatórios e depois aplicar. Não habilitar `unsafe-eval`
em produção.

### FRONT-024 — Todas as rotas são carregadas de forma antecipada

**Categoria:** desempenho, PWA  
**Evidência:** imports estáticos em `App.tsx` e saída do build.

Agenda, educação, notificações, gamificação e escovação entram no primeiro
carregamento mesmo quando o usuário abre apenas o dashboard. Em rede móvel,
isso aumenta tempo de download, parse e atualização do precache.

**Correção recomendada:** usar `React.lazy`/lazy route modules por feature,
manter apenas shell, autenticação e dashboard no caminho inicial e medir com
budget de bundle. Carregar rotas prováveis de maneira oportunista após o app
ficar interativo.

### FRONT-025 — Infraestrutura HTTP está acoplada ao controle de sessão

**Categoria:** arquitetura limpa, SOLID  
**Evidência:** `httpClient.ts` importa diretamente `supabaseClient` e executa
logout; providers misturam APIs do navegador, regras de reconciliação, estado
de UI e chamadas ao servidor.

O cliente viola SRP e DIP: uma resposta HTTP tem efeito global de autenticação,
e qualquer troca do provedor de identidade exige alterar a infraestrutura de
rede. Esse acoplamento também contribui para o logout Push inconsistente.

**Correção recomendada:** definir portas pequenas (`TokenProvider`,
`UnauthorizedHandler`, `ApiClient`, `PushSubscriptionPort`, `BusinessClock`)
e injetá-las na composição da aplicação. Casos de uso coordenam logout,
registro Push e revelações; adapters Supabase/browser apenas implementam as
portas. Evitar um “service locator” ou provider único que concentre todas as
responsabilidades.

### FRONT-026 — Thumbnail remoto pode rastrear pacientes

**Categoria:** privacidade  
**Evidência:** `ModuleCard.tsx` renderiza `thumbnail_url` diretamente e o
backend aceita texto sem allowlist.

Embora os módulos atuais não usem thumbnail, um URL de admin pode fazer o
navegador do paciente contatar um terceiro, revelando IP, horário e referrer.
Em um produto de saúde isso deve ser controlado antes de habilitar imagens
remotas.

**Correção recomendada:** servir imagens por storage/domínio próprio ou proxy
validado, limitar esquema/host no backend, usar `referrerPolicy="no-referrer"`,
`loading="lazy"`, limites de tamanho/tipo e CSP `img-src` restrita.

---

## Achados de baixa gravidade

### FRONT-027 — Rota pública de diagnóstico expõe estado operacional

**Categoria:** exposição de informação  
**Evidência:** `/diagnostico` em `App.tsx` e `HealthCheckPage.tsx`.

A rota informa publicamente se API e banco estão disponíveis e mostra a
mensagem de erro recebida. O dado é limitado, mas facilita reconhecimento e
não faz parte da experiência do paciente.

**Correção recomendada:** remover a rota do bundle de produção, protegê-la por
ambiente/autorização ou manter somente um health check genérico no backend,
sem detalhes de dependências.

### FRONT-028 — Limpar campos opcionais grava string vazia em vez de `null`

**Categoria:** contrato, dívida arquitetural  
**Evidência:** `buildAppointmentPatch.ts` documenta o uso de `""` porque o
backend ignora `null`.

Isso mistura “não informado” com string vazia e obriga cada consumidor a
normalizar. A solução funciona visualmente, mas deteriora a semântica dos
dados e espalha conhecimento da implementação do backend no frontend.

**Correção recomendada:** ajustar o PATCH para distinguir campo ausente de
campo presente com `null` e então remover o workaround. Gerar o contrato a
partir do OpenAPI e migrar strings vazias históricas para `null`.

### FRONT-029 — Telas de erro pedem nova tentativa, mas não oferecem retry

**Categoria:** UX, resiliência  
**Evidência:** dashboard, perfil, agenda, educação, conquistas e notificações.

Após as tentativas automáticas do React Query, várias telas exibem apenas
“Tente novamente” sem botão `refetch`. Em PWA móvel, isso força reload ou
navegação manual.

**Correção recomendada:** criar `QueryErrorState` reutilizável com ação de
retry, feedback de offline e estado de nova tentativa, preservando foco e
conteúdo já carregado quando possível.

### FRONT-030 — Preferência de movimento reduzido não é considerada

**Categoria:** acessibilidade  
**Evidência:** spinner `animate-spin` e transições do design system.

O impacto atual é pequeno, mas um produto de saúde deve respeitar
`prefers-reduced-motion` desde o design system para evitar regressão quando
novas animações forem adicionadas.

**Correção recomendada:** aplicar variantes `motion-reduce`, manter indicação
textual de loading e adicionar a preferência aos testes visuais/a11y.

---

## Plano de correção recomendado

### Onda 0 — Bloqueadores de produção

1. FRONT-001 — idempotência por operação lógica.
2. FRONT-002 — logout e revogação Push centralizados.
3. FRONT-003 — conquistas visíveis e isoladas por usuário.
4. FRONT-004 — erro do perfil não pode virar onboarding.
5. FRONT-005 — validação rígida das variáveis de produção.
6. FRONT-018 — contraste do design system, por afetar todas as telas.
7. FRONT-022 — CI mínimo para impedir regressão durante as correções.

### Onda 1 — Resiliência dos fluxos principais

1. FRONT-006 e FRONT-007 — timeout/cancelamento e bootstrap de auth.
2. FRONT-011 e FRONT-012 — timer e recuperação da escovação.
3. FRONT-010, FRONT-014 e FRONT-015 — notificações e calendário.
4. FRONT-013 — deep links e cold start da PWA.
5. FRONT-008 e FRONT-009 — contrato runtime e schemas de formulário.
6. FRONT-019 e FRONT-020 — navegação acessível e safe areas.

### Onda 2 — Arquitetura, qualidade e operação

1. FRONT-021, FRONT-023 e FRONT-025 — boundaries, observabilidade, headers e
   portas/adapters.
2. FRONT-016 e FRONT-017 — agenda e métricas educacionais.
3. FRONT-024 e FRONT-026 — performance e privacidade de assets.
4. FRONT-027, FRONT-028, FRONT-029 e FRONT-030 — hardening restante.

## Critério de encerramento da auditoria

O frontend pode ser considerado pronto para produção quando:

- todos os itens de alta gravidade estiverem corrigidos e testados;
- lint, typecheck, testes, build, audit e E2E forem obrigatórios no CI;
- staging HTTPS validar login/logout, troca de contas, escovação, fio dental,
  conquistas na virada do dia e Push com o app fechado;
- deep links funcionarem online e offline em um build real;
- os fluxos principais passarem por teclado, leitor de tela, contraste e
  dispositivos com safe area;
- variáveis, CSP, headers, release e observabilidade forem verificados no
  ambiente publicado;
- houver rollout gradual e monitoramento de erros, duplicidade de mutações e
  falhas de subscription/acknowledge.

Mesmo após esses itens, recomenda-se teste manual em iPhone/iPad PWA, Android
Chrome e desktop, além de pentest focado no sistema implantado. Testes verdes
no repositório são necessários, mas não substituem validação do ambiente real.
