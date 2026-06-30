/* Legacy alumni archive helpers: preserved old Excel data + live follow-up data. */
(function (global) {
  'use strict';

  var AL_KEY = 'mm_alumni';
  var CONTACT_KEY = 'mm_alumni_contacts';

  var SAMPLE_ALUMNI = [];
  var SAMPLE_CONTACTS = [];

  function esc(s) {
    if (global.API && API.esc) return API.esc(s || '');
    return String(s || '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function load(key) {
    if (global.API && API.persistLoadArr) return API.persistLoadArr(key);
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
  }

  function save(key, rows) {
    if (global.API && API.persistSaveArr) API.persistSaveArr(key, rows || []);
    else {
      try { localStorage.setItem(key, JSON.stringify(rows || [])); } catch (e) {}
    }
  }

  function ensureSampleData() {
    return false;
  }

  function sourceLabel(row) {
    if (!row) return '';
    if (/^legacy_excel/.test(String(row.source_type || ''))) return 'পুরনো Excel';
    if (row.source_type === 'current_student' || row.source_type === 'supabase_alumni') return 'বর্তমান ছাত্র তালিকা';
    return row.source_type ? row.source_type : 'লোকাল রেকর্ড';
  }

  function allPhones(row) {
    var list = [];
    if (row && row.phone) list.push(row.phone);
    if (row && row.other_phones) {
      String(row.other_phones).split(';').forEach(function (p) {
        p = p.trim();
        if (p && list.indexOf(p) < 0) list.push(p);
      });
    }
    return list.join('; ');
  }

  function displayLocation(row) {
    return (row && (row.location || row.latest_verified_status || row.old_current_status || row.old_address)) || 'অজানা';
  }

  function displayYear(row) {
    return (row && (row.year || row.study_end_hijri || String(row.left_date || '').slice(0, 4))) || '—';
  }

  function isLegacy(row) {
    return !!(row && /^legacy_excel/.test(String(row.source_type || '')));
  }

  function needsContact(row, lastContact, daysSince) {
    if (!row) return true;
    if (row.followup_status === 'verified') return false;
    if (row.old_status_category === 'no_contact' && !lastContact) return true;
    return daysSince == null || daysSince > 30;
  }

  function oldInfoHtml(row) {
    if (!row) return '';
    var legacyBits = [
      row.legacy_batch ? '<div><b>ব্যাচ:</b> ' + esc(row.legacy_batch) + '</div>' : '',
      row.proposed_legacy_id ? '<div><b>অস্থায়ী legacy দাখেলা:</b> ' + esc(row.proposed_legacy_id) + '</div>' : '',
      row.old_address ? '<div><b>পুরনো ঠিকানা:</b> ' + esc(row.old_address) + '</div>' : '',
      allPhones(row) ? '<div><b>সংরক্ষিত ফোন:</b> ' + esc(allPhones(row)) + '</div>' : '',
      row.old_current_status ? '<div><b>পুরনো বর্তমান অবস্থা:</b> ' + esc(row.old_current_status) + '</div>' : '',
      row.old_study_note ? '<div><b>পুরনো মন্তব্য:</b> ' + esc(row.old_study_note) + '</div>' : '',
    ].filter(Boolean).join('');
    var liveBits = [
      row.location ? '<div><b>সর্বশেষ যাচাইকৃত অবস্থা:</b> ' + esc(row.location) + '</div>' : '<div><b>সর্বশেষ যাচাইকৃত অবস্থা:</b> এখনো নেই</div>',
      row.last_contact_date ? '<div><b>শেষ যোগাযোগ:</b> ' + esc(row.last_contact_date) + '</div>' : '',
      '<div><b>উৎস:</b> ' + esc(sourceLabel(row)) + '</div>',
    ].filter(Boolean).join('');
    return '<div class="legacy-info-card">' +
      '<div class="legacy-info-title">পুরনো সংরক্ষিত তথ্য</div>' +
      '<div class="legacy-info-grid">' + (legacyBits || '<div>পুরনো Excel/source তথ্য নেই।</div>') + '</div>' +
      '<div class="legacy-info-title" style="margin-top:10px">লাইভ ফলোআপ</div>' +
      '<div class="legacy-info-grid">' + liveBits + '</div>' +
      '</div>';
  }

  global.MDRAlumniIntegration = {
    ensureSampleData: ensureSampleData,
    sourceLabel: sourceLabel,
    allPhones: allPhones,
    displayLocation: displayLocation,
    displayYear: displayYear,
    isLegacy: isLegacy,
    needsContact: needsContact,
    oldInfoHtml: oldInfoHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
