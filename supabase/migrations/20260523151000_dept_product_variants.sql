-- Department product variants: sellable packs can consume one shared stock item.

alter table public.dept_products
  add column if not exists stock_product_id uuid references public.dept_products(id) on delete set null,
  add column if not exists is_stock_item boolean not null default true,
  add column if not exists is_sellable boolean not null default true;

update public.dept_products
set stock_product_id = null
where stock_product_id = id;

create index if not exists dept_products_stock_product_idx
on public.dept_products (dept_id, stock_product_id)
where stock_product_id is not null;

create or replace function public.dept_rel_bootstrap(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_dept_code text;
  v_dept_id uuid;
begin
  v_actor := private.dept_authorized_actor(p_actor_id, p_pin, p_dept_code);
  if v_actor.id is null and not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;

  v_dept_code := coalesce(nullif(btrim(p_dept_code), ''), v_actor.dept_code);

  select id into v_dept_id
  from public.dept_departments
  where code = v_dept_code and is_active = true;

  if v_dept_id is null then
    return jsonb_build_object('ok', false, 'error', 'dept_not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'dept_id', v_dept_code,
        'name', p.name,
        'unit', p.unit,
        'stock_unit', coalesce(nullif(btrim(p.stock_unit), ''), sp.stock_unit, p.unit),
        'pack_size', p.pack_size,
        'price', p.price,
        'is_active', p.is_active,
        'stock_product_id', p.stock_product_id,
        'stock_product_name', sp.name,
        'is_stock_item', p.is_stock_item,
        'is_sellable', p.is_sellable
      ) order by p.sort_order, p.name)
      from public.dept_products p
      left join public.dept_products sp
        on sp.id = p.stock_product_id and sp.dept_id = p.dept_id
      where p.dept_id = v_dept_id and p.is_active = true
    ), '[]'::jsonb),
    'inventory', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'dept_id', v_dept_code,
        'product_id', i.product_id,
        'item_name', i.item_name,
        'unit', i.unit,
        'quantity', i.quantity,
        'date_updated', i.updated_at
      ) order by i.item_name)
      from public.dept_inventory i
      where i.dept_id = v_dept_id
    ), '[]'::jsonb),
    'transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'dept_id', v_dept_code,
        'type', t.type,
        'amount', t.amount,
        'base_amount', t.base_amount,
        'honor_amount', t.honor_amount,
        'description', t.description,
        'date', t.txn_date,
        'txn_date', t.txn_date,
        'category', t.category,
        'buyer_name', t.buyer_name,
        'buyer_phone', t.buyer_phone,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'metadata', t.metadata || jsonb_build_object(
          'honor_amount', t.honor_amount,
          'buyer_name', t.buyer_name,
          'buyer_phone', t.buyer_phone,
          'seller_name', coalesce(t.metadata->>'seller_name', case when t.type = 'expense' then t.buyer_name else null end),
          'line_items', coalesce(
            nullif(t.metadata->'line_items', '[]'::jsonb),
            (
              select jsonb_agg(jsonb_build_object(
                'product_id', ti.product_id,
                'stock_product_id', coalesce(p.stock_product_id, ti.product_id),
                'product_name', ti.product_name,
                'name', ti.product_name,
                'unit', ti.unit,
                'qty', ti.quantity,
                'rate', ti.unit_price,
                'amount', ti.line_total
              ) order by ti.sort_order)
              from public.dept_transaction_items ti
              left join public.dept_products p on p.id = ti.product_id
              where ti.transaction_id = t.id
            ),
            '[]'::jsonb
          )
        )
      ) order by t.txn_date desc, t.created_at desc)
      from public.dept_transactions t
      where t.dept_id = v_dept_id and t.deleted_at is null
    ), '[]'::jsonb),
    'extra_fields', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'dept_id', v_dept_code,
        'key', f.key,
        'label', f.label,
        'type', f.field_type,
        'optional', f.optional,
        'sort_order', f.sort_order
      ) order by f.sort_order, f.created_at)
      from public.dept_extra_fields f
      where f.dept_id = v_dept_id
    ), '[]'::jsonb),
    'edit_requests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'dept_id', v_dept_code,
        'transaction_id', r.transaction_id,
        'kind', r.kind,
        'reason', r.reason,
        'status', r.status,
        'original', r.original,
        'proposed', r.proposed,
        'created_at', r.created_at,
        'resolved_at', r.resolved_at
      ) order by r.created_at desc)
      from public.dept_edit_requests r
      where r.dept_id = v_dept_id
    ), '[]'::jsonb)
  );
end;
$$;

drop function if exists public.dept_rel_save_product(uuid, text, text, uuid, text, text, numeric, boolean, text, numeric);

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
  p_pack_size numeric default null,
  p_stock_product_id uuid default null,
  p_is_stock_item boolean default true,
  p_is_sellable boolean default true
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
  v_stock_product public.dept_products%rowtype;
  v_unit text := coalesce(nullif(btrim(p_unit), ''), 'পিস');
  v_stock_unit text := coalesce(nullif(btrim(p_stock_unit), ''), v_unit);
  v_pack numeric := nullif(p_pack_size, 0);
  v_name text := btrim(coalesce(p_name, ''));
  v_is_stock_item boolean := coalesce(p_is_stock_item, true);
  v_is_sellable boolean := coalesce(p_is_sellable, true);
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

  if p_stock_product_id is not null then
    if p_product_id is not null and p_stock_product_id = p_product_id then
      return jsonb_build_object('ok', false, 'error', 'self_stock_product');
    end if;
    select * into v_stock_product
    from public.dept_products
    where id = p_stock_product_id and dept_id = v_dept_id and is_active = true;
    if v_stock_product.id is null then
      return jsonb_build_object('ok', false, 'error', 'stock_product_not_found');
    end if;
    v_stock_unit := coalesce(nullif(btrim(v_stock_product.stock_unit), ''), v_stock_product.unit, v_stock_unit);
    v_is_stock_item := false;
    v_is_sellable := true;
  end if;

  if p_product_id is null then
    insert into public.dept_products (
      dept_id, name, unit, stock_unit, pack_size, price,
      stock_product_id, is_stock_item, is_sellable, is_active
    )
    values (
      v_dept_id, v_name, v_unit, v_stock_unit, v_pack, greatest(coalesce(p_price, 0), 0),
      p_stock_product_id, v_is_stock_item, v_is_sellable, p_is_active
    )
    on conflict (dept_id, lower(name)) do update
    set unit = excluded.unit,
        stock_unit = excluded.stock_unit,
        pack_size = excluded.pack_size,
        price = excluded.price,
        stock_product_id = excluded.stock_product_id,
        is_stock_item = excluded.is_stock_item,
        is_sellable = excluded.is_sellable,
        is_active = excluded.is_active,
        updated_at = now()
    returning id into v_product_id;
  else
    update public.dept_products
    set name = v_name,
        unit = v_unit,
        stock_unit = v_stock_unit,
        pack_size = v_pack,
        price = greatest(coalesce(p_price, 0), 0),
        stock_product_id = p_stock_product_id,
        is_stock_item = v_is_stock_item,
        is_sellable = v_is_sellable,
        is_active = p_is_active,
        updated_at = now()
    where id = p_product_id and dept_id = v_dept_id
    returning id into v_product_id;
  end if;

  if v_product_id is not null and v_is_stock_item then
    update public.dept_inventory
    set product_id = v_product_id,
        item_name = v_name,
        unit = v_stock_unit,
        updated_at = now()
    where dept_id = v_dept_id
      and product_id is null
      and lower(item_name) = lower(v_name)
      and lower(unit) = lower(v_stock_unit)
      and not exists (
        select 1
        from public.dept_inventory existing
        where existing.dept_id = v_dept_id
          and existing.product_id = v_product_id
      );

    update public.dept_inventory
    set item_name = v_name,
        unit = v_stock_unit,
        updated_at = now()
    where dept_id = v_dept_id and product_id = v_product_id;
  end if;

  return jsonb_build_object('ok', true, 'id', v_product_id);
end;
$$;

grant execute on function public.dept_rel_save_product(
  uuid, text, text, uuid, text, text, numeric, boolean, text, numeric, uuid, boolean, boolean
) to anon;

create or replace function public.dept_rel_adjust_inventory(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text,
  p_product_id uuid,
  p_item_name text,
  p_unit text,
  p_quantity_delta numeric,
  p_reason text default 'stock_in',
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
  v_product public.dept_products%rowtype;
  v_stock_product public.dept_products%rowtype;
  v_name text;
  v_input_unit text;
  v_stock_unit text;
  v_delta_stock numeric;
begin
  v_actor := private.dept_authorized_actor(p_actor_id, p_pin, p_dept_code);
  if v_actor.id is null and not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;
  if p_reason not in ('stock_in', 'waste', 'adjustment') then
    return jsonb_build_object('ok', false, 'error', 'invalid_reason');
  end if;
  if coalesce(p_quantity_delta, 0) = 0 then
    return jsonb_build_object('ok', false, 'error', 'quantity_required');
  end if;

  select id into v_dept_id from public.dept_departments where code = p_dept_code and is_active = true;
  if v_dept_id is null then
    return jsonb_build_object('ok', false, 'error', 'dept_not_found');
  end if;

  if p_product_id is not null then
    select * into v_product from public.dept_products where id = p_product_id and dept_id = v_dept_id;
    if v_product.id is not null and v_product.stock_product_id is not null then
      select * into v_stock_product
      from public.dept_products
      where id = v_product.stock_product_id and dept_id = v_dept_id;
    else
      v_stock_product := v_product;
    end if;
  end if;

  v_name := coalesce(v_stock_product.name, v_product.name, nullif(btrim(coalesce(p_item_name, '')), ''));
  v_input_unit := coalesce(nullif(btrim(p_unit), ''), v_stock_product.stock_unit, v_stock_product.unit, v_product.unit, 'পিস');
  v_stock_unit := coalesce(nullif(btrim(v_stock_product.stock_unit), ''), nullif(btrim(v_stock_product.unit), ''), v_input_unit, 'পিস');
  if v_name is null or v_name = '' then
    return jsonb_build_object('ok', false, 'error', 'item_required');
  end if;

  v_delta_stock := private.dept_convert_qty_to_stock_unit(
    p_quantity_delta,
    v_input_unit,
    v_stock_unit,
    v_product.unit,
    v_product.pack_size
  );

  perform private.dept_inventory_apply(
    v_dept_id,
    v_stock_product.id,
    v_name,
    v_stock_unit,
    v_delta_stock,
    p_reason,
    null,
    v_actor.id,
    p_notes
  );

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.dept_rel_save_transaction(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text,
  p_type text,
  p_description text,
  p_date date,
  p_category text default null,
  p_amount numeric default 0,
  p_honor_amount numeric default 0,
  p_buyer_name text default null,
  p_buyer_phone text default null,
  p_items jsonb default '[]'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_dept_id uuid;
  v_txn_id uuid;
  v_items jsonb := coalesce(p_items, '[]'::jsonb);
  v_base numeric := 0;
  v_amount numeric := 0;
  v_item jsonb;
  v_product public.dept_products%rowtype;
  v_stock_product public.dept_products%rowtype;
  v_name text;
  v_unit text;
  v_qty numeric;
  v_rate numeric;
  v_line_total numeric;
  v_sort integer := 0;
  v_stock_unit text;
  v_stock_qty numeric;
begin
  v_actor := private.dept_authorized_actor(p_actor_id, p_pin, p_dept_code);
  if v_actor.id is null and not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;
  if p_type not in ('income', 'expense') then
    return jsonb_build_object('ok', false, 'error', 'invalid_type');
  end if;

  select id into v_dept_id from public.dept_departments where code = p_dept_code and is_active = true;
  if v_dept_id is null then
    return jsonb_build_object('ok', false, 'error', 'dept_not_found');
  end if;

  if jsonb_array_length(v_items) > 0 then
    select coalesce(sum(greatest(coalesce((x->>'amount')::numeric, 0), 0)), 0) into v_base
    from jsonb_array_elements(v_items) x;
  else
    v_base := greatest(coalesce(p_amount, 0), 0);
  end if;

  v_amount := v_base + case when p_type = 'income' then greatest(coalesce(p_honor_amount, 0), 0) else 0 end;

  if v_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'amount_required');
  end if;

  insert into public.dept_transactions (
    dept_id, type, amount, base_amount, honor_amount, description, txn_date,
    category, buyer_name, buyer_phone, metadata, created_by
  )
  values (
    v_dept_id, p_type, v_amount, v_base,
    case when p_type = 'income' then greatest(coalesce(p_honor_amount, 0), 0) else 0 end,
    btrim(coalesce(p_description, '')), coalesce(p_date, current_date),
    p_category, nullif(btrim(coalesce(p_buyer_name, '')), ''),
    nullif(btrim(coalesce(p_buyer_phone, '')), ''),
    coalesce(p_metadata, '{}'::jsonb), v_actor.id
  )
  returning id into v_txn_id;

  for v_item in select * from jsonb_array_elements(v_items) loop
    v_sort := v_sort + 1;
    v_product := null;
    v_stock_product := null;
    if nullif(v_item->>'product_id', '') is not null then
      select * into v_product
      from public.dept_products
      where id = (v_item->>'product_id')::uuid and dept_id = v_dept_id;
      if v_product.id is not null and v_product.stock_product_id is not null then
        select * into v_stock_product
        from public.dept_products
        where id = v_product.stock_product_id and dept_id = v_dept_id;
      else
        v_stock_product := v_product;
      end if;
    end if;

    v_name := coalesce(nullif(v_item->>'product_name', ''), nullif(v_item->>'name', ''), v_product.name, 'আইটেম');
    v_unit := coalesce(nullif(v_item->>'unit', ''), v_product.unit, 'পিস');
    v_qty := greatest(coalesce((v_item->>'qty')::numeric, (v_item->>'quantity')::numeric, case when p_type = 'income' then 0 else 1 end), 0);
    v_rate := greatest(coalesce((v_item->>'rate')::numeric, (v_item->>'unit_price')::numeric, case when v_qty > 0 then (v_item->>'amount')::numeric / v_qty else 0 end, 0), 0);
    v_line_total := greatest(coalesce((v_item->>'amount')::numeric, case when p_type = 'income' then v_qty * v_rate else v_rate end), 0);

    insert into public.dept_transaction_items (
      transaction_id, product_id, product_name, unit, quantity, unit_price, line_total, sort_order
    )
    values (
      v_txn_id, v_product.id, v_name, v_unit, v_qty,
      case when p_type = 'income' then v_rate else v_line_total end,
      v_line_total, v_sort
    );

    if p_type = 'income' and v_product.id is not null and v_qty > 0 then
      v_stock_unit := coalesce(nullif(btrim(v_stock_product.stock_unit), ''), v_stock_product.unit, v_product.stock_unit, v_product.unit, 'পিস');
      v_stock_qty := private.dept_convert_qty_to_stock_unit(
        v_qty, v_unit, v_stock_unit, v_product.unit, v_product.pack_size
      );
      perform private.dept_inventory_apply(
        v_dept_id, v_stock_product.id, coalesce(v_stock_product.name, v_name), v_stock_unit, -v_stock_qty,
        'sale', v_txn_id, v_actor.id, 'বিক্রির কারণে মজুদ কমেছে'
      );
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'id', v_txn_id);
end;
$$;

create or replace function public.dept_rel_update_transaction(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text,
  p_transaction_id uuid,
  p_description text,
  p_date date,
  p_category text default null,
  p_amount numeric default 0,
  p_honor_amount numeric default 0,
  p_buyer_name text default null,
  p_buyer_phone text default null,
  p_items jsonb default '[]'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_txn public.dept_transactions%rowtype;
  v_item record;
  v_product public.dept_products%rowtype;
  v_stock_product public.dept_products%rowtype;
  v_stock_unit text;
  v_stock_qty numeric;
  v_new jsonb;
begin
  v_actor := private.dept_authorized_actor(p_actor_id, p_pin, p_dept_code);
  if v_actor.id is null and not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;

  select t.* into v_txn
  from public.dept_transactions t
  join public.dept_departments d on d.id = t.dept_id
  where t.id = p_transaction_id and d.code = p_dept_code and t.deleted_at is null;
  if v_txn.id is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;

  if v_txn.type = 'income' then
    for v_item in select * from public.dept_transaction_items where transaction_id = v_txn.id and product_id is not null loop
      select * into v_product from public.dept_products where id = v_item.product_id;
      if v_product.id is not null and v_product.stock_product_id is not null then
        select * into v_stock_product from public.dept_products where id = v_product.stock_product_id;
      else
        v_stock_product := v_product;
      end if;
      v_stock_unit := coalesce(nullif(btrim(v_stock_product.stock_unit), ''), v_stock_product.unit, v_product.stock_unit, v_product.unit, 'পিস');
      v_stock_qty := private.dept_convert_qty_to_stock_unit(
        v_item.quantity, v_item.unit, v_stock_unit, v_product.unit, v_product.pack_size
      );
      perform private.dept_inventory_apply(
        v_txn.dept_id, v_stock_product.id, coalesce(v_stock_product.name, v_item.product_name), v_stock_unit, v_stock_qty,
        'adjustment', v_txn.id, v_actor.id, 'লেনদেন এডিটের আগে পুরনো বিক্রি ফেরত'
      );
    end loop;
  end if;

  delete from public.dept_transaction_items where transaction_id = v_txn.id;

  update public.dept_transactions
  set description = btrim(coalesce(p_description, '')),
      txn_date = coalesce(p_date, current_date),
      category = p_category,
      amount = 0,
      base_amount = 0,
      honor_amount = case when v_txn.type = 'income' then greatest(coalesce(p_honor_amount, 0), 0) else 0 end,
      buyer_name = nullif(btrim(coalesce(p_buyer_name, '')), ''),
      buyer_phone = nullif(btrim(coalesce(p_buyer_phone, '')), ''),
      metadata = coalesce(p_metadata, '{}'::jsonb),
      updated_at = now()
  where id = v_txn.id;

  v_new := public.dept_rel_save_transaction(
    p_actor_id, p_pin, p_dept_code, v_txn.type, p_description, p_date, p_category,
    p_amount, p_honor_amount, p_buyer_name, p_buyer_phone, p_items, p_metadata
  );

  update public.dept_transaction_items
  set transaction_id = v_txn.id
  where transaction_id = (v_new->>'id')::uuid;

  update public.dept_transactions src
  set deleted_at = now(), deleted_by = v_actor.id
  where src.id = (v_new->>'id')::uuid;

  update public.dept_transactions tgt
  set amount = src.amount,
      base_amount = src.base_amount,
      honor_amount = src.honor_amount,
      description = src.description,
      txn_date = src.txn_date,
      category = src.category,
      buyer_name = src.buyer_name,
      buyer_phone = src.buyer_phone,
      metadata = src.metadata,
      updated_at = now()
  from public.dept_transactions src
  where tgt.id = v_txn.id and src.id = (v_new->>'id')::uuid;

  return jsonb_build_object('ok', true, 'id', v_txn.id);
end;
$$;

create or replace function public.dept_rel_delete_transaction(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text,
  p_transaction_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_txn public.dept_transactions%rowtype;
  v_item record;
  v_product public.dept_products%rowtype;
  v_stock_product public.dept_products%rowtype;
  v_stock_unit text;
  v_stock_qty numeric;
begin
  v_actor := private.dept_authorized_actor(p_actor_id, p_pin, p_dept_code);
  if v_actor.id is null and not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;

  select t.* into v_txn
  from public.dept_transactions t
  join public.dept_departments d on d.id = t.dept_id
  where t.id = p_transaction_id and d.code = p_dept_code and t.deleted_at is null;
  if v_txn.id is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;

  if v_txn.type = 'income' then
    for v_item in select * from public.dept_transaction_items where transaction_id = v_txn.id and product_id is not null loop
      select * into v_product from public.dept_products where id = v_item.product_id;
      if v_product.id is not null and v_product.stock_product_id is not null then
        select * into v_stock_product from public.dept_products where id = v_product.stock_product_id;
      else
        v_stock_product := v_product;
      end if;
      v_stock_unit := coalesce(nullif(btrim(v_stock_product.stock_unit), ''), v_stock_product.unit, v_product.stock_unit, v_product.unit, 'পিস');
      v_stock_qty := private.dept_convert_qty_to_stock_unit(
        v_item.quantity, v_item.unit, v_stock_unit, v_product.unit, v_product.pack_size
      );
      perform private.dept_inventory_apply(
        v_txn.dept_id, v_stock_product.id, coalesce(v_stock_product.name, v_item.product_name), v_stock_unit, v_stock_qty,
        'adjustment', v_txn.id, v_actor.id, 'লেনদেন ডিলিটের কারণে বিক্রি ফেরত'
      );
    end loop;
  end if;

  update public.dept_transactions
  set deleted_at = now(), deleted_by = v_actor.id, updated_at = now()
  where id = v_txn.id;

  return jsonb_build_object('ok', true, 'id', v_txn.id);
end;
$$;

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

  if exists (
    select 1
    from public.dept_products p
    where p.dept_id = v_dept_id
      and p.stock_product_id = p_product_id
      and p.is_active = true
  ) then
    return jsonb_build_object('ok', false, 'error', 'stock_product_in_use');
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
      'তালিকা থেকে বাদ - মজুদ শূন্য'
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

grant execute on function public.dept_rel_bootstrap(uuid, text, text) to anon;
grant execute on function public.dept_rel_adjust_inventory(uuid, text, text, uuid, text, text, numeric, text, text) to anon;
grant execute on function public.dept_rel_save_transaction(uuid, text, text, text, text, date, text, numeric, numeric, text, text, jsonb, jsonb) to anon;
grant execute on function public.dept_rel_update_transaction(uuid, text, text, uuid, text, date, text, numeric, numeric, text, text, jsonb, jsonb) to anon;
grant execute on function public.dept_rel_delete_transaction(uuid, text, text, uuid) to anon;
grant execute on function public.dept_rel_remove_product(uuid, text, text, uuid, text) to anon;
