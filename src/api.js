const API = import.meta.env.VITE_API_URL || 'https://sclass-backen.onrender.com';


console.log("API =", API);
console.log(import.meta.env);
let token = localStorage.getItem('eclass_token');

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('eclass_token', t);
  else localStorage.removeItem('eclass_token');
}

export function getToken() {
  return token;
}

export function clearToken() {
  token = null;
  localStorage.removeItem('eclass_token');
}

async function request(method, path, body, opts = {}) {
  const headers = {};
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    ...opts,
  });

  if (res.status === 401) {
    clearToken();
    return null;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.errors?.[0]?.msg || `Request failed (${res.status})`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const api = {
  // ── Auth (public) ──
  login: (body) => request('POST', '/api/auth/login', body),
  googleLogin: (credential) => request('POST', '/api/auth/google', { credential }),

  // ── Public routes ──
  getPublicClasses: () => fetch(`${API}/api/public/classes`).then(r => r.json()).catch(() => []),
  saveStudent: (studentId, data) => request('PUT', `/api/students/${studentId}`, data),
  logActivity: (body) => request('POST', '/api/activity', body, { keepalive: true }),
  createPending: (body) => request('POST', '/api/public/pending', body),
  createParent: (data) => request('POST', '/api/public/parents', data, false),
  createPendingParent: (body) => request('POST', '/api/public/pendingParents', body),
  recordStudentLogin: (studentId) => request('POST', `/api/public/students/${studentId}/login-log`),
  createPendingTeacher: (body) => request('POST', '/api/public/pendingTeachers', body),
  sendVerificationEmail: (email, code) => request('POST', '/api/public/send-verification-email', { email, code }),

  // ── Bulk state load ──
  getState: () => request('GET', '/api/state'),

  // ── Teachers ──
  createTeacher: (body) => request('POST', '/api/teachers', body),
  updateTeacher: (id, body) => request('PUT', `/api/teachers/${id}`, body),
  deleteTeacher: (id) => request('DELETE', `/api/teachers/${id}`),

  // ── Classes ──
  createClass: (body) => request('POST', '/api/classes', body),
  updateClass: (id, body) => request('PUT', `/api/classes/${id}`, body),
  deleteClass: (id) => request('DELETE', `/api/classes/${id}`),

  // ── Students ──
  createStudent: (body) => request('POST', '/api/students', body),
  createStudentsBulk: (body) => request('POST', '/api/students/bulk', body),
  updateStudent: (id, body) => request('PUT', `/api/students/${id}`, body),
  deleteStudent: (id) => request('DELETE', `/api/students/${id}`),

  // ── Pending Students ──
  approvePending: (id, body) => request('POST', `/api/pending/${id}/approve`, body),
  rejectPending: (id) => request('DELETE', `/api/pending/${id}`),

  // ── Parents & Pending Parents ──
  deleteParent: (id) => request('DELETE', `/api/parents/${id}`),
  updateParent: (id, body) => request('PUT', `/api/parents/${id}`, body),
  rejectPendingParent: (id) => request('DELETE', `/api/pendingParents/${id}`),

  // ── Pending Teachers ──
  approvePendingTeacher: (id) => request('POST', `/api/pendingTeachers/${id}/approve`),
  rejectPendingTeacher: (id) => request('DELETE', `/api/pendingTeachers/${id}`),

  // ── Seats ──
  updateSeats: (classId, body) => request('PUT', `/api/seats/${classId}`, body),

  // ── Messages ──
  getMessages: (classId, channel) => request('GET', `/api/messages/${classId}/${encodeURIComponent(channel)}`),
  pollMessages: (classId, channel, afterId) =>
    request('GET', `/api/messages/${classId}/${encodeURIComponent(channel)}/poll?after=${afterId}`),
  sendMessage: (body) => request('POST', '/api/messages', body),
  pingChat: (classId, body) => request('POST', `/api/chat/${classId}/ping`, body),
  getOnlineUsers: (classId) => request('GET', `/api/chat/${classId}/online`),

  // ── Assignments ──
  createAssignment: (body) => request('POST', '/api/assignments', body),
  updateAssignment: (id, body) => request('PUT', `/api/assignments/${id}`, body),
  deleteAssignment: (id) => request('DELETE', `/api/assignments/${id}`),
  submitAssignment: (id, body) => request('POST', `/api/assignments/${id}/submit`, body),
  gradeAssignment: (id, body) => request('POST', `/api/assignments/${id}/grade`, body),

  // ── Attendance ──
  toggleAttendance: (body) => request('POST', '/api/attendance/toggle', body),
  setAttendance: (classId, date, body) => request('PUT', `/api/attendance/${classId}/${date}`, body),
  scanAttendance: (body) => request('POST', '/api/attendance/scan', body),
  startAttendance: (classId, ts) => request('POST', '/api/attendance/start', { classId, ts }),
  stopAttendance: (classId) => request('POST', '/api/attendance/stop', { classId }),
  getActiveAttendance: (classId) => request('GET', `/api/attendance/active/${classId}`),
  recordProctorLog: (body) => request('POST', '/api/proctor/log', body),
  createSchool: (body) => request('POST', '/api/schools', body),
  deleteSchool: (id) => request('DELETE', `/api/schools/${id}`),

  // ── Grades ──
  setStudentGrades: (studentId, body) => request('PUT', `/api/grades/${studentId}`, body),
  deleteStudentGrades: (studentId) => request('DELETE', `/api/grades/${studentId}`),

  // ── Files ──
  createFile: (body) => request('POST', '/api/files', body),
  downloadFile: (id) => request('PUT', `/api/files/${id}/download`),
  deleteFile: (id) => request('DELETE', `/api/files/${id}`),

  // ── Data (admin) ──
  exportData: () => request('GET', '/api/data/export'),
  importData: (body) => request('POST', '/api/data/import', body),
  resetData: () => request('DELETE', '/api/data/reset'),
  logActivity: (body) => request('POST', '/api/activity', body, { keepalive: true }),

  // ── Trợ giảng AI (chỉ học sinh) ──
  askAI: (message, history) => request('POST', '/api/ai/ask', { message, history }),

  // ── Thời khóa biểu (giáo viên sửa, học sinh/phụ huynh xem) ──
  getSchedule: (classId) => request('GET', `/api/schedule/${classId}`),
  updateSchedule: (classId, data) => request('PUT', `/api/schedule/${classId}`, { data }),

  // ── Schools & Grades ──
  getSchools: () => request('GET', '/api/schools'),
  createSchool: (body) => request('POST', '/api/schools', body),
  deleteSchool: (id) => request('DELETE', `/api/schools/${id}`),
  getGrades: () => request('GET', '/api/grades'),
  createGrade: (body) => request('POST', '/api/grades', body),
  deleteGrade: (id) => request('DELETE', `/api/grades/${id}`),
};

export default api;