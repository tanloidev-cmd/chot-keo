# Database tests

RLS and schema checks are implemented as executable scripts so they can run
without a Docker daemon:

```bash
npm run test:rls
```

- `scripts/validate-sql.mjs` applies every migration to an in-process PGlite
  database with minimal `auth`/`storage` stubs. It catches SQL syntax/order
  errors.
- `scripts/test-rls.mjs` seeds users/groups/meetups and switches the
  `authenticated` role with JWT claims. It checks cross-group isolation, invite
  limits, private cancellation reasons, RSVP ownership and audit visibility.
- `scripts/test-concurrency.mjs` uses two Supabase clients against a running
  project to race invite redemption and meetup confirmation.

For pgTAP against a real Supabase stack, run `supabase start`, then
`supabase test db`. The Node scripts above are the required gate for this MVP
because they also exercise the RPC layer used by the app.
