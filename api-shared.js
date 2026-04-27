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
  };
})();

if (typeof window !== 'undefined') {
  window.MMSharedAPI = MMSharedAPI;
  window.supabaseClient = MMSharedAPI.supabaseClient;
}
