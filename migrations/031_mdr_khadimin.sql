-- 031_mdr_khadimin.sql
-- দফতর হোম «খাদিমিন» — টেবিল + RPC (admin / daftar)

create table if not exists public.mdr_khadimin (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  duty text,
  join_date date,
  status text not null default 'active' check (status in ('active', 'away', 'inactive')),
  address text,
  details text,
  created_by uuid not null references public.shared_users (id),
  updated_by uuid not null references public.shared_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mdr_khadimin_notes (
  id uuid primary key default gen_random_uuid(),
  khadim_id uuid not null references public.mdr_khadimin (id) on delete cascade,
  note_date date not null default current_date,
  body text not null,
  created_by uuid not null references public.shared_users (id),
  created_at timestamptz not null default now()
);

create index if not exists mdr_khadimin_notes_khadim_id_idx
  on public.mdr_khadimin_notes (khadim_id);

create table if not exists public.mdr_khadimin_leaves (
  id uuid primary key default gen_random_uuid(),
  khadim_id uuid not null references public.mdr_khadimin (id) on delete cascade,
  date_from date not null,
  date_to date not null,
  reason text,
  days integer not null,
  created_by uuid not null references public.shared_users (id),
  created_at timestamptz not null default now()
);

create index if not exists mdr_khadimin_leaves_khadim_id_idx
  on public.mdr_khadimin_leaves (khadim_id);

alter table public.mdr_khadimin enable row level security;
alter table public.mdr_khadimin_notes enable row level security;
alter table public.mdr_khadimin_leaves enable row level security;

drop policy if exists "deny_all_mdr_khadimin" on public.mdr_khadimin;
create policy "deny_all_mdr_khadimin" on public.mdr_khadimin for all using (false) with check (false);

drop policy if exists "deny_all_mdr_khadimin_notes" on public.mdr_khadimin_notes;
create policy "deny_all_mdr_khadimin_notes" on public.mdr_khadimin_notes for all using (false) with check (false);

drop policy if exists "deny_all_mdr_khadimin_leaves" on public.mdr_khadimin_leaves;
create policy "deny_all_mdr_khadimin_leaves" on public.mdr_khadimin_leaves for all using (false) with check (false);

-- ------------------------------------------------------------
-- তালিকা (সেটিংস থেকে শিক্ষাবর্ষ শুরু তারিখ включитель)
-- ------------------------------------------------------------
create or replace function public.mdr_rel_khadimin_list(p_actor_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_sess date;
  v_hijri text;
begin
  select *
  into v_actor
  from public.shared_users
  where id = p_actor_id
    and is_active = true
    and pin = p_pin
    and role in ('admin', 'daftar');

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  select s.session_start_date, s.hijri_year
  into v_sess, v_hijri
  from public.mdr_settings s
  where s.id = true;

  return jsonb_build_object(
    'ok', true,
    'session_start_date', v_sess,
    'hijri_year', v_hijri,
    'khadimin', coalesce((
      select jsonb_agg(sub.kj order by sub.kj->>'name')
      from (
        select jsonb_build_object(
          'id', k.id,
          'name', k.name,
          'phone', k.phone,
          'duty', k.duty,
          'join_date', k.join_date,
          'status', k.status,
          'address', k.address,
          'details', k.details,
          'notes', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'date', n.note_date::text,
                'text', n.body
              ) order by n.created_at desc
            )
            from public.mdr_khadimin_notes n
            where n.khadim_id = k.id
          ), '[]'::jsonb)
        ) as kj
        from public.mdr_khadimin k
      ) sub
    ), '[]'::jsonb),
    'leaves', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'khadim_id', l.khadim_id,
          'from', l.date_from::text,
          'to', l.date_to::text,
          'reason', l.reason,
          'days', l.days
        ) order by l.date_from desc, l.created_at desc
      )
      from public.mdr_khadimin_leaves l
    ), '[]'::jsonb)
  );
end;
$$;

-- ------------------------------------------------------------
-- সংরক্ষণ / নতুন
-- ------------------------------------------------------------
create or replace function public.mdr_rel_khadimin_upsert(
  p_actor_id uuid,
  p_pin text,
  p_id uuid default null,
  p_name text default null,
  p_phone text default null,
  p_duty text default null,
  p_join_date date default null,
  p_status text default null,
  p_address text default null,
  p_details text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_id uuid;
  v_st text;
begin select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin and role in ('admin', 'daftar');

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  if trim(coalesce(p_name, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;

  v_st := nullif(trim(coalesce(p_status, '')), '');
  if v_st is null or v_st not in ('active', 'away', 'inactive') then
    v_st := 'active';
  end if;

  if p_id is not null and exists (select 1 from public.mdr_khadimin k where k.id = p_id) then
    update public.mdr_khadimin
    set name = trim(p_name),
        phone = nullif(trim(coalesce(p_phone, '')), ''),
        duty = nullif(trim(coalesce(p_duty, '')), ''),
        join_date = p_join_date,
        status = v_st,
        address = nullif(trim(coalesce(p_address, '')), ''),
        details = nullif(trim(coalesce(p_details, '')), ''),
        updated_by = v_actor.id,
        updated_at = now()
    where id = p_id;
    v_id := p_id;
  else
    insert into public.mdr_khadimin (
      name, phone, duty, join_date, status, address, details, created_by, updated_by
    )
    values (
      trim(p_name),
      nullif(trim(coalesce(p_phone, '')), ''),
      nullif(trim(coalesce(p_duty, '')), ''),
      p_join_date,
      v_st,
      nullif(trim(coalesce(p_address, '')), ''),
      nullif(trim(coalesce(p_details, '')), ''),
      v_actor.id,
      v_actor.id
    )
    returning id into v_id;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.mdr_rel_khadimin_add_note(
  p_actor_id uuid,
  p_pin text,
  p_khadim_id uuid,
  p_text text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
begin select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin and role in ('admin', 'daftar');

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  if not exists (select 1 from public.mdr_khadimin k where k.id = p_khadim_id) then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if trim(coalesce(p_text, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'text_required');
  end if;

  insert into public.mdr_khadimin_notes (khadim_id, body, created_by)
  values (p_khadim_id, trim(p_text), v_actor.id);

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.mdr_rel_khadimin_add_leave(
  p_actor_id uuid,
  p_pin text,
  p_khadim_id uuid,
  p_date_from date,
  p_date_to date,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  d_lo date;
  d_hi date;
  v_days int;
begin select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin and role in ('admin', 'daftar');

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  if not exists (select 1 from public.mdr_khadimin k where k.id = p_khadim_id) then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if p_date_from is null or p_date_to is null then
    return jsonb_build_object('ok', false, 'error', 'dates_required');
  end if;

  d_lo := least(p_date_from, p_date_to);
  d_hi := greatest(p_date_from, p_date_to);
  v_days := (d_hi - d_lo) + 1;
  if v_days < 1 then v_days := 1; end if;

  insert into public.mdr_khadimin_leaves (
    khadim_id, date_from, date_to, reason, days, created_by
  )
  values (
    p_khadim_id,
    d_lo,
    d_hi,
    nullif(trim(coalesce(p_reason, '')), ''),
    v_days,
    v_actor.id
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.mdr_rel_khadimin_list(uuid, text) to anon;
grant execute on function public.mdr_rel_khadimin_upsert(uuid, text, uuid, text, text, text, date, text, text, text) to anon;
grant execute on function public.mdr_rel_khadimin_add_note(uuid, text, uuid, text) to anon;
grant execute on function public.mdr_rel_khadimin_add_leave(uuid, text, uuid, date, date, text) to anon;
