/* eslint-disable @typescript-eslint/no-unused-expressions -- terse `cond ? ok() : fail()` assertions */
// Smoke-tests the Supabase migration against an in-process Postgres (PGlite),
// with a minimal stand-in for Supabase's auth schema. Run: node scripts/test-schema.mjs
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";

const db = new PGlite({ extensions: { pgcrypto } });
const ok = (m) => console.log("  ✓", m);
const fail = (m) => { console.error("  ✗", m); process.exitCode = 1; };

await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
`);
for (const f of readdirSync("supabase/migrations").sort()) {
  await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
  ok(`applied ${f}`);
}
await db.exec(`grant all on all tables in schema public to authenticated, service_role; grant select on all tables in schema public to anon;`);

const asUser = async (uid, sql, params) => {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false); select set_config('request.jwt.claim.role', 'authenticated', false);`);
  try { return await db.query(sql, params); } finally { await db.exec(`reset role;`); }
};

// Signup creates profile + project
const { rows: [alice] } = await db.query(`insert into auth.users (email, raw_user_meta_data) values ('alice@x.com', '{"full_name":"Alice","project_name":"Adyant Ayurveda","contact_label":"Patients"}') returning id`);
const { rows: [bob] } = await db.query(`insert into auth.users (email, raw_user_meta_data) values ('bob@y.com', '{"full_name":"Bob","project_name":"Adyant Ayurveda"}') returning id`);
const { rows: projects } = await db.query(`select slug, contact_label from projects order by created_at`);
projects.length === 2 && projects[0].slug === "adyant-ayurveda" && projects[1].slug.startsWith("adyant-ayurveda-") ? ok(`signup created projects ${projects.map(p=>p.slug).join(", ")}`) : fail(JSON.stringify(projects));

const pa = (await db.query(`select id from projects where created_by=$1`, [alice.id])).rows[0].id;


// Isolation
const seen = await asUser(alice.id, `select id from projects`);
seen.rows.length === 1 && seen.rows[0].id === pa ? ok("alice sees only her project") : fail("isolation broken: " + JSON.stringify(seen.rows));
const st = await asUser(bob.id, `select count(*)::int n from lead_stages where project_id=$1`, [pa]);
st.rows[0].n === 0 ? ok("bob can't read alice's stages") : fail("stages leak");

// capture_lead + repeat detection
const r1 = await asUser(alice.id, `select capture_lead($1, 'Raksha', '+91 97439 17025', null, 'Meta Ads', 'Massage') as r`, [pa]);
const r2 = await asUser(alice.id, `select capture_lead($1, 'Raksha again', '9743917025', null, 'Website') as r`, [pa]);
r2.rows[0].r.repeat && r2.rows[0].r.id === r1.rows[0].r.id ? ok("repeat enquiry detected by phone") : fail(JSON.stringify([r1.rows, r2.rows]));
try { await asUser(bob.id, `select capture_lead($1, 'Hacker', '1234567890')`, [pa]); fail("bob captured into alice's project"); } catch { ok("capture_lead rejects non-members"); }

// stage change logs activity, convert_lead
const leadId = r1.rows[0].r.id;
await asUser(alice.id, `update leads set stage_id = (select id from lead_stages where project_id=$1 and name='Follow-up') where id=$2`, [pa, leadId]);
const contactId = (await asUser(alice.id, `select convert_lead($1) as c`, [leadId])).rows[0].c;
const acts = await asUser(alice.id, `select type, body from lead_activities where lead_id=$1 order by created_at`, [leadId]);
acts.rows.filter(a => a.type === "stage_change").length === 2 ? ok("stage changes logged: " + acts.rows.map(a=>a.body).join(" | ")) : fail(JSON.stringify(acts.rows));
contactId ? ok("lead converted to contact") : fail("convert failed");

// stats
const ds = (await asUser(alice.id, `select dashboard_stats($1) as s`, [pa])).rows[0].s;
ds.total_leads === 1 && ds.converted === 1 && ds.stages.length === 7 ? ok("dashboard_stats") : fail(JSON.stringify(ds));
const rs = (await asUser(alice.id, `select report_stats($1) as s`, [pa])).rows[0].s;
rs.sources.length >= 1 && rs.daily.length === 1 ? ok("report_stats") : fail(JSON.stringify(rs));
const leak = (await asUser(bob.id, `select dashboard_stats($1) as s`, [pa])).rows[0].s;
leak.total_leads === 0 ? ok("stats obey RLS for outsiders") : fail("stats leak");

// owner protection + secrets
try { await asUser(alice.id, `update project_members set role='agent' where project_id=$1 and user_id=$2`, [pa, alice.id]); fail("last owner demoted"); } catch { ok("last owner protected"); }
const sec = await asUser(bob.id, `select count(*)::int n from project_secrets where project_id=$1`, [pa]);
sec.rows[0].n === 0 ? ok("secrets hidden from outsiders") : fail("secret leak");

// create_project RPC + delete cascade
const np = (await asUser(alice.id, `select (create_project('Second Clinic')).slug as s`)).rows[0].s;
np === "second-clinic" ? ok("create_project rpc") : fail(np);
await asUser(alice.id, `delete from projects where slug='second-clinic'`);
(await db.query(`select count(*)::int n from projects where slug='second-clinic'`)).rows[0].n === 0 ? ok("owner can delete project (cascade passes owner guard)") : fail("delete failed");
await db.query(`delete from auth.users where id=$1`, [bob.id]);
ok("deleting a user cascades cleanly");

const br = await db.query(`select * from get_project_branding('adyant-ayurveda')`);
br.rows[0]?.name === "Adyant Ayurveda" ? ok("public branding lookup") : fail("branding");
// Demo seed script runs cleanly against the schema
const seed = readFileSync("supabase/seed-demo.sql", "utf8").replaceAll("'your-project-slug'", "'adyant-ayurveda'");
await db.exec(seed);
const counts = (await db.query(`select (select count(*) from leads)::int l, (select count(*) from contacts)::int c,
  (select count(*) from appointments)::int a, (select count(*) from call_logs)::int k, (select count(*) from tasks)::int t`)).rows[0];
counts.l > 100 && counts.c > 0 && counts.a > 0 && counts.k > 0 ? ok(`demo seed: ${JSON.stringify(counts)}`) : fail("seed " + JSON.stringify(counts));
const after = (await asUser(alice.id, `select dashboard_stats($1) as s`, [pa])).rows[0].s;
after.total_leads > 100 ? ok(`dashboard after seed: ${after.total_leads} leads, ${after.converted} converted, ${after.no_show} no-shows`) : fail("stats after seed");

console.log(process.exitCode ? "\nFAILED" : "\nAll schema checks passed");
