-- 032_mdr_daftar_notes_dastarkhan.sql
-- দফতর হোম: স্টাফ নোট + দস্তরখান সাপ্তাহিক শিট (JSON) — টেবিল + RPC (admin / daftar)

-- ------------------------------------------------------------
-- দফতর দায়িত্বশীলের নোট (তালিকা আলাদা সারি)
-- ------------------------------------------------------------
create table if not exists public.mdr_daftar_staff_notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  created_by uuid not null references public.shared_users (id),
  updated_by uuid not null references public.shared_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mdr_daftar_staff_notes_created_at_idx
  on public.mdr_daftar_staff_notes (created_at desc);

alter table public.mdr_daftar_staff_notes enable row level security;

drop policy if exists "deny_all_mdr_daftar_staff_notes" on public.mdr_daftar_staff_notes;
create policy "deny_all_mdr_daftar_staff_notes" on public.mdr_daftar_staff_notes
  for all using (false) with check (false);

-- ------------------------------------------------------------
-- দস্তরখান — একক সারি (id=1); payload = { menu, cooking, duty }
-- ------------------------------------------------------------
create table if not exists public.mdr_dastarkhan_weekly (
  id smallint primary key default 1 check (id = 1),
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid not null references public.shared_users (id),
  updated_at timestamptz not null default now()
);

alter table public.mdr_dastarkhan_weekly enable row level security;

drop policy if exists "deny_all_mdr_dastarkhan_weekly" on public.mdr_dastarkhan_weekly;
create policy "deny_all_mdr_dastarkhan_weekly" on public.mdr_dastarkhan_weekly
  for all using (false) with check (false);

-- ------------------------------------------------------------
-- নোট তালিকা
-- ------------------------------------------------------------
create or replace function public.mdr_rel_daftar_notes_list(p_actor_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
begin
  select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin and role in ('admin', 'daftar');

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  return jsonb_build_object(
    'ok', true,
    'notes', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', n.id,
          'text', n.body,
          'created_at', to_char(n.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ) order by n.created_at desc, n.id desc
      )
      from public.mdr_daftar_staff_notes n
    ), '[]'::jsonb)
  );
end;
$$;

-- ------------------------------------------------------------
-- নোট নতুন / আপডেট
-- ------------------------------------------------------------
create or replace function public.mdr_rel_daftar_notes_upsert(
  p_actor_id uuid,
  p_pin text,
  p_id uuid default null,
  p_text text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_id uuid;
begin
  select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin and role in ('admin', 'daftar');

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  if trim(coalesce(p_text, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'text_required');
  end if;

  if p_id is not null and exists (select 1 from public.mdr_daftar_staff_notes n where n.id = p_id) then
    update public.mdr_daftar_staff_notes
    set body = trim(p_text),
        updated_by = v_actor.id,
        updated_at = now()
    where id = p_id;
    v_id := p_id;
  else
    insert into public.mdr_daftar_staff_notes (body, created_by, updated_by)
    values (trim(p_text), v_actor.id, v_actor.id)
    returning id into v_id;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

-- ------------------------------------------------------------
-- নোট মোছা
-- ------------------------------------------------------------
create or replace function public.mdr_rel_daftar_notes_delete(
  p_actor_id uuid,
  p_pin text,
  p_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_deleted int;
begin
  select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin and role in ('admin', 'daftar');

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  if p_id is null then
    return jsonb_build_object('ok', false, 'error', 'id_required');
  end if;

  delete from public.mdr_daftar_staff_notes where id = p_id;
  get diagnostics v_deleted = ROW_COUNT;
  if v_deleted < 1 then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------
-- দস্তরখান পড়া
-- ------------------------------------------------------------
create or replace function public.mdr_rel_dastarkhan_get(p_actor_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_payload jsonb;
begin
  select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin and role in ('admin', 'daftar');

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  select w.payload into v_payload from public.mdr_dastarkhan_weekly w where w.id = 1;
  if v_payload is null then
    v_payload := '{}'::jsonb;
  end if;

  return jsonb_build_object('ok', true, 'payload', v_payload);
end;
$$;

-- ------------------------------------------------------------
-- দস্তরখান সংরক্ষণ
-- ------------------------------------------------------------
create or replace function public.mdr_rel_dastarkhan_save(
  p_actor_id uuid,
  p_pin text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_clean jsonb;
begin
  select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin and role in ('admin', 'daftar');

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    v_clean := '{}'::jsonb;
  else
    v_clean := p_payload;
  end if;

  insert into public.mdr_dastarkhan_weekly (id, payload, updated_by)
  values (1, v_clean, v_actor.id)
  on conflict (id) do update
  set payload = excluded.payload,
      updated_by = excluded.updated_by,
      updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.mdr_rel_daftar_notes_list(uuid, text) to anon;
grant execute on function public.mdr_rel_daftar_notes_upsert(uuid, text, uuid, text) to anon;
grant execute on function public.mdr_rel_daftar_notes_delete(uuid, text, uuid) to anon;
grant execute on function public.mdr_rel_dastarkhan_get(uuid, text) to anon;
grant execute on function public.mdr_rel_dastarkhan_save(uuid, text, jsonb) to anon;
