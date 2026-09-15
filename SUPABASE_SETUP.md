# Configuração segura do Supabase

1. Crie um projeto no Supabase e execute `supabase/migrations/20260827_initial_schema.sql` no SQL Editor.
2. No frontend, copie `ConectaLar Front/.env.example` para `.env.local` e preencha somente URL e chave publicável.
3. No backend, copie `ConectaLar Back/.env.example` para `.env`. A chave `SUPABASE_SERVICE_ROLE_KEY` nunca pode ir para o Git ou navegador.
4. No painel Supabase > Authentication > Password Security, configure mínimo de 12 caracteres, todos os grupos de caracteres e proteção contra senhas vazadas. Ative confirmação de e-mail e CAPTCHA.
5. Em Authentication > Rate Limits, configure os limites conforme seu plano; o backend também limita 100 requisições/IP a cada 15 minutos.
