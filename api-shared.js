/* মাদরাসাতুল মদীনা — Supabase shared client helpers */

const MMSharedAPI = (() => {
  const cfg = window.MM_SUPABASE_CONFIG || {};

  function getSupabaseKey() {
    return cfg.publishableKey || cfg.anonKey || '';
  }

  function requireClient() {
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase client script is not loaded');
    }
    const key = getSupabaseKey();
    if (!cfg.url || !key) {
      throw new Error('supabase-config.js is missing SUPABASE_URL or publishable key');
    }
    return window.supabase.createClient(cfg.url, key);
  }

  const supabaseClient = requireClient();

  async function rpc(name, params) {
    const { data, error } = await supabaseClient.rpc(name, params || {});
    if (error) throw error;
    return data;
  }

  return {
    supabaseClient,
    rpc,
    loginAdmin(pin) {
      return rpc('mdr_rel_admin_login', { p_pin: pin });
    },
    loginUser(userId, pin) {
      return rpc('mdr_rel_user_login', { p_user_id: userId, p_pin: pin });
    },
    loginStaff(role, loginId, pin) {
      return rpc('mdr_rel_staff_login', {
        p_role: role,
        p_login_id: loginId || null,
        p_pin: pin,
      });
    },
    adminUsers(pin) {
      return rpc('mdr_rel_admin_users', { p_pin: pin });
    },
    saveMadrasaUser(pin, user) {
      return rpc('mdr_rel_save_user', {
        p_pin: pin,
        p_user_id: user.id || null,
        p_name: user.name,
        p_role: user.role,
        p_login_id: user.login_id || null,
        p_user_pin: user.pin,
        p_class_code: user.class_code || null,
        p_admin_perms: user.admin_perms || {},
        p_is_active: user.is_active !== false,
      });
    },
    daftarBootstrap(actorId, pin) {
      return rpc('mdr_rel_daftar_bootstrap', {
        p_actor_id: actorId,
        p_pin: pin,
      });
    },
    saveAttendanceDay(actorId, pin, date, records, hijriYear) {
      return rpc('mdr_rel_save_attendance_day', {
        p_actor_id: actorId,
        p_pin: pin,
        p_date: date,
        p_records: records || [],
        p_hijri_year: hijriYear || null,
      });
    },
  };
})();

if (typeof window !== 'undefined') {
  window.MMSharedAPI = MMSharedAPI;
  window.supabaseClient = MMSharedAPI.supabaseClient;
}
