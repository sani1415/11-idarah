-- Admin push notification: নতুন staff→admin বার্তা এলে admin-এর PWA-তে web push পাঠায়।
--
-- কাজের ধারা:
--   mdr_shared_messages-এ AFTER INSERT (from_role <> 'admin') হলে trigger fire করে,
--   trigger function pg_net (net.http_post) দিয়ে send-admin-push edge function-কে কল করে।
--   edge function admin-এর সব subscription (mdr_shared_push_subscriptions, actor_role='admin')
--   বের করে web push পাঠায় এবং অপঠিত বার্তার সংখ্যা দিয়ে app-icon badge সেট করে।
--
-- নিরাপত্তা:
--   edge function verify_jwt:false, তাই trigger একটি shared secret (x-notify-secret header)
--   পাঠায় যা function-এর NOTIFY_WEBHOOK_SECRET env-এর সমান হতে হয়।
--   raw secret repo-তে রাখা হয় না — Vault থেকে পড়া হয়।
--
-- প্রয়োজনীয় পূর্বশর্ত (একবার, dashboard/SQL দিয়ে; এই ফাইলে raw value রাখা হয়নি):
--   select vault.create_secret('<NOTIFY_WEBHOOK_SECRET এর মান>', 'mdr_notify_webhook_secret');
--   এবং edge function-এর env-এ VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / NOTIFY_WEBHOOK_SECRET সেট থাকা চাই।
--   frontend js/mm-push.js-এর VAPID_PUBLIC_KEY অবশ্যই env-এর VAPID_PUBLIC_KEY-এর সমান হতে হবে।

create or replace function private.mdr_notify_admin_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'mdr_notify_webhook_secret'
    limit 1;

  perform net.http_post(
    url := 'https://bbdtoucanihtrymzpynq.supabase.co/functions/v1/send-admin-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', coalesce(v_secret, '')
    ),
    body := jsonb_build_object(
      'from_role', NEW.from_role,
      'from_name', NEW.from_name,
      'body', NEW.body,
      'thread_id', NEW.thread_id
    ),
    timeout_milliseconds := 5000
  );

  return NEW;
end;
$$;

revoke all on function private.mdr_notify_admin_new_message() from public, anon, authenticated;

drop trigger if exists mdr_shared_messages_notify_admin on public.mdr_shared_messages;
create trigger mdr_shared_messages_notify_admin
  after insert on public.mdr_shared_messages
  for each row
  when (NEW.from_role is distinct from 'admin')
  execute function private.mdr_notify_admin_new_message();
