-- 029_mdr_alhamdulillah.sql
-- Teacher-toggle «আলহামদুলিল্লাহ» মার্ক (ছাত্র তালিকা তারকা)। ওয়াকফ টেবিল স্পর্শ নয়।

alter table public.mdr_students
add column if not exists alhamdulillah boolean not null default false,
add column if not exists alhamdulillah_by uuid references public.shared_users(id) on delete set null,
add column if not exists alhamdulillah_at timestamptz;

create index if not exists mdr_students_alhamdulillah_idx
on public.mdr_students (alhamdulillah)
where alhamdulillah = true;

create or replace function public.mdr_rel_set_alhamdulillah(
  p_actor_id uuid,
  p_pin text,
  p_student_id uuid,
  p_alhamdulillah boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_student public.mdr_students%rowtype;
begin
  select *
  into v_actor
  from public.shared_users
  where id = p_actor_id
    and is_active = true
    and pin = p_pin
    and role = 'madrasa_teacher'
    and class_id is not null;

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_teacher');
  end if;

  select *
  into v_student
  from public.mdr_students
  where id = p_student_id
    and status = 'active';

  if v_student.id is null then
    return jsonb_build_object('ok', false, 'error', 'student_not_found');
  end if;

  if v_student.current_class_id <> v_actor.class_id then
    return jsonb_build_object('ok', false, 'error', 'not_teacher_class');
  end if;

  update public.mdr_students
  set alhamdulillah = coalesce(p_alhamdulillah, false),
      alhamdulillah_by = case when coalesce(p_alhamdulillah, false) then v_actor.id else null end,
      alhamdulillah_at = case when coalesce(p_alhamdulillah, false) then now() else null end,
      updated_at = now()
  where id = p_student_id;

  return jsonb_build_object(
    'ok', true,
    'student_id', p_student_id,
    'alhamdulillah', coalesce(p_alhamdulillah, false)
  );
end;
$$;

grant execute on function public.mdr_rel_set_alhamdulillah(uuid, text, uuid, boolean) to anon;

-- শিক্ষক বুটস্ট্র্যাপে ফিল্ড যোগ (০২২-এর সংস্করণ প্রতিস্থাপন)
create or replace function public.mdr_rel_teacher_class_bootstrap(p_actor_id uuid, p_pin text)
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
    and role = 'madrasa_teacher'
    and class_id is not null;

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_teacher');
  end if;

  return jsonb_build_object(
    'ok', true,
    'students', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'student_id', s.student_id, 'name', s.name, 'guardian_name', s.guardian_name,
        'guardian_phone', s.guardian_phone, 'district', s.district, 'upazila', s.upazila,
        'class_code', c.code, 'class_name', c.name, 'division_code', d.code,
        'current_roll', s.current_roll, 'status', s.status, 'is_hifz', s.is_hifz,
        'special_watch', coalesce(s.special_watch, false),
        'special_watch_at', s.special_watch_at,
        'alhamdulillah', coalesce(s.alhamdulillah, false),
        'alhamdulillah_at', s.alhamdulillah_at
      ) order by s.current_roll, s.name), '[]'::jsonb)
      from public.mdr_students s
      join public.mdr_classes c on c.id = s.current_class_id
      join public.mdr_divisions d on d.id = s.division_id
      where s.status = 'active'
        and s.current_class_id = v_actor.class_id
    ),
    'books', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'class_code', c.code,
        'class_name', c.name,
        'total_pages', b.total_pages,
        'sort_order', b.sort_order,
        'pages_done', coalesce(bp.pages_done, 0),
        'notes', bp.notes,
        'updated_at', bp.updated_at
      ) order by b.sort_order, b.name), '[]'::jsonb)
      from public.mdr_books b
      join public.mdr_classes c on c.id = b.class_id
      left join public.mdr_book_progress bp on bp.book_id = b.id
      where b.class_id = v_actor.class_id
    ),
    'book_progress_history', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', e.id,
        'book_id', e.book_id,
        'class_code', c.code,
        'pages_done', e.pages_done,
        'note', e.notes,
        'date', e.created_at::date,
        'by', coalesce(u.name, '')
      ) order by e.created_at desc), '[]'::jsonb)
      from public.mdr_book_progress_events e
      join public.mdr_classes c on c.id = e.class_id
      left join public.shared_users u on u.id = e.updated_by
      where e.class_id = v_actor.class_id
    ),
    'akhlaq', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id,
        'student_id', a.student_id,
        'score', a.score,
        'reason', a.reason,
        'date', a.evaluated_at::date,
        'by', coalesce(u.name, '')
      ) order by a.evaluated_at desc), '[]'::jsonb)
      from public.mdr_akhlaq a
      join public.mdr_students s on s.id = a.student_id
      left join public.shared_users u on u.id = a.evaluated_by
      where s.current_class_id = v_actor.class_id
    ),
    'logs', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'type', l.type,
        'class_code', c.code,
        'student_id', l.student_id,
        'content', l.content,
        'date', l.created_at::date,
        'by', coalesce(u.name, '')
      ) order by l.created_at desc), '[]'::jsonb)
      from public.mdr_logs l
      left join public.mdr_students s on s.id = l.student_id
      left join public.mdr_classes c on c.id = coalesce(l.class_id, s.current_class_id)
      left join public.shared_users u on u.id = l.written_by
      where coalesce(l.class_id, s.current_class_id) = v_actor.class_id
    )
  );
end;
$$;
