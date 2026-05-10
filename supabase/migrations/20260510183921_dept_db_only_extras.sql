-- Department module DB-only support:
-- stores per-department dynamic form fields and edit/delete requests in Supabase.

create table if not exists public.dept_extra_fields (
  id uuid primary key default gen_random_uuid(),
  dept_id uuid not null references public.dept_departments(id) on delete cascade,
  key text not null,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'number')),
  optional boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.shared_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dept_id, key)
);

create table if not exists public.dept_edit_requests (
  id uuid primary key default gen_random_uuid(),
  dept_id uuid not null references public.dept_departments(id) on delete cascade,
  transaction_id uuid references public.dept_transactions(id) on delete set null,
  kind text not null default 'dept_transaction_edit',
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  original jsonb not null default '{}'::jsonb,
  proposed jsonb,
  requested_by uuid references public.shared_users(id),
  resolved_by uuid references public.shared_users(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists dept_extra_fields_dept_sort_idx on public.dept_extra_fields (dept_id, sort_order, created_at);
create index if not exists dept_edit_requests_dept_status_idx on public.dept_edit_requests (dept_id, status, created_at desc);

alter table public.dept_extra_fields enable row level security;
alter table public.dept_edit_requests enable row level security;

drop policy if exists "deny_all_dept_extra_fields" on public.dept_extra_fields;
create policy "deny_all_dept_extra_fields" on public.dept_extra_fields for all using (false) with check (false);
drop policy if exists "deny_all_dept_edit_requests" on public.dept_edit_requests;
create policy "deny_all_dept_edit_requests" on public.dept_edit_requests for all using (false) with check (false);

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
          'is_active', d.is_active
        ) order by d.sort_order, d.name)
        from public.dept_departments d
      ), '[]'::jsonb)
    )
  else
    jsonb_build_object('ok', false, 'error', 'invalid_pin')
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
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'dept_id', v_dept_code,
        'name', p.name,
        'unit', p.unit,
        'price', p.price,
        'is_active', p.is_active
      ) order by p.sort_order, p.name)
      from public.dept_products p
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
                'product_name', ti.product_name,
                'name', ti.product_name,
                'unit', ti.unit,
                'qty', ti.quantity,
                'rate', ti.unit_price,
                'amount', ti.line_total
              ) order by ti.sort_order)
              from public.dept_transaction_items ti
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

create or replace function public.dept_rel_save_extra_field(
  p_pin text,
  p_dept_code text,
  p_field jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_dept_id uuid;
  v_id uuid;
  v_key text;
  v_label text;
  v_type text;
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  select id into v_dept_id from public.dept_departments where code = p_dept_code;
  if v_dept_id is null then
    return jsonb_build_object('ok', false, 'error', 'dept_not_found');
  end if;

  v_label := nullif(btrim(coalesce(p_field->>'label', '')), '');
  if v_label is null then
    return jsonb_build_object('ok', false, 'error', 'label_required');
  end if;

  v_key := coalesce(nullif(btrim(p_field->>'key'), ''), 'f_' || left(replace(gen_random_uuid()::text, '-', ''), 10));
  v_type := case when p_field->>'type' = 'number' then 'number' else 'text' end;

  if nullif(p_field->>'id', '') is not null then
    update public.dept_extra_fields
    set key = v_key,
        label = v_label,
        field_type = v_type,
        optional = coalesce((p_field->>'optional')::boolean, true),
        sort_order = coalesce(nullif(p_field->>'sort_order', '')::integer, 0),
        updated_at = now()
    where id = (p_field->>'id')::uuid and dept_id = v_dept_id
    returning id into v_id;
  else
    insert into public.dept_extra_fields (dept_id, key, label, field_type, optional, sort_order)
    values (
      v_dept_id,
      v_key,
      v_label,
      v_type,
      coalesce((p_field->>'optional')::boolean, true),
      coalesce(nullif(p_field->>'sort_order', '')::integer, 0)
    )
    on conflict (dept_id, key) do update set
      label = excluded.label,
      field_type = excluded.field_type,
      optional = excluded.optional,
      sort_order = excluded.sort_order,
      updated_at = now()
    returning id into v_id;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'key', v_key);
end;
$$;

create or replace function public.dept_rel_delete_extra_field(
  p_pin text,
  p_dept_code text,
  p_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_deleted int;
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  delete from public.dept_extra_fields f
  using public.dept_departments d
  where f.dept_id = d.id
    and d.code = p_dept_code
    and f.key = p_key;

  get diagnostics v_deleted = row_count;
  if v_deleted < 1 then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.dept_rel_save_edit_request(
  p_actor_id uuid,
  p_pin text,
  p_dept_code text,
  p_transaction_id uuid,
  p_kind text,
  p_reason text,
  p_original jsonb default '{}'::jsonb,
  p_proposed jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_dept_id uuid;
  v_id uuid;
begin
  v_actor := private.dept_authorized_actor(p_actor_id, p_pin, p_dept_code);
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_login');
  end if;

  select id into v_dept_id from public.dept_departments where code = p_dept_code and is_active = true;
  if v_dept_id is null then
    return jsonb_build_object('ok', false, 'error', 'dept_not_found');
  end if;

  insert into public.dept_edit_requests (
    dept_id, transaction_id, kind, reason, original, proposed, requested_by
  )
  values (
    v_dept_id,
    p_transaction_id,
    coalesce(nullif(btrim(p_kind), ''), 'dept_transaction_edit'),
    coalesce(p_reason, ''),
    coalesce(p_original, '{}'::jsonb),
    p_proposed,
    v_actor.id
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.dept_rel_resolve_edit_request(
  p_pin text,
  p_request_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_admin public.shared_users%rowtype;
  v_status text;
  v_id uuid;
begin
  select * into v_admin
  from public.shared_users u
  where u.is_active = true and u.role = 'admin' and u.pin = p_pin
  order by u.created_at
  limit 1;

  if v_admin.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  v_status := case when p_status = 'approved' then 'approved' else 'rejected' end;
  update public.dept_edit_requests
  set status = v_status,
      resolved_by = v_admin.id,
      resolved_at = now()
  where id = p_request_id
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.dept_rel_admin_departments(text) from public, authenticated;
revoke execute on function public.dept_rel_save_extra_field(text, text, jsonb) from public, authenticated;
revoke execute on function public.dept_rel_delete_extra_field(text, text, text) from public, authenticated;
revoke execute on function public.dept_rel_save_edit_request(uuid, text, text, uuid, text, text, jsonb, jsonb) from public, authenticated;
revoke execute on function public.dept_rel_resolve_edit_request(text, uuid, text) from public, authenticated;

grant execute on function public.dept_rel_admin_departments(text) to anon;
grant execute on function public.dept_rel_bootstrap(uuid, text, text) to anon;
grant execute on function public.dept_rel_save_extra_field(text, text, jsonb) to anon;
grant execute on function public.dept_rel_delete_extra_field(text, text, text) to anon;
grant execute on function public.dept_rel_save_edit_request(uuid, text, text, uuid, text, text, jsonb, jsonb) to anon;
grant execute on function public.dept_rel_resolve_edit_request(text, uuid, text) to anon;
