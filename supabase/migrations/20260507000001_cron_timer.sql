-- Cron job para rodar o timer de inatividade todo dia às 3h da manhã
SELECT cron.schedule(
  'timer-inatividade-diario',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dvkafvepsujnehkyfhbp.supabase.co/functions/v1/timer-inatividade',
    headers := '{"Authorization": "Bearer ' || current_setting('app.supabase_service_key', true) || '"}'::jsonb
  );
  $$
);
