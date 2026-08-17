# Testes de integração do banco

O script valida pontuação ilimitada, idempotência da conclusão, streak,
fronteira de meia-noite em São Paulo, revelação diferida, lease/acknowledge e
isolamento RLS no schema final.

Com o Supabase local iniciado e as migrações `001` a `011` aplicadas, execute
como o usuário administrativo do PostgreSQL:

```powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f database/tests/001_habits_achievements_and_rls.sql
```

O teste roda dentro de uma transação e termina com `ROLLBACK`. O papel
administrativo é necessário apenas para criar fixtures sem registros reais no
Supabase Auth; as asserções de RLS são executadas depois como `authenticated`.
