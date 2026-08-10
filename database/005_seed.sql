-- =============================================================================
-- CardioCare Connect — 005: Seed (dados de configuração)
-- Depende de 002_schema.sql. Idempotente: pode ser reexecutado com segurança.
-- =============================================================================

insert into public.achievements (name, description, icon, condition_type, condition_value, points_reward)
values
  ('Primeira Escovação', '1ª sessão de escovação completada', '🦷', 'brushing_count', 1, 10),
  ('Semana Perfeita', 'Streak de 7 dias seguidos escovando', '🔥', 'streak_days', 7, 50),
  ('Mês Dedicado', 'Streak de 30 dias seguidos escovando', '🏆', 'streak_days', 30, 200),
  ('Primeira Leitura', '1º módulo educacional concluído', '📚', 'module_completed', 1, 15),
  ('Estudante Assíduo', 'Todos os módulos educacionais concluídos', '🎓', 'all_modules_completed', 1, 100),
  ('Agenda Organizada', '1ª consulta odontológica agendada', '📅', 'appointment_scheduled', 1, 20),
  ('Perfil Completo', 'Perfil de saúde preenchido por completo', '✅', 'health_profile_completed', 1, 25),
  ('50 Escovações', '50 sessões de escovação totais', '⭐', 'brushing_count', 50, 75),
  ('100 Escovações', '100 sessões de escovação totais', '💎', 'brushing_count', 100, 150),
  ('Fio Dental Frequente', '30 registros de uso de fio dental', '🪥', 'flossing_count', 30, 60)
on conflict do nothing;

insert into public.education_modules (title, slug, description, content, category, order_index, estimated_minutes)
values
  (
    'A Conexão Entre Boca e Coração',
    'conexao-boca-coracao',
    'Entenda por que a saúde bucal é tão importante para quem tem uma condição cardíaca.',
    '{"sections": [{"type": "text", "title": "Por que isso importa?", "body": "Bactérias da boca podem alcançar a corrente sanguínea e afetar o coração, especialmente em pacientes cardíacos."}]}'::jsonb,
    'mouth_heart_connection',
    1,
    5
  ),
  (
    'O Que é Bacteremia?',
    'o-que-e-bacteremia',
    'Como bactérias orais entram na corrente sanguínea e por que isso é um risco.',
    '{"sections": [{"type": "text", "title": "Bacteremia", "body": "Bacteremia é a presença de bactérias na corrente sanguínea, que pode ocorrer após procedimentos odontológicos ou má higiene bucal."}]}'::jsonb,
    'bacteremia',
    2,
    4
  ),
  (
    'Entendendo a Endocardite Infecciosa',
    'entendendo-endocardite',
    'O que é endocardite, seus riscos e como preveni-la.',
    '{"sections": [{"type": "text", "title": "O que é endocardite?", "body": "Endocardite é uma infecção grave do revestimento interno do coração, frequentemente ligada a bactérias orais."}]}'::jsonb,
    'endocarditis',
    3,
    6
  ),
  (
    'Gengivite: Um Risco Silencioso',
    'gengivite-risco-silencioso',
    'Por que a gengivite exige atenção redobrada em pacientes cardíacos.',
    '{"sections": [{"type": "text", "title": "Gengivite e coração", "body": "A inflamação da gengiva pode facilitar a entrada de bactérias na corrente sanguínea."}]}'::jsonb,
    'gingivitis',
    4,
    4
  ),
  (
    'Técnicas Corretas de Escovação e Fio Dental',
    'tecnicas-escovacao-fio-dental',
    'Aprenda a escovar os dentes e usar o fio dental corretamente.',
    '{"sections": [{"type": "text", "title": "Técnica correta", "body": "Escove por 2 minutos cobrindo todas as regiões da boca e use fio dental diariamente."}]}'::jsonb,
    'oral_hygiene_techniques',
    5,
    5
  ),
  (
    'Medicamentos Cardíacos e Odontologia',
    'medicamentos-cardiacos-odontologia',
    'Interações entre medicamentos cardíacos e tratamentos odontológicos.',
    '{"sections": [{"type": "text", "title": "Atenção às interações", "body": "Alguns medicamentos cardíacos exigem cuidados especiais antes de procedimentos odontológicos."}]}'::jsonb,
    'medication_interactions',
    6,
    5
  )
on conflict (slug) do nothing;