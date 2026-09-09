# Testes de integração do banco

Os scripts validam pontuação ilimitada, idempotência da conclusão, streak,
fronteira de meia-noite em São Paulo, revelação diferida, preferências de
notificação, RLS de subscriptions, supressão, outbox, lease e reagendamento.

## CI

O workflow `Database quality` inicia um banco Supabase vazio, aplica todas as
migrations `database/NNN_*.sql` em ordem e executa todos os testes
`database/tests/NNN_*.sql`. Ele roda em pull requests e em pushes para `main`
quando arquivos do banco ou do próprio workflow são alterados.

O Supabase CLI fica fixado no workflow para que uma atualização automática da
ferramenta não mude o ambiente de teste sem revisão.

## Execução local

Com o Supabase local iniciado e as migrações `001` a `029` aplicadas, execute
como o usuário administrativo do PostgreSQL:

```powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/tests/001_habits_achievements_and_rls.sql
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/tests/002_notifications.sql
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/tests/003_backend_hardening.sql
```

O teste roda dentro de uma transação e termina com `ROLLBACK`. O papel
administrativo é necessário apenas para criar fixtures sem registros reais no
Supabase Auth; as asserções de RLS são executadas depois como `authenticated`.
