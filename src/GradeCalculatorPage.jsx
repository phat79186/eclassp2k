import React, { useState, useMemo, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
const SUBJECTS = {
  graded: ['Toán', 'Ngữ văn', 'Ngoại ngữ', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý', 'Giáo dục công dân', 'Kinh tế pháp luật', 'Tin học', 'Công nghệ', 'Giáo dục quốc phòng – An ninh'],
  passfail: ['Thể dục', 'Giáo dục địa phương']
};

// Các cột điểm hiển thị cùng lúc trên bảng "Nhập nhanh cả lớp" (thay vì phải đổi dropdown từng cột một)
const BULK_FIELDS = [
  { key: 'm1',  label: 'M1',        full: 'Điểm miệng M1' },
  { key: 'm2',  label: 'M2',        full: 'Điểm 15 phút M2' },
  { key: 'm3',  label: 'M3',        full: 'Điểm 15 phút M3' },
  { key: 'm4',  label: 'M4',        full: 'Điểm 15 phút M4' },
  { key: 'mid', label: 'Giữa kỳ',   full: 'Điểm giữa kỳ' },
  { key: 'fin', label: 'Cuối kỳ',   full: 'Điểm cuối kỳ' },
];
// Gộp cả 2 học kỳ thành 1 danh sách 12 cột (HK1 x6 + HK2 x6) để hiển thị chung 1 bảng, khỏi cần chọn học kỳ
const ALL_TERM_FIELDS = [
  ...BULK_FIELDS.map(f => ({ ...f, term: 'hk1' })),
  ...BULK_FIELDS.map(f => ({ ...f, term: 'hk2' })),
];

// Điểm trung bình môn học kỳ theo hệ số (M1-M4: hs1, Giữa kỳ: hs2, Cuối kỳ: hs3)
function calcAvg(subScores) {
  if (!subScores) return null;
  const { m1, m2, m3, m4, mid, fin } = subScores;
  let sum = 0, count = 0;
  const add = (v, w) => {
    const n = parseFloat(v);
    if (!isNaN(n)) { sum += n * w; count += w; }
  };
  add(m1, 1); add(m2, 1); add(m3, 1); add(m4, 1);
  add(mid, 2); add(fin, 3);
  return count > 0 ? (sum / count) : null;
}

// Đạt/Chưa đạt học kỳ cho môn đánh giá bằng nhận xét
function calcPassFail(subScores) {
  if (!subScores) return null;
  const { m1, m2, m3, m4, mid, fin } = subScores;
  const all = [m1, m2, m3, m4, mid, fin].filter(Boolean);
  if (all.length === 0) return null;
  const cCount = all.filter(x => x === 'C').length;
  return cCount > 0 ? 'C' : 'D';
}

// Tính điểm trung bình cả năm + xếp loại học lực (Thông tư 22) từ dữ liệu điểm của 1 học sinh.
// Dùng chung cho cả bảng tính chi tiết (giáo viên/học sinh) lẫn thẻ tóm tắt (phụ huynh).
export const GRADE_SUBJECTS = SUBJECTS;

export function computeGradeSummary(scores, conduct) {
  let sumTBM = 0, countTBM = 0, hasC = false, minScore = 10, mathLitEngMax = 0;
  const results = {};

  SUBJECTS.graded.forEach(sub => {
    const hk1 = calcAvg(scores?.[sub]?.hk1);
    const hk2 = calcAvg(scores?.[sub]?.hk2);
    let cn = null;
    if (hk1 !== null && hk2 !== null) cn = (hk1 + hk2 * 2) / 3;
    else if (hk2 !== null) cn = hk2;
    else if (hk1 !== null) cn = hk1;

    results[sub] = { hk1, hk2, cn, type: 'graded' };

    if (cn !== null) {
      cn = Math.round(cn * 10) / 10;
      sumTBM += cn;
      countTBM++;
      if (cn < minScore) minScore = cn;
      if (['Toán', 'Ngữ văn', 'Ngoại ngữ'].includes(sub) && cn > mathLitEngMax) mathLitEngMax = cn;
    }
  });

  SUBJECTS.passfail.forEach(sub => {
    const hk1 = calcPassFail(scores?.[sub]?.hk1);
    const hk2 = calcPassFail(scores?.[sub]?.hk2);
    let cn = hk2 || hk1;
    if (hk1 === 'C' || hk2 === 'C') cn = 'C';
    else if (hk1 === 'D' || hk2 === 'D') cn = 'D';

    results[sub] = { hk1, hk2, cn, type: 'passfail' };
    if (cn === 'C') hasC = true;
  });

  const dtbmca = countTBM > 0 ? Math.round((sumTBM / countTBM) * 10) / 10 : 0;

  let classification = countTBM === 0 ? 'CHƯA ĐỦ ĐIỂM' : 'CHƯA ĐẠT';
  if (countTBM > 0) {
    if (dtbmca >= 8.0 && mathLitEngMax >= 8.0 && minScore >= 6.5 && !hasC) classification = 'TỐT';
    else if (dtbmca >= 6.5 && mathLitEngMax >= 6.5 && minScore >= 5.0 && !hasC) classification = 'KHÁ';
    else if (dtbmca >= 5.0 && mathLitEngMax >= 5.0 && minScore >= 3.5 && !hasC) classification = 'ĐẠT';
    if (conduct === 'average' && (classification === 'TỐT' || classification === 'KHÁ')) classification = 'ĐẠT';
    if (conduct === 'weak') classification = 'CHƯA ĐẠT';
  }

  return { dtbmca, classification, results, minScore, mathLitEngMax, countTBM };
}

export default function GradeCalculatorPage({ state, user, selClass, setSelClass, myClasses }) {
  const isTeacher = user?.role === 'teacher';
  const isParent = user?.role === 'parent';
  const isSelfStudent = user?.role === 'student'; // học sinh tự xem/sửa điểm của chính mình
  const myClassIds = isTeacher ? (myClasses || []).map(c => c.id) : [];
  // Ghi nhớ (memo) danh sách học sinh theo lớp: nếu để mảng mới ở mỗi lần render, các useEffect
  // phụ thuộc myStudents phía dưới sẽ chạy lại liên tục và xóa điểm giáo viên vừa gõ (chưa kịp lưu).
  const myStudents = useMemo(
    () => (isTeacher ? state?.students?.filter(s => s.classId === selClass) || [] : []),
    [isTeacher, state?.students, selClass]
  );
  const myChildren = isParent ? state?.students?.filter(s => (user?.data?.childIds || []).includes(s.id)) || [] : [];

  const [selectedStudentId, setSelectedStudentId] = useState(myStudents.length > 0 ? myStudents[0].id : '');
  
  // Xác định giáo viên chủ nhiệm (đã gia cố so sánh tránh undefined/null)
  const isHomeroom = useMemo(() => {
    if (!isTeacher || !selClass) return false;
    const currentClass = state.classes.find(c => c.id === selClass);
    const userId = user?.data?.id || user?.user?.id || user?.id;
    if (!currentClass || !currentClass.teacherId || !userId) return false;
    return String(currentClass.teacherId) === String(userId);
  }, [isTeacher, selClass, state.classes, user]);

  const [activeTab, setActiveTab] = useState('bulk');
  const [bulkSub, setBulkSub] = useState(() => (isTeacher && user.data?.subject ? user.data.subject : SUBJECTS.graded[0]));
  const [bulkScores, setBulkScores] = useState({}); // { [studentId]: { hk1: {m1..fin}, hk2: {m1..fin} } } - cả 2 học kỳ cùng lúc
  const [bulkDirty, setBulkDirty] = useState(() => new Set());  // "studentId:field" đã sửa nhưng chưa lưu
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkJustSaved, setBulkJustSaved] = useState(false);
  const [fillColVal, setFillColVal] = useState({}); // giá trị nháp của ô "điền nhanh cả cột", theo field

  // Tự động đồng bộ activeTab dựa trên quyền chủ nhiệm
  useEffect(() => {
    if (isTeacher) {
      setActiveTab(isHomeroom ? 'detail' : 'bulk');
    } else {
      setActiveTab('detail');
    }
  }, [isHomeroom, isTeacher]);

  useEffect(() => {
    if (isTeacher && user.data?.subject) {
      setBulkSub(user.data.subject);
    }
  }, [user.data?.subject, isTeacher]);

  const canEditSubject = (sub) => {
    if (!isTeacher) return true;
    if (isHomeroom) return true;
    const teacherSubject = (user.data?.subject || "").trim().toLowerCase();
    return teacherSubject === sub.trim().toLowerCase();
  };

  useEffect(() => {
    if (!isTeacher || activeTab !== 'bulk') return;
    const mkTerm = row => ({ m1: row.m1 || '', m2: row.m2 || '', m3: row.m3 || '', m4: row.m4 || '', mid: row.mid || '', fin: row.fin || '' });
    const init = {};
    myStudents.forEach(s => {
      const subScores = state.grades[s.id]?.scores?.[bulkSub] || {};
      init[s.id] = { hk1: mkTerm(subScores.hk1 || {}), hk2: mkTerm(subScores.hk2 || {}) };
    });
    setBulkScores(init);
    setBulkDirty(new Set());
  }, [bulkSub, activeTab, myStudents, state.grades, isTeacher]);

  const isBulkPassFail = SUBJECTS.passfail.includes(bulkSub);

  // Danh sách học sinh sau khi lọc theo ô tìm kiếm (chỉ ảnh hưởng hiển thị + "điền nhanh cả cột",
  // nút Lưu vẫn lưu đủ toàn bộ lớp bên dưới)
  const filteredBulkStudents = useMemo(() => {
    const q = bulkSearch.trim().toLowerCase();
    if (!q) return myStudents;
    return myStudents.filter(s => (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q));
  }, [myStudents, bulkSearch]);

  const saveBulkScores = () => {
    state.setGrades(prev => {
      const next = { ...prev };
      myStudents.forEach(s => {
        const rec = next[s.id] || { scores: {}, conduct: '', teacherLocked: {} };
        const sScores = { ...(rec.scores || {}) };
        const rowData = bulkScores[s.id] || { hk1: {}, hk2: {} };
        sScores[bulkSub] = {
          hk1: { ...(sScores[bulkSub]?.hk1 || {}), ...rowData.hk1 },
          hk2: { ...(sScores[bulkSub]?.hk2 || {}), ...rowData.hk2 },
        };

        const tl = { ...(rec.teacherLocked || {}) };
        const lockedHk1 = { ...(tl[bulkSub]?.hk1 || {}) };
        const lockedHk2 = { ...(tl[bulkSub]?.hk2 || {}) };
        BULK_FIELDS.forEach(({ key }) => {
          if (rowData.hk1?.[key] !== undefined) lockedHk1[key] = rowData.hk1[key] !== '';
          if (rowData.hk2?.[key] !== undefined) lockedHk2[key] = rowData.hk2[key] !== '';
        });
        tl[bulkSub] = { hk1: lockedHk1, hk2: lockedHk2 };

        next[s.id] = { ...rec, scores: sScores, teacherLocked: tl };
      });
      return next;
    });
    setBulkDirty(new Set());
    setBulkJustSaved(true);
    setTimeout(() => setBulkJustSaved(false), 2200);
  };

  // Sửa 1 ô trong bảng nhập nhanh (đã sửa lỗi regex cũ [^d] từng xóa sạch mọi số vừa gõ)
  const handleBulkCellChange = (studentId, term, field, rawVal) => {
    let v = rawVal;
    if (isBulkPassFail) {
      v = v.toUpperCase();
      if (v !== 'D' && v !== 'C' && v !== '') return;
    } else {
      v = v.replace(/[^\d.]/g, '');
      if (v.length >= 2 && !v.includes('.')) v = v.slice(0, -1) + '.' + v.slice(-1);
    }
    setBulkScores(p => ({
      ...p,
      [studentId]: { ...(p[studentId] || { hk1: {}, hk2: {} }), [term]: { ...(p[studentId]?.[term] || {}), [field]: v } }
    }));
    setBulkDirty(p => { const n = new Set(p); n.add(`${studentId}:${term}:${field}`); return n; });
  };

  // Điền nhanh 1 giá trị cho cả cột, 1 học kỳ (áp dụng cho các học sinh đang hiển thị theo bộ lọc)
  const handleFillColumn = (term, field) => {
    const fillKey = `${term}:${field}`;
    const raw = (fillColVal[fillKey] || '').trim();
    if (raw === '') return;
    let v = raw;
    if (isBulkPassFail) {
      v = v.toUpperCase();
      if (v !== 'D' && v !== 'C') return;
    } else {
      v = v.replace(/[^\d.]/g, '');
    }
    setBulkScores(p => {
      const next = { ...p };
      filteredBulkStudents.forEach(s => {
        const cur = next[s.id] || { hk1: {}, hk2: {} };
        next[s.id] = { ...cur, [term]: { ...cur[term], [field]: v } };
      });
      return next;
    });
    setBulkDirty(p => {
      const n = new Set(p);
      filteredBulkStudents.forEach(s => n.add(`${s.id}:${term}:${field}`));
      return n;
    });
    setFillColVal(p => ({ ...p, [fillKey]: '' }));
  };

  // Dán (Ctrl+V) trực tiếp từ Excel: hỗ trợ dán 1 ô, 1 hàng, 1 cột hoặc cả khối nhiều hàng x nhiều cột,
  // kể cả dán liền mạch từ cột HK1 tràn sang HK2 (đúng thứ tự cột của file mẫu Tải file mẫu / Nhập từ Excel)
  const handleBulkPaste = (e, studentIdx, colIdx) => {
    const paste = e.clipboardData.getData('text');
    if (!paste || (!paste.includes('\t') && !paste.includes('\n'))) return; // dán 1 giá trị -> để trình duyệt xử lý bình thường
    e.preventDefault();
    const rows = paste.split(/\r?\n/).filter(r => r.length > 0).map(r => r.split('\t'));
    const touched = new Set();
    setBulkScores(p => {
      const next = { ...p };
      rows.forEach((cells, rOff) => {
        const student = filteredBulkStudents[studentIdx + rOff];
        if (!student) return;
        const cur = { hk1: { ...(next[student.id]?.hk1 || {}) }, hk2: { ...(next[student.id]?.hk2 || {}) } };
        cells.forEach((cell, cOff) => {
          const col = ALL_TERM_FIELDS[colIdx + cOff];
          if (!col) return;
          let v = cell.trim();
          if (isBulkPassFail) {
            v = v.toUpperCase();
            if (v !== 'D' && v !== 'C') v = '';
          } else {
            v = v.replace(/[^\d.]/g, '');
          }
          cur[col.term][col.key] = v;
          touched.add(`${student.id}:${col.term}:${col.key}`);
        });
        next[student.id] = cur;
      });
      return next;
    });
    setBulkDirty(prevDirty => { const n = new Set(prevDirty); touched.forEach(t => n.add(t)); return n; });
  };
  const [selectedChildId, setSelectedChildId] = useState(myChildren.length > 0 ? myChildren[0].id : '');

  const [selectedGraded, setSelectedGraded] = useState(new Set(SUBJECTS.graded));
  const [selectedPassFail, setSelectedPassFail] = useState(new Set(SUBJECTS.passfail));

  // Với học sinh/phụ huynh: chỉ hiện kết quả sau khi bấm nút "Tính điểm & Xếp loại" (giữ nguyên trải nghiệm cũ).
  // Với giáo viên: không cần bấm nút nữa, kết quả tự động tính lại mỗi khi điểm thay đổi.
  const [revealedIds, setRevealedIds] = useState(new Set());

  const currentId = isTeacher ? selectedStudentId : isParent ? selectedChildId : (user?.role === 'student' ? user.data.id : 'default');
  const readOnly = isParent; // phụ huynh chỉ xem, không được sửa điểm

  // Điểm CHÍNH THỨC (giáo viên nhập) — lưu tập trung ở state.grades, đồng bộ server.
  // Đây là NGUỒN DUY NHẤT được dùng để tính Bảng xếp hạng.
  const gradesStore = state?.grades || {};
  const officialScores = gradesStore[currentId]?.scores || {};
  const conduct = gradesStore[currentId]?.conduct || '';
  // Đánh dấu ô nào do giáo viên đã nhập -> học sinh không được sửa các ô đó nữa
  const teacherLocked = gradesStore[currentId]?.teacherLocked || {};
  const isLocked = (sub, term, field) => !!(teacherLocked?.[sub]?.[term]?.[field]);

  // Điểm MỤC TIÊU (học sinh tự đặt cho bản thân) — CHỈ lưu trong localStorage của trình duyệt học sinh đó.
  // KHÔNG đồng bộ lên server, KHÔNG bao giờ ghi vào state.grades -> không ảnh hưởng Bảng xếp hạng,
  // không ai khác (giáo viên/phụ huynh/học sinh khác) nhìn thấy được giá trị này.
  const targetStorageKey = `gc_target_scores_${user?.data?.id || 'anon'}`;
  const [localTargetScores, setLocalTargetScores] = useState(() => {
    if (user?.role !== 'student') return {};
    try {
      const raw = localStorage.getItem(targetStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    if (!isSelfStudent) return;
    try { localStorage.setItem(targetStorageKey, JSON.stringify(localTargetScores)); } catch { /* noop */ }
  }, [localTargetScores, isSelfStudent, targetStorageKey]);

  // Điểm hiển thị/tính toán trên trang này = gộp điểm chính thức + điểm mục tiêu (chỉ cho học sinh).
  // Ô nào đã bị giáo viên khóa -> luôn ưu tiên điểm chính thức (không để lộ điểm mục tiêu cũ đè lên).
  const scores = useMemo(() => {
    if (!isSelfStudent) return officialScores;
    const merged = {};
    const allSubs = new Set([...Object.keys(officialScores), ...Object.keys(localTargetScores)]);
    allSubs.forEach(sub => {
      merged[sub] = { hk1: {}, hk2: {} };
      ['hk1', 'hk2'].forEach(term => {
        const off = officialScores?.[sub]?.[term] || {};
        const local = localTargetScores?.[sub]?.[term] || {};
        const fields = new Set([...Object.keys(off), ...Object.keys(local)]);
        fields.forEach(field => {
          merged[sub][term][field] = isLocked(sub, term, field) ? (off[field] || '') : (local[field] !== undefined ? local[field] : (off[field] || ''));
        });
      });
    });
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officialScores, localTargetScores, isSelfStudent, teacherLocked]);

  const liveResult = useMemo(() => currentId ? computeGradeSummary(scores, conduct) : null, [scores, conduct, currentId]);
  const result = isTeacher ? liveResult : (revealedIds.has(currentId) ? liveResult : null);

  // Dữ liệu điểm có sẵn từ TRƯỚC khi có tính năng khóa ô (chưa có teacherLocked) được coi là điểm
  // giáo viên đã nhập từ trước -> tự động khóa lại 1 lần để học sinh không sửa nhầm điểm thật.
  useEffect(() => {
    if (!currentId || readOnly) return;
    const rec = gradesStore[currentId];
    if (!rec || rec.teacherLocked !== undefined) return;
    if (!rec.scores || Object.keys(rec.scores).length === 0) return;
    const tl = {};
    Object.entries(rec.scores).forEach(([sub, terms]) => {
      tl[sub] = { hk1: {}, hk2: {} };
      ['hk1', 'hk2'].forEach(term => {
        const t = terms?.[term] || {};
        Object.entries(t).forEach(([field, v]) => { if (v) tl[sub][term][field] = true; });
      });
    });
    state.setGrades(prev => {
      const r = prev[currentId];
      if (!r || r.teacherLocked !== undefined) return prev;
      return { ...prev, [currentId]: { ...r, teacherLocked: tl } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, state?.grades]);

  const setScores = (updater) => {
    if (readOnly || !currentId) return;
    state.setGrades(prev => {
      const rec = prev[currentId] || { scores: {}, conduct: '' };
      const newScores = typeof updater === 'function' ? updater(rec.scores || {}) : updater;
      return { ...prev, [currentId]: { ...rec, scores: newScores } };
    });
  };

  const setConduct = (val) => {
    if (readOnly || !currentId) return;
    state.setGrades(prev => {
      const rec = prev[currentId] || { scores: {}, conduct: '' };
      return { ...prev, [currentId]: { ...rec, conduct: val } };
    });
  };
  const setResult = () => setRevealedIds(prev => new Set(prev).add(currentId));

  // Đánh dấu 1 hoặc nhiều ô điểm là "giáo viên đã nhập" (chỉ giáo viên mới có quyền khóa/mở khóa)
  const setTeacherLock = (sub, entries) => {
    if (!isTeacher || !currentId || entries.length === 0) return;
    state.setGrades(prev => {
      const rec = prev[currentId] || { scores: {}, conduct: '', teacherLocked: {} };
      const tl = { ...(rec.teacherLocked || {}) };
      tl[sub] = { hk1: { ...(tl[sub]?.hk1 || {}) }, hk2: { ...(tl[sub]?.hk2 || {}) } };
      entries.forEach(({ term, field, locked }) => { tl[sub][term][field] = locked; });
      return { ...prev, [currentId]: { ...rec, teacherLocked: tl } };
    });
  };

  const toggleGraded = (sub) => {
    const next = new Set(selectedGraded);
    if (next.has(sub)) next.delete(sub); else next.add(sub);
    setSelectedGraded(next);
  };

  const togglePassFail = (sub) => {
    const next = new Set(selectedPassFail);
    if (next.has(sub)) next.delete(sub); else next.add(sub);
    setSelectedPassFail(next);
  };

  const handleScoreChange = (sub, term, field, val) => {
    if (isTeacher && !canEditSubject(sub)) return;
    if (isSelfStudent && isLocked(sub, term, field)) return; // ô giáo viên đã nhập -> học sinh không được sửa
    let numVal = val.replace(/[^\d]/g, '');
    if (numVal.length >= 2 && !numVal.includes('.')) {
       numVal = numVal.slice(0, -1) + '.' + numVal.slice(-1);
    }
    if (isSelfStudent) {
      // Điểm mục tiêu: chỉ lưu local, không đụng tới điểm chính thức / Bảng xếp hạng
      setLocalTargetScores(p => ({
        ...p,
        [sub]: { ...p[sub], [term]: { ...(p[sub]?.[term] || {}), [field]: numVal } }
      }));
      return;
    }
    setScores(p => ({
      ...p,
      [sub]: {
        ...p[sub],
        [term]: {
          ...(p[sub]?.[term] || {}),
          [field]: numVal
        }
      }
    }));
    if (isTeacher) setTeacherLock(sub, [{ term, field, locked: numVal !== '' }]);
  };

  const handlePassFailChange = (sub, term, field, val) => {
    if (isTeacher && !canEditSubject(sub)) return;
    if (isSelfStudent && isLocked(sub, term, field)) return; // ô giáo viên đã nhập -> học sinh không được sửa
    const v = val.toUpperCase();
    if (v === 'D' || v === 'C' || v === '') {
      if (isSelfStudent) {
        // Điểm mục tiêu: chỉ lưu local, không đụng tới điểm chính thức / Bảng xếp hạng
        setLocalTargetScores(p => ({
          ...p,
          [sub]: { ...p[sub], [term]: { ...(p[sub]?.[term] || {}), [field]: v } }
        }));
        return;
      }
      setScores(p => ({
        ...p,
        [sub]: {
          ...p[sub],
          [term]: {
            ...(p[sub]?.[term] || {}),
            [field]: v
          }
        }
      }));
      if (isTeacher) setTeacherLock(sub, [{ term, field, locked: v !== '' }]);
    }
  };

  const handlePaste = (e, sub, term, startField) => {
    if (isTeacher && !canEditSubject(sub)) return;
    const paste = e.clipboardData.getData('text');
    if (!paste) return;
    const values = paste.split(/[\t\n]/).map(v => v.trim()).filter(Boolean);
    if (values.length <= 1) return;
    e.preventDefault();
    
    const fieldsOrder = ['m1', 'm2', 'm3', 'm4', 'mid', 'fin'];
    let startIndex = fieldsOrder.indexOf(startField);
    let vIdx = 0;
    const touched = [];

    const updater = p => {
      const nextSub = { ...p[sub] };
      let currentTerm = term;
      
      while (vIdx < values.length && currentTerm) {
        if (!nextSub[currentTerm]) nextSub[currentTerm] = {};
        const curTerm = currentTerm;
        const curField = fieldsOrder[startIndex];

        if (!(isSelfStudent && isLocked(sub, curTerm, curField))) {
          let val = values[vIdx];
          if (SUBJECTS.passfail.includes(sub)) {
             val = val.toUpperCase();
             if (val !== 'D' && val !== 'C') val = '';
          } else {
             let numVal = val.replace(/[^\d]/g, '');
             if (numVal.length >= 2 && !numVal.includes('.')) numVal = numVal.slice(0, -1) + '.' + numVal.slice(-1);
             val = numVal;
          }
          nextSub[curTerm][curField] = val;
          touched.push({ term: curTerm, field: curField, locked: val !== '' });
        }
        
        vIdx++;
        startIndex++;
        if (startIndex >= fieldsOrder.length) {
          startIndex = 0;
          currentTerm = currentTerm === 'hk1' ? 'hk2' : null;
        }
      }
      return { ...p, [sub]: nextSub };
    };

    if (isSelfStudent) {
      // Dán điểm mục tiêu: chỉ lưu local, không đụng tới điểm chính thức / Bảng xếp hạng
      setLocalTargetScores(updater);
      return;
    }
    setScores(updater);
    if (isTeacher) setTeacherLock(sub, touched);
  };

  const handleExportTemplate = () => {
    const wb = XLSX.utils.book_new();
    const cols = ['Mã HS', 'Họ Tên', 'HK1_M1', 'HK1_M2', 'HK1_M3', 'HK1_M4', 'HK1_GiữaKỳ', 'HK1_CuốiKỳ', 'HK2_M1', 'HK2_M2', 'HK2_M3', 'HK2_M4', 'HK2_GiữaKỳ', 'HK2_CuốiKỳ'];
    
    const addSheet = (subName) => {
      const data = [cols];
      myStudents.forEach(s => {
        data.push([s.id, s.name, '', '', '', '', '', '', '', '', '', '', '', '']);
      });
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, subName);
    };

    Array.from(selectedGraded).forEach(addSheet);
    Array.from(selectedPassFail).forEach(addSheet);

    XLSX.writeFile(wb, `Mau_Nhap_Diem.xlsx`);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: 'array' });

      state.setGrades(prevGrades => {
        const next = { ...(prevGrades || {}) };

        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
          for (let i = 1; i < json.length; i++) {
            const row = json[i];
            if (!row || row.length < 2) continue;
            const stuId = String(row[0]);
            const rec = next[stuId] || { scores: {}, conduct: '', teacherLocked: {} };
            const s = { ...(rec.scores?.[sheetName] || {}) };
            s.hk1 = { ...(s.hk1 || {}) };
            s.hk2 = { ...(s.hk2 || {}) };
            const tl = { ...(rec.teacherLocked || {}) };
            tl[sheetName] = { hk1: { ...(tl[sheetName]?.hk1 || {}) }, hk2: { ...(tl[sheetName]?.hk2 || {}) } };

            const val = (idx) => (row[idx] != null ? String(row[idx]).trim() : '');
            // Excel do giáo viên nhập -> khóa luôn từng ô có dữ liệu, học sinh không sửa được
            const applyField = (term, field, idx) => {
              const v = val(idx);
              if (v) { s[term][field] = v; tl[sheetName][term][field] = true; }
            };
            applyField('hk1', 'm1', 2); applyField('hk1', 'm2', 3); applyField('hk1', 'm3', 4);
            applyField('hk1', 'm4', 5); applyField('hk1', 'mid', 6); applyField('hk1', 'fin', 7);
            applyField('hk2', 'm1', 8); applyField('hk2', 'm2', 9); applyField('hk2', 'm3', 10);
            applyField('hk2', 'm4', 11); applyField('hk2', 'mid', 12); applyField('hk2', 'fin', 13);

            next[stuId] = { ...rec, scores: { ...rec.scores, [sheetName]: s }, teacherLocked: tl };
          }
        });

        return next;
      });

      alert('Nhập điểm từ Excel thành công!');
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null;
  };

  const calculateAll = () => {
    setResult();
  };

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {isTeacher && myClasses && myClasses.length > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--wa015)", border: "1px solid var(--border2)", padding: "10px 14px", borderRadius: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)" }}>CHỌN LỚP HỌC:</span>
          <select value={selClass} onChange={e => setSelClass(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, background: "var(--wa055)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 12, outline: "none", fontFamily: "inherit" }}>
            {myClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.school || 'Không rõ trường'})</option>)}
          </select>
        </div>
      )}
      {isTeacher && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: isHomeroom ? 'rgba(52,211,153,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${isHomeroom ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.3)'}`, padding: '10px 16px', borderRadius: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: isHomeroom ? '#34D399' : '#F59E0B' }}>
            {isHomeroom ? "👑 Giáo viên chủ nhiệm" : "👨‍🏫 Giáo viên bộ môn"}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            (Lớp: {state.classes.find(c => c.id === selClass)?.name || "Chưa chọn"} · Môn phụ trách: {user.data?.subject || "Chưa gán"})
          </span>
        </div>
      )}
      {isTeacher && isHomeroom && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          <button onClick={() => setActiveTab('detail')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: activeTab === 'detail' ? 'var(--accent)' : 'var(--wa04)', color: activeTab === 'detail' ? '#fff' : 'var(--text2)', fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all .2s' }}>Nhập chi tiết từng học sinh</button>
          <button onClick={() => setActiveTab('bulk')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: activeTab === 'bulk' ? 'var(--accent)' : 'var(--wa04)', color: activeTab === 'bulk' ? '#fff' : 'var(--text2)', fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all .2s' }}>Nhập nhanh theo cột cả lớp</button>
        </div>
      )}

      {isTeacher && activeTab === 'bulk' && (
        <div className="scard" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>MÔN HỌC</span>
              {user.data?.subject ? (
                <div style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--wa05)', border: '1px solid var(--border2)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  📚 Môn {user.data.subject}
                </div>
              ) : (
                <select value={bulkSub} onChange={e => setBulkSub(e.target.value)} className="inp" style={{ width: 180 }}>
                  {[...SUBJECTS.graded, ...SUBJECTS.passfail].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>TÌM HỌC SINH</span>
              <input type="text" className="inp" placeholder="Tên hoặc mã HS..." value={bulkSearch} onChange={e => setBulkSearch(e.target.value)} style={{ width: 180 }} />
            </div>

            <div style={{ flex: 1 }} />

            {bulkDirty.size > 0 && (
              <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, marginBottom: 10 }}>● {bulkDirty.size} ô chưa lưu</span>
            )}
            {bulkJustSaved && (
              <span style={{ fontSize: 12, color: '#34D399', fontWeight: 700, marginBottom: 10 }}>✓ Đã lưu</span>
            )}

            <button
              onClick={saveBulkScores}
              disabled={bulkDirty.size === 0}
              style={{ padding: '10px 20px', background: bulkDirty.size === 0 ? 'var(--wa04)' : 'var(--accent)', color: bulkDirty.size === 0 ? 'var(--text3)' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: bulkDirty.size === 0 ? 'default' : 'pointer' }}
              className="gc-btn"
            >
              💾 Lưu điểm cả lớp
            </button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
            💡 Cả học kỳ 1 và học kỳ 2 hiện chung 1 bảng, khỏi cần chọn học kỳ. Gõ điểm rồi bấm mũi tên / Enter để nhảy ô, dán (Ctrl+V) cả khối điểm copy từ Excel, hoặc dùng hàng "Điền nhanh cả cột" để gán nhanh 1 điểm cho cả lớp rồi sửa lại vài trường hợp ngoại lệ.
          </div>

          <div style={{ overflowX: 'auto', marginTop: 4 }}>
            <table className="gc-table gcb-table" style={{ width: '100%', minWidth: 1400, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: 50 }}>STT</th>
                  <th rowSpan={2} style={{ width: 100 }}>Mã HS</th>
                  <th rowSpan={2} style={{ minWidth: 160, textAlign: 'left', paddingLeft: 16 }}>Họ và tên học sinh</th>
                  <th colSpan={BULK_FIELDS.length + 1} style={{ background: 'rgba(79,172,254,0.08)' }}>Học kỳ 1</th>
                  <th colSpan={BULK_FIELDS.length + 1} style={{ background: 'rgba(167,139,250,0.08)' }}>Học kỳ 2</th>
                  <th rowSpan={2} style={{ minWidth: 78, background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>Cả năm</th>
                </tr>
                <tr>
                  {BULK_FIELDS.map(f => (
                    <th key={`hk1-${f.key}`} title={f.full} style={{ minWidth: 70, background: 'rgba(79,172,254,0.08)' }}>{f.label}</th>
                  ))}
                  <th style={{ minWidth: 68, background: 'rgba(79,172,254,0.08)', color: isBulkPassFail ? 'var(--text3)' : '#34D399' }}>{isBulkPassFail ? 'KQ' : 'TB'}</th>
                  {BULK_FIELDS.map(f => (
                    <th key={`hk2-${f.key}`} title={f.full} style={{ minWidth: 70, background: 'rgba(167,139,250,0.08)' }}>{f.label}</th>
                  ))}
                  <th style={{ minWidth: 68, background: 'rgba(167,139,250,0.08)', color: isBulkPassFail ? 'var(--text3)' : '#34D399' }}>{isBulkPassFail ? 'KQ' : 'TB'}</th>
                </tr>
                <tr className="gcb-fillrow">
                  <td colSpan={3} style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'right', paddingRight: 10, border: '1px solid var(--wa025)' }}>Điền nhanh cả cột →</td>
                  {['hk1', 'hk2'].map(term => (
                    <React.Fragment key={term}>
                      {BULK_FIELDS.map(f => {
                        const fillKey = `${term}:${f.key}`;
                        return (
                          <td key={fillKey} style={{ border: '1px solid var(--wa025)' }}>
                            <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                              <input
                                type="text"
                                maxLength={isBulkPassFail ? 1 : 4}
                                placeholder={isBulkPassFail ? 'D/C' : '—'}
                                value={fillColVal[fillKey] || ''}
                                onChange={e => setFillColVal(p => ({ ...p, [fillKey]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') handleFillColumn(term, f.key); }}
                                className="gc-input"
                                style={{ width: 34, padding: '4px 2px', fontSize: 11 }}
                              />
                              <button onClick={() => handleFillColumn(term, f.key)} title={`Áp dụng cho ${filteredBulkStudents.length} học sinh đang hiển thị`} style={{ border: 'none', background: 'var(--wa04)', color: 'var(--accent)', borderRadius: 5, fontSize: 11, padding: '0 6px', cursor: 'pointer' }}>↓</button>
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ border: '1px solid var(--wa025)' }} />
                    </React.Fragment>
                  ))}
                  <td style={{ border: '1px solid var(--wa025)' }} />
                </tr>
              </thead>
              <tbody>
                {filteredBulkStudents.map((s, idx) => {
                  const rowData = bulkScores[s.id] || { hk1: {}, hk2: {} };
                  const p1 = isBulkPassFail ? calcPassFail(rowData.hk1) : calcAvg(rowData.hk1);
                  const p2 = isBulkPassFail ? calcPassFail(rowData.hk2) : calcAvg(rowData.hk2);
                  let cn;
                  if (isBulkPassFail) {
                    cn = p2 || p1;
                    if (p1 === 'C' || p2 === 'C') cn = 'C'; else if (p1 === 'D' || p2 === 'D') cn = 'D';
                  } else {
                    if (p1 !== null && p2 !== null) cn = (p1 + p2 * 2) / 3;
                    else if (p2 !== null) cn = p2;
                    else if (p1 !== null) cn = p1;
                    else cn = null;
                  }
                  const fmtPreview = (val) => val === null || val === undefined ? '-' : isBulkPassFail ? (val === 'C' ? 'Chưa đạt' : 'Đạt') : (Math.round(val * 10) / 10).toFixed(1);
                  const previewColor = (val) => val === null || val === undefined ? 'var(--text4)' : isBulkPassFail ? (val === 'C' ? '#EF4444' : '#34D399') : (val < 5 ? '#EF4444' : '#34D399');
                  return (
                    <tr key={s.id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontFamily: 'monospace' }}>{s.code}</td>
                      <td style={{ textAlign: 'left', paddingLeft: 16, fontWeight: 600 }}>{s.name}</td>
                      {['hk1', 'hk2'].map((term, termIdx) => (
                        <React.Fragment key={term}>
                          {BULK_FIELDS.map((f, fIdx) => {
                            const colIdx = termIdx * BULK_FIELDS.length + fIdx;
                            const val = rowData[term]?.[f.key] || '';
                            const isDirty = bulkDirty.has(`${s.id}:${term}:${f.key}`);
                            const isWarn = isBulkPassFail ? val === 'C' : (val !== '' && parseFloat(val) < 5.0);
                            return (
                              <td key={f.key}>
                                <input
                                  type="text"
                                  className={`gc-input gcb-input ${isWarn ? 'gc-warn' : ''} ${isDirty ? 'gcb-dirty' : ''}`}
                                  value={val}
                                  placeholder={isBulkPassFail ? 'D/C' : '-'}
                                  maxLength={isBulkPassFail ? 1 : 4}
                                  title={`${f.full} - ${term === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2'}`}
                                  onChange={e => handleBulkCellChange(s.id, term, f.key, e.target.value)}
                                  onPaste={e => handleBulkPaste(e, idx, colIdx)}
                                  onKeyDown={e => {
                                    const cells = Array.from(e.currentTarget.closest('table').querySelectorAll('.gcb-input'));
                                    const cols = ALL_TERM_FIELDS.length;
                                    const myIdx = cells.indexOf(e.currentTarget);
                                    if (myIdx === -1) return;
                                    const col0 = myIdx % cols;
                                    let target = -1;
                                    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); target = myIdx + cols; }
                                    else if (e.key === 'ArrowUp') { e.preventDefault(); target = myIdx - cols; }
                                    else if (e.key === 'ArrowRight' && col0 < cols - 1) { e.preventDefault(); target = myIdx + 1; }
                                    else if (e.key === 'ArrowLeft' && col0 > 0) { e.preventDefault(); target = myIdx - 1; }
                                    if (target >= 0 && target < cells.length) cells[target].focus();
                                  }}
                                />
                              </td>
                            );
                          })}
                          <td style={{ fontWeight: 'bold', color: previewColor(termIdx === 0 ? p1 : p2) }}>
                            {fmtPreview(termIdx === 0 ? p1 : p2)}
                          </td>
                        </React.Fragment>
                      ))}
                      <td style={{ fontWeight: 'bold', color: previewColor(cn) }}>
                        {fmtPreview(cn)}
                      </td>
                    </tr>
                  );
                })}
                {filteredBulkStudents.length === 0 && (
                  <tr>
                    <td colSpan={4 + ALL_TERM_FIELDS.length + 2} style={{ padding: 20, color: 'var(--text3)' }}>
                      {bulkSearch ? 'Không tìm thấy học sinh phù hợp.' : 'Lớp chưa có học sinh nào.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`
        .gc-btn { transition: all .2s; }
        .gc-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(79,172,254, 0.2); }
        .gc-input { width: 60px; padding: 6px; border-radius: 6px; border: 1px solid var(--inp-bd); background: var(--inp-bg); color: var(--text); text-align: center; outline: none; transition: border .2s, box-shadow .2s; font-family: monospace; font-size: 13px; }
        .gc-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-bg); }
        .gc-target { border-color: rgba(59,130,246,.5) !important; color: #3B82F6 !important; background: rgba(59,130,246,.07) !important; }
        .gc-target:focus { border-color: #3B82F6 !important; box-shadow: 0 0 0 2px rgba(59,130,246,.15); }
        .gc-warn { background: rgba(239, 68, 68, 0.15) !important; color: #EF4444 !important; border-color: #EF4444 !important; }
        .gc-pass { color: #34D399; font-weight: bold; }
        .gc-fail { color: #EF4444; font-weight: bold; }
        .gc-table th { background: var(--surface); padding: 10px; border: 1px solid var(--wa025); font-size: 12px; font-weight: 600; color: var(--text3); }
        .gc-table td { border: 1px solid var(--wa025); padding: 8px 4px; text-align: center; }
        .gc-table tr:hover { background: rgba(255,255,255,0.02); }
        .gcb-dirty { box-shadow: inset 0 -2px 0 0 #F59E0B; }
        .gcb-fillrow td { padding: 4px; background: var(--surface2); }
        .gcb-table thead th { position: sticky; top: 0; z-index: 2; }
      `}</style>

      {isTeacher && activeTab === 'detail' && (
        <div className="scard" style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>👤 Chọn học sinh:</div>
          <select 
            value={selectedStudentId} 
            onChange={e => setSelectedStudentId(e.target.value)}
            className="inp"
            style={{ flex: 1, minWidth: 200, maxWidth: 300 }}
          >
            {myStudents.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          
          <div style={{ flex: 1 }} />
          
          <button onClick={handleExportTemplate} style={{ padding: '8px 14px', border: "1px solid rgba(52,211,153,.28)", background: "rgba(52,211,153,.08)", color: "#34D399", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }} className="gc-btn">
            📥 Tải file mẫu
          </button>
          
          <label style={{ padding: '8px 14px', border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text3)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-block' }} className="gc-btn">
            📤 Nhập từ Excel
            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {isParent && (
        <div className="scard" style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>👪 Xem bảng điểm của con:</div>
          {myChildren.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Chưa liên kết học sinh nào. Vào mục "Tổng quan" để gửi yêu cầu liên kết con.</div>
          ) : myChildren.length === 1 ? (
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{myChildren[0].name}</div>
          ) : (
            <select
              value={selectedChildId}
              onChange={e => setSelectedChildId(e.target.value)}
              className="inp"
              style={{ flex: 1, minWidth: 200, maxWidth: 300 }}
            >
              {myChildren.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      )}
      
      {(!isTeacher || activeTab === 'detail') && (
        <>
          <div className="scard" style={{ padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: 'var(--text)' }}>🎓 Xếp Loại Học Lực THPT (Thông tư 22)</h1>
        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginBottom: 24 }}>Hệ thống tính điểm và xếp loại học lực cả năm học</p>

        {!readOnly && (
        <div style={{ background: isSelfStudent ? 'rgba(59,130,246,0.1)' : 'rgba(52, 211, 153, 0.1)', border: `1px solid ${isSelfStudent ? 'rgba(59,130,246,0.35)' : 'rgba(52, 211, 153, 0.3)'}`, padding: 16, borderRadius: 12, marginBottom: 24 }}>
          <h4 style={{ color: isSelfStudent ? '#3B82F6' : '#34D399', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> {isSelfStudent ? '🎯 ĐIỂM MỤC TIÊU CỦA EM' : 'HƯỚNG DẪN NHẬP ĐIỂM'}</h4>
          <ul style={{ fontSize: 12, color: 'var(--text)', marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {isSelfStudent && <li>Đây là <strong style={{ color: '#3B82F6' }}>điểm mục tiêu</strong> em tự đặt ra cho bản thân, không phải điểm chính thức do giáo viên nhập</li>}
            {isSelfStudent && <li>Điểm mục tiêu chỉ lưu <strong>trên thiết bị này</strong>, không gửi lên hệ thống và <strong>không tính vào Bảng xếp hạng</strong> của lớp</li>}
            <li>Nhập số liền: <strong>85</strong> tự động thành <strong>8.5</strong></li>
            <li>Môn Đạt/Chưa đạt: Gõ <strong>D</strong> (Đạt) hoặc <strong>C</strong> (Chưa đạt)</li>
            <li>Ô đỏ báo hiệu điểm &lt; 5.0 hoặc Chưa đạt</li>
          </ul>
          {isSelfStudent && (
            <button
              onClick={() => { if (window.confirm('Xóa toàn bộ điểm mục tiêu đã nhập trên thiết bị này?')) setLocalTargetScores({}); }}
              style={{ marginTop: 10, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(59,130,246,.4)', background: 'transparent', color: '#3B82F6', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              Xóa điểm mục tiêu
            </button>
          )}
        </div>
        )}

        {!readOnly && (
        <>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}><CheckCircle size={16} color="var(--accent)" /> Chọn môn tính điểm</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {SUBJECTS.graded.map(sub => (
              <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--surface2)', borderRadius: 8, cursor: 'pointer', border: `1px solid ${selectedGraded.has(sub) ? 'var(--accent)' : 'transparent'}`, transition: 'all .2s' }}>
                <input type="checkbox" checked={selectedGraded.has(sub)} onChange={() => toggleGraded(sub)} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ fontSize: 12, color: selectedGraded.has(sub) ? 'var(--accent)' : 'var(--text)' }}>{sub}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}><CheckCircle size={16} color="#34D399" /> Chọn môn Đạt / Chưa đạt</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {SUBJECTS.passfail.map(sub => (
              <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--surface2)', borderRadius: 8, cursor: 'pointer', border: `1px solid ${selectedPassFail.has(sub) ? '#34D399' : 'transparent'}`, transition: 'all .2s' }}>
                <input type="checkbox" checked={selectedPassFail.has(sub)} onChange={() => togglePassFail(sub)} style={{ accentColor: '#34D399' }} />
                <span style={{ fontSize: 12, color: selectedPassFail.has(sub) ? '#34D399' : 'var(--text)' }}>{sub}</span>
              </label>
            ))}
          </div>
        </div>
        </>
        )}
      </div>

      <div className="scard" style={{ padding: 20, overflowX: 'auto' }}>
        <table className="gc-table" style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ minWidth: 180, textAlign: 'left', paddingLeft: 16 }}>Môn học</th>
              <th colSpan={7} style={{ background: 'rgba(79,172,254,0.05)' }}>Học kỳ 1</th>
              <th colSpan={7} style={{ background: 'rgba(167,139,250,0.05)' }}>Học kỳ 2</th>
              <th rowSpan={2} style={{ background: 'rgba(52,211,153,0.08)', color: '#34D399' }}>CẢ NĂM</th>
            </tr>
            <tr>
              {['M1','M2','M3','M4','Giữa kỳ','Cuối kỳ','ĐTB HK1', 'M1','M2','M3','M4','Giữa kỳ','Cuối kỳ','ĐTB HK2'].map((l, i) => (
                <th key={i}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(selectedGraded).map(sub => {
              const s = scores[sub] || {};
              const renderInputs = (term) => (
                <>
                  {['m1','m2','m3','m4','mid','fin'].map(f => {
                    const val = s[term]?.[f] || '';
                    const isWarn = val !== '' && parseFloat(val) < 5.0;
                    const locked = isSelfStudent && isLocked(sub, term, f);
                    return (
                      <td key={f}>
                        {readOnly || locked || !canEditSubject(sub)
                          ? <span title={locked ? 'Điểm do giáo viên nhập, không thể sửa' : ''} className={isWarn ? 'gc-fail' : ''} style={{ fontSize: 13, fontFamily: 'monospace', color: locked && !isWarn ? 'var(--text3)' : undefined }}>{val || '-'}</span>
                          : <input type="text" className={`gc-input ${isWarn ? 'gc-warn' : ''} ${isSelfStudent ? 'gc-target' : ''}`} value={val} onChange={e => handleScoreChange(sub, term, f, e.target.value)} onPaste={e => handlePaste(e, sub, term, f)} />}
                      </td>
                    );
                  })}
                </>
              );
              const a1 = calcAvg(s.hk1);
              const a2 = calcAvg(s.hk2);
              let cn = null;
              if (a1 !== null && a2 !== null) cn = (a1 + a2*2)/3; else if (a2 !== null) cn = a2; else if (a1 !== null) cn = a1;

              return (
                <tr key={sub}>
                  <td style={{ textAlign: 'left', paddingLeft: 16, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sub}</td>
                  {renderInputs('hk1')}
                  <td style={{ fontWeight: 'bold', color: a1 !== null ? (a1 < 5 ? '#EF4444' : (isSelfStudent ? '#3B82F6' : 'var(--text)')) : 'var(--text4)' }}>{a1 !== null ? (Math.round(a1*10)/10).toFixed(1) : '-'}</td>
                  {renderInputs('hk2')}
                  <td style={{ fontWeight: 'bold', color: a2 !== null ? (a2 < 5 ? '#EF4444' : (isSelfStudent ? '#3B82F6' : 'var(--text)')) : 'var(--text4)' }}>{a2 !== null ? (Math.round(a2*10)/10).toFixed(1) : '-'}</td>
                  <td style={{ background: isSelfStudent ? 'rgba(59,130,246,0.06)' : 'rgba(52,211,153,0.05)', fontWeight: 'bold', fontSize: 15, color: cn !== null ? (cn < 5 ? '#EF4444' : (isSelfStudent ? '#3B82F6' : '#34D399')) : 'var(--text4)' }}>{cn !== null ? (Math.round(cn*10)/10).toFixed(1) : '-'}</td>
                </tr>
              );
            })}
            
            {Array.from(selectedPassFail).length > 0 && <tr><td colSpan={16} style={{ background: 'var(--surface2)', padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text3)' }}>MÔN ĐÁNH GIÁ (D = Đạt, C = Chưa đạt)</td></tr>}
            
            {Array.from(selectedPassFail).map(sub => {
              const s = scores[sub] || {};
              const renderInputs = (term) => (
                <>
                  {['m1','m2','m3','m4','mid','fin'].map(f => {
                    const val = s[term]?.[f] || '';
                    const locked = isSelfStudent && isLocked(sub, term, f);
                    return (
                      <td key={f}>
                        {readOnly || locked || !canEditSubject(sub)
                          ? <span title={locked ? 'Điểm do giáo viên nhập, không thể sửa' : ''} className={val === 'C' ? 'gc-fail' : val === 'D' ? 'gc-pass' : ''} style={{ fontSize: 13 }}>{val || '-'}</span>
                          : <input type="text" maxLength={1} className={`gc-input ${val === 'C' ? 'gc-warn' : val === 'D' ? 'gc-pass' : ''} ${isSelfStudent ? 'gc-target' : ''}`} value={val} onChange={e => handlePassFailChange(sub, term, f, e.target.value)} onPaste={e => handlePaste(e, sub, term, f)} />}
                      </td>
                    );
                  })}
                </>
              );
              const p1 = calcPassFail(s.hk1);
              const p2 = calcPassFail(s.hk2);
              let cn = p2 || p1;
              if (p1 === 'C' || p2 === 'C') cn = 'C'; else if (p1 === 'D' || p2 === 'D') cn = 'D';

              return (
                <tr key={sub}>
                  <td style={{ textAlign: 'left', paddingLeft: 16, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sub}</td>
                  {renderInputs('hk1')}
                  <td className={p1 === 'C' ? 'gc-fail' : p1 === 'D' ? 'gc-pass' : ''}>{p1 || '-'}</td>
                  {renderInputs('hk2')}
                  <td className={p2 === 'C' ? 'gc-fail' : p2 === 'D' ? 'gc-pass' : ''}>{p2 || '-'}</td>
                  <td style={{ background: 'rgba(52,211,153,0.05)' }} className={cn === 'C' ? 'gc-fail' : cn === 'D' ? 'gc-pass' : ''}>{cn || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="scard" style={{ padding: 24, flex: 1, minWidth: 300 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, textAlign: 'center', color: 'var(--text)' }}>Hạnh kiểm cả năm</h3>
          {readOnly ? (
            <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, padding: '10px 0', color: 'var(--text)' }}>
              {{ excellent: 'Tốt', good: 'Khá', average: 'Trung bình', weak: 'Yếu' }[conduct] || 'Chưa có đánh giá'}
            </div>
          ) : (
            <select value={conduct} onChange={e => setConduct(e.target.value)} className="inp" style={{ width: '100%' }}>
              <option value="">-- Chọn mức hạnh kiểm --</option>
              <option value="excellent">Tốt</option>
              <option value="good">Khá</option>
              <option value="average">Trung bình</option>
              <option value="weak">Yếu</option>
            </select>
          )}
        </div>
        
        <div style={{ flex: 1, minWidth: 300, display: 'flex', alignItems: 'center' }}>
          {isTeacher ? (
            <div style={{ width: '100%', padding: 18, background: 'rgba(52,211,153,0.08)', border: '1px dashed rgba(52,211,153,0.35)', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle size={18} /> Tự động tính điểm & xếp loại
            </div>
          ) : (
            <button onClick={calculateAll} className="bprimary gc-btn" style={{ width: '100%', padding: 18, borderRadius: 12, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <FileText size={20} /> TÍNH ĐIỂM & XẾP LOẠI
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="scard" style={{ padding: 30, border: '2px solid var(--accent)', boxShadow: '0 0 20px var(--accent-bg)', textAlign: 'center', animation: 'fadeUp 0.3s ease' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>Kết Quả Xếp Loại</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, letterSpacing: 1 }}>ĐIỂM TRUNG BÌNH MÔN</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#34D399' }}>{result.dtbmca.toFixed(1)}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, letterSpacing: 1 }}>XẾP LOẠI HỌC LỰC</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: result.classification === 'TỐT' ? '#34D399' : result.classification === 'KHÁ' ? '#3B82F6' : result.classification === 'ĐẠT' ? '#F59E0B' : '#EF4444', textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>{result.classification}</div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}