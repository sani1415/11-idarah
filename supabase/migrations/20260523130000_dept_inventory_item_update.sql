-- Inventory item metadata + quantity edit; sync linked product catalog row.

create or replace function public.dept_rel_update_inventory_item(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text,
  p_inventory_id uuid,
  p_item_name text,
  p_unit text default null,
  p_quantity numeric default null,
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
  v_product public.dept_products%rowtype;
  v_name text;
  v_unit text;
  v_new_qty numeric;
  v_delta numeric;
begin
  v_actor := private.dept_authorized_actor(p_actor_id, p_pin, p_dept_code);
  if v_actor.id is null and not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;

  v_name := btrim(coalesce(p_item_name, ''));
  if v_name = '' then
    return jsonb_build_object('ok', false, 'error', 'name_required');
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

  v_unit := coalesce(nullif(btrim(p_unit), ''), v_inv.unit, 'পিস');

  if v_inv.product_id is not null then
    select * into v_product
    from public.dept_products
    where id = v_inv.product_id and dept_id = v_dept_id;
    if v_product.id is null then
      return jsonb_build_object('ok', false, 'error', 'product_not_found');
    end if;
  end if;

  if p_quantity is not null then
    v_new_qty := p_quantity;
  elsif lower(v_unit) <> lower(v_inv.unit) then
    v_new_qty := private.dept_convert_qty_to_stock_unit(
      v_inv.quantity,
      v_inv.unit,
      v_unit,
      v_product.unit,
      v_product.pack_size
    );
  else
    v_new_qty := v_inv.quantity;
  end if;

  if v_new_qty is null or v_new_qty < 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_quantity');
  end if;

  if v_inv.product_id is null then
    if exists (
      select 1
      from public.dept_inventory i
      where i.dept_id = v_dept_id
        and i.product_id is null
        and i.id <> v_inv.id
        and lower(i.item_name) = lower(v_name)
        and lower(i.unit) = lower(v_unit)
    ) then
      return jsonb_build_object('ok', false, 'error', 'duplicate_item');
    end if;
  elsif lower(v_name) <> lower(v_product.name) then
    if exists (
      select 1
      from public.dept_products p
      where p.dept_id = v_dept_id
        and p.id <> v_product.id
        and lower(p.name) = lower(v_name)
    ) then
      return jsonb_build_object('ok', false, 'error', 'duplicate_product');
    end if;
  end if;

  if v_inv.product_id is not null then
    update public.dept_products
    set name = v_name,
        stock_unit = v_unit,
        updated_at = now()
    where id = v_product.id and dept_id = v_dept_id;
  end if;

  update public.dept_inventory
  set item_name = v_name,
      unit = v_unit,
      quantity = v_new_qty,
      updated_at = now()
  where id = v_inv.id;

  v_delta := v_new_qty - v_inv.quantity;
  if abs(v_delta) >= 0.000001 then
    insert into public.dept_inventory_movements (
      dept_id, product_id, transaction_id, item_name, unit, quantity_delta, reason, notes, created_by
    )
    values (
      v_dept_id,
      v_inv.product_id,
      null,
      v_name,
      v_unit,
      v_delta,
      'adjustment',
      coalesce(nullif(btrim(p_notes), ''), 'মজুদ সংশোধন'),
      v_actor.id
    );
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.dept_rel_update_inventory_item(
  uuid, text, text, uuid, text, text, numeric, text
) to anon;

-- Keep inventory display in sync when product catalog is edited.
create or replace function public.dept_rel_save_product(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text,
  p_product_id uuid,
  p_name text,
  p_unit text,
  p_price numeric,
  p_is_active boolean default true,
  p_stock_unit text default null,
  p_pack_size numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_dept_id uuid;
  v_product_id uuid;
  v_unit text := coalesce(nullif(btrim(p_unit), ''), 'পিস');
  v_stock_unit text := coalesce(nullif(btrim(p_stock_unit), ''), v_unit);
  v_pack numeric := nullif(p_pack_size, 0);
  v_name text := btrim(coalesce(p_name, ''));
begin
  v_actor := private.dept_authorized_actor(p_actor_id, p_pin, p_dept_code);
  if v_actor.id is null and not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;
  if v_name = '' then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;

  select id into v_dept_id from public.dept_departments where code = p_dept_code and is_active = true;
  if v_dept_id is null then
    return jsonb_build_object('ok', false, 'error', 'dept_not_found');
  end if;

  if p_product_id is null then
    insert into public.dept_products (dept_id, name, unit, stock_unit, pack_size, price)
    values (v_dept_id, v_name, v_unit, v_stock_unit, v_pack, greatest(coalesce(p_price, 0), 0))
    on conflict (dept_id, lower(name)) do update
    set unit = excluded.unit,
        stock_unit = excluded.stock_unit,
        pack_size = excluded.pack_size,
        price = excluded.price,
        is_active = p_is_active,
        updated_at = now()
    returning id into v_product_id;
  else
    update public.dept_products
    set name = v_name,
        unit = v_unit,
        stock_unit = v_stock_unit,
        pack_size = v_pack,
        price = greatest(coalesce(p_price, 0), 0),
        is_active = p_is_active,
        updated_at = now()
    where id = p_product_id and dept_id = v_dept_id
    returning id into v_product_id;
  end if;

  if v_product_id is not null then
    update public.dept_inventory
    set item_name = v_name,
        unit = v_stock_unit,
        updated_at = now()
    where dept_id = v_dept_id and product_id = v_product_id;
  end if;

  return jsonb_build_object('ok', true, 'id', v_product_id);
end;
$$;

grant execute on function public.dept_rel_save_product(uuid, text, text, uuid, text, text, numeric, boolean, text, numeric) to anon;
