---
name: testing-admin-dashboards
description: End-to-end test the Ed_Vision admin dashboards (Certificate Overview, Usage Behavior, etc.) against a locally seeded database. Use when verifying any admin/dashboard/* page replaces mock data with real API data, or when fixing aggregation bugs in admin_be services.
---

# Testing the admin dashboards locally

The admin dashboards under `Ed_Vision/src/modules/admin/` are typically wired to NestJS endpoints in `ed_vision_backend/src/admin_be/`. Many recent PRs replace hard-coded mock data with real DB aggregates — to verify those, you need (1) backend + frontend running locally, (2) a populated DB, and (3) a way to compare what the API returns to what the UI renders.

## Local stack

Backend deps:
```
cd ed_vision_backend
npm install        # if not already
docker compose up -d   # spins up postgres:16, mongo:6, redis:7
npx prisma generate
npx prisma db push
node prisma/seed.js                    # core roles + admin
node prisma/seed-complete-database.js  # students/teachers/classes
npm run start:dev                      # NestJS :3000
```

Frontend:
```
cd Ed_Vision
npm install
VITE_API_BASE_URL=http://localhost:3000 npm run dev   # Vite :5173
```

If `npm install` fails on the frontend, retry once — peer-dep resolution is occasionally flaky.

## Admin login

- URL: `http://localhost:5173/auth/login`
- Email: `admin@dtu.edu.vn`
- Password: `admin123` (from `prisma/seed.js`; check the seed file if it changes)

The `admin` role's `ProtectedRoute` allows `/admin/*` via the role fallback even if the granular permission map fails to sync, so you don't need to debug permissions just to test a page.

## Schema gotcha — CertificateEnrollment has no account_id

The `CertificateEnrollment` table is keyed by `student_id`, NOT `account_id`. If a service writes raw SQL like:

```sql
SELECT account_id FROM "CertificateEnrollment"  -- BROKEN
```

Postgres throws `42703 column "account_id" does not exist`. A global try/catch in the service will then swallow the error and return an empty/zero payload — the UI shows all zeros and **looks like a frontend bug**. Always JOIN through `Student`:

```sql
SELECT s.account_id
  FROM "CertificateEnrollment" ce
  JOIN "Student" s ON s.student_id = ce.student_id
```

The same pattern applies for any aggregate that mixes `CertificateEnrollment` with `UserActivityLog` / `StudySession` (which DO have `account_id` directly).

## Quick API health check before opening the UI

After the backend starts, curl the endpoint with each timeRange variant before opening the browser. If all four return zero/empty payloads, suspect a SQL error and check the backend logs (`PrismaClientKnownRequestError`).

```bash
for t in this-month last-month this-quarter this-year; do
  echo "=== $t ==="
  curl -s "http://localhost:3000/admin/dashboard/certificate-overview?timeRange=$t" \
    | python3 -c "import sys, json; d=json.load(sys.stdin); print('totalStudents:', d['kpis']['totalStudents']['value'])"
done
```

## Adversarial UI test pattern for "real data instead of mocks" PRs

For any dashboard PR that claims to swap mocks for real data, run this five-step check (each step has a concrete pass/fail criterion):

1. **KPIs match DB, not mocks.** Hard-coded mocks are usually visually distinct (e.g. `12,480` vs the seed's `5`). If you see a round mock number, the API isn't wired.
2. **Time-range dropdown actually refetches.** Open the time-range / period dropdown and change it. KPI change chips, line/bar Y-axis ranges, and doughnut slice sizes should all visibly change. If they don't, the request is either cached, not fired, or ignoring the param.
3. **Stacked / multi-series charts have non-trivial shape.** Mocks were usually monotonic (e.g. `[145, 210, 285, 360]`). Real data on a small seed is rarely monotonic — verify the shape isn't just the old mock pattern.
4. **Activity / news feeds use DB-derived strings.** Mocks include specific recognizable phrases like `"15 sinh viên mới đăng ký IELTS"`. If you still see those literal strings, the rewire missed that section.
5. **Error UX exists.** Kill the backend (`shell action=kill` the backend shell, or `pkill -f nest`) and trigger a refetch. The page should show an error banner + retry button, NOT silently fall back to mocks or stay frozen forever.

## Recording

Before recording: maximize the browser with `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz` (do NOT use `xdotool key super+Up` — it tiles to half-screen on Ubuntu).

Annotate per Jest `it()` style: one `test_start` per scenario, one consolidated `assertion` per scenario. Include the *numeric* expected value in the assertion text so the recording is self-explanatory.

## Devin Secrets Needed

None for local testing — credentials come from `prisma/seed.js` (admin `password123` / `admin123`) and `.env` defaults. If a future test ever needs a staging DB, request `DATABASE_URL_STAGING` as a session secret.
