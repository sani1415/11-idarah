-- Show each department head's current PIN in the admin department settings.

create or replace function public.dept_rel_admin_departments(p_pin text)
returns jsonb
language sql
security definer
set search_path = public, private
as $$
  select case when private.verify_admin_pin(p_pin) then
    jsonb_build_object(
      'ok', true,
      'departments', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'code', d.code,
          'emoji', d.emoji,
          'sort_order', d.sort_order,
          'is_active', d.is_active,
          'head_user_id', h.id,
          'head_name', h.name,
          'head_pin', h.pin,
          'head_login_id', h.login_id
        ) order by d.sort_order, d.name)
        from public.dept_departments d
        left join lateral (
          select u.id, u.name, u.pin, u.login_id
          from public.shared_users u
          where u.role = 'dept_head'
            and u.dept_code = d.code
            and u.is_active = true
          order by u.created_at, u.id
          limit 1
        ) h on true
      ), '[]'::jsonb)
    )
  else
    jsonb_build_object('ok', false, 'error', 'invalid_pin')
  end;
$$;

revoke execute on function public.dept_rel_admin_departments(text) from public, authenticated;
grant execute on function public.dept_rel_admin_departments(text) to anon;
