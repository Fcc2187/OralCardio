# Notificações push — guia de uso e operação

O OralCardio usa **Web Push padrão**. Ele continua sendo uma aplicação web:
não existe aplicativo nativo, arquivo IPA/APK ou publicação obrigatória em
loja. O usuário sempre escolhe se deseja receber notificações.

## Para usuários

### iPhone e iPad

Requisitos: iOS/iPadOS 16.4 ou superior e acesso ao OralCardio por HTTPS.

1. Abra o endereço do OralCardio no Safari.
2. Toque em **Compartilhar**.
3. Escolha **Adicionar à Tela de Início**.
4. Abra o OralCardio pelo ícone criado na tela inicial.
5. Entre na conta e acesse **Perfil → Configurar notificações**.
6. Toque em **Ativar neste dispositivo**.
7. Confirme **Permitir** no aviso do sistema.
8. Escolha e salve os lembretes desejados.

Adicionar à tela inicial instala somente a PWA. Não baixa um aplicativo da
App Store e não exige conta Apple Developer. Se o site estiver aberto apenas
em uma aba comum, o OralCardio exibirá as instruções acima e não solicitará a
permissão prematuramente.

### Android

1. Abra o endereço HTTPS do OralCardio em um navegador compatível, como Chrome.
2. Entre na conta e acesse **Perfil → Configurar notificações**.
3. Toque em **Ativar neste dispositivo** e confirme **Permitir**.
4. Escolha e salve os lembretes desejados.

No Android, adicionar o OralCardio à tela inicial melhora a experiência, mas
não é requisito para Web Push em navegadores compatíveis.

### O que será enviado

- Escovação: cada horário representa uma meta. O segundo lembrete só é
  suprimido depois da segunda escovação do dia.
- Fio dental: o lembrete é suprimido se já houver um registro no dia.
- Consultas: somente consultas futuras com status `scheduled` geram avisos.
- Reagendar ou cancelar uma consulta invalida os avisos antigos.

As mensagens da tela bloqueada são genéricas. Condição cardíaca, medicamentos,
alergias e outras informações clínicas nunca fazem parte do payload.

### Permissão bloqueada

Se o usuário escolher **Não permitir**, navegadores não aceitam que o site
abra o aviso repetidamente. A permissão deve ser restaurada nas configurações
de notificações do navegador ou do sistema operacional. Depois, basta voltar
à página de notificações do OralCardio.

Ao sair da conta, a subscription do dispositivo é revogada. Em aparelho
compartilhado, isso impede que o próximo usuário receba lembretes da conta
anterior.

## Para desenvolvimento e operação

### Componentes

```text
PWA/service worker → FastAPI → PostgreSQL outbox
                              ▲
Supabase Cron → dispatcher ───┴─→ serviços Web Push
```

- O frontend solicita consentimento, cria a `PushSubscription` e registra o
  dispositivo pela API.
- O banco cria jobs idempotentes e deliveries individuais por dispositivo.
- O Supabase Cron chama o endpoint interno a cada minuto.
- O FastAPI reivindica deliveries com lease e envia usando VAPID.
- Respostas `404/410` revogam subscriptions; `429/5xx` usam backoff com jitter.

### Migrações

Aplicar, em ordem, depois da `011`:

1. `012_notifications_core.sql`
2. `013_notification_outbox.sql`
3. Publicar backend e frontend da fase 4.
4. `014_notification_cron.sql`
5. `015_remove_appointment_reminder_flag.sql`

A `014` agenda o Cron, mas ele não chama endereço algum enquanto os segredos
esperados não existirem no Supabase Vault.

### Gerar as chaves VAPID

No backend, depois de instalar `requirements.txt`:

```powershell
cd D:\cardio-care\backend
.\venv\Scripts\vapid.exe --gen
.\venv\Scripts\vapid.exe --applicationServerKey --private-key private_key.pem
```

O primeiro comando cria a chave privada. O segundo imprime a chave pública
`applicationServerKey`. Arquivos `.pem` estão ignorados pelo Git e devem ser
armazenados no gerenciador de segredos do ambiente.

Configuração do backend:

```env
WEB_PUSH_VAPID_PUBLIC_KEY=<applicationServerKey>
WEB_PUSH_VAPID_PRIVATE_KEY=<caminho-ou-segredo-da-chave-privada>
WEB_PUSH_VAPID_SUBJECT=mailto:contato@dominio.com.br
WEB_PUSH_VAPID_KEY_VERSION=1
SUPABASE_SERVICE_ROLE_KEY=<somente-no-backend>
NOTIFICATION_DISPATCH_TOKEN=<segredo-aleatorio-longo>
```

A service role só é injetada no dispatcher. Endpoints de pacientes continuam
usando JWT e RLS.

### Ativar o Cron no Supabase

Depois que o backend estiver publicado em HTTPS, crie os segredos pelo SQL
Editor ou pela interface do Vault:

```sql
select vault.create_secret(
  'https://api.exemplo.com',
  'notification_dispatch_url'
);

select vault.create_secret(
  '<mesmo valor de NOTIFICATION_DISPATCH_TOKEN>',
  'notification_dispatch_token'
);
```

Não coloque barra final na URL. O job `oralcardio-notification-dispatch` chama
`/internal/v1/notifications/dispatch` a cada minuto.

### Validação

1. Use uma origem HTTPS estável; `localhost` só é seguro no mesmo dispositivo.
2. Aplique as migrações e configure VAPID/dispatcher.
3. Ative notificações em **Perfil → Configurar notificações**.
4. Use **Enviar notificação de teste**.
5. Feche a PWA e valide a entrega em segundo plano.
6. Valide em Chrome Android e em uma PWA adicionada à tela inicial no iPhone.

Para testar em um iPhone físico durante desenvolvimento, use staging HTTPS ou
um túnel HTTPS estável. Trocar a origem invalida a associação com o service
worker e exige nova inscrição.

Testes automatizados:

```powershell
cd D:\cardio-care\backend
.\venv\Scripts\python.exe -m pytest
.\venv\Scripts\python.exe -m ruff check app tests

cd D:\cardio-care\frontend
npm test
npm run lint
npm run build

psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/tests/002_notifications.sql
```

### Operação e segurança

- Nunca registre endpoint, `p256dh`, `auth`, service role ou chave VAPID.
- Monitore idade do job pendente mais antigo, retries, dead letters e heartbeat
  do Cron.
- Jobs enviados/suprimidos têm retenção de 90 dias; mortos, 180 dias.
- Para interromper entregas sem perder dados, desative o job Cron ou remova os
  dois segredos do Vault.
- Ao rotacionar VAPID, incremente `WEB_PUSH_VAPID_KEY_VERSION`; subscriptions
  antigas deverão ser renovadas.

## Referências oficiais

- [WebKit — Web Push para web apps no iOS e iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [MDN — Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MDN — uso da Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)
- [Vite PWA — service worker com injectManifest](https://vite-pwa-org.netlify.app/guide/inject-manifest)
- [Supabase — Cron](https://supabase.com/docs/guides/cron)
