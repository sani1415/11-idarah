/* মাদরাসা Supabase RPC helpers */

const MMMadrasaAPI = (() => {
  function ensureShared() {
    if (!window.MMSharedAPI) {
      throw new Error('MMSharedAPI is not loaded');
    }
    return window.MMSharedAPI;
  }

  async function rpc(name, params) {
    return ensureShared().rpc(name, params);
  }

  function requireOk(res) {
    if (!res || res.ok !== true) {
      throw new Error((res && res.error) || 'request_failed');
    }
    return res;
  }

  return {
    adminBootstrap(pin) {
      return rpc('mdr_rel_admin_bootstrap', { p_pin: pin }).then(requireOk);
    },
    adminStudents(pin) {
      return rpc('mdr_rel_admin_students', { p_pin: pin }).then(requireOk);
    },
    getSettings(pin) {
      return rpc('mdr_rel_get_settings', { p_pin: pin }).then(requireOk);
    },
    saveSettings(pin, settings) {
      return rpc('mdr_rel_save_settings', {
        p_pin: pin,
        p_institution: settings.institution || null,
        p_hijri_year: settings.hijri_year || null,
        p_session_start_date: settings.session_start_date || null,
        p_hijri_offset_days: Number(settings.hijri_offset_days) || 0,
      }).then(requireOk);
    },
    importCandidates(pin, source) {
      return rpc('mdr_rel_import_candidates', {
        p_pin: pin,
        p_source: source || null,
      }).then(requireOk);
    },
    approveImportCandidate(pin, payload) {
      return rpc('mdr_rel_approve_import_candidate', {
        p_pin: pin,
        p_candidate_id: payload.candidateId,
        p_student_id: payload.studentId,
        p_class_code: payload.classCode,
        p_roll: payload.roll,
        p_hijri_year: payload.hijriYear || null,
      }).then(requireOk);
    },
    skipImportCandidate(pin, candidateId) {
      return rpc('mdr_rel_skip_import_candidate', {
        p_pin: pin,
        p_candidate_id: candidateId,
      }).then(requireOk);
    },
  };
})();

if (typeof window !== 'undefined') {
  window.MMMadrasaAPI = MMMadrasaAPI;
}
