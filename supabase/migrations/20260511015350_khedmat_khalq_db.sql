-- Khedmat-e-Khalq database-backed module.
-- Public tables are RLS-denied; browser clients read/write through security-definer RPCs.

create table if not exists public.khedmat_beneficiaries (
  id text primary key,
  name text not null,
  address text,
  phone text,
  family_info text,
  notes text,
  first_contact date not null default current_date,
  created_by uuid references public.shared_users(id) on delete set null,
  updated_by uuid references public.shared_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.khedmat_activity_types (
  id text primary key,
  name text not null,
  emoji text not null default '🤝',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.shared_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.khedmat_activities (
  id text primary key,
  beneficiary_id text not null references public.khedmat_beneficiaries(id) on delete cascade,
  type_id text references public.khedmat_activity_types(id) on delete set null,
  title text not null,
  description text not null default '',
  amount numeric(12,2) not null default 0 check (amount >= 0),
  activity_date date not null default current_date,
  images jsonb not null default '[]'::jsonb,
  created_by uuid references public.shared_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.khedmat_daily_logs (
  id text primary key,
  content text not null,
  by_name text,
  log_date date not null default current_date,
  created_by uuid references public.shared_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.khedmat_finance (
  id text primary key,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  source text,
  activity_id text references public.khedmat_activities(id) on delete set null,
  txn_date date not null default current_date,
  created_by uuid references public.shared_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists khedmat_beneficiaries_first_contact_idx on public.khedmat_beneficiaries (first_contact desc, created_at desc);
create index if not exists khedmat_activities_beneficiary_date_idx on public.khedmat_activities (beneficiary_id, activity_date desc, created_at desc);
create index if not exists khedmat_daily_logs_date_idx on public.khedmat_daily_logs (log_date desc, created_at desc);
create index if not exists khedmat_finance_date_idx on public.khedmat_finance (txn_date desc, created_at desc);

alter table public.khedmat_beneficiaries enable row level security;
alter table public.khedmat_activity_types enable row level security;
alter table public.khedmat_activities enable row level security;
alter table public.khedmat_daily_logs enable row level security;
alter table public.khedmat_finance enable row level security;

drop policy if exists "deny_all_khedmat_beneficiaries" on public.khedmat_beneficiaries;
create policy "deny_all_khedmat_beneficiaries" on public.khedmat_beneficiaries for all using (false) with check (false);
drop policy if exists "deny_all_khedmat_activity_types" on public.khedmat_activity_types;
create policy "deny_all_khedmat_activity_types" on public.khedmat_activity_types for all using (false) with check (false);
drop policy if exists "deny_all_khedmat_activities" on public.khedmat_activities;
create policy "deny_all_khedmat_activities" on public.khedmat_activities for all using (false) with check (false);
drop policy if exists "deny_all_khedmat_daily_logs" on public.khedmat_daily_logs;
create policy "deny_all_khedmat_daily_logs" on public.khedmat_daily_logs for all using (false) with check (false);
drop policy if exists "deny_all_khedmat_finance" on public.khedmat_finance;
create policy "deny_all_khedmat_finance" on public.khedmat_finance for all using (false) with check (false);

insert into public.khedmat_activity_types (id, name, emoji, sort_order)
values
  ('at_food', 'খাদ্য সহায়তা', '🍲', 10),
  ('at_medical', 'চিকিৎসা সহায়তা', '💊', 20),
  ('at_cash', 'নগদ সহায়তা', '💵', 30),
  ('at_visit', 'খোঁজখবর', '🤝', 40)
on conflict (id) do nothing;

create or replace function private.verify_khedmat_actor(p_actor_id uuid, p_pin text)
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
    and u.role in ('admin', 'khedmat')
    and (
      (p_actor_id is not null and u.id = p_actor_id)
      or (p_actor_id is null and u.role = 'admin')
    )
  order by case when p_actor_id is not null and u.id = p_actor_id then 0 else 1 end, u.created_at
  limit 1;

  if v_actor.id is null then
    return null;
  end if;

  return v_actor;
end;
$$;

create or replace function private.khedmat_new_id(p_prefix text)
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(nullif(btrim(p_prefix), ''), 'kh') || '_' || left(replace(gen_random_uuid()::text, '-', ''), 16);
$$;

create or replace function public.khedmat_rel_bootstrap(p_actor_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
begin
  v_actor := private.verify_khedmat_actor(p_actor_id, p_pin);
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  return jsonb_build_object(
    'ok', true,
    'beneficiaries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'address', b.address,
        'phone', b.phone,
        'family_info', b.family_info,
        'notes', b.notes,
        'first_contact', b.first_contact
      ) order by b.first_contact desc, b.created_at desc)
      from public.khedmat_beneficiaries b
    ), '[]'::jsonb),
    'activity_types', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'emoji', t.emoji,
        'is_active', t.is_active,
        'sort_order', t.sort_order
      ) order by t.sort_order, t.created_at)
      from public.khedmat_activity_types t
    ), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'beneficiary_id', a.beneficiary_id,
        'type_id', a.type_id,
        'title', a.title,
        'description', a.description,
        'amount', a.amount,
        'date', a.activity_date,
        'images', a.images
      ) order by a.activity_date desc, a.created_at desc)
      from public.khedmat_activities a
    ), '[]'::jsonb),
    'daily_logs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id,
        'content', l.content,
        'by', l.by_name,
        'date', l.log_date
      ) order by l.log_date desc, l.created_at desc)
      from public.khedmat_daily_logs l
    ), '[]'::jsonb),
    'finance', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'type', f.type,
        'amount', f.amount,
        'description', f.description,
        'source', f.source,
        'activity_id', f.activity_id,
        'date', f.txn_date
      ) order by f.txn_date desc, f.created_at desc)
      from public.khedmat_finance f
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.khedmat_rel_upsert_beneficiary(
  p_actor_id uuid,
  p_pin text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_id text;
  v_row public.khedmat_beneficiaries%rowtype;
begin
  v_actor := private.verify_khedmat_actor(p_actor_id, p_pin);
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;
  if nullif(btrim(coalesce(p_payload->>'name', '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;

  v_id := coalesce(nullif(btrim(p_payload->>'id'), ''), private.khedmat_new_id('bn'));

  insert into public.khedmat_beneficiaries (
    id, name, address, phone, family_info, notes, first_contact, created_by, updated_by
  )
  values (
    v_id,
    btrim(p_payload->>'name'),
    nullif(btrim(coalesce(p_payload->>'address', '')), ''),
    nullif(btrim(coalesce(p_payload->>'phone', '')), ''),
    nullif(btrim(coalesce(p_payload->>'family_info', '')), ''),
    nullif(btrim(coalesce(p_payload->>'notes', '')), ''),
    coalesce(nullif(p_payload->>'first_contact', '')::date, current_date),
    v_actor.id,
    v_actor.id
  )
  on conflict (id) do update set
    name = excluded.name,
    address = excluded.address,
    phone = excluded.phone,
    family_info = excluded.family_info,
    notes = excluded.notes,
    first_contact = excluded.first_contact,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'beneficiary', jsonb_build_object(
      'id', v_row.id,
      'name', v_row.name,
      'address', v_row.address,
      'phone', v_row.phone,
      'family_info', v_row.family_info,
      'notes', v_row.notes,
      'first_contact', v_row.first_contact
    )
  );
end;
$$;

create or replace function public.khedmat_rel_upsert_activity_type(
  p_actor_id uuid,
  p_pin text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_id text;
  v_row public.khedmat_activity_types%rowtype;
begin
  v_actor := private.verify_khedmat_actor(p_actor_id, p_pin);
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;
  if nullif(btrim(coalesce(p_payload->>'name', '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;

  v_id := coalesce(nullif(btrim(p_payload->>'id'), ''), private.khedmat_new_id('at'));

  insert into public.khedmat_activity_types (id, name, emoji, is_active, sort_order, created_by)
  values (
    v_id,
    btrim(p_payload->>'name'),
    coalesce(nullif(btrim(p_payload->>'emoji'), ''), '🤝'),
    coalesce(nullif(p_payload->>'is_active', '')::boolean, true),
    coalesce(nullif(p_payload->>'sort_order', '')::integer, 0),
    v_actor.id
  )
  on conflict (id) do update set
    name = excluded.name,
    emoji = excluded.emoji,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'activity_type', jsonb_build_object(
      'id', v_row.id,
      'name', v_row.name,
      'emoji', v_row.emoji,
      'is_active', v_row.is_active,
      'sort_order', v_row.sort_order
    )
  );
end;
$$;

create or replace function public.khedmat_rel_insert_activity(
  p_actor_id uuid,
  p_pin text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_id text;
  v_type_id text;
  v_row public.khedmat_activities%rowtype;
begin
  v_actor := private.verify_khedmat_actor(p_actor_id, p_pin);
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;
  if not exists (select 1 from public.khedmat_beneficiaries where id = p_payload->>'beneficiary_id') then
    return jsonb_build_object('ok', false, 'error', 'beneficiary_not_found');
  end if;
  if nullif(btrim(coalesce(p_payload->>'title', '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'title_required');
  end if;

  v_id := coalesce(nullif(btrim(p_payload->>'id'), ''), private.khedmat_new_id('act'));
  v_type_id := nullif(btrim(coalesce(p_payload->>'type_id', '')), '');
  if v_type_id is not null and not exists (select 1 from public.khedmat_activity_types where id = v_type_id) then
    v_type_id := null;
  end if;

  insert into public.khedmat_activities (
    id, beneficiary_id, type_id, title, description, amount, activity_date, images, created_by
  )
  values (
    v_id,
    p_payload->>'beneficiary_id',
    v_type_id,
    btrim(p_payload->>'title'),
    coalesce(p_payload->>'description', ''),
    coalesce(nullif(p_payload->>'amount', '')::numeric, 0),
    coalesce(nullif(p_payload->>'date', '')::date, current_date),
    coalesce(p_payload->'images', '[]'::jsonb),
    v_actor.id
  )
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'activity', jsonb_build_object(
      'id', v_row.id,
      'beneficiary_id', v_row.beneficiary_id,
      'type_id', v_row.type_id,
      'title', v_row.title,
      'description', v_row.description,
      'amount', v_row.amount,
      'date', v_row.activity_date,
      'images', v_row.images
    )
  );
end;
$$;

create or replace function public.khedmat_rel_add_activity_images(
  p_actor_id uuid,
  p_pin text,
  p_activity_id text,
  p_images jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_row public.khedmat_activities%rowtype;
begin
  v_actor := private.verify_khedmat_actor(p_actor_id, p_pin);
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;
  if jsonb_typeof(coalesce(p_images, '[]'::jsonb)) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'invalid_images');
  end if;

  update public.khedmat_activities
  set images = coalesce(images, '[]'::jsonb) || coalesce(p_images, '[]'::jsonb),
      updated_at = now()
  where id = p_activity_id
  returning * into v_row;

  if v_row.id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'activity', jsonb_build_object(
      'id', v_row.id,
      'beneficiary_id', v_row.beneficiary_id,
      'type_id', v_row.type_id,
      'title', v_row.title,
      'description', v_row.description,
      'amount', v_row.amount,
      'date', v_row.activity_date,
      'images', v_row.images
    )
  );
end;
$$;

create or replace function public.khedmat_rel_insert_daily_log(
  p_actor_id uuid,
  p_pin text,
  p_content text,
  p_by text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_row public.khedmat_daily_logs%rowtype;
begin
  v_actor := private.verify_khedmat_actor(p_actor_id, p_pin);
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;
  if nullif(btrim(coalesce(p_content, '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'content_required');
  end if;

  insert into public.khedmat_daily_logs (id, content, by_name, log_date, created_by)
  values (private.khedmat_new_id('lg'), btrim(p_content), nullif(btrim(coalesce(p_by, '')), ''), current_date, v_actor.id)
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'log', jsonb_build_object('id', v_row.id, 'content', v_row.content, 'by', v_row.by_name, 'date', v_row.log_date)
  );
end;
$$;

create or replace function public.khedmat_rel_insert_finance(
  p_actor_id uuid,
  p_pin text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_row public.khedmat_finance%rowtype;
begin
  v_actor := private.verify_khedmat_actor(p_actor_id, p_pin);
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;
  if coalesce(p_payload->>'type', '') not in ('income', 'expense') then
    return jsonb_build_object('ok', false, 'error', 'invalid_type');
  end if;
  if coalesce(nullif(p_payload->>'amount', '')::numeric, 0) <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;
  if nullif(btrim(coalesce(p_payload->>'description', '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'description_required');
  end if;

  insert into public.khedmat_finance (
    id, type, amount, description, source, activity_id, txn_date, created_by
  )
  values (
    coalesce(nullif(btrim(p_payload->>'id'), ''), private.khedmat_new_id('fn')),
    p_payload->>'type',
    (p_payload->>'amount')::numeric,
    btrim(p_payload->>'description'),
    nullif(btrim(coalesce(p_payload->>'source', '')), ''),
    nullif(btrim(coalesce(p_payload->>'activity_id', '')), ''),
    coalesce(nullif(p_payload->>'date', '')::date, current_date),
    v_actor.id
  )
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'finance', jsonb_build_object(
      'id', v_row.id,
      'type', v_row.type,
      'amount', v_row.amount,
      'description', v_row.description,
      'source', v_row.source,
      'activity_id', v_row.activity_id,
      'date', v_row.txn_date
    )
  );
end;
$$;

revoke execute on function private.verify_khedmat_actor(uuid, text) from public, anon, authenticated;
revoke execute on function private.khedmat_new_id(text) from public, anon, authenticated;

revoke execute on function public.khedmat_rel_bootstrap(uuid, text) from public, authenticated;
revoke execute on function public.khedmat_rel_upsert_beneficiary(uuid, text, jsonb) from public, authenticated;
revoke execute on function public.khedmat_rel_upsert_activity_type(uuid, text, jsonb) from public, authenticated;
revoke execute on function public.khedmat_rel_insert_activity(uuid, text, jsonb) from public, authenticated;
revoke execute on function public.khedmat_rel_add_activity_images(uuid, text, text, jsonb) from public, authenticated;
revoke execute on function public.khedmat_rel_insert_daily_log(uuid, text, text, text) from public, authenticated;
revoke execute on function public.khedmat_rel_insert_finance(uuid, text, jsonb) from public, authenticated;

grant execute on function public.khedmat_rel_bootstrap(uuid, text) to anon;
grant execute on function public.khedmat_rel_upsert_beneficiary(uuid, text, jsonb) to anon;
grant execute on function public.khedmat_rel_upsert_activity_type(uuid, text, jsonb) to anon;
grant execute on function public.khedmat_rel_insert_activity(uuid, text, jsonb) to anon;
grant execute on function public.khedmat_rel_add_activity_images(uuid, text, text, jsonb) to anon;
grant execute on function public.khedmat_rel_insert_daily_log(uuid, text, text, text) to anon;
grant execute on function public.khedmat_rel_insert_finance(uuid, text, jsonb) to anon;
