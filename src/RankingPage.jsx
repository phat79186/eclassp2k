import { useEffect, useMemo, useState } from 'react';
import api from './api.js';
import { Search, Trophy, ArrowUp, ArrowDown, BarChart2, BookOpen, RefreshCw } from 'lucide-react';
import { computeGradeSummary, GRADE_SUBJECTS } from './GradeCalculatorPage';

const SUBJECT_LABEL_OVERRIDES = {
  'Ngoại ngữ': 'Tiếng Anh',
  'Giáo dục công dân': 'GDCD',
  'Ngữ văn': 'Ngữ Văn',
  'Lịch sử': 'Lịch Sử',
  'Địa lý': 'Địa Lý',
  'Vật lý': 'Vật Lý',
};

const SUBJECT_FILTERS = [
  { value: 'all', label: 'Tổng hợp' },
  ...GRADE_SUBJECTS.graded.map(s => ({ value: s, label: SUBJECT_LABEL_OVERRIDES[s] || s })),
  ...GRADE_SUBJECTS.passfail.map(s => ({ value: s, label: SUBJECT_LABEL_OVERRIDES[s] || s })),
];
const SEMESTER_OPTIONS = [
  { value: 'all', label: 'Tổng hợp' },
  { value: 'hk1', label: 'Học kỳ 1' },
  { value: 'hk2', label: 'Học kỳ 2' },
];
const CORE_SUBJECTS = ['Toán', 'Ngữ văn', 'Ngoại ngữ'];

const toNumeric = val => {
  if (typeof val === 'number') return val;
  if (val === 'C') return 1;
  if (val === 'D') return 0;
  return null;
};

const formatScore = val => {
  if (val === null || val === undefined) return '--';
  if (typeof val === 'number') return val.toFixed(1);
  return String(val);
};

const getTermAverage = (summary, term) => {
  const values = Object.values(summary.results || {}).filter(r => r.type === 'graded' && typeof r[term] === 'number').map(r => r[term]);
  if (!values.length) return null;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(avg * 10) / 10;
};

const getSubjectStat = (summary, subject, semester) => {
  const result = summary.results?.[subject];
  if (!result) return null;
  if (semester === 'all') return result.cn;
  return result[semester] ?? null;
};

const compareStudents = (a, b) => {
  if (b.rankValue !== a.rankValue) return (b.rankValue || 0) - (a.rankValue || 0);
  if (b.subjectCount !== a.subjectCount) return b.subjectCount - a.subjectCount;
  if (b.coreScore !== a.coreScore) return b.coreScore - a.coreScore;
  return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
};

const getRankLabel = rank => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
};

const getWeekKey = date => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};

const getWeekStreak = weeks => {
  if (!weeks || weeks.length === 0) return 0;
  const unique = [...new Set(weeks)].sort();
  let streak = 0;
  let best = 0;
  let prev = null;

  const weeksInYear = year => {
    const d = new Date(Date.UTC(year, 11, 31));
    const weekKey = getWeekKey(d);
    return Number(weekKey.split('-W')[1]);
  };

  const isNext = (current, next) => {
    const [cy, cw] = current.split('-W').map(Number);
    const [ny, nw] = next.split('-W').map(Number);
    if (ny === cy && nw === cw + 1) return true;
    if (ny === cy + 1 && cw === weeksInYear(cy) && nw === 1) return true;
    return false;
  };

  unique.forEach(week => {
    if (prev && isNext(prev, week)) {
      streak += 1;
    } else {
      streak = 1;
    }
    best = Math.max(best, streak);
    prev = week;
  });
  return best;
};

export default function RankingPage({ state, user, selClass, setSelClass, myClasses }) {
  const isTeacher = user.role === 'teacher';
  const isParent = user.role === 'parent';
  const isStudent = user.role === 'student';

  const parentChildren = useMemo(() => {
    if (!isParent) return [];
    const childIds = new Set(user.data?.childIds || []);
    return state.students.filter(s => childIds.has(s.id));
  }, [isParent, state.students, user.data]);

  const classOptions = useMemo(() => {
    const classes = state.classes || [];
    if (isTeacher) return classes.filter(c => c.teacherId === user.data.id).map(c => ({ value: c.id, label: c.name }));
    if (isParent) {
      const classIds = [...new Set(parentChildren.map(s => s.classId))];
      return classIds.map(id => {
        const cls = classes.find(c => c.id === id);
        return { value: id, label: cls?.name || `Lớp ${id}` };
      });
    }
    if (isStudent) return classes.filter(c => c.id === user.classId).map(c => ({ value: c.id, label: c.name }));
    return [];
  }, [state.classes, isTeacher, isParent, isStudent, parentChildren, user.classId, user.data.id]);

  const [parentSelectedClassId, setParentSelectedClassId] = useState('');
  const selectedClassId = isTeacher ? selClass : (isStudent ? user.classId : (parentSelectedClassId || classOptions[0]?.value || ''));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState(isStudent ? user.data.id : parentChildren[0]?.id || null);
  const [weeklyReportStatus, setWeeklyReportStatus] = useState('');

  useEffect(() => {
    if (!isTeacher && !isStudent && !parentSelectedClassId && classOptions.length) {
      setParentSelectedClassId(classOptions[0].value);
    }
  }, [classOptions, parentSelectedClassId, isTeacher, isStudent]);

  useEffect(() => {
    if (!selectedStudentId) {
      if (isStudent) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedStudentId(user.data.id);
      } else if (isParent) {
        setSelectedStudentId(parentChildren[0]?.id || null);
      }
    }
  }, [isParent, isStudent, parentChildren, selectedStudentId, user.data.id]);

  const students = useMemo(() => {
    if (!selectedClassId) return [];
    return state.students.filter(s => s.classId === selectedClassId);
  }, [state.students, selectedClassId]);

  const attendanceSessions = useMemo(() => {
    if (!selectedClassId || !state.attendance) return [];
    return Object.keys(state.attendance).filter(key => key.startsWith(`${selectedClassId}_`));
  }, [selectedClassId, state.attendance]);

  const assignmentTasks = useMemo(() => {
    if (!selectedClassId || !state.assignments) return [];
    return state.assignments[selectedClassId] || [];
  }, [selectedClassId, state.assignments]);

  const attendanceStats = useMemo(() => {
    const totals = attendanceSessions.length;
    const stats = {};
    students.forEach(student => {
      stats[student.id] = { present: 0, total: totals, pct: 0, weeks: new Set() };
    });
    attendanceSessions.forEach(key => {
      const presentList = state.attendance[key] || [];
      const rawDate = key.replace(`${selectedClassId}_`, '');
      const weekKey = getWeekKey(new Date(rawDate));
      presentList.forEach(studentId => {
        if (stats[studentId]) {
          stats[studentId].present += 1;
          stats[studentId].weeks.add(weekKey);
        }
      });
    });
    Object.values(stats).forEach(stat => {
      stat.pct = stat.total ? Math.round((stat.present / stat.total) * 100) : 0;
    });
    return stats;
  }, [attendanceSessions, selectedClassId, state.attendance, students]);

  const assignmentStats = useMemo(() => {
    const total = assignmentTasks.length;
    const stats = {};
    students.forEach(student => {
      const done = assignmentTasks.filter(task => task.submissions?.[student.id]).length;
      stats[student.id] = { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    });
    return stats;
  }, [assignmentTasks, students]);

  const grades = useMemo(() => state.grades || {}, [state.grades]);

  const studentSummaries = useMemo(() => {
    return students.map(s => {
      const record = grades[s.id] || {};
      const summary = computeGradeSummary(record.scores || {}, record.conduct || '');
      const termHk1 = getTermAverage(summary, 'hk1');
      const termHk2 = getTermAverage(summary, 'hk2');
      const improvement = typeof termHk1 === 'number' && typeof termHk2 === 'number' ? Math.round((termHk2 - termHk1) * 10) / 10 : null;
      const coreScore = Math.max(...CORE_SUBJECTS.map(sub => toNumeric(getSubjectStat(summary, sub, 'all')) || 0));
      const subjectCount = Object.values(summary.results || {}).filter(r => r.type === 'graded' && typeof r.cn === 'number').length;
      const topSubject = Object.entries(summary.results || {})
        .filter(([, r]) => r.type === 'graded' && typeof r.cn === 'number')
        .sort(([, a], [, b]) => b.cn - a.cn)[0]?.[0] || null;
      const weakSubject = Object.entries(summary.results || {})
        .filter(([, r]) => r.type === 'graded' && typeof r.cn === 'number')
        .sort(([, a], [, b]) => a.cn - b.cn)[0]?.[0] || null;
      const attendance = attendanceStats[s.id] || { pct: 0, present: 0, total: attendanceSessions.length, weeks: new Set() };
      const assignment = assignmentStats[s.id] || { done: 0, total: assignmentTasks.length, pct: 0 };
      return {
        ...s,
        summary,
        termHk1,
        termHk2,
        improvement,
        coreScore,
        subjectCount,
        topSubject,
        weakSubject,
        attendancePct: attendance.pct,
        attendancePresent: attendance.present,
        attendanceTotal: attendance.total,
        attendanceStreak: getWeekStreak([...attendance.weeks]),
        assignmentCompletion: assignment.pct,
        completedTasks: assignment.done,
        totalTasks: assignment.total,
        year: record.year || 'Năm hiện tại',
      };
    });
  }, [students, grades, attendanceStats, attendanceSessions.length, assignmentStats, assignmentTasks.length]);

  const yearOptions = useMemo(() => {
    const years = new Set(studentSummaries.map(s => s.year).filter(Boolean));
    if (years.size === 0) return ['Năm hiện tại'];
    return Array.from(years).sort();
  }, [studentSummaries]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return studentSummaries.filter(s => {
      if (selectedYear !== 'all' && selectedYear !== 'Năm hiện tại' && s.year !== selectedYear) return false;
      if (query && !s.name.toLowerCase().includes(query) && !s.code?.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [studentSummaries, searchTerm, selectedYear]);

  const rankedStudents = useMemo(() => {
    const enhanced = filteredStudents.map(s => {
      let rankValue;
      if (selectedSubject === 'all') {
        rankValue = selectedSemester === 'hk1' ? s.termHk1 : selectedSemester === 'hk2' ? s.termHk2 : s.summary.dtbmca;
      } else {
        rankValue = getSubjectStat(s.summary, selectedSubject, selectedSemester);
      }
      if (typeof rankValue === 'string') rankValue = toNumeric(rankValue);
      if (rankValue === null || rankValue === undefined) rankValue = 0;
      return { ...s, rankValue };
    });
    const sorted = enhanced.slice().sort((a, b) => {
      const primary = compareStudents(a, b);
      if (primary !== 0) return primary;
      return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
    });
    return sorted.map((s, idx) => ({ ...s, rank: idx + 1 }));
  }, [filteredStudents, selectedSubject, selectedSemester]);

  const topImprovers = useMemo(() => {
    return studentSummaries
      .map(s => ({
        ...s,
        improvement: typeof s.termHk1 === 'number' && typeof s.termHk2 === 'number' ? Math.round((s.termHk2 - s.termHk1) * 10) / 10 : null,
      }))
      .filter(s => typeof s.improvement === 'number' && s.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5);
  }, [studentSummaries]);

  const selectedStudent = useMemo(() => {
    return selectedStudentId ? rankedStudents.find(s => s.id === selectedStudentId) : rankedStudents[0] || null;
  }, [rankedStudents, selectedStudentId]);

  const hallOfFameMetrics = useMemo(() => {
    const highestAvg = rankedStudents[0] || null;
    const bestAttendance = [...rankedStudents].sort((a, b) => b.attendancePct - a.attendancePct)[0] || null;
    const bestCompletion = [...rankedStudents].sort((a, b) => b.assignmentCompletion - a.assignmentCompletion)[0] || null;
    const strongestStreak = [...rankedStudents].sort((a, b) => b.attendanceStreak - a.attendanceStreak)[0] || null;
    return { highestAvg, bestAttendance, bestCompletion, strongestStreak };
  }, [rankedStudents]);

  const supportCandidates = useMemo(() => {
    return rankedStudents
      .map(s => {
        const risk =
          (s.summary.dtbmca < 5 ? 30 : 0) +
          (s.attendancePct < 70 ? 20 : 0) +
          (s.assignmentCompletion < 60 ? 20 : 0) +
          (s.summary.classification === 'CHƯA ĐẠT' ? 10 : 0);
        return { ...s, risk };
      })
      .filter(s => s.risk > 0)
      .sort((a, b) => b.risk - a.risk || a.rank - b.rank)
      .slice(0, 6);
  }, [rankedStudents]);

  const personalStudent = useMemo(() => {
    if (isStudent) return rankedStudents.find(s => s.id === user.data.id);
    if (isParent) return selectedStudent;
    return null;
  }, [rankedStudents, selectedStudent, isStudent, isParent, user.data.id]);

  const currentClass = state.classes.find(c => c.id === selectedClassId);

  const weeklySummaryText = useMemo(() => {
    if (!currentClass) return '';
    const top3 = rankedStudents.slice(0, 3).map(s => `${getRankLabel(s.rank)} ${s.name} (${formatScore(s.rankValue)})`).join('\n');
    const improver = rankedStudents.filter(s => typeof s.improvement === 'number' && s.improvement > 0).sort((a, b) => b.improvement - a.improvement)[0];
    const bestAttendance = hallOfFameMetrics.bestAttendance;
    return `🏆 BẢNG XẾP HẠNG TUẦN\nLớp: ${currentClass.name}\n\nTop 3 tuần này:\n${top3 || 'Chưa đủ dữ liệu'}\n\n📈 Học sinh tiến bộ nhất: ${improver ? `${improver.name} (+${improver.improvement})` : 'Chưa có'}\n🔥 Chuyên cần tốt nhất: ${bestAttendance ? `${bestAttendance.name} (${bestAttendance.attendancePct}%)` : 'Chưa có'}\n`;
  }, [currentClass, hallOfFameMetrics.bestAttendance, rankedStudents]);

  const sendWeeklySummary = async () => {
    if (!selectedClassId || !currentClass) return;
    setWeeklyReportStatus('Đang gửi...');
    try {
      await api.sendMessage({
        classId: selectedClassId,
        channel: 'thong-bao',
        text: weeklySummaryText,
        senderName: user.data.name,
        senderRole: user.role,
      });
      setWeeklyReportStatus('Đã gửi báo cáo tuần.');
    } catch {
      setWeeklyReportStatus('Gửi báo cáo không thành công.');
    }
  };

  return (
    <div className="page" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="scard" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <Trophy size={22} style={{ color: '#FBBF24' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Bảng xếp hạng học sinh</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Xếp hạng theo điểm trung bình hiện có của hệ thống, không tái tạo lại logic tính điểm.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 16, background: 'var(--wa04)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Lớp</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{currentClass?.name || 'Chưa chọn lớp'}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 16, background: 'var(--wa04)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Học sinh</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{students.length}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 16, background: 'var(--wa04)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Điểm cao nhất</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{formatScore(Math.max(0, ...rankedStudents.map(s => s.rankValue || 0)))}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 16, background: 'var(--wa04)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Tiến bộ nhất</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{topImprovers[0]?.improvement ? `+${topImprovers[0].improvement}` : '--'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="scard" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Search size={16} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Bộ lọc</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isTeacher && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                    Chọn lớp
                    <select className="inp" value={selectedClassId} onChange={e => { setSelClass(e.target.value); setSelectedStudentId(null); }}>
                      {classOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                )}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                  Tìm học sinh
                  <input className="inp" placeholder="Nhập tên hoặc mã" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                  Chủ đề xếp hạng
                  <select className="inp" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                    {SUBJECT_FILTERS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                  Học kỳ
                  <select className="inp" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                    {SEMESTER_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                  Năm học
                  <select className="inp" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                    <option value="all">Tất cả</option>
                    {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="scard" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <BarChart2 size={16} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Top tiến bộ</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topImprovers.length ? topImprovers.map((student, index) => (
                  <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(79,172,254,.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{index + 1}.</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{student.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatScore(student.termHk1)} → {formatScore(student.termHk2)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>+{student.improvement}</div>
                  </div>
                )) : <div style={{ fontSize: 12, color: 'var(--text3)' }}>Chưa có dữ liệu tăng tiến đủ.</div>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {personalStudent && (
            <div className="scard" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Peer Comparison</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>So sánh cá nhân với các mốc tiến bộ và top.</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Hạng {personalStudent.rank}/{rankedStudents.length}</span>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Điểm hiện tại</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{formatScore(personalStudent.rankValue)}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Hoàn thành bài</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{personalStudent.assignmentCompletion}%</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Chuyên cần</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{personalStudent.attendancePct}%</div>
                  </div>
                </div>
                {(() => {
                  const above = rankedStudents.find(s => s.rank === personalStudent.rank - 1);
                  const gap = above ? Math.max(0, Math.round(((above.rankValue || 0) - (personalStudent.rankValue || 0)) * 10) / 10) : null;
                  const top10Target = rankedStudents[9];
                  const top3Target = rankedStudents[2];
                  const progress = target => {
                    if (!target || !personalStudent.rankValue) return 0;
                    return Math.min(100, Math.max(0, Math.round((personalStudent.rankValue / target) * 100)));
                  };
                  return (
                    <>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                        {above ? `Nếu tăng thêm ${gap || 0} điểm hoặc hoàn thành thêm ${Math.max(0, (above.completedTasks || 0) - (personalStudent.completedTasks || 0))} bài, bạn có thể vượt qua học sinh phía trên.` : 'Bạn đang đứng đầu trong bộ lọc hiện tại.'}
                      </div>
                      {[['Top 10', top10Target?.rankValue], ['Top 3', top3Target?.rankValue]].map(([label, target]) => {
                        const pct = progress(target);
                        return (
                          <div key={label} style={{ display: 'grid', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
                              <span>{label}</span>
                              <span>{Math.round(pct)}%</span>
                            </div>
                            <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'rgba(255,255,255,.08)' }}>
                              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#4FACFE,#7B3FE4)' }} />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {isParent && user.data.childIds?.length > 0 && (
            <div className="scard" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Báo cáo phụ huynh</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Thông tin nhanh cho phụ huynh dựa trên học sinh con mình.</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{user.data.childIds.length} con</span>
              </div>
              {user.data.childIds.map(childId => {
                const child = rankedStudents.find(s => s.id === childId) || studentSummaries.find(s => s.id === childId);
                if (!child) return null;
                return (
                  <div key={childId} style={{ borderTop: '1px solid var(--wa07)', paddingTop: 14, marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{child.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>Hạng: {child.rank || '--'} · Điểm TB: {formatScore(child.summary.dtbmca)}</div>
                      </div>
                      <div style={{ minWidth: 110, padding: 10, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Chuyên cần</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{child.attendancePct}%</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      <span style={{ fontSize: 10, color: '#34D399', background: 'rgba(52,211,153,.12)', padding: '4px 8px', borderRadius: 8 }}>Bài tập {child.assignmentCompletion}%</span>
                      <span style={{ fontSize: 10, color: '#F59E0B', background: 'rgba(245,158,11,.12)', padding: '4px 8px', borderRadius: 8 }}>Điểm TB {formatScore(child.summary.dtbmca)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(isTeacher || isParent) && (
            <div className="scard" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Danh sách cần hỗ trợ</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Danh sách học sinh cần hỗ trợ thêm dựa trên dữ liệu hiện có.</div>
                </div>
                <span style={{ fontSize: 11, color: '#F59E0B' }}>Bảo mật</span>
              </div>
              {supportCandidates.length ? supportCandidates.map(student => (
                <div key={student.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: '12px 0', borderTop: '1px solid var(--wa07)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{student.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Hạng {student.rank} · {formatScore(student.summary.dtbmca)} · {student.summary.classification}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {student.attendancePct < 70 && <span style={{ fontSize: 10, color: '#EF4444', background: 'rgba(239,68,68,.12)', padding: '4px 8px', borderRadius: 8 }}>Vắng nhiều</span>}
                      {student.assignmentCompletion < 60 && <span style={{ fontSize: 10, color: '#FBBF24', background: 'rgba(251,191,36,.12)', padding: '4px 8px', borderRadius: 8 }}>Nộp ít</span>}
                      {student.summary.dtbmca < 5 && <span style={{ fontSize: 10, color: '#F97316', background: 'rgba(249,115,22,.12)', padding: '4px 8px', borderRadius: 8 }}>Điểm thấp</span>}
                    </div>
                  </div>
                  <div style={{ minWidth: 54, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{student.risk}</div>
                </div>
              )) : <div style={{ fontSize: 12, color: 'var(--text3)' }}>Hiện tại không có học sinh cần hỗ trợ đặc biệt.</div>}
            </div>
          )}

          <div className="scard" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Chi tiết học sinh</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Chọn một học sinh để xem chi tiết xếp hạng, điểm, và tiến bộ.</div>
              </div>
              <button onClick={() => setSelectedStudentId(null)} style={{ border: 'none', background: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11 }}>Đặt lại</button>
            </div>
            {selectedStudent ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{selectedStudent.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Hạng hiện tại: {selectedStudent.rank}</div>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(79,172,254,.08)', fontWeight: 700, color: 'var(--accent)' }}>{getRankLabel(selectedStudent.rank)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Điểm trung bình</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{formatScore(selectedStudent.summary.dtbmca)}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Hoàn thành bài</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{selectedStudent.assignmentCompletion}%</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Chuyên cần</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{selectedStudent.attendancePct}%</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Môn mạnh nhất</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{selectedStudent.topSubject || '--'}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Môn cần cải thiện</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{selectedStudent.weakSubject || '--'}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>HK1 → HK2</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{formatScore(selectedStudent.termHk1)} → {formatScore(selectedStudent.termHk2)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Chọn một học sinh từ bảng bên dưới để xem chi tiết xếp hạng, tăng tiến và môn học mạnh/yếu.</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        <div className="scard" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Trophy size={16} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Hall of Fame</span>
          </div>
          {[
            { label: 'Điểm trung bình cao nhất', student: hallOfFameMetrics.highestAvg, value: formatScore(hallOfFameMetrics.highestAvg?.rankValue) },
            { label: 'Chuyên cần tốt nhất', student: hallOfFameMetrics.bestAttendance, value: `${hallOfFameMetrics.bestAttendance?.attendancePct || 0}%` },
            { label: 'Hoàn thành bài tốt nhất', student: hallOfFameMetrics.bestCompletion, value: `${hallOfFameMetrics.bestCompletion?.assignmentCompletion || 0}%` },
            { label: 'Chuỗi giữ top dài nhất', student: hallOfFameMetrics.strongestStreak, value: `${hallOfFameMetrics.strongestStreak?.attendanceStreak || 0} tuần` },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--wa07)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{item.student?.name || '--'}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{item.value || '--'}</div>
            </div>
          ))}
        </div>

        <div className="scard" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <BookOpen size={16} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Báo cáo tuần</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 14 }}>
            Báo cáo tự động tuần dựa trên dữ liệu xếp hạng hiện có trong hệ thống.
          </div>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 12, minHeight: 120, fontSize: 12, color: 'var(--text4)', whiteSpace: 'pre-wrap' }}>
            {weeklySummaryText || 'Chưa có lớp hoặc dữ liệu để tạo báo cáo.'}
          </div>
          {isTeacher && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={sendWeeklySummary} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Gửi báo cáo tuần</button>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{weeklyReportStatus}</span>
            </div>
          )}
        </div>
      </div>

      <div className="scard" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.5fr 0.7fr 0.8fr 0.9fr 0.9fr', gap: 0, padding: '16px 18px', background: 'rgba(79,172,254,.04)', color: 'var(--text3)', fontSize: 11, fontWeight: 700 }}>
          <span>Hạng</span>
          <span>Học sinh</span>
          <span>Điểm</span>
          <span>Môn</span>
          <span>Xếp loại</span>
          <span>Tốt/Yếu</span>
        </div>
        {rankedStudents.length ? rankedStudents.map(student => (
          <button
            key={student.id}
            onClick={() => setSelectedStudentId(student.id)}
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr 0.5fr 0.7fr 0.8fr 0.9fr 0.9fr',
              gap: 0,
              padding: '14px 18px',
              background: student.id === selectedStudent?.id ? 'rgba(79,172,254,.12)' : 'transparent',
              border: 'none',
              textAlign: 'left',
              color: 'inherit',
              cursor: 'pointer',
              transition: 'background .2s',
            }}
          >
            <span style={{ fontWeight: 700 }}>{getRankLabel(student.rank)}</span>
            <span>{student.name}</span>
            <span>{formatScore(student.rankValue)}</span>
            <span>{student.subjectCount}</span>
            <span>{student.summary.classification}</span>
            <span>{student.topSubject || '--'} / {student.weakSubject || '--'}</span>
          </button>
        )) : (
          <div style={{ padding: 18, fontSize: 12, color: 'var(--text3)' }}>Không có học sinh khớp bộ lọc.</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
        <div className="scard" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ArrowUp size={16} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Hạng thay đổi HK1 → HK2</span>
          </div>
          {rankedStudents.length ? rankedStudents.slice(0, 5).map(student => {
            const hk1 = student.termHk1;
            const hk2 = student.termHk2;
            const change = typeof hk1 === 'number' && typeof hk2 === 'number' ? Math.round((hk2 - hk1) * 10) / 10 : null;
            return (
              <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--wa07)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{student.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>HK1 {formatScore(hk1)} → HK2 {formatScore(hk2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: change >= 0 ? '#34D399' : '#EF4444', fontWeight: 700 }}>
                  {change !== null ? `${change >= 0 ? '+' : ''}${change}` : '--'}
                </div>
              </div>
            );
          }) : <div style={{ fontSize: 12, color: 'var(--text3)' }}>Không đủ dữ liệu để so sánh.</div>}
        </div>

        <div className="scard" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ArrowDown size={16} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Điểm mạnh / cần cải thiện</span>
          </div>
          {selectedStudent ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Môn mạnh nhất</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{selectedStudent.topSubject || '--'}</div>
              </div>
              <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79,172,254,.05)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Môn cần cải thiện</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{selectedStudent.weakSubject || '--'}</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Chọn một học sinh để xem môn mạnh nhất và cần cải thiện.</div>
          )}
        </div>

        <div className="scard" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <RefreshCw size={16} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Dữ liệu hiện tại</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
            Bảng xếp hạng này sử dụng điểm trung bình và phân loại học lực đã được hệ thống tính sẵn từ khu vực quản lý điểm.
            Nếu không có dữ liệu điểm đầy đủ, một số học sinh sẽ xuất hiện với dữ liệu `--` hoặc bài đánh giá đang chờ cập nhật.
          </div>
        </div>
      </div>
    </div>
  );
}
