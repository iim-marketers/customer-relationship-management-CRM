# CRM — one CRM, many projects

A multi-project CRM built with **Next.js 16**, **Tailwind CSS v4**, **shadcn/ui** and **Supabase**.
Each project (a clinic, a client, a brand…) gets its own isolated CRM: pipeline, team, branches,
settings and a branded login page. One person can belong to many projects and switch between them.

## Features

| Area | What it does |
| --- | --- |
| **Sign up** | One form: project name, industry, your name, email, password. A database trigger creates the project with a default pipeline, lead sources and branch. |
| **Login** | `/login` (all projects) and a branded `/p/<slug>/login` per project that only lets that project's members in. |
| **Dashboard** | KPIs, stage pipeline, repeat enquiries, follow-up queue, upcoming appointments, newest leads. |
| **To-Do** | Week strip, overdue section, follow-ups + tasks per day, stage chips, snooze. |
| **Leads** | Kanban with drag-and-drop between stages, or a paginated list. Filters for status, branch, assignee, source, service and date range. Same phone number = repeat enquiry, not a duplicate. |
| **Lead detail** | Stage pills, follow-up scheduler, activity timeline + notes, appointments, tasks, calls, convert to customer. |
| **Appointments** | Day view with week strip, booking, status changes, reschedule. Marking a no-show moves the lead to "No Show". |
| **Customers** | Renamed per project (Patients, Clients, Students…). List + detail with appointments and call history. |
| **Call logs** | Calls with status, agent, duration and recording, plus "create lead from call". |
| **Reports** | Conversion funnel, source breakdown, leads over time, service mix, team performance. |
| **Settings** | Project profile and branding, users and roles, branches, pipeline stages, lead sources, services, API key. |
| **Webhook** | `POST /api/v1/leads` with a per-project API key, for website forms, Meta/Google Ads and Zapier. |

Roles: **owner** (everything, including deleting the project), **admin** (settings and team),
**manager** (can also delete records) and **agent** (works leads).

## Setup

### 1. Create a Supabase project
Create one at [supabase.com](https://supabase.com). Then open **SQL Editor**, paste the whole of
[`supabase/migrations/20261126000000_init.sql`](supabase/migrations/20261126000000_init.sql), and run it.
If you use the Supabase CLI, run `supabase link` and then `supabase db push` instead.

### 2. Configure Auth
In **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (your production URL later)
- **Redirect URLs**: add `http://localhost:3000/auth/confirm`

Optional: for the fastest local testing, turn off **Authentication → Providers → Email → Confirm email**.
Sign-up then takes you straight into your new project. With it on, users confirm by email first.
Their project is already created and waiting.

### 3. Environment
```bash
cp .env.example .env
```
Copy the values from **Project Settings → API Keys**:

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Everything |
| `SUPABASE_SECRET_KEY` | Adding team members (it creates their login) and the lead webhook. Server-only, so never expose it. |
| `DATABASE_URL` | `npm run db:migrate` (Supabase CLI). Not used by the app at runtime. |
| `NEXT_PUBLIC_SITE_URL` | Links in confirmation emails |

### 4. Run
```bash
npm install
npm run dev
```
Open http://localhost:3000, click **Create project**, and you're in.

### 5. (Optional) Demo data
Open [`supabase/seed-demo.sql`](supabase/seed-demo.sql) and set `v_slug` to your project's slug.
Run it in the SQL Editor. It adds about 150 leads, follow-ups, appointments, tasks and calls, so every screen has something to show.

## Sending leads in (webhook)

Each project has an API key, found under **Settings → Integrations / API**.

```bash
curl -X POST http://localhost:3000/api/v1/leads \
  -H "x-api-key: <project api key>" \
  -H "content-type: application/json" \
  -d '{"name":"Raksha","phone":"+91 97439 17025","source":"Meta Ads","service":"Consultation","notes":"Back pain"}'
```

The webhook accepts JSON or form posts and common field aliases (`full_name`, `phone_number`,
`message`, `utm_source`, `campaign`…). A phone number that already exists in the project counts as a repeat enquiry on the existing lead.

## How multi-tenancy works

- Every business table has a `project_id`. **Row Level Security** limits every row to active members of
  that project through the `is_member()` / `is_admin()` helpers. One database safely serves all projects.
- URLs are `/p/<project-slug>/...`. The server checks membership on every page and every server action,
  and RLS checks it again in the database.
- `src/proxy.ts` (Next 16's replacement for `middleware.ts`) refreshes the Supabase session and sends
  signed-out visitors to the right login page.
- Aggregates (`dashboard_stats`, `report_stats`) are SQL functions that run with the caller's
  permissions, so they obey RLS too.

## Project layout

```
supabase/migrations/      schema, RLS, triggers, RPCs
supabase/seed-demo.sql    optional demo data
scripts/test-schema.mjs   schema + RLS tests in in-process Postgres (npm run test:db)
src/proxy.ts              session refresh + auth redirects
src/lib/project.ts        data access layer: auth + project membership + lookups
src/lib/dates.ts          timezone-aware date helpers (each project has a timezone)
src/app/(auth)/           login, signup, auth actions
src/app/projects/         project picker + "new project"
src/app/p/[slug]/login    branded per-project login
src/app/p/[slug]/(crm)/   the CRM: dashboard, todo, leads, appointments, contacts,
                          call-logs, reports, settings, search (+ actions.ts)
src/app/api/v1/leads      lead-capture webhook
src/components/crm/       shared CRM UI (shell, filters, dialogs, badges…)
src/components/ui/        shadcn/ui components
```

## Notes

- **Cache Components** is enabled (the Next 16 default). Pages read the session inside
  `<Suspense>` boundaries, so the shell streams instantly and data fills in.
- Rename the product by changing "CRM" in `src/components/brand.tsx`, `src/components/site/site-header.tsx` (landing-page wordmark) and `src/app/layout.tsx`.
- Each project's colour, logo and contact label ("Patients", "Clients"…) are set in **Settings → Project profile**.
