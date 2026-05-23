-- Per-department customizable settings for staff pages.

create table if not exists public.dept_settings (
  dept_id uuid primary key references public.dept_departments(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references public.shared_users(id),
  updated_at timestamptz not null default now()
);

alter table public.dept_settings enable row level security;

drop policy if exists "deny_all_dept_settings" on public.dept_settings;
create policy "deny_all_dept_settings" on public.dept_settings for all using (false) with check (false);

create or replace function public.dept_rel_save_settings(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text,
  p_settings jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_dept_id uuid;
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

  insert into public.dept_settings (dept_id, settings, updated_by, updated_at)
  values (v_dept_id, coalesce(p_settings, '{}'::jsonb), v_actor.id, now())
  on conflict (dept_id) do update
  set settings = excluded.settings,
      updated_by = excluded.updated_by,
      updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

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
    'settings', coalesce((
      select s.settings
      from public.dept_settings s
      where s.dept_id = v_dept_id
    ), '{}'::jsonb),
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

grant execute on function public.dept_rel_save_settings(uuid, text, text, jsonb) to anon;
grant execute on function public.dept_rel_bootstrap(uuid, text, text) to anon;
