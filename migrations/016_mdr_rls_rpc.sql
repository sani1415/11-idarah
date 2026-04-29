-- 016_mdr_rls_rpc.sql
-- RLS and RPC layer for the Madrasa module.

alter table public.mdr_divisions enable row level security;
alter table public.mdr_classes enable row level security;
alter table public.mdr_students enable row level security;
alter table public.mdr_class_history enable row level security;
alter table public.mdr_books enable row level security;
alter table public.mdr_book_progress enable row level security;
alter table public.mdr_attendance enable row level security;
alter table public.mdr_attendance_details enable row level security;
alter table public.mdr_student_import_candidates enable row level security;

alter table public.shared_users
add column if not exists login_id text;

create unique index if not exists shared_users_login_id_key
on public.shared_users (lower(login_id))
where login_id is not null and btrim(login_id) <> '';

drop policy if exists "deny_all_mdr_divisions" on public.mdr_divisions;
create policy "deny_all_mdr_divisions" on public.mdr_divisions for all using (false) with check (false);

drop policy if exists "deny_all_mdr_classes" on public.mdr_classes;
create policy "deny_all_mdr_classes" on public.mdr_classes for all using (false) with check (false);

drop policy if exists "deny_all_mdr_students" on public.mdr_students;
create policy "deny_all_mdr_students" on public.mdr_students for all using (false) with check (false);

drop policy if exists "deny_all_mdr_class_history" on public.mdr_class_history;
create policy "deny_all_mdr_class_history" on public.mdr_class_history for all using (false) with check (false);

drop policy if exists "deny_all_mdr_books" on public.mdr_books;
create policy "deny_all_mdr_books" on public.mdr_books for all using (false) with check (false);

drop policy if exists "deny_all_mdr_book_progress" on public.mdr_book_progress;
create policy "deny_all_mdr_book_progress" on public.mdr_book_progress for all using (false) with check (false);

drop policy if exists "deny_all_mdr_attendance" on public.mdr_attendance;
create policy "deny_all_mdr_attendance" on public.mdr_attendance for all using (false) with check (false);

drop policy if exists "deny_all_mdr_attendance_details" on public.mdr_attendance_details;
create policy "deny_all_mdr_attendance_details" on public.mdr_attendance_details for all using (false) with check (false);

drop policy if exists "deny_all_mdr_student_import_candidates" on public.mdr_student_import_candidates;
create policy "deny_all_mdr_student_import_candidates" on public.mdr_student_import_candidates for all using (false) with check (false);

create or replace function public.mdr_rel_admin_login(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user public.shared_users%rowtype;
begin
  select *
  into v_user
  from public.shared_users
  where role = 'admin'
    and is_active = true
    and pin = p_pin
  order by created_at
  limit 1;

  if v_user.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  return jsonb_build_object(
    'ok', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'name', v_user.name,
      'role', v_user.role,
      'module_access', v_user.module_access,
      'admin_perms', v_user.admin_perms
    )
  );
end;
$$;

create or replace function public.mdr_rel_user_login(p_user_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user public.shared_users%rowtype;
begin
  select *
  into v_user
  from public.shared_users
  where id = p_user_id
    and is_active = true
    and pin = p_pin;

  if v_user.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_user_or_pin');
  end if;

  return jsonb_build_object(
    'ok', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'name', v_user.name,
      'role', v_user.role,
      'module_access', v_user.module_access,
      'admin_perms', v_user.admin_perms,
      'class_id', v_user.class_id,
      'dept_code', v_user.dept_code
    )
  );
end;
$$;

create or replace function public.mdr_rel_staff_login(p_role text, p_login_id text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user public.shared_users%rowtype;
  v_class public.mdr_classes%rowtype;
begin
  select *
  into v_user
  from public.shared_users u
  where u.role = p_role
    and u.is_active = true
    and u.pin = p_pin
    and (
      (p_login_id is not null and btrim(p_login_id) <> '' and lower(u.login_id) = lower(btrim(p_login_id)))
      or (coalesce(p_login_id, '') = '' and u.login_id is null)
    )
  order by u.created_at
  limit 1;

  if v_user.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;

  if v_user.class_id is not null then
    select * into v_class from public.mdr_classes where id = v_user.class_id;
  end if;

  return jsonb_build_object('ok', true, 'user', jsonb_build_object(
    'id', v_user.id,
    'name', v_user.name,
    'role', v_user.role,
    'login_id', v_user.login_id,
    'class_id', v_user.class_id,
    'class_code', v_class.code,
    'class_name', v_class.name,
    'dept_code', v_user.dept_code,
    'admin_perms', v_user.admin_perms
  ));
end;
$$;

create or replace function public.mdr_rel_admin_users(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  return jsonb_build_object(
    'ok', true,
    'users', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'pin', u.pin,
        'role', u.role,
        'login_id', u.login_id,
        'module_access', u.module_access,
        'admin_perms', u.admin_perms,
        'dept_code', u.dept_code,
        'class_id', u.class_id,
        'class_code', c.code,
        'class_name', c.name,
        'is_active', u.is_active,
        'created_at', u.created_at
      ) order by u.role, c.sort_order, u.name), '[]'::jsonb)
      from public.shared_users u
      left join public.mdr_classes c on c.id = u.class_id
      where u.role <> 'admin'
    )
  );
end;
$$;

create or replace function public.mdr_rel_save_user(
  p_pin text,
  p_user_id uuid,
  p_name text,
  p_role text,
  p_login_id text,
  p_user_pin text,
  p_class_code text default null,
  p_admin_perms jsonb default '{}'::jsonb,
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_class_id uuid;
  v_user_id uuid;
  v_login_id text := nullif(btrim(coalesce(p_login_id, '')), '');
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  if p_role not in ('madrasa_teacher','daftar','library','alumni_tracker','hifz','khedmat') then
    return jsonb_build_object('ok', false, 'error', 'invalid_role');
  end if;

  if btrim(coalesce(p_name, '')) = '' or btrim(coalesce(p_user_pin, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_required');
  end if;

  if p_role = 'madrasa_teacher' then
    if v_login_id is null then
      return jsonb_build_object('ok', false, 'error', 'missing_login_id');
    end if;
    select id into v_class_id from public.mdr_classes where code = p_class_code and is_active = true;
    if v_class_id is null then
      return jsonb_build_object('ok', false, 'error', 'class_not_found');
    end if;
  end if;

  if v_login_id is not null and exists (
    select 1 from public.shared_users u
    where lower(u.login_id) = lower(v_login_id)
      and (p_user_id is null or u.id <> p_user_id)
  ) then
    return jsonb_build_object('ok', false, 'error', 'login_id_taken');
  end if;

  if p_role = 'madrasa_teacher' and p_is_active and exists (
    select 1 from public.shared_users u
    where u.role = 'madrasa_teacher'
      and u.class_id = v_class_id
      and u.is_active = true
      and (p_user_id is null or u.id <> p_user_id)
  ) then
    return jsonb_build_object('ok', false, 'error', 'class_teacher_exists');
  end if;

  if p_user_id is null then
    insert into public.shared_users (name, pin, role, login_id, module_access, admin_perms, class_id, is_active)
    values (
      btrim(p_name), btrim(p_user_pin), p_role, v_login_id,
      case when p_role = 'khedmat' then array['khedmat'] else array['madrasa'] end,
      coalesce(p_admin_perms, '{}'::jsonb), v_class_id, p_is_active
    )
    returning id into v_user_id;
  else
    update public.shared_users
    set name = btrim(p_name),
        pin = btrim(p_user_pin),
        role = p_role,
        login_id = v_login_id,
        module_access = case when p_role = 'khedmat' then array['khedmat'] else array['madrasa'] end,
        admin_perms = coalesce(p_admin_perms, '{}'::jsonb),
        class_id = v_class_id,
        is_active = p_is_active,
        updated_at = now()
    where id = p_user_id and role <> 'admin'
    returning id into v_user_id;
  end if;

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'user_not_found');
  end if;

  return jsonb_build_object('ok', true, 'id', v_user_id);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'login_id_taken');
end;
$$;

create or replace function public.mdr_rel_admin_bootstrap(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  return jsonb_build_object(
    'ok', true,
    'divisions', (select coalesce(jsonb_agg(to_jsonb(d) order by d.code), '[]'::jsonb) from public.mdr_divisions d),
    'classes', (select coalesce(jsonb_agg(to_jsonb(c) order by c.sort_order), '[]'::jsonb) from public.mdr_classes c),
    'student_count', (select count(*) from public.mdr_students),
    'book_count', (select count(*) from public.mdr_books),
    'import_pending_count', (
      select count(*)
      from public.mdr_student_import_candidates
      where candidate_status = 'pending'
    )
  );
end;
$$;

create or replace function public.mdr_rel_admin_students(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  return jsonb_build_object(
    'ok', true,
    'classes', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'code', c.code,
        'name', c.name,
        'roll_prefix', c.roll_prefix,
        'sort_order', c.sort_order,
        'division_code', d.code
      ) order by d.code, c.sort_order), '[]'::jsonb)
      from public.mdr_classes c
      join public.mdr_divisions d on d.id = c.division_id
      where c.is_active = true
    ),
    'students', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id,
        'student_id', s.student_id,
        'name', s.name,
        'guardian_name', s.guardian_name,
        'guardian_phone', s.guardian_phone,
        'district', s.district,
        'upazila', s.upazila,
        'class_code', c.code,
        'class_name', c.name,
        'division_code', d.code,
        'current_roll', s.current_roll,
        'status', s.status,
        'is_hifz', s.is_hifz
      ) order by d.code, c.sort_order, s.current_roll, s.name), '[]'::jsonb)
      from public.mdr_students s
      join public.mdr_classes c on c.id = s.current_class_id
      join public.mdr_divisions d on d.id = s.division_id
      where s.status = 'active'
    )
  );
end;
$$;

create or replace function public.mdr_rel_daftar_bootstrap(p_actor_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
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

  return jsonb_build_object(
    'ok', true,
    'classes', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'code', c.code,
        'name', c.name,
        'roll_prefix', c.roll_prefix,
        'sort_order', c.sort_order,
        'division_code', d.code
      ) order by d.code, c.sort_order), '[]'::jsonb)
      from public.mdr_classes c
      join public.mdr_divisions d on d.id = c.division_id
      where c.is_active = true
    ),
    'students', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id,
        'student_id', s.student_id,
        'name', s.name,
        'guardian_name', s.guardian_name,
        'guardian_phone', s.guardian_phone,
        'district', s.district,
        'upazila', s.upazila,
        'class_code', c.code,
        'class_name', c.name,
        'division_code', d.code,
        'current_roll', s.current_roll,
        'status', s.status,
        'is_hifz', s.is_hifz
      ) order by d.code, c.sort_order, s.current_roll, s.name), '[]'::jsonb)
      from public.mdr_students s
      join public.mdr_classes c on c.id = s.current_class_id
      join public.mdr_divisions d on d.id = s.division_id
      where s.status = 'active'
    ),
    'attendance', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', ad.id,
        'student_id', ad.student_id,
        'date', a.date,
        'status', ad.status,
        'absent_reason', ad.absent_reason,
        'hijri_year', ad.hijri_year
      ) order by a.date desc), '[]'::jsonb)
      from public.mdr_attendance_details ad
      join public.mdr_attendance a on a.id = ad.attendance_id
    )
  );
end;
$$;

create or replace function public.mdr_rel_save_attendance_day(
  p_actor_id uuid,
  p_pin text,
  p_date date,
  p_records jsonb,
  p_hijri_year text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_row record;
  v_class_id uuid;
  v_attendance_id uuid;
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

  if p_date is null or p_records is null or jsonb_typeof(p_records) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  for v_row in
    select *
    from jsonb_to_recordset(p_records) as r(student_id uuid, status text, absent_reason text)
  loop
    if v_row.status not in ('present', 'absent', 'holiday') then
      return jsonb_build_object('ok', false, 'error', 'invalid_status');
    end if;

    select current_class_id
    into v_class_id
    from public.mdr_students
    where id = v_row.student_id
      and status = 'active';

    if v_class_id is null then
      return jsonb_build_object('ok', false, 'error', 'student_not_found');
    end if;

    insert into public.mdr_attendance (class_id, date, entered_by)
    values (v_class_id, p_date, v_actor.id)
    on conflict (class_id, date)
    do update set entered_by = excluded.entered_by
    returning id into v_attendance_id;

    insert into public.mdr_attendance_details (
      attendance_id, student_id, status, absent_reason, hijri_year, updated_at
    )
    values (
      v_attendance_id,
      v_row.student_id,
      v_row.status,
      case when v_row.status = 'absent' then nullif(btrim(coalesce(v_row.absent_reason, '')), '') else null end,
      nullif(btrim(coalesce(p_hijri_year, '')), ''),
      now()
    )
    on conflict (attendance_id, student_id)
    do update set
      status = excluded.status,
      absent_reason = excluded.absent_reason,
      hijri_year = excluded.hijri_year,
      updated_at = now();
  end loop;

  return jsonb_build_object(
    'ok', true,
    'attendance', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', ad.id,
        'student_id', ad.student_id,
        'date', a.date,
        'status', ad.status,
        'absent_reason', ad.absent_reason,
        'hijri_year', ad.hijri_year
      ) order by a.date desc), '[]'::jsonb)
      from public.mdr_attendance_details ad
      join public.mdr_attendance a on a.id = ad.attendance_id
    )
  );
end;
$$;

create or replace function public.mdr_rel_import_candidates(p_pin text, p_source text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  return jsonb_build_object(
    'ok', true,
    'items', (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.source, c.class_code, c.old_roll), '[]'::jsonb)
      from public.mdr_student_import_candidates c
      where c.candidate_status = 'pending'
        and (p_source is null or c.source = p_source)
    )
  );
end;
$$;

create or replace function public.mdr_rel_approve_import_candidate(
  p_pin text,
  p_candidate_id uuid,
  p_student_id text,
  p_class_code text,
  p_roll text,
  p_hijri_year text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_candidate public.mdr_student_import_candidates%rowtype;
  v_division_id uuid;
  v_class_id uuid;
  v_student_id uuid;
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  select * into v_candidate
  from public.mdr_student_import_candidates
  where id = p_candidate_id
    and candidate_status = 'pending';

  if v_candidate.id is null then
    return jsonb_build_object('ok', false, 'error', 'candidate_not_found');
  end if;

  select c.id, c.division_id
  into v_class_id, v_division_id
  from public.mdr_classes c
  where c.code = p_class_code
    and c.is_active = true;

  if v_class_id is null then
    return jsonb_build_object('ok', false, 'error', 'class_not_found');
  end if;

  insert into public.mdr_students (
    student_id,
    name,
    guardian_name,
    guardian_phone,
    district,
    upazila,
    division_id,
    current_class_id,
    current_roll,
    admission_date,
    hijri_year,
    status,
    is_hifz,
    import_source,
    old_student_id
  )
  values (
    trim(p_student_id),
    v_candidate.name,
    v_candidate.guardian_name,
    v_candidate.guardian_phone,
    v_candidate.district,
    v_candidate.upazila,
    v_division_id,
    v_class_id,
    trim(p_roll),
    current_date,
    nullif(trim(coalesce(p_hijri_year, '')), ''),
    'active',
    v_candidate.suggested_is_hifz,
    v_candidate.source,
    v_candidate.old_student_id
  )
  returning id into v_student_id;

  insert into public.mdr_class_history (student_id, class_id, roll, from_date, notes)
  values (v_student_id, v_class_id, trim(p_roll), current_date, 'পুরনো ব্যাকআপ থেকে অনুমোদিত');

  update public.mdr_student_import_candidates
  set candidate_status = 'approved',
      approved_student_id = v_student_id
  where id = p_candidate_id;

  return jsonb_build_object('ok', true, 'student_uuid', v_student_id);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'student_id_already_exists');
end;
$$;

create or replace function public.mdr_rel_skip_import_candidate(
  p_pin text,
  p_candidate_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  update public.mdr_student_import_candidates
  set candidate_status = 'skipped'
  where id = p_candidate_id
    and candidate_status = 'pending';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'candidate_not_found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.mdr_rel_admin_login(text) to anon;
grant execute on function public.mdr_rel_user_login(uuid, text) to anon;
grant execute on function public.mdr_rel_staff_login(text, text, text) to anon;
grant execute on function public.mdr_rel_admin_users(text) to anon;
grant execute on function public.mdr_rel_save_user(text, uuid, text, text, text, text, text, jsonb, boolean) to anon;
grant execute on function public.mdr_rel_admin_bootstrap(text) to anon;
grant execute on function public.mdr_rel_admin_students(text) to anon;
grant execute on function public.mdr_rel_daftar_bootstrap(uuid, text) to anon;
grant execute on function public.mdr_rel_save_attendance_day(uuid, text, date, jsonb, text) to anon;
grant execute on function public.mdr_rel_import_candidates(text, text) to anon;
grant execute on function public.mdr_rel_approve_import_candidate(text, uuid, text, text, text, text) to anon;
grant execute on function public.mdr_rel_skip_import_candidate(text, uuid) to anon;
