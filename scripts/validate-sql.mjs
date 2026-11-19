import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
import path from 'node:path'

const db = new PGlite()
await db.exec(`
  create schema if not exists auth;
  create schema if not exists storage;
  create schema if not exists extensions;
  create role anon;
  create role authenticated;
  create role service_role;
  create table auth.users (
    id uuid primary key,
    phone text,
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text not null,
    owner uuid,
    created_at timestamptz default now()
  );
  alter table storage.objects enable row level security;
  create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
    select string_to_array(name, '/')
  $$;
`)

const files = fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort()
for (const file of files) {
  const sql = fs.readFileSync(path.join('supabase/migrations', file), 'utf8')
  try {
    await db.exec(sql.replace(/create extension if not exists pgcrypto with schema extensions;/g, ''))
    console.log('OK', file)
  } catch (error) {
    console.error('FAIL', file)
    console.error(error.message)
    process.exitCode = 1
    break
  }
}
await db.close()
