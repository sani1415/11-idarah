-- Madrasa kormosuchi: database-backed program ledger.

create schema if not exists private;

create table if not exists public.mdr_programs (
  id text primary key,
  name text not null,
  status text not null default 'চলমান',
  program_date date,
  note text not null default '',
  income_types text[] not null default array['আয়','অনুদান','অন্যান্য']::text[],
  expense_types text[] not null default array['ব্যয়','অন্যান্য']::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.shared_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mdr_program_incomes (
  id text primary key,
  program_id text not null references public.mdr_programs(id) on delete cascade,
  entry_date date,
  type text not null default '',
  person_type text not null default '',
  name text not null default '',
  share numeric(14,3) not null default 0 check (share >= 0),
  amount numeric(14,2) not null check (amount >= 0),
  ref text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.shared_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mdr_program_expenses (
  id text primary key,
  program_id text not null references public.mdr_programs(id) on delete cascade,
  entry_date date,
  type text not null default '',
  amount numeric(14,2) not null check (amount >= 0),
  note text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.shared_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mdr-program-receipts',
  'mdr-program-receipts',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.mdr_program_expense_attachments (
  id text primary key,
  program_id text not null references public.mdr_programs(id) on delete cascade,
  expense_id text not null references public.mdr_program_expenses(id) on delete cascade,
  bucket_id text not null default 'mdr-program-receipts',
  storage_path text not null unique,
  file_name text not null default '',
  mime_type text not null default '',
  file_size bigint not null default 0 check (file_size >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.shared_users(id),
  created_at timestamptz not null default now()
);

create index if not exists mdr_program_incomes_program_date_idx on public.mdr_program_incomes (program_id, entry_date, created_at);
create index if not exists mdr_program_expenses_program_date_idx on public.mdr_program_expenses (program_id, entry_date, created_at);
create index if not exists mdr_programs_status_idx on public.mdr_programs (status, created_at);
create index if not exists mdr_program_expense_attachments_expense_idx on public.mdr_program_expense_attachments (expense_id, created_at);

alter table public.mdr_programs enable row level security;
alter table public.mdr_program_incomes enable row level security;
alter table public.mdr_program_expenses enable row level security;
alter table public.mdr_program_expense_attachments enable row level security;

drop policy if exists "deny_all_mdr_programs" on public.mdr_programs;
create policy "deny_all_mdr_programs" on public.mdr_programs for all using (false) with check (false);
drop policy if exists "deny_all_mdr_program_incomes" on public.mdr_program_incomes;
create policy "deny_all_mdr_program_incomes" on public.mdr_program_incomes for all using (false) with check (false);
drop policy if exists "deny_all_mdr_program_expenses" on public.mdr_program_expenses;
create policy "deny_all_mdr_program_expenses" on public.mdr_program_expenses for all using (false) with check (false);
drop policy if exists "deny_all_mdr_program_expense_attachments" on public.mdr_program_expense_attachments;
create policy "deny_all_mdr_program_expense_attachments" on public.mdr_program_expense_attachments for all using (false) with check (false);

drop policy if exists "anon_insert_mdr_program_receipts" on storage.objects;
create policy "anon_insert_mdr_program_receipts" on storage.objects
for insert to anon
with check (bucket_id = 'mdr-program-receipts');

drop policy if exists "anon_select_mdr_program_receipts" on storage.objects;
create policy "anon_select_mdr_program_receipts" on storage.objects
for select to anon
using (bucket_id = 'mdr-program-receipts');

drop policy if exists "anon_delete_mdr_program_receipts" on storage.objects;
create policy "anon_delete_mdr_program_receipts" on storage.objects
for delete to anon
using (bucket_id = 'mdr-program-receipts');

create or replace function private.mdr_program_actor(
  p_actor_id uuid,
  p_pin text,
  p_allow_admin boolean default true
)
returns public.shared_users
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
begin
  select * into v_actor
  from public.shared_users u
  where u.is_active = true
    and u.pin = p_pin
    and (p_actor_id is null or u.id = p_actor_id)
    and (
      u.role = 'daftar'
      or (p_allow_admin and u.role = 'admin')
    )
  order by case when p_actor_id is not null and u.id = p_actor_id then 0 else 1 end, u.created_at
  limit 1;

  return v_actor;
end;
$$;

create or replace function public.mdr_rel_programs_bootstrap(p_actor_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
begin
  v_actor := private.mdr_program_actor(p_actor_id, p_pin, true);
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  return jsonb_build_object(
    'ok', true,
    'read_only', v_actor.role = 'admin',
    'programs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'status', p.status,
        'date', coalesce(p.program_date::text, ''),
        'note', p.note,
        'shareEnabled', coalesce((p.metadata->>'shareEnabled')::boolean, false),
        'incomeTypes', to_jsonb(p.income_types),
        'expenseTypes', to_jsonb(p.expense_types),
        '_at', floor(extract(epoch from p.created_at) * 1000)::bigint,
        '_updatedAt', floor(extract(epoch from p.updated_at) * 1000)::bigint
      ) order by p.created_at, p.id)
      from public.mdr_programs p
    ), '[]'::jsonb),
    'income', coalesce((
      select jsonb_object_agg(program_id, rows)
      from (
        select i.program_id, jsonb_agg(jsonb_build_object(
          'id', i.id,
          'date', coalesce(i.entry_date::text, ''),
          'type', i.type,
          'personType', i.person_type,
          'name', i.name,
          'studentId', coalesce(i.metadata->>'studentId', ''),
          'studentPermanentId', coalesce(i.metadata->>'studentPermanentId', ''),
          'studentClassId', coalesce(i.metadata->>'studentClassId', ''),
          'share', i.share,
          'amount', i.amount,
          'ref', i.ref,
          '_at', floor(extract(epoch from i.created_at) * 1000)::bigint,
          '_updatedAt', floor(extract(epoch from i.updated_at) * 1000)::bigint
        ) order by i.entry_date nulls last, i.created_at, i.id) as rows
        from public.mdr_program_incomes i
        group by i.program_id
      ) s
    ), '{}'::jsonb),
    'expense', coalesce((
      select jsonb_object_agg(program_id, rows)
      from (
        select e.program_id, jsonb_agg(jsonb_build_object(
          'id', e.id,
          'date', coalesce(e.entry_date::text, ''),
          'type', e.type,
          'amount', e.amount,
          'note', e.note,
          '_at', floor(extract(epoch from e.created_at) * 1000)::bigint,
          '_updatedAt', floor(extract(epoch from e.updated_at) * 1000)::bigint
        ) order by e.entry_date nulls last, e.created_at, e.id) as rows
        from public.mdr_program_expenses e
        group by e.program_id
      ) s
    ), '{}'::jsonb),
    'attachments', coalesce((
      select jsonb_object_agg(expense_id, rows)
      from (
        select a.expense_id, jsonb_agg(jsonb_build_object(
          'id', a.id,
          'programId', a.program_id,
          'expenseId', a.expense_id,
          'bucketId', a.bucket_id,
          'storagePath', a.storage_path,
          'fileName', a.file_name,
          'mimeType', a.mime_type,
          'fileSize', a.file_size,
          '_at', floor(extract(epoch from a.created_at) * 1000)::bigint
        ) order by a.created_at, a.id) as rows
        from public.mdr_program_expense_attachments a
        group by a.expense_id
      ) s
    ), '{}'::jsonb)
  );
end;
$$;

create or replace function public.mdr_rel_program_upsert(p_actor_id uuid, p_pin text, p_program jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_id text;
  v_name text;
  v_income_types text[];
  v_expense_types text[];
begin
  v_actor := private.mdr_program_actor(p_actor_id, p_pin, false);
  if v_actor.id is null then return jsonb_build_object('ok', false, 'error', 'invalid_actor'); end if;
  if p_program is null or jsonb_typeof(p_program) <> 'object' then return jsonb_build_object('ok', false, 'error', 'invalid_payload'); end if;

  v_name := nullif(btrim(coalesce(p_program->>'name', '')), '');
  if v_name is null then return jsonb_build_object('ok', false, 'error', 'name_required'); end if;

  v_id := coalesce(nullif(p_program->>'id', ''), 'prog-' || replace(gen_random_uuid()::text, '-', ''));

  select array(
    select btrim(value)
    from jsonb_array_elements_text(case when jsonb_typeof(p_program->'incomeTypes') = 'array' then p_program->'incomeTypes' else '[]'::jsonb end) as t(value)
    where btrim(value) <> ''
  ) into v_income_types;
  if coalesce(array_length(v_income_types, 1), 0) = 0 then
    v_income_types := array['আয়','অনুদান','অন্যান্য']::text[];
  end if;

  select array(
    select btrim(value)
    from jsonb_array_elements_text(case when jsonb_typeof(p_program->'expenseTypes') = 'array' then p_program->'expenseTypes' else '[]'::jsonb end) as t(value)
    where btrim(value) <> ''
  ) into v_expense_types;
  if coalesce(array_length(v_expense_types, 1), 0) = 0 then
    v_expense_types := array['ব্যয়','অন্যান্য']::text[];
  end if;

  insert into public.mdr_programs (id, name, status, program_date, note, income_types, expense_types, metadata, created_by, updated_at)
  values (
    v_id,
    v_name,
    coalesce(nullif(p_program->>'status', ''), 'চলমান'),
    nullif(p_program->>'date', '')::date,
    coalesce(p_program->>'note', ''),
    v_income_types,
    v_expense_types,
    coalesce(p_program - array['id','name','status','date','note','incomeTypes','expenseTypes'], '{}'::jsonb),
    v_actor.id,
    now()
  )
  on conflict (id) do update set
    name = excluded.name,
    status = excluded.status,
    program_date = excluded.program_date,
    note = excluded.note,
    income_types = excluded.income_types,
    expense_types = excluded.expense_types,
    metadata = public.mdr_programs.metadata || excluded.metadata,
    updated_at = now();

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.mdr_rel_program_delete(p_actor_id uuid, p_pin text, p_program_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_deleted int;
begin
  v_actor := private.mdr_program_actor(p_actor_id, p_pin, false);
  if v_actor.id is null then return jsonb_build_object('ok', false, 'error', 'invalid_actor'); end if;

  delete from public.mdr_programs where id = p_program_id;
  get diagnostics v_deleted = ROW_COUNT;
  if v_deleted < 1 then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.mdr_rel_program_upsert_income(p_actor_id uuid, p_pin text, p_entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_id text;
  v_program_id text;
begin
  v_actor := private.mdr_program_actor(p_actor_id, p_pin, false);
  if v_actor.id is null then return jsonb_build_object('ok', false, 'error', 'invalid_actor'); end if;
  if p_entry is null or jsonb_typeof(p_entry) <> 'object' then return jsonb_build_object('ok', false, 'error', 'invalid_payload'); end if;

  v_program_id := nullif(p_entry->>'programId', '');
  if v_program_id is null or not exists (select 1 from public.mdr_programs p where p.id = v_program_id) then
    return jsonb_build_object('ok', false, 'error', 'program_not_found');
  end if;

  v_id := coalesce(nullif(p_entry->>'id', ''), 'pinc-' || replace(gen_random_uuid()::text, '-', ''));
  insert into public.mdr_program_incomes (id, program_id, entry_date, type, person_type, name, share, amount, ref, metadata, created_by, updated_at)
  values (
    v_id,
    v_program_id,
    nullif(p_entry->>'date', '')::date,
    coalesce(p_entry->>'type', ''),
    coalesce(p_entry->>'personType', ''),
    coalesce(p_entry->>'name', ''),
    greatest(coalesce(nullif(p_entry->>'share', '')::numeric, 0), 0),
    greatest(coalesce(nullif(p_entry->>'amount', '')::numeric, 0), 0),
    coalesce(p_entry->>'ref', ''),
    coalesce(p_entry - array['id','programId','date','type','personType','name','share','amount','ref'], '{}'::jsonb),
    v_actor.id,
    now()
  )
  on conflict (id) do update set
    program_id = excluded.program_id,
    entry_date = excluded.entry_date,
    type = excluded.type,
    person_type = excluded.person_type,
    name = excluded.name,
    share = excluded.share,
    amount = excluded.amount,
    ref = excluded.ref,
    metadata = public.mdr_program_incomes.metadata || excluded.metadata,
    updated_at = now();

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.mdr_rel_program_upsert_expense(p_actor_id uuid, p_pin text, p_entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_id text;
  v_program_id text;
begin
  v_actor := private.mdr_program_actor(p_actor_id, p_pin, false);
  if v_actor.id is null then return jsonb_build_object('ok', false, 'error', 'invalid_actor'); end if;
  if p_entry is null or jsonb_typeof(p_entry) <> 'object' then return jsonb_build_object('ok', false, 'error', 'invalid_payload'); end if;

  v_program_id := nullif(p_entry->>'programId', '');
  if v_program_id is null or not exists (select 1 from public.mdr_programs p where p.id = v_program_id) then
    return jsonb_build_object('ok', false, 'error', 'program_not_found');
  end if;

  v_id := coalesce(nullif(p_entry->>'id', ''), 'pexp-' || replace(gen_random_uuid()::text, '-', ''));
  insert into public.mdr_program_expenses (id, program_id, entry_date, type, amount, note, metadata, created_by, updated_at)
  values (
    v_id,
    v_program_id,
    nullif(p_entry->>'date', '')::date,
    coalesce(p_entry->>'type', ''),
    greatest(coalesce(nullif(p_entry->>'amount', '')::numeric, 0), 0),
    coalesce(p_entry->>'note', ''),
    coalesce(p_entry - array['id','programId','date','type','amount','note'], '{}'::jsonb),
    v_actor.id,
    now()
  )
  on conflict (id) do update set
    program_id = excluded.program_id,
    entry_date = excluded.entry_date,
    type = excluded.type,
    amount = excluded.amount,
    note = excluded.note,
    metadata = public.mdr_program_expenses.metadata || excluded.metadata,
    updated_at = now();

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.mdr_rel_program_delete_entry(p_actor_id uuid, p_pin text, p_type text, p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_deleted int;
begin
  v_actor := private.mdr_program_actor(p_actor_id, p_pin, false);
  if v_actor.id is null then return jsonb_build_object('ok', false, 'error', 'invalid_actor'); end if;

  if p_type = 'income' then
    delete from public.mdr_program_incomes where id = p_id;
  elsif p_type = 'expense' then
    delete from public.mdr_program_expenses where id = p_id;
  else
    return jsonb_build_object('ok', false, 'error', 'invalid_type');
  end if;

  get diagnostics v_deleted = ROW_COUNT;
  if v_deleted < 1 then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.mdr_rel_program_add_expense_attachment(p_actor_id uuid, p_pin text, p_attachment jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_expense public.mdr_program_expenses%rowtype;
  v_id text;
  v_path text;
begin
  v_actor := private.mdr_program_actor(p_actor_id, p_pin, false);
  if v_actor.id is null then return jsonb_build_object('ok', false, 'error', 'invalid_actor'); end if;
  if p_attachment is null or jsonb_typeof(p_attachment) <> 'object' then return jsonb_build_object('ok', false, 'error', 'invalid_payload'); end if;

  select * into v_expense
  from public.mdr_program_expenses e
  where e.id = nullif(p_attachment->>'expenseId', '');
  if v_expense.id is null then return jsonb_build_object('ok', false, 'error', 'expense_not_found'); end if;

  v_path := nullif(btrim(coalesce(p_attachment->>'storagePath', '')), '');
  if v_path is null then return jsonb_build_object('ok', false, 'error', 'path_required'); end if;

  v_id := coalesce(nullif(p_attachment->>'id', ''), 'patt-' || replace(gen_random_uuid()::text, '-', ''));
  insert into public.mdr_program_expense_attachments (
    id, program_id, expense_id, bucket_id, storage_path, file_name, mime_type, file_size, metadata, created_by
  )
  values (
    v_id,
    v_expense.program_id,
    v_expense.id,
    coalesce(nullif(p_attachment->>'bucketId', ''), 'mdr-program-receipts'),
    v_path,
    coalesce(p_attachment->>'fileName', ''),
    coalesce(p_attachment->>'mimeType', ''),
    greatest(coalesce(nullif(p_attachment->>'fileSize', '')::bigint, 0), 0),
    coalesce(p_attachment - array['id','programId','expenseId','bucketId','storagePath','fileName','mimeType','fileSize'], '{}'::jsonb),
    v_actor.id
  )
  on conflict (id) do update set
    file_name = excluded.file_name,
    mime_type = excluded.mime_type,
    file_size = excluded.file_size,
    metadata = public.mdr_program_expense_attachments.metadata || excluded.metadata;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.mdr_rel_program_delete_expense_attachment(p_actor_id uuid, p_pin text, p_attachment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_path text;
begin
  v_actor := private.mdr_program_actor(p_actor_id, p_pin, false);
  if v_actor.id is null then return jsonb_build_object('ok', false, 'error', 'invalid_actor'); end if;

  delete from public.mdr_program_expense_attachments
  where id = p_attachment_id
  returning storage_path into v_path;

  if v_path is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true, 'storagePath', v_path);
end;
$$;

revoke execute on function private.mdr_program_actor(uuid, text, boolean) from public, anon, authenticated;

revoke execute on function public.mdr_rel_programs_bootstrap(uuid, text) from public, authenticated;
revoke execute on function public.mdr_rel_program_upsert(uuid, text, jsonb) from public, authenticated;
revoke execute on function public.mdr_rel_program_delete(uuid, text, text) from public, authenticated;
revoke execute on function public.mdr_rel_program_upsert_income(uuid, text, jsonb) from public, authenticated;
revoke execute on function public.mdr_rel_program_upsert_expense(uuid, text, jsonb) from public, authenticated;
revoke execute on function public.mdr_rel_program_delete_entry(uuid, text, text, text) from public, authenticated;
revoke execute on function public.mdr_rel_program_add_expense_attachment(uuid, text, jsonb) from public, authenticated;
revoke execute on function public.mdr_rel_program_delete_expense_attachment(uuid, text, text) from public, authenticated;

grant execute on function public.mdr_rel_programs_bootstrap(uuid, text) to anon;
grant execute on function public.mdr_rel_program_upsert(uuid, text, jsonb) to anon;
grant execute on function public.mdr_rel_program_delete(uuid, text, text) to anon;
grant execute on function public.mdr_rel_program_upsert_income(uuid, text, jsonb) to anon;
grant execute on function public.mdr_rel_program_upsert_expense(uuid, text, jsonb) to anon;
grant execute on function public.mdr_rel_program_delete_entry(uuid, text, text, text) to anon;
grant execute on function public.mdr_rel_program_add_expense_attachment(uuid, text, jsonb) to anon;
grant execute on function public.mdr_rel_program_delete_expense_attachment(uuid, text, text) to anon;
