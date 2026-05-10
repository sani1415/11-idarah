-- হিফজ বিভাগ: tables + RPCs

-- ── TABLES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mdr_hifz_groups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  teacher_name text,
  start_date   date,
  note         text,
  is_active    boolean     NOT NULL DEFAULT true,
  created_by   uuid        REFERENCES public.shared_users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mdr_hifz_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_mdr_hifz_groups" ON public.mdr_hifz_groups FOR ALL USING (false);

CREATE TABLE IF NOT EXISTS public.mdr_hifz_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL REFERENCES public.mdr_hifz_groups(id) ON DELETE CASCADE,
  student_id  uuid        NOT NULL REFERENCES public.mdr_students(id) ON DELETE CASCADE,
  joined_date date,
  status      text        NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','completed','transferred','dropped')),
  left_reason text,
  left_at     date,
  left_note   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, student_id)
);
ALTER TABLE public.mdr_hifz_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_mdr_hifz_members" ON public.mdr_hifz_members FOR ALL USING (false);

CREATE TABLE IF NOT EXISTS public.mdr_hifz_progress (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid        NOT NULL REFERENCES public.mdr_hifz_groups(id) ON DELETE CASCADE,
  para_done     integer     NOT NULL DEFAULT 0 CHECK (para_done >= 0 AND para_done <= 30),
  current_para  integer     NOT NULL DEFAULT 1 CHECK (current_para >= 1 AND current_para <= 30),
  note          text,
  recorded_date date        NOT NULL DEFAULT CURRENT_DATE,
  recorded_by   uuid        REFERENCES public.shared_users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, recorded_date)
);
ALTER TABLE public.mdr_hifz_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_mdr_hifz_progress" ON public.mdr_hifz_progress FOR ALL USING (false);

CREATE TABLE IF NOT EXISTS public.mdr_hifz_activity (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid        NOT NULL REFERENCES public.mdr_hifz_groups(id) ON DELETE CASCADE,
  type          text        NOT NULL DEFAULT 'পাঠ',
  text          text        NOT NULL,
  recorded_date date        NOT NULL DEFAULT CURRENT_DATE,
  recorded_by   uuid        REFERENCES public.shared_users(id),
  by_name       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mdr_hifz_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_mdr_hifz_activity" ON public.mdr_hifz_activity FOR ALL USING (false);


-- ── AUTH HELPER ─────────────────────────────────────────────────────────────
-- hifz staff, admin, বা restricted_admin (hifz permission সহ) verify করে

CREATE OR REPLACE FUNCTION private.verify_hifz_actor(p_actor_id uuid, p_pin text)
RETURNS public.shared_users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
DECLARE v_actor public.shared_users%rowtype;
BEGIN
  SELECT * INTO v_actor
  FROM public.shared_users u
  WHERE u.is_active = true
    AND u.pin = p_pin
    AND u.role IN ('admin','restricted_admin','hifz')
    AND (
      (p_actor_id IS NOT NULL AND u.id = p_actor_id)
      OR (p_actor_id IS NULL AND u.role = 'admin')
    )
  ORDER BY CASE WHEN p_actor_id IS NOT NULL AND u.id = p_actor_id THEN 0 ELSE 1 END, u.created_at
  LIMIT 1;

  IF v_actor.id IS NULL THEN RETURN NULL; END IF;

  IF v_actor.role = 'restricted_admin' THEN
    IF coalesce(v_actor.admin_perms->'permissions'->>'hifz','false') <> 'true' THEN
      RETURN NULL;
    END IF;
  END IF;

  RETURN v_actor;
END;
$$;


-- ── BOOTSTRAP ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mdr_rel_hifz_bootstrap(p_actor_id uuid, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
DECLARE v_actor public.shared_users%rowtype;
BEGIN
  v_actor := private.verify_hifz_actor(p_actor_id, p_pin);
  IF v_actor.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_actor');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'groups', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', g.id, 'name', g.name, 'teacher', g.teacher_name,
        'start', g.start_date, 'note', g.note, 'active', g.is_active
      ) ORDER BY g.created_at), '[]'::jsonb)
      FROM public.mdr_hifz_groups g
    ),
    'members', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id, 'group_id', m.group_id,
        'student_id', m.student_id,
        'student_name', s.name,
        'student_roll', s.current_roll,
        'student_permanent_id', s.student_id,
        'class_name', c.name,
        'class_code', c.code,
        'joined', m.joined_date,
        'status', m.status,
        'left_reason', m.left_reason,
        'left_at', m.left_at
      ) ORDER BY m.created_at), '[]'::jsonb)
      FROM public.mdr_hifz_members m
      JOIN public.mdr_students s ON s.id = m.student_id
      LEFT JOIN public.mdr_classes c ON c.id = s.current_class_id
    ),
    'progress', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', p.id, 'group_id', p.group_id,
        'para_done', p.para_done, 'current_para', p.current_para,
        'note', p.note, 'date', p.recorded_date
      ) ORDER BY p.group_id, p.recorded_date DESC), '[]'::jsonb)
      FROM public.mdr_hifz_progress p
    ),
    'activity', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'group_id', a.group_id,
        'type', a.type, 'text', a.text, 'date', a.recorded_date,
        'by', coalesce(a.by_name, u.name, '')
      ) ORDER BY a.recorded_date DESC, a.created_at DESC), '[]'::jsonb)
      FROM public.mdr_hifz_activity a
      LEFT JOIN public.shared_users u ON u.id = a.recorded_by
    )
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mdr_rel_hifz_bootstrap(uuid,text) FROM public, authenticated;
GRANT EXECUTE ON FUNCTION public.mdr_rel_hifz_bootstrap(uuid,text) TO anon;


-- ── SAVE GROUP (upsert) ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mdr_rel_hifz_save_group(
  p_actor_id uuid, p_pin text,
  p_group_id uuid, p_name text, p_teacher text, p_start_date date, p_note text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
DECLARE v_actor public.shared_users%rowtype; v_id uuid;
BEGIN
  v_actor := private.verify_hifz_actor(p_actor_id, p_pin);
  IF v_actor.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_actor');
  END IF;

  IF p_group_id IS NOT NULL THEN
    UPDATE public.mdr_hifz_groups
    SET name=p_name, teacher_name=p_teacher, start_date=p_start_date,
        note=p_note, updated_at=now()
    WHERE id = p_group_id;
    v_id := p_group_id;
  ELSE
    INSERT INTO public.mdr_hifz_groups (name, teacher_name, start_date, note, created_by)
    VALUES (p_name, p_teacher, p_start_date, p_note, v_actor.id)
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mdr_rel_hifz_save_group(uuid,text,uuid,text,text,date,text) FROM public, authenticated;
GRANT EXECUTE ON FUNCTION public.mdr_rel_hifz_save_group(uuid,text,uuid,text,text,date,text) TO anon;


-- ── SAVE PROGRESS (upsert by date) ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mdr_rel_hifz_save_progress(
  p_actor_id uuid, p_pin text,
  p_group_id uuid, p_para_done integer, p_current_para integer, p_note text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
DECLARE v_actor public.shared_users%rowtype; v_id uuid;
BEGIN
  v_actor := private.verify_hifz_actor(p_actor_id, p_pin);
  IF v_actor.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_actor');
  END IF;

  INSERT INTO public.mdr_hifz_progress
    (group_id, para_done, current_para, note, recorded_date, recorded_by)
  VALUES (p_group_id, p_para_done, p_current_para, p_note, CURRENT_DATE, v_actor.id)
  ON CONFLICT (group_id, recorded_date) DO UPDATE
    SET para_done=EXCLUDED.para_done, current_para=EXCLUDED.current_para,
        note=EXCLUDED.note, recorded_by=EXCLUDED.recorded_by
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mdr_rel_hifz_save_progress(uuid,text,uuid,integer,integer,text) FROM public, authenticated;
GRANT EXECUTE ON FUNCTION public.mdr_rel_hifz_save_progress(uuid,text,uuid,integer,integer,text) TO anon;


-- ── ADD MEMBER ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mdr_rel_hifz_add_member(
  p_actor_id uuid, p_pin text,
  p_group_id uuid, p_student_id uuid, p_joined_date date
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
DECLARE v_actor public.shared_users%rowtype; v_id uuid;
BEGIN
  v_actor := private.verify_hifz_actor(p_actor_id, p_pin);
  IF v_actor.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_actor');
  END IF;

  INSERT INTO public.mdr_hifz_members (group_id, student_id, joined_date, status)
  VALUES (p_group_id, p_student_id, coalesce(p_joined_date, CURRENT_DATE), 'active')
  ON CONFLICT (group_id, student_id) DO UPDATE
    SET status='active', left_reason=NULL, left_at=NULL, left_note=NULL,
        joined_date=EXCLUDED.joined_date
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mdr_rel_hifz_add_member(uuid,text,uuid,uuid,date) FROM public, authenticated;
GRANT EXECUTE ON FUNCTION public.mdr_rel_hifz_add_member(uuid,text,uuid,uuid,date) TO anon;


-- ── MEMBER LEAVE ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mdr_rel_hifz_member_leave(
  p_actor_id uuid, p_pin text,
  p_member_id uuid, p_status text, p_reason text, p_left_at date, p_note text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
DECLARE v_actor public.shared_users%rowtype;
BEGIN
  v_actor := private.verify_hifz_actor(p_actor_id, p_pin);
  IF v_actor.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_actor');
  END IF;

  UPDATE public.mdr_hifz_members
  SET status=p_status, left_reason=p_reason,
      left_at=coalesce(p_left_at, CURRENT_DATE), left_note=p_note
  WHERE id = p_member_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mdr_rel_hifz_member_leave(uuid,text,uuid,text,text,date,text) FROM public, authenticated;
GRANT EXECUTE ON FUNCTION public.mdr_rel_hifz_member_leave(uuid,text,uuid,text,text,date,text) TO anon;


-- ── SAVE ACTIVITY ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mdr_rel_hifz_save_activity(
  p_actor_id uuid, p_pin text,
  p_group_id uuid, p_type text, p_text text, p_by_name text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
DECLARE v_actor public.shared_users%rowtype; v_id uuid;
BEGIN
  v_actor := private.verify_hifz_actor(p_actor_id, p_pin);
  IF v_actor.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_actor');
  END IF;

  INSERT INTO public.mdr_hifz_activity
    (group_id, type, text, recorded_date, recorded_by, by_name)
  VALUES (p_group_id, p_type, p_text, CURRENT_DATE, v_actor.id, p_by_name)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mdr_rel_hifz_save_activity(uuid,text,uuid,text,text,text) FROM public, authenticated;
GRANT EXECUTE ON FUNCTION public.mdr_rel_hifz_save_activity(uuid,text,uuid,text,text,text) TO anon;
