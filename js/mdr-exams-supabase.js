/* Bridge: Supabase exam data ↔ prototype API cache (mm_exams, mm_results). */
(function (global) {
  'use strict';

  var CLASS_CODE_TO_LOCAL_ID = {
    kitab_y1: 'cls_k1', kitab_iyada: 'cls_ky',
    kitab_y2: 'cls_k2', kitab_y3: 'cls_k3', kitab_y4: 'cls_k4',
    kitab_y5: 'cls_k5', kitab_y6: 'cls_k6', kitab_y7: 'cls_k7',
    kitab_hifz: 'cls_kh',
    maktab_y1: 'cls_m1', maktab_y2: 'cls_m2', maktab_y3: 'cls_m3',
    maktab_y4: 'cls_m4', maktab_y5: 'cls_m5',
  };

  function mapExam(ex) {
    return {
      id: String(ex.id),
      name: ex.name || '',
      type: ex.type || 'monthly',
      class_id: CLASS_CODE_TO_LOCAL_ID[ex.class_code] || ex.class_code || '',
      created: ex.created_at ? String(ex.created_at).slice(0, 10) : '',
      subjects: (ex.subjects || []).map(function (s) {
        return { id: String(s.id), name: s.name || '', max: Number(s.max_marks) || 100, sort_order: Number(s.sort_order) || 0 };
      }),
    };
  }

  function mapResults(exams) {
    var all = [];
    (exams || []).forEach(function (ex) {
      var byStudent = {};
      (ex.results || []).forEach(function (r) {
        var sid = String(r.student_id);
        if (!byStudent[sid]) byStudent[sid] = [];
        byStudent[sid].push(r);
      });
      Object.keys(byStudent).forEach(function (sid) {
        var rows = byStudent[sid];
        var subjects = rows.map(function (r) {
          var subj = (ex.subjects || []).find(function (s) { return String(s.id) === String(r.subject_id); });
          return {
            subject_id: String(r.subject_id),
            name: subj ? subj.name : '',
            max: subj ? Number(subj.max_marks) : 100,
            marks: Number(r.marks) || 0,
          };
        });
        var total = subjects.reduce(function (a, s) { return a + s.marks; }, 0);
        var maxTotal = subjects.reduce(function (a, s) { return a + s.max; }, 0);
        var pct = maxTotal ? Math.round(total / maxTotal * 1000) / 10 : 0;
        all.push({
          id: String(ex.id) + '_' + sid,
          exam_id: String(ex.id),
          student_id: sid,
          subjects: subjects,
          total: total,
          max_total: maxTotal,
          percentage: pct,
          grade: '',
        });
      });
    });
    return all;
  }

  function getActorPin() {
    if (!global.MMSession) return null;
    var actorId = MMSession.getStaffUserId && MMSession.getStaffUserId();
    var pin = MMSession.getStaffPin && MMSession.getStaffPin();
    if (!actorId || !pin) return null;
    return { actorId: actorId, pin: pin };
  }

  async function bootstrap() {
    if (!global.MMSharedAPI || !global.API) return false;
    var ap = getActorPin();
    if (!ap) return false;
    var res = await MMSharedAPI.examBootstrap(ap.actorId, ap.pin);
    if (!res || !res.ok) return false;
    API.persistSaveArr('mm_exams', (res.exams || []).map(mapExam));
    API.persistSaveArr('mm_results', mapResults(res.exams || []));
    return true;
  }

  async function saveExam(name, type, subjects) {
    if (!global.MMSharedAPI) return null;
    var ap = getActorPin();
    if (!ap) return null;
    var dbSubjects = subjects.map(function (s) { return { name: s.name, max_marks: s.max }; });
    var res = await MMSharedAPI.saveExam(ap.actorId, ap.pin, name, type, dbSubjects);
    if (!res || !res.ok) throw new Error(res && res.error || 'save_failed');
    await bootstrap();
    return String(res.id);
  }

  async function updateExam(examId, name, type, subjects) {
    if (!global.MMSharedAPI) return;
    var ap = getActorPin();
    if (!ap) return;
    var dbSubjects = subjects
      ? subjects.map(function (s) { return { name: s.name, max_marks: s.max }; })
      : null;
    var res = await MMSharedAPI.updateExam(ap.actorId, ap.pin, examId, name, type, dbSubjects);
    if (!res || !res.ok) throw new Error(res && res.error || 'update_failed');
    await bootstrap();
  }

  async function deleteExam(examId) {
    if (!global.MMSharedAPI) return;
    var ap = getActorPin();
    if (!ap) return;
    var res = await MMSharedAPI.deleteExam(ap.actorId, ap.pin, examId);
    if (!res || !res.ok) throw new Error(res && res.error || 'delete_failed');
    await bootstrap();
  }

  async function saveResults(examId, resultsArr) {
    // resultsArr: [{student_id, subject_id, marks}]
    if (!global.MMSharedAPI) return;
    var ap = getActorPin();
    if (!ap) return;
    var res = await MMSharedAPI.saveExamResults(ap.actorId, ap.pin, examId, resultsArr);
    if (!res || !res.ok) throw new Error(res && res.error || 'save_results_failed');
    await bootstrap();
  }

  global.MDRExamsSync = { bootstrap: bootstrap, saveExam: saveExam, updateExam: updateExam, deleteExam: deleteExam, saveResults: saveResults };
})(typeof window !== 'undefined' ? window : globalThis);
