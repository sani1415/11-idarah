-- Remove product from catalog: keep physical stock (unlink) or zero stock then deactivate.

create or replace function public.dept_rel_remove_product(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text,
  p_product_id uuid,
  p_mode text default 'keep_stock'
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_dept_id uuid;
  v_product public.dept_products%rowtype;
  v_inv public.dept_inventory%rowtype;
  v_mode text := lower(btrim(coalesce(p_mode, 'keep_stock')));
begin
  v_actor := private.dept_authorized_actor(p_actor_id, p_pin, p_dept_code);
  if v_actor.id is null and not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;

  if v_mode not in ('keep_stock', 'zero_stock') then
    return jsonb_build_object('ok', false, 'error', 'invalid_mode');
  end if;

  if p_product_id is null then
    return jsonb_build_object('ok', false, 'error', 'product_required');
  end if;

  select id into v_dept_id
  from public.dept_departments
  where code = p_dept_code and is_active = true;
  if v_dept_id is null then
    return jsonb_build_object('ok', false, 'error', 'dept_not_found');
  end if;

  select * into v_product
  from public.dept_products
  where id = p_product_id and dept_id = v_dept_id
  for update;
  if v_product.id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  select * into v_inv
  from public.dept_inventory
  where dept_id = v_dept_id and product_id = p_product_id
  for update;

  if v_mode = 'zero_stock' and v_inv.id is not null and coalesce(v_inv.quantity, 0) > 0 then
    perform private.dept_inventory_apply(
      v_dept_id,
      p_product_id,
      v_inv.item_name,
      v_inv.unit,
      -v_inv.quantity,
      'waste',
      null,
      v_actor.id,
      'তালিকা থেকে বাদ — মজুদ শূন্য'
    );
    delete from public.dept_inventory
    where id = v_inv.id;
  elsif v_mode = 'keep_stock' and v_inv.id is not null then
    if coalesce(v_inv.quantity, 0) > 0 and exists (
      select 1
      from public.dept_inventory i
      where i.dept_id = v_dept_id
        and i.product_id is null
        and i.id <> v_inv.id
        and lower(i.item_name) = lower(v_inv.item_name)
        and lower(i.unit) = lower(v_inv.unit)
    ) then
      return jsonb_build_object('ok', false, 'error', 'duplicate_item');
    end if;

    update public.dept_inventory
    set product_id = null,
        updated_at = now()
    where id = v_inv.id;
  elsif v_inv.id is not null and coalesce(v_inv.quantity, 0) <= 0 then
    delete from public.dept_inventory
    where id = v_inv.id;
  end if;

  update public.dept_products
  set is_active = false,
      updated_at = now()
  where id = p_product_id and dept_id = v_dept_id;

  return jsonb_build_object('ok', true, 'mode', v_mode);
end;
$$;

grant execute on function public.dept_rel_remove_product(uuid, text, text, uuid, text) to anon;
