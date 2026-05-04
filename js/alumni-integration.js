/* Legacy alumni archive helpers: preserved old Excel data + live follow-up data. */
(function (global) {
  'use strict';

  var AL_KEY = 'mm_alumni';
  var CONTACT_KEY = 'mm_alumni_contacts';

  var SAMPLE_ALUMNI = [
    {
      id: 'legacy_excel_01_001',
      source_type: 'legacy_excel_sample',
      proposed_legacy_id: 'LEG-01-001',
      permanent_id: '',
      batch_no: '1',
      legacy_batch: '১ম জামাত ১৪০৯/১০ থেকে ১৪১৩/১৪ হিঃ শিক্ষাবর্ষ',
      study_start_hijri: '1409/10',
      study_end_hijri: '1413/14',
      legacy_serial: '1',
      name: 'মুহাম্মদ মিজানুর রহমান',
      old_address: 'মিরপুর, ঢাকা',
      phone: '01552330920',
      old_current_status: 'শিক্ষক, মাদরাসাতু তাহফিযুল কুরআন, দারুল ইহসানের অধীনে আশুলিয়া, সাভার।',
      old_study_note: 'পাঁচ বছর পূর্ণ করেছেন।',
      old_status_category: 'completed',
      year: '1413/14',
      reason: 'পাঁচ বছর পূর্ণ করেছেন।',
      location: '',
      followup_status: 'needs_review',
      status: 'সম্পন্ন',
    },
    {
      id: 'legacy_excel_01_003',
      source_type: 'legacy_excel_sample',
      proposed_legacy_id: 'LEG-01-003',
      permanent_id: '',
      batch_no: '1',
      legacy_batch: '১ম জামাত ১৪০৯/১০ থেকে ১৪১৩/১৪ হিঃ শিক্ষাবর্ষ',
      study_start_hijri: '1409/10',
      study_end_hijri: '1413/14',
      legacy_serial: '3',
      name: 'মুহাম্মদ আবুল কাসেম',
      old_address: 'মিরপুর, ঢাকা',
      phone: '01680041136',
      old_current_status: 'আরবী প্রভাষক, দারুল ইহসান। পরিচালক, আল-আজহার মডেল একাডেমী, দ্বীনী প্রাথমিক স্কুল, মিরপুর, ঢাকা।',
      old_study_note: '৩য় বর্ষ পর্যন্ত পড়ার পর পারিবারিক সমস্যার কারণে অন্যত্র চলে যান।',
      old_status_category: 'partial',
      year: '1413/14',
      reason: '৩য় বর্ষ পর্যন্ত পড়েছেন।',
      location: '',
      followup_status: 'needs_review',
      status: 'মাঝপথে',
    },
    {
      id: 'legacy_excel_01_006',
      source_type: 'legacy_excel_sample',
      proposed_legacy_id: 'LEG-01-006',
      permanent_id: '',
      batch_no: '1',
      legacy_batch: '১ম জামাত ১৪০৯/১০ থেকে ১৪১৩/১৪ হিঃ শিক্ষাবর্ষ',
      study_start_hijri: '1409/10',
      study_end_hijri: '1413/14',
      legacy_serial: '6',
      name: 'মুহাম্মদ জাবেদ ইকবাল',
      old_address: '',
      phone: '',
      old_current_status: '',
      old_study_note: 'যোগাযোগ সম্ভব হয়নি।',
      old_status_category: 'no_contact',
      year: '1413/14',
      reason: 'যোগাযোগ সম্ভব হয়নি।',
      location: '',
      followup_status: 'needs_review',
      status: 'যোগাযোগ নেই',
    },
    {
      id: 'legacy_excel_02_001',
      source_type: 'legacy_excel_sample',
      proposed_legacy_id: 'LEG-02-001',
      permanent_id: '',
      batch_no: '2',
      legacy_batch: '২য় জামাত ১৪১০/১১ থেকে ১৪১৪/১৫ হিঃ শিক্ষাবর্ষ',
      study_start_hijri: '1410/11',
      study_end_hijri: '1414/15',
      legacy_serial: '1',
      name: 'মুহাম্মদ আবু সালেহ রাহমানী',
      old_address: 'লক্ষীপুর',
      phone: '01715821568',
      other_phones: '01842821568',
      old_current_status: 'মুহতামিম, মাদরাসাতুল হিকমাহ উত্তরা ঢাকা; খতীব, খিলগাঁও গভর্মেন্ট কলোনী জামে মসজিদ।',
      old_study_note: 'পূর্ণ পাঁচ বছর পড়েছেন।',
      old_status_category: 'completed',
      year: '1414/15',
      reason: 'পূর্ণ পাঁচ বছর পড়েছেন।',
      location: '',
      followup_status: 'needs_review',
      status: 'সম্পন্ন',
    },
    {
      id: 'legacy_excel_02_005',
      source_type: 'legacy_excel_sample',
      proposed_legacy_id: 'LEG-02-005',
      permanent_id: '',
      batch_no: '2',
      legacy_batch: '২য় জামাত ১৪১০/১১ থেকে ১৪১৪/১৫ হিঃ শিক্ষাবর্ষ',
      study_start_hijri: '1410/11',
      study_end_hijri: '1414/15',
      legacy_serial: '5',
      name: 'মুহাম্মদ টিপু',
      old_address: 'ধানমন্ডি, ঢাকা',
      phone: '01815441630',
      other_phones: '01760329291; 01820561482',
      old_current_status: '',
      old_study_note: 'যোগাযোগ সম্ভব হয়নি।',
      old_status_category: 'no_contact',
      year: '1414/15',
      reason: 'যোগাযোগ সম্ভব হয়নি।',
      location: '',
      followup_status: 'needs_review',
      status: 'যোগাযোগ নেই',
    },
  ];

  var SAMPLE_CONTACTS = [
    {
      id: 'legacy_contact_02_001_demo',
      alumni_id: 'legacy_excel_02_001',
      type: 'ফোনে কথা',
      status: 'নমুনা লাইভ ফলোআপ: নতুন নম্বর যাচাই করা দরকার',
      text: 'এটি ডেমো লগ। পুরনো Excel-এর তথ্য অপরিবর্তিত থাকবে; নতুন খোঁজখবর এখানে জমা হবে।',
      date: '2026-05-04',
      by: 'দায়িত্বশীল',
      source_type: 'demo_followup',
    },
  ];

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
    var rows = load(AL_KEY);
    var byId = {};
    rows.forEach(function (row) { byId[String(row.id || '')] = true; });
    SAMPLE_ALUMNI.forEach(function (row) {
      if (!byId[row.id]) rows.push(Object.assign({}, row));
    });
    save(AL_KEY, rows);

    var contacts = load(CONTACT_KEY);
    var contactIds = {};
    contacts.forEach(function (row) { contactIds[String(row.id || '')] = true; });
    SAMPLE_CONTACTS.forEach(function (row) {
      if (!contactIds[row.id]) contacts.push(Object.assign({}, row));
    });
    save(CONTACT_KEY, contacts);
  }

  function sourceLabel(row) {
    if (!row) return '';
    if (row.source_type === 'legacy_excel_sample') return 'পুরনো Excel নমুনা';
    if (row.source_type === 'legacy_excel') return 'পুরনো Excel';
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
      row.proposed_legacy_id ? '<div><b>অস্থায়ী legacy ID:</b> ' + esc(row.proposed_legacy_id) + '</div>' : '',
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
