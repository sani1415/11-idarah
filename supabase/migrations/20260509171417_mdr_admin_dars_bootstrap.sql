-- Admin/restricted-admin read model for Dars (kitab progress).

create or replace function public.mdr_rel_admin_dars_bootstrap(p_actor_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_depts text[];
  v_is_super boolean;
begin
  select * into v_actor
  from public.shared_users u
  where u.is_active = true
    and u.pin = p_pin
    and u.role in ('admin', 'restricted_admin')
    and (
      (p_actor_id is not null and u.id = p_actor_id)
      or (p_actor_id is null and u.role = 'admin')
    )
  order by case when p_actor_id is not null and u.id = p_actor_id then 0 else 1 end, u.created_at
  limit 1;

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_actor');
  end if;

  v_is_super := v_actor.role = 'admin' or coalesce(v_actor.admin_perms->>'super_admin', 'false') = 'true';

  if not v_is_super and coalesce(v_actor.admin_perms->'permissions'->>'dars', 'false') <> 'true' then
    return jsonb_build_object('ok', false, 'error', 'permission_denied');
  end if;

  if v_is_super then
    v_depts := array['kitab','maktab']::text[];
  else
    select array(
      select value
      from jsonb_array_elements_text(coalesce(v_actor.admin_perms->'scope'->'madrasa_depts', '[]'::jsonb)) as t(value)
      where value in ('kitab', 'maktab')
    ) into v_depts;
  end if;

  if coalesce(array_length(v_depts, 1), 0) = 0 then
    return jsonb_build_object('ok', true, 'classes', '[]'::jsonb, 'books', '[]'::jsonb, 'book_progress_history', '[]'::jsonb);
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
      ) order by d.code, c.sort_order, c.name), '[]'::jsonb)
      from public.mdr_classes c
      join public.mdr_divisions d on d.id = c.division_id
      where c.is_active = true
        and c.code <> 'kitab_hifz'
        and d.code = any(v_depts)
    ),
    'books', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'class_code', c.code,
        'class_name', c.name,
        'division_code', d.code,
        'total_pages', b.total_pages,
        'sort_order', b.sort_order,
        'pages_done', coalesce(bp.pages_done, 0),
        'notes', bp.notes,
        'updated_at', bp.updated_at
      ) order by d.code, c.sort_order, b.sort_order, b.name), '[]'::jsonb)
      from public.mdr_books b
      join public.mdr_classes c on c.id = b.class_id
      join public.mdr_divisions d on d.id = c.division_id
      left join public.mdr_book_progress bp on bp.book_id = b.id
      where c.is_active = true
        and c.code <> 'kitab_hifz'
        and d.code = any(v_depts)
    ),
    'book_progress_history', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', e.id,
        'book_id', e.book_id,
        'class_code', c.code,
        'division_code', d.code,
        'pages_done', e.pages_done,
        'note', e.notes,
        'date', e.created_at::date,
        'by', coalesce(u.name, '')
      ) order by e.created_at desc), '[]'::jsonb)
      from public.mdr_book_progress_events e
      join public.mdr_classes c on c.id = e.class_id
      join public.mdr_divisions d on d.id = c.division_id
      left join public.shared_users u on u.id = e.updated_by
      where c.is_active = true
        and c.code <> 'kitab_hifz'
        and d.code = any(v_depts)
    )
  );
end;
$$;

revoke execute on function public.mdr_rel_admin_dars_bootstrap(uuid, text) from public, authenticated;
grant execute on function public.mdr_rel_admin_dars_bootstrap(uuid, text) to anon;
