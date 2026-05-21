# Morey's Daily Report Tool

Internal operational reporting app for Morey's Piers.

## Local development
1. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL and anon key.
2. `npm install`
3. `npm run dev` then open http://localhost:3000

## Architecture
- Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
- Supabase: auth + Postgres + Row-Level Security + storage
- Vercel: deployment
- Snowflake: transaction/ticket metrics (server-only, Phase 6)
- Resend or SendGrid: email (Phase 4)
- Claude or OpenAI: AI summary (Phase 5)
- Server-side PDF generation (Phase 4)

## Database
All schema changes are tracked in `supabase/migrations/`.
Phase 1 schema is `0001_init.sql` — paste it into the Supabase SQL Editor to apply.

## Phases
- **Phase 1** Supabase + auth + roles + categories + terminals
- **Phase 2** Floating widget + report CRUD + PIN mode
- **Phase 3** Supervisor dashboard + Daily Report builder
- **Phase 4** PDF generation + email delivery
- **Phase 5** Weather + AI summary
- **Phase 6** Snowflake metrics
- **Phase 7** Scheduled automation + seasonal toggle
- **Phase 8** Deployment + QA
