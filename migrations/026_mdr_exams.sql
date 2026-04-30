-- 026_mdr_exams.sql
-- Exam management tables, RLS, and RPC functions for the Madrasa module.

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

create table if not exists public.mdr_exams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null check (type in ('weekly','monthly','half_yearly','yearly','test')),
  class_id   uuid not null references public.mdr_classes(id) on delete cascade,
  exam_date  date,
  created_by uuid not null references public.shared_users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.mdr_exam_subjects (
  id         uuid primary key default gen_random_uuid(),
  exam_id    uuid not null references public.mdr_exams(id) on delete cascade,
  name       text not null,
  max_marks  integer not null default 100 check (max_marks > 0),
  sort_order integer not null default 0
);

create table if not exists public.mdr_exam_results (
  id         uuid primary key default gen_random_uuid(),
  exam_id    uuid not null references public.mdr_exams(id) on delete cascade,
  student_id uuid not null references public.mdr_students(id) on delete cascade,
  subject_id uuid not null references public.mdr_exam_subjects(id) on delete cascade,
  marks      numeric(5,2) not null check (marks >= 0),
  created_at timestamptz not null default now(),
  unique (exam_id, student_id, subject_id)
);

-- ─────────────────────────────────────────────
-- RLS (deny all — RPC-only access)
-- ─────────────────────────────────────────────

alter table public.mdr_exams enable row level security;
alter table public.mdr_exam_subjects enable row level security;
alter table public.mdr_exam_results enable row level security;

drop policy if exists "deny_all_mdr_exams" on public.mdr_exams;
create policy "deny_all_mdr_exams" on public.mdr_exams for all using (false) with check (false);

drop policy if exists "deny_all_mdr_exam_subjects" on public.mdr_exam_subjects;
create policy "deny_all_mdr_exam_subjects" on public.mdr_exam_subjects for all using (false) with check (false);

drop policy if exists "deny_all_mdr_exam_results" on public.mdr_exam_results;
create policy "deny_all_mdr_exam_results" on public.mdr_exam_results for all using (false) with check (false);

-- ─────────────────────────────────────────────
-- RPC 1: Exam Bootstrap — teacher's class exams + subjects + results
-- ─────────────────────────────────────────────

create or replace function public.mdr_rel_exam_bootstrap(
  p_actor_id uuid,
  p_pin      text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_class public.mdr_classes%rowtype;
  v_exams jsonb;
begin
  select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin
    and role = 'madrasa_teacher' and class_id is not null;
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_teacher');
  end if;

  select * into v_class from public.mdr_classes where id = v_actor.class_id;

  select jsonb_agg(
    jsonb_build_object(
      'id',         e.id,
      'name',       e.name,
      'type',       e.type,
      'class_code', v_class.code,
      'created_at', e.created_at,
      'subjects', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id',         s.id,
            'name',       s.name,
            'max_marks',  s.max_marks,
            'sort_order', s.sort_order
          ) order by s.sort_order, s.id
        )
        from public.mdr_exam_subjects s where s.exam_id = e.id
      ), '[]'::jsonb),
      'results', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'student_id', r.student_id,
            'subject_id', r.subject_id,
            'marks',      r.marks
          )
        )
        from public.mdr_exam_results r where r.exam_id = e.id
      ), '[]'::jsonb)
    ) order by e.created_at desc
  )
  into v_exams
  from public.mdr_exams e
  where e.class_id = v_actor.class_id;

  return jsonb_build_object(
    'ok',         true,
    'class_code', v_class.code,
    'exams',      coalesce(v_exams, '[]'::jsonb)
  );
end;
$$;

-- ─────────────────────────────────────────────
-- RPC 2: Save Exam (create with subjects)
-- p_subjects: [{"name":"নাহু","max_marks":100}, ...]
-- ─────────────────────────────────────────────

create or replace function public.mdr_rel_save_exam(
  p_actor_id uuid,
  p_pin      text,
  p_name     text,
  p_type     text,
  p_subjects jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor   public.shared_users%rowtype;
  v_exam_id uuid;
  v_subj    jsonb;
  v_i       integer := 0;
begin
  select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin
    and role = 'madrasa_teacher' and class_id is not null;
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_teacher');
  end if;
  if p_type not in ('weekly','monthly','half_yearly','yearly','test') then
    return jsonb_build_object('ok', false, 'error', 'invalid_type');
  end if;
  if btrim(coalesce(p_name,'')) = '' then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;
  if jsonb_array_length(coalesce(p_subjects,'[]'::jsonb)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'subjects_required');
  end if;

  insert into public.mdr_exams (name, type, class_id, created_by)
  values (btrim(p_name), p_type, v_actor.class_id, v_actor.id)
  returning id into v_exam_id;

  for v_subj in select * from jsonb_array_elements(p_subjects) loop
    insert into public.mdr_exam_subjects (exam_id, name, max_marks, sort_order)
    values (
      v_exam_id,
      btrim(v_subj->>'name'),
      coalesce((v_subj->>'max_marks')::integer, 100),
      v_i
    );
    v_i := v_i + 1;
  end loop;

  return jsonb_build_object('ok', true, 'id', v_exam_id);
end;
$$;

-- ─────────────────────────────────────────────
-- RPC 3: Update Exam (name + type; optionally replace subjects if no results)
-- p_subjects: NULL = don't change; array = replace (only when no results exist)
-- ─────────────────────────────────────────────

create or replace function public.mdr_rel_update_exam(
  p_actor_id uuid,
  p_pin      text,
  p_exam_id  uuid,
  p_name     text,
  p_type     text,
  p_subjects jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_exam  public.mdr_exams%rowtype;
  v_subj  jsonb;
  v_i     integer := 0;
begin
  select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin
    and role = 'madrasa_teacher' and class_id is not null;
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_teacher');
  end if;

  select * into v_exam from public.mdr_exams where id = p_exam_id;
  if v_exam.id is null then
    return jsonb_build_object('ok', false, 'error', 'exam_not_found');
  end if;
  if v_exam.class_id <> v_actor.class_id then
    return jsonb_build_object('ok', false, 'error', 'not_your_class');
  end if;
  if btrim(coalesce(p_name,'')) = '' then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;
  if p_type not in ('weekly','monthly','half_yearly','yearly','test') then
    return jsonb_build_object('ok', false, 'error', 'invalid_type');
  end if;

  update public.mdr_exams set name = btrim(p_name), type = p_type where id = p_exam_id;

  if p_subjects is not null then
    if exists (select 1 from public.mdr_exam_results where exam_id = p_exam_id) then
      return jsonb_build_object('ok', false, 'error', 'has_results_cannot_change_subjects');
    end if;
    if jsonb_array_length(p_subjects) = 0 then
      return jsonb_build_object('ok', false, 'error', 'subjects_required');
    end if;
    delete from public.mdr_exam_subjects where exam_id = p_exam_id;
    for v_subj in select * from jsonb_array_elements(p_subjects) loop
      insert into public.mdr_exam_subjects (exam_id, name, max_marks, sort_order)
      values (p_exam_id, btrim(v_subj->>'name'), coalesce((v_subj->>'max_marks')::integer, 100), v_i);
      v_i := v_i + 1;
    end loop;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- ─────────────────────────────────────────────
-- RPC 4: Delete Exam (cascades to subjects + results)
-- ─────────────────────────────────────────────

create or replace function public.mdr_rel_delete_exam(
  p_actor_id uuid,
  p_pin      text,
  p_exam_id  uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_exam  public.mdr_exams%rowtype;
begin
  select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin
    and role = 'madrasa_teacher' and class_id is not null;
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_teacher');
  end if;

  select * into v_exam from public.mdr_exams where id = p_exam_id;
  if v_exam.id is null then
    return jsonb_build_object('ok', false, 'error', 'exam_not_found');
  end if;
  if v_exam.class_id <> v_actor.class_id then
    return jsonb_build_object('ok', false, 'error', 'not_your_class');
  end if;

  delete from public.mdr_exams where id = p_exam_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ─────────────────────────────────────────────
-- RPC 5: Save Exam Results (bulk upsert)
-- p_results: [{"student_id":"uuid","subject_id":"uuid","marks":85}, ...]
-- ─────────────────────────────────────────────

create or replace function public.mdr_rel_save_exam_results(
  p_actor_id uuid,
  p_pin      text,
  p_exam_id  uuid,
  p_results  jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_exam  public.mdr_exams%rowtype;
  v_row   jsonb;
  v_count integer := 0;
begin
  select * into v_actor from public.shared_users
  where id = p_actor_id and is_active = true and pin = p_pin
    and role = 'madrasa_teacher' and class_id is not null;
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_teacher');
  end if;

  select * into v_exam from public.mdr_exams where id = p_exam_id;
  if v_exam.id is null then
    return jsonb_build_object('ok', false, 'error', 'exam_not_found');
  end if;
  if v_exam.class_id <> v_actor.class_id then
    return jsonb_build_object('ok', false, 'error', 'not_your_class');
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_results,'[]'::jsonb)) loop
    insert into public.mdr_exam_results (exam_id, student_id, subject_id, marks)
    values (
      p_exam_id,
      (v_row->>'student_id')::uuid,
      (v_row->>'subject_id')::uuid,
      (v_row->>'marks')::numeric
    )
    on conflict (exam_id, student_id, subject_id)
    do update set marks = excluded.marks, created_at = now();
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'count', v_count);
end;
$$;

-- ─────────────────────────────────────────────
-- GRANTS
-- ─────────────────────────────────────────────

grant execute on function public.mdr_rel_exam_bootstrap(uuid, text) to anon;
grant execute on function public.mdr_rel_save_exam(uuid, text, text, text, jsonb) to anon;
grant execute on function public.mdr_rel_update_exam(uuid, text, uuid, text, text, jsonb) to anon;
grant execute on function public.mdr_rel_delete_exam(uuid, text, uuid) to anon;
grant execute on function public.mdr_rel_save_exam_results(uuid, text, uuid, jsonb) to anon;
