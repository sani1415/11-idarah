-- Delete an inventory row; log remaining stock as waste before removal.

create or replace function public.dept_rel_delete_inventory_item(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text,
  p_inventory_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_dept_id uuid;
  v_inv public.dept_inventory%rowtype;
  v_note text := coalesce(nullif(btrim(p_notes), ''), 'মজুদ তালিকা থেকে মুছে ফেলা');
begin
  v_actor := private.dept_authorized_actor(p_actor_id, p_pin, p_dept_code);
  if v_actor.id is null and not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;

  select id into v_dept_id
  from public.dept_departments
  where code = p_dept_code and is_active = true;
  if v_dept_id is null then
    return jsonb_build_object('ok', false, 'error', 'dept_not_found');
  end if;

  select * into v_inv
  from public.dept_inventory
  where id = p_inventory_id and dept_id = v_dept_id
  for update;
  if v_inv.id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if coalesce(v_inv.quantity, 0) > 0 then
    perform private.dept_inventory_apply(
      v_dept_id,
      v_inv.product_id,
      v_inv.item_name,
      v_inv.unit,
      -v_inv.quantity,
      'waste',
      null,
      v_actor.id,
      v_note
    );
  end if;

  delete from public.dept_inventory
  where id = v_inv.id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.dept_rel_delete_inventory_item(uuid, text, text, uuid, text) to anon;
