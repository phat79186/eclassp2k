import React, { useState, useMemo } from 'react';
import { 
  Users, Plus, Edit2, Trash2, BookOpen, School, X, Upload, 
  CheckCircle, AlertCircle, FileText, Database, HelpCircle
} from 'lucide-react';

const SUBJECTS = ["Toán", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", "Lịch sử", "Địa lý", "Tiếng Anh", "Tin học", "GDCD", "Công nghệ", "Thể dục"];

// Hỗ trợ hiển thị badge màu sắc
function Badge({ c, children }) {
  const colors = {
    green: { bg: "rgba(52,211,153,.1)", fg: "#34D399", bd: "rgba(52,211,153,.2)" },
    blue: { bg: "rgba(79,172,254,.1)", fg: "var(--accent)", bd: "rgba(79,172,254,.2)" },
    orange: { bg: "rgba(245,158,11,.1)", fg: "#F59E0B", bd: "rgba(245,158,11,.2)" },
    violet: { bg: "rgba(167,139,250,.1)", fg: "#A78BFA", bd: "rgba(167,139,250,.2)" }
  };
  const theme = colors[c] || colors.blue;
  return (
    <span style={{ 
      padding: "2px 7px", borderRadius: "12px", fontSize: "9px", fontWeight: 700,
      background: theme.bg, color: theme.fg, border: `1px solid ${theme.bd}`,
      display: "inline-flex", alignItems: "center", gap: 3
    }}>
      {children}
    </span>
  );
}

// Bảng input component phụ trợ (Đồng bộ với thiết kế của dự án)
function Inp({ label, value, onChange, placeholder, type = "text", required = false, note = "" }) {
  return (
    <div style={{ marginBottom: 12, textAlign: "left" }}>
      <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--text2)", marginBottom: 4, letterSpacing: ".04em" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="inp"
        style={{ width: "100%", padding: "8px 12px", fontSize: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--inp-bg)", color: "var(--text)", outline: "none", fontFamily: "inherit" }}
      />
      {note && <div style={{ fontSize: "10px", color: "var(--text4)", marginTop: 3 }}>{note}</div>}
    </div>
  );
}

function Sel({ label, value, onChange, options, required = false }) {
  return (
    <div style={{ marginBottom: 12, textAlign: "left" }}>
      <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: "var(--text2)", marginBottom: 4, letterSpacing: ".04em" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="inp"
        style={{ width: "100%", padding: "8px 12px", fontSize: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--inp-bg)", color: "var(--text)", outline: "none", fontFamily: "inherit" }}
      >
        {options.map(o => (
          <option key={o.v ?? o} value={o.v ?? o}>{o.l ?? o}</option>
        ))}
      </select>
    </div>
  );
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ padding: "8px 12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "8px", color: "#FCA5A5", fontSize: "11px", fontWeight: 600, textAlign: "left", marginBottom: 10 }}>
      ⚠️ {msg}
    </div>
  );
}

export default function AdminDashPage({ state, user }) {
  // ── 1. DI CHUYỂN TOÀN BỘ LOGIC QUẢN TRỊ HIỆN CÓ ──────────────────────
  const teachers = (state.teachers || []).filter(t => t.subject !== 'Quản sinh');
  const [showAddT, setShowAddT] = useState(false);
  const [editT, setEditT] = useState(null);
  const [newT, setNewT] = useState({ 
    name: "", username: "", password: "", subject: SUBJECTS[0], em: "👨‍🏫", 
    email: "", emailVerified: false, school: "", homeroomClassId: "" 
  });
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [errT, setErrT] = useState("");

  const [newSchName, setNewSchName] = useState("");
  const [showAddClass, setShowAddClass] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [newClsName, setNewClsName] = useState("");
  const [newClsSchool, setNewClsSchool] = useState("");
  const [newClsGrade, setNewClsGrade] = useState("10");
  const [newClsTeacherId, setNewClsTeacherId] = useState("");
  const [errCls, setErrCls] = useState("");
  const [proctorPasswords, setProctorPasswords] = useState({});

  // ── 2. LOGIC BỔ SUNG: BATCH BULK IMPORT CSV ──────────────────────────
  const [activeImportTab, setActiveImportTab] = useState("school"); // school, teacher
  const [previewData, setPreviewData] = useState([]);
  const [importLogs, setImportLogs] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Parser CSV thô phía Client
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Phân tích các cột (hỗ trợ phân tách bằng dấu phẩy)
      const cols = [];
      let current = "";
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      cols.push(current.trim());
      result.push(cols);
    }
    return result;
  };

  // Xử lý đọc file tải lên
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportLogs("");
    setPreviewData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        const parsed = parseCSV(csvText);
        if (parsed.length < 2) {
          setImportLogs("⚠️ File CSV trống hoặc không đúng cấu trúc (thiếu dòng tiêu đề).");
          return;
        }

        const headers = parsed[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const rows = parsed.slice(1);
        const previewRows = [];

        if (activeImportTab === "school") {
          // Định dạng Trường học: Cột TenTruong
          const nameIdx = parsed[0].findIndex(h => h.toLowerCase() === "tentruong");
          if (nameIdx === -1) {
            setImportLogs("⚠️ File CSV không tìm thấy cột 'TenTruong' ở dòng tiêu đề.");
            return;
          }

          rows.forEach((row, idx) => {
            const name = row[nameIdx] || "";
            const isValid = name.trim().length > 0;
            previewRows.push({
              id: idx + 1,
              name: name.trim(),
              isValid,
              error: isValid ? "" : "Tên trường học không được để trống"
            });
          });
        } else {
          // Định dạng Giáo viên: HoTen, TenDangNhap, MatKhau, MonHoc, TruongHoc, Email
          const idxName = parsed[0].findIndex(h => h.toLowerCase() === "hoten");
          const idxUser = parsed[0].findIndex(h => h.toLowerCase() === "tendangnhap");
          const idxPass = parsed[0].findIndex(h => h.toLowerCase() === "matkhau");
          const idxSubj = parsed[0].findIndex(h => h.toLowerCase() === "monhoc");
          const idxSch  = parsed[0].findIndex(h => h.toLowerCase() === "truonghoc");
          const idxMail = parsed[0].findIndex(h => h.toLowerCase() === "email");

          if (idxName === -1 || idxUser === -1 || idxPass === -1 || idxSubj === -1 || idxSch === -1 || idxMail === -1) {
            setImportLogs("⚠️ File CSV thiếu các cột tiêu đề bắt buộc: 'HoTen', 'TenDangNhap', 'MatKhau', 'MonHoc', 'TruongHoc', 'Email'.");
            return;
          }

          rows.forEach((row, idx) => {
            const name = row[idxName] || "";
            const username = row[idxUser] || "";
            const password = row[idxPass] || "";
            const subject = row[idxSubj] || "";
            const school = row[idxSch] || "";
            const email = row[idxMail] || "";

            let error = "";
            if (!name.trim()) error += "Thiếu họ tên; ";
            if (!username.trim()) error += "Thiếu tên đăng nhập; ";
            if (!password.trim()) error += "Thiếu mật khẩu; ";
            if (!subject.trim()) error += "Thiếu môn học; ";
            if (!school.trim()) error += "Thiếu trường học; ";
            if (!email.trim()) error += "Thiếu email; ";

            previewRows.push({
              id: idx + 1,
              name: name.trim(),
              username: username.trim(),
              password: password.trim(),
              subject: subject.trim(),
              school: school.trim(),
              email: email.trim(),
              isValid: error === "",
              error: error
            });
          });
        }

        setPreviewData(previewRows);
      } catch (err) {
        setImportLogs("Lỗi đọc file: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  // Gọi API lưu dữ liệu
  const saveBulkImport = async () => {
    const validData = previewData.filter(d => d.isValid);
    if (validData.length === 0) {
      alert("Không có bản ghi hợp lệ nào để lưu!");
      return;
    }

    setIsUploading(true);
    setImportLogs("");

    try {
      const endpoint = activeImportTab === "school" 
        ? "/api/admin/import/schools" 
        : "/api/admin/import/teachers";

      const payload = activeImportTab === "school"
        ? validData.map(d => ({ name: d.name }))
        : validData.map(d => ({
            name: d.name,
            username: d.username,
            password: d.password,
            subject: d.subject,
            school: d.school,
            email: d.email
          }));

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Lỗi máy chủ khi import dữ liệu.");
      }

      const resData = await res.json();
      setImportLogs(`✅ Nhập thành công! ${resData.importedCount} bản ghi đã được thêm.`);
      setPreviewData([]);
      setCsvFileName("");

      // Tải lại dữ liệu hệ thống
      if (state.reload) state.reload();

    } catch (err) {
      setImportLogs("❌ Thất bại: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ── 3. CÁC HÀM XỬ LÝ SỰ KIỆN GỐC CỦA ADMIN ──────────────────────────
  const openAddTeacher = () => {
    setEditT(null);
    setNewT({ name: "", username: "", password: "", subject: SUBJECTS[0], em: "👨‍🏫", email: "", emailVerified: false, school: "", homeroomClassId: "" });
    setSelectedClasses([]);
    setErrT(""); setShowAddT(true);
  };

  const openEditTeacher = (t) => {
    setEditT(t);
    const hrClass = state.classes.find(c => c.teacherId === t.id);
    setNewT({ 
      name: t.name, username: t.username, password: "", subject: t.subject || SUBJECTS[0], 
      em: t.em || "👨‍🏫", email: t.email || "", emailVerified: !!t.emailVerified, 
      school: t.school || "", homeroomClassId: hrClass ? hrClass.id : "" 
    });
    setSelectedClasses(t.teachingClassIds || []);
    setErrT(""); setShowAddT(true);
  };

  const saveTeacher = () => {
    setErrT("");
    if (!newT.name.trim()) { setErrT("Nhập họ và tên giáo viên"); return; }
    if (!newT.username.trim() || (!editT && !newT.password)) { setErrT("Nhập tên đăng nhập và mật khẩu"); return; }
    if (newT.password && newT.password.length < 4) { setErrT("Mật khẩu tối thiểu 4 ký tự"); return; }
    if (teachers.find(t => t.username.toLowerCase() === newT.username.trim().toLowerCase() && t.id !== editT?.id)) { setErrT("Tên đăng nhập đã tồn tại"); return; }

    const teacherId = editT ? editT.id : "t_" + Date.now() + Math.random().toString().slice(2, 8);

    if (editT) {
      state.setTeachers(prev => prev.map(t => t.id === editT.id ? {
        ...t, name: newT.name.trim(), username: newT.username.trim(), subject: newT.subject, em: newT.em,
        email: newT.email.trim(), emailVerified: newT.emailVerified,
        school: (newT.school || "").trim(),
        teachingClassIds: selectedClasses,
        ...(newT.password ? { password: newT.password } : {})
      } : t));
    } else {
      state.setTeachers(prev => [...prev, {
        id: teacherId,
        name: newT.name.trim(), username: newT.username.trim(), password: newT.password,
        subject: newT.subject, em: newT.em, email: newT.email.trim(), emailVerified: newT.emailVerified,
        school: (newT.school || "").trim(),
        teachingClassIds: selectedClasses, isAdmin: false
      }]);
    }

    // Cập nhật lớp chủ nhiệm
    state.setClasses(prev => prev.map(c => {
      if (c.id === newT.homeroomClassId) return { ...c, teacherId };
      if (c.teacherId === teacherId && c.id !== newT.homeroomClassId) return { ...c, teacherId: null };
      return c;
    }));

    setShowAddT(false); setEditT(null);
  };

  const deleteTeacher = async tid => {
    if (tid === user.data.id) { alert("Không thể xóa tài khoản đang đăng nhập!"); return; }
    if (confirm("Xóa giáo viên này?")) {
      state.setTeachers(p => p.filter(x => x.id !== tid));
    }
  };

  const handleAddSchool = async () => {
    if (!newSchName.trim()) return;
    try {
      await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSchName.trim() })
      });
      state.reload();
      setNewSchName("");
    } catch (e) {
      alert("Lỗi thêm trường: " + e.message);
    }
  };

  const handleDeleteSchool = async (schId) => {
    const sch = state.schools.find(s => s.id === schId);
    if (!sch) return;
    if (confirm("Xóa trường " + sch.name + " sẽ xóa toàn bộ các khối lớp liên kết?")) {
      try {
        await fetch(`/api/schools/${schId}`, { method: 'DELETE' });
        state.reload();
      } catch (e) {
        alert("Lỗi xóa trường: " + e.message);
      }
    }
  };

  const openAddCls = () => {
    setEditClass(null); setNewClsName(""); setNewClsSchool(""); setNewClsGrade("10"); setNewClsTeacherId(""); setErrCls(""); setShowAddClass(true);
  };

  const openEditCls = (c) => {
    setEditClass(c); setNewClsName(c.name); setNewClsSchool(c.school || ""); setNewClsGrade(c.grade || "10"); setNewClsTeacherId(c.teacherId || ""); setErrCls(""); setShowAddClass(true);
  };

  const saveClass = () => {
    setErrCls("");
    if (!newClsName.trim()) { setErrCls("Nhập tên lớp"); return; }
    
    const dup = state.classes.find(c => c.name === newClsName.trim() && c.id !== editClass?.id);
    if (dup) { setErrCls("Tên lớp đã tồn tại"); return; }

    if (editClass) {
      state.setClasses(prev => prev.map(c => c.id === editClass.id ? {
        ...c, name: newClsName.trim(), school: newClsSchool.trim(), grade: newClsGrade.trim(), teacherId: newClsTeacherId || null
      } : c));
    } else {
      const id = "cls_" + Date.now();
      state.setClasses(prev => [...prev, {
        id, name: newClsName.trim(), school: newClsSchool.trim(), grade: newClsGrade.trim(), teacherId: newClsTeacherId || null, createdAt: Date.now()
      }]);
    }
    setShowAddClass(false); setEditClass(null);
  };

  const deleteClass = async cid => {
    if (confirm("Xóa lớp này và toàn bộ học sinh trong lớp?")) {
      state.setClasses(p => p.filter(c => c.id !== cid));
      state.setStudents(p => p.filter(s => s.classId !== cid));
    }
  };

  const handleSaveProctor = (sch) => {
    const password = proctorPasswords[sch.id] || "";
    if (!password.trim() || password.length < 4) { alert("Mật khẩu tối thiểu 4 ký tự!"); return; }

    const existingProctor = state.teachers.find(t => t.subject === 'Quản sinh' && t.school === sch.name);
    const cleanSchName = sch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = `qs_${sch.id}_${cleanSchName}`;

    if (existingProctor) {
      state.setTeachers(prev => prev.map(t => t.id === existingProctor.id ? {
        ...t, password: password, teachingClassIds: state.classes.filter(c => c.school === sch.name).map(c => c.id)
      } : t));
      alert(`Đã đổi mật khẩu Quản sinh trường ${sch.name} thành '${password}'!`);
    } else {
      state.setTeachers(prev => [...prev, {
        id: `t_qs_${sch.id}`, name: `Quản sinh ${sch.name}`, username: username, password: password,
        subject: "Quản sinh", em: "👮", school: sch.name,
        teachingClassIds: state.classes.filter(c => c.school === sch.name).map(c => c.id), isAdmin: false
      }]);
      alert(`Đã cấp thành công tài khoản Quản sinh!\n- Tên đăng nhập: ${username}\n- Mật khẩu: ${password}`);
    }
    setProctorPasswords(p => ({ ...p, [sch.id]: "" }));
  };

  const classesBySchoolAndGrade = useMemo(() => {
    const groups = {};
    state.classes.forEach(c => {
      const sch = c.school || "Trường khác";
      const gr = c.grade || "Khối khác";
      if (!groups[sch]) groups[sch] = {};
      if (!groups[sch][gr]) groups[sch][gr] = [];
      groups[sch][gr].push(c);
    });
    return groups;
  }, [state.classes]);

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20, background: "#050C1A", minHeight: "100vh" }}>
      
      {/* ── CARD BULK IMPORT CSV (MỚI BỔ SUNG) ────────────────────────── */}
      <div className="scard" style={{ border: "1px solid rgba(79,172,254,0.2)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border2)", background: "rgba(79,172,254,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={16} color="var(--accent)" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>NHẬP DỮ LIỆU NHANH BẰNG FILE CSV</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button 
              onClick={() => { setActiveImportTab("school"); setPreviewData([]); setCsvFileName(""); setImportLogs(""); }}
              style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: `1px solid ${activeImportTab === "school" ? "rgba(79,172,254,.4)" : "var(--wa05)"}`, background: activeImportTab === "school" ? "rgba(79,172,254,.1)" : "transparent", color: activeImportTab === "school" ? "var(--accent)" : "var(--text3)", cursor: "pointer" }}
            >
              Trường học
            </button>
            <button 
              onClick={() => { setActiveImportTab("teacher"); setPreviewData([]); setCsvFileName(""); setImportLogs(""); }}
              style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: `1px solid ${activeImportTab === "teacher" ? "rgba(79,172,254,.4)" : "var(--wa05)"}`, background: activeImportTab === "teacher" ? "rgba(79,172,254,.1)" : "transparent", color: activeImportTab === "teacher" ? "var(--accent)" : "var(--text3)", cursor: "pointer" }}
            >
              Giáo viên
            </button>
          </div>
        </div>

        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Hướng dẫn định dạng */}
          <div style={{ display: "flex", gap: 10, background: "rgba(255,255,255,0.015)", border: "1px dashed var(--border2)", borderRadius: 10, padding: "10px 14px", alignItems: "flex-start" }}>
            <HelpCircle size={16} style={{ color: "var(--text3)", marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>
              <strong>Định dạng file yêu cầu:</strong><br />
              {activeImportTab === "school" ? (
                <span>File CSV phải có hàng tiêu đề: <code>TenTruong</code> (Chỉ nhận diện cột này).</span>
              ) : (
                <span>Cần đủ các tiêu đề: <code>HoTen</code>, <code>TenDangNhap</code>, <code>MatKhau</code>, <code>MonHoc</code>, <code>TruongHoc</code>, <code>Email</code></span>
              )}
            </div>
          </div>

          {/* Chọn file */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border2)", background: "rgba(255,255,255,0.03)", cursor: "pointer", color: "var(--text)", fontSize: 12, fontWeight: 700 }}>
              <Upload size={14} color="var(--accent)" />
              <span>Chọn file CSV</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
            <span style={{ fontSize: 12, color: csvFileName ? "var(--text)" : "var(--text4)", fontStyle: csvFileName ? "normal" : "italic" }}>
              {csvFileName || "Chưa có file nào được chọn"}
            </span>
          </div>

          {/* Preview dữ liệu */}
          {previewData.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>BẢNG XEM TRƯỚC DỮ LIỆU (PREVIEW):</div>
              <div style={{ overflowX: "auto", border: "1px solid var(--border2)", borderRadius: 10, background: "rgba(0,0,0,0.2)", maxHeight: 200, scrollbarWidth: "thin" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border2)" }}>
                      <th style={{ padding: "8px 12px", color: "var(--text3)" }}>STT</th>
                      <th style={{ padding: "8px 12px", color: "var(--text3)" }}>Trạng thái</th>
                      {activeImportTab === "school" ? (
                        <th style={{ padding: "8px 12px", color: "var(--text3)" }}>Tên Trường Học</th>
                      ) : (
                        <>
                          <th style={{ padding: "8px 12px", color: "var(--text3)" }}>Họ Tên</th>
                          <th style={{ padding: "8px 12px", color: "var(--text3)" }}>Tên đăng nhập</th>
                          <th style={{ padding: "8px 12px", color: "var(--text3)" }}>Mật khẩu</th>
                          <th style={{ padding: "8px 12px", color: "var(--text3)" }}>Môn học</th>
                          <th style={{ padding: "8px 12px", color: "var(--text3)" }}>Trường</th>
                          <th style={{ padding: "8px 12px", color: "var(--text3)" }}>Email</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid var(--border2)", background: row.isValid ? "transparent" : "rgba(239,68,68,0.03)" }}>
                        <td style={{ padding: "8px 12px", color: "var(--text4)" }}>{row.id}</td>
                        <td style={{ padding: "8px 12px" }}>
                          {row.isValid ? (
                            <CheckCircle size={14} color="#10B981" />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#EF4444" }}>
                              <AlertCircle size={14} />
                              <span style={{ fontSize: 9 }}>Lỗi: {row.error}</span>
                            </div>
                          )}
                        </td>
                        {activeImportTab === "school" ? (
                          <td style={{ padding: "8px 12px", color: row.isValid ? "var(--text)" : "var(--text3)" }}>{row.name}</td>
                        ) : (
                          <>
                            <td style={{ padding: "8px 12px", color: row.isValid ? "var(--text)" : "var(--text3)" }}>{row.name}</td>
                            <td style={{ padding: "8px 12px", color: "var(--text)" }}>{row.username}</td>
                            <td style={{ padding: "8px 12px", color: "var(--text3)", fontFamily: "monospace" }}>{row.password}</td>
                            <td style={{ padding: "8px 12px", color: "var(--text)" }}>{row.subject}</td>
                            <td style={{ padding: "8px 12px", color: "var(--text)" }}>{row.school}</td>
                            <td style={{ padding: "8px 12px", color: "var(--text2)" }}>{row.email}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Nút lưu */}
              <button 
                onClick={saveBulkImport}
                disabled={isUploading}
                style={{ 
                  alignSelf: "flex-end", padding: "8px 20px", borderRadius: 10,
                  background: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)",
                  color: "#fff", border: "none", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  opacity: isUploading ? 0.6 : 1
                }}
              >
                {isUploading ? "Đang xử lý lưu..." : "Xác nhận & Lưu vào cơ sở dữ liệu"}
              </button>
            </div>
          )}

          {/* Logs / Kết quả */}
          {importLogs && (
            <div style={{ 
              padding: "10px 14px", borderRadius: 10, 
              background: importLogs.startsWith("❌") ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
              border: importLogs.startsWith("❌") ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(16,185,129,0.2)",
              color: importLogs.startsWith("❌") ? "#FCA5A5" : "#34D399",
              fontSize: 12, fontWeight: 600, textAlign: "left"
            }}>
              {importLogs}
            </div>
          )}
        </div>
      </div>

      {/* ── CARD 1: DANH SÁCH GIÁO VIÊN ────────────────────── */}
      <div className="scard" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--wa06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={16} style={{ color: "#34D399" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Danh sách giáo viên & lớp học phụ trách</span>
          </div>
          <button onClick={openAddTeacher} className="btn-small" style={{ padding: "5px 12px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Plus size={12} />Tạo tài khoản giáo viên
          </button>
        </div>
        {teachers.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text4)" }}>
            <Users size={36} style={{ margin: "0 auto 14px", opacity: .25 }} />
            <div style={{ fontSize: 13 }}>Chưa có giáo viên nào hoạt động</div>
          </div>
        ) : teachers.map(t => {
          const teacherClasses = state.classes.filter(c => c.teacherId === t.id);
          const otherClasses = state.classes.filter(c => (t.teachingClassIds || []).includes(c.id));
          return (
            <div key={t.id} style={{ padding: "14px 18px", borderBottom: "1px solid var(--wa04)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, overflow: "hidden" }}>
                {t.photo ? <img src={t.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (t.em || "👨‍🏫")}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                  {t.name} {t.isAdmin && <Badge c="violet">Admin</Badge>}
                  {t.school && <Badge c="orange">🏢 {t.school}</Badge>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>Tên đăng nhập: <span style={{ color: "var(--text2)" }}>{t.username}</span> · Môn: <span style={{ color: "var(--text2)" }}>{t.subject}</span></div>
                {t.email && <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>✉️ {t.email}{t.emailVerified && <Badge c="green">Đã xác minh</Badge>}</div>}
                
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Lớp chủ nhiệm:</span>
                    {teacherClasses.length === 0 ? (
                      <span style={{ fontSize: 10, color: "var(--text4)", fontStyle: "italic" }}>Chưa phụ trách</span>
                    ) : teacherClasses.map(c => (
                      <Badge key={c.id} c="green">👑 {c.name}</Badge>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Lớp bộ môn dạy:</span>
                    {otherClasses.length === 0 ? (
                      <span style={{ fontSize: 10, color: "var(--text4)", fontStyle: "italic" }}>Chưa phân lớp bộ môn</span>
                    ) : otherClasses.map(c => (
                      <Badge key={c.id} c="blue">{c.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => openEditTeacher(t)} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(79,172,254,.22)", background: "rgba(79,172,254,.06)", color: "var(--accent)", cursor: "pointer", display: "flex" }}><Edit2 size={12} /></button>
                {t.id !== user.data.id && (
                  <button onClick={() => deleteTeacher(t.id)} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex" }}><Trash2 size={12} /></button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CARD 2: QUẢN LÝ LỚP HỌC TOÀN HỆ THỐNG ────────────────────── */}
      <div className="scard" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
            <BookOpen size={16} style={{ color: "var(--accent)" }} />
            Quản lý lớp học & Giáo viên chủ nhiệm
          </div>
          <button onClick={openAddCls} style={{ padding: "5px 12px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Plus size={12} />Tạo lớp học mới
          </button>
        </div>

        {Object.keys(classesBySchoolAndGrade).length === 0 ? (
          <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>Chưa có lớp học nào được tạo.</div>
        ) : Object.keys(classesBySchoolAndGrade).map(sch => (
          <div key={sch} style={{ border: "1px solid var(--border2)", borderRadius: 12, padding: 14, background: "rgba(255,255,255,0.005)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text2)", borderBottom: "1px solid var(--border2)", paddingBottom: 6, marginBottom: 10 }}>
              🏢 Trường: {sch}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.keys(classesBySchoolAndGrade[sch]).map(grade => (
                <div key={grade} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text4)", padding: "4px 8px", background: "var(--wa05)", borderRadius: 6, marginTop: 4 }}>
                    Khối {grade}
                  </span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
                    {classesBySchoolAndGrade[sch][grade].map(c => {
                      const teacher = state.teachers.find(t => t.id === c.teacherId);
                      return (
                        <div key={c.id} style={{ display: "flex", alignItems: "center", borderRadius: 10, border: "1px solid var(--border2)", background: "var(--wa03)", padding: "4px 10px", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{c.name}</span>
                          <span style={{ fontSize: 10, color: "var(--text3)" }}>
                            (GVCN: {teacher ? teacher.name : "Chưa phân công"})
                          </span>
                          <button onClick={() => openEditCls(c)} style={{ padding: 2, background: "none", border: "none", color: "var(--accent)", cursor: "pointer", display: "flex" }}><Edit2 size={10} /></button>
                          <button onClick={() => deleteClass(c.id)} style={{ padding: 2, background: "none", border: "none", color: "#EF4444", cursor: "pointer", display: "flex" }}><Trash2 size={10} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── CARD 3: QUẢN LÝ TRƯỜNG HỌC & QUẢN SINH ────────────────────── */}
      <div className="scard" style={{ padding: 20, border: "1px solid var(--border2)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
          <School size={16} style={{ color: "var(--accent)" }} />
          Quản lý trường học & Khối lớp mặc định
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="inp" placeholder="Nhập tên trường học mới (VD: THPT Nguyễn Du)" value={newSchName} onChange={e => setNewSchName(e.target.value)} style={{ flex: 1, padding: "8px 12px", background: "var(--inp-bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", outline: "none", fontFamily: "inherit" }} />
          <button onClick={handleAddSchool} style={{ padding: "8px 16px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Thêm trường mới</button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          {(!state.schools || state.schools.length === 0) ? (
            <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>Chưa có trường học nào hoạt động.</div>
          ) : state.schools.map(sch => {
            const schGrades = (state.grades || []).filter(g => g.schoolId === sch.id);
            const proctor = state.teachers.find(t => t.subject === 'Quản sinh' && t.school === sch.name);
            return (
              <div key={sch.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--wa015)", border: "1px solid var(--border2)", borderRadius: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>🏢 {sch.name}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "var(--text4)", fontWeight: 600 }}>Khối lớp tạo sẵn:</span>
                    {schGrades.map(g => (
                      <Badge key={g.id} c="green">Khối {g.name}</Badge>
                    ))}
                  </div>

                  {/* Quản lý Quản sinh */}
                  <div style={{ marginTop: 10, padding: 10, background: "rgba(255,255,255,0.015)", border: "1px dashed var(--border2)", borderRadius: 8, maxWidth: 380 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: proctor ? "var(--accent)" : "var(--text3)" }}>
                      👮 Quản sinh: {proctor ? (
                        <>
                          Tài khoản: <strong style={{ color: "var(--text)" }}>{proctor.username}</strong>
                        </>
                      ) : (
                        <span style={{ fontStyle: "italic", color: "var(--text4)" }}>Chưa cấp tài khoản</span>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
                      <input 
                        type="text" 
                        placeholder={proctor ? "Mật khẩu mới để đổi" : "Nhập mật khẩu để cấp"} 
                        value={proctorPasswords[sch.id] || ""} 
                        onChange={e => setProctorPasswords(p => ({ ...p, [sch.id]: e.target.value }))}
                        className="inp" 
                        style={{ padding: "4px 8px", fontSize: 11, flex: 1, minWidth: 120, height: 28, background: "var(--inp-bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", outline: "none", fontFamily: "inherit" }}
                      />
                      <button 
                        onClick={() => handleSaveProctor(sch)}
                        style={{ padding: "5px 10px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", height: 28 }}
                      >
                        {proctor ? "Đổi mật khẩu" : "Cấp tài khoản"}
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDeleteSchool(sch.id)} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex", alignSelf: "flex-start" }}><Trash2 size={12} /></button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL 1: THÊM / SỬA GIÁO VIÊN ────────────────────── */}
      {showAddT && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAddT(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="modal" style={{ width: 380, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{editT ? "Chỉnh sửa tài khoản giáo viên" : "Tạo tài khoản giáo viên"}</h2>
              <button onClick={() => setShowAddT(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 7, letterSpacing: ".05em" }}>CHỌN EMOJI ĐẠI DIỆN</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {["👨‍🏫","👩‍🏫","👨‍💼","👩‍💼","🧑‍🏫","👨‍🔬","👩‍🔬","👨‍💻","👩‍💻","🎓","📚","⭐"].map(e => (
                  <button key={e} onClick={() => setNewT(p => ({ ...p, em: e }))} style={{ width: 32, height: 32, borderRadius: 7, border: `2px solid ${newT.em===e?"var(--accent)":"rgba(255,255,255,.08)"}`, background: newT.em===e?"rgba(79,172,254,.1)":"rgba(255,255,255,.03)", cursor: "pointer", fontSize: 16 }}>{e}</button>
                ))}
              </div>
            </div>
            <Inp label="HỌ VÀ TÊN GIÁO VIÊN" value={newT.name} onChange={v => setNewT(p => ({ ...p, name: v }))} placeholder="Thầy/Cô Nguyễn Văn A" required />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Inp label="TÊN ĐĂNG NHẬP" value={newT.username} onChange={v => setNewT(p => ({ ...p, username: v }))} placeholder="Username" required />
              <Inp label="MẬT KHẨU" value={newT.password} onChange={v => setNewT(p => ({ ...p, password: v }))} type="password" placeholder={editT ? "Để trống nếu không đổi" : "Tối thiểu 4 ký tự"} required={!editT} />
            </div>

            <Sel label="TRƯỜNG HỌC" value={newT.school || ""} onChange={v => setNewT(p => ({ ...p, school: v }))} options={[{ v: "", l: "-- Chọn trường học --" }, ...(state.schools || []).map(s => ({ v: s.name, l: s.name }))] } />
            
            <Sel label="MÔN HỌC PHỤ TRÁCH" value={newT.subject} onChange={v => setNewT(p => ({ ...p, subject: v }))} options={SUBJECTS} required />
            
            <Sel label="LỚP CHỦ NHIỆM" value={newT.homeroomClassId || ""} onChange={v => setNewT(p => ({ ...p, homeroomClassId: v }))} options={[{ v: "", l: "-- Không làm chủ nhiệm --" }, ...state.classes.map(c => ({ v: c.id, l: c.name + " (" + (c.school || "") + ")" }))] } />

            {/* Lớp giảng dạy */}
            <div style={{ marginTop: 10, textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5 }}>LỚP GIẢNG DẠY PHỤ TRÁCH</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 120, overflowY: "auto", padding: 8, background: "var(--wa04)", border: "1px solid var(--border2)", borderRadius: 8 }}>
                {state.classes.filter(c => !newT.school || c.school === newT.school).map(c => {
                  const checked = selectedClasses.includes(c.id);
                  return (
                    <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text)", cursor: "pointer", width: "45%" }}>
                      <input type="checkbox" checked={checked} onChange={() => {
                        setSelectedClasses(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]);
                      }} />
                      {c.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <Inp label="GMAIL" value={newT.email} onChange={v => setNewT(p => ({ ...p, email: v, emailVerified: false }))} placeholder="ten@gmail.com" note="Dùng để xác minh danh tính và nhận thông báo tài khoản" />
            <ErrBox msg={errT} />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowAddT(false)} style={{ flex: 1, padding: "8px 16px", background: "none", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, cursor: "pointer" }}>Hủy</button>
              <button onClick={saveTeacher} style={{ flex: 1, padding: "8px 16px", background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{editT ? "Lưu thay đổi" : "Tạo tài khoản"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: THÊM / SỬA LỚP HỌC ────────────────────── */}
      {showAddClass && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAddClass(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="modal" style={{ width: 340, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{editClass ? "Đổi tên lớp" : "Thêm lớp mới"}</h2>
              <button onClick={() => setShowAddClass(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>
            </div>
            <Inp label="TÊN LỚP" value={newClsName} onChange={setNewClsName} placeholder="12A1, 10B3..." required />
            
            <Sel label="TRƯỜNG HỌC" value={newClsSchool} onChange={setNewClsSchool} options={[{ v: "", l: "-- Chọn trường học --" }, ...(state.schools || []).map(s => ({ v: s.name, l: s.name }))] } />
            
            <Sel label="KHỐI LỚP" value={newClsGrade} onChange={setNewClsGrade} options={["10", "11", "12"].map(g => ({ v: g, l: "Khối " + g }))} />

            <Sel label="GIÁO VIÊN CHỦ NHIỆM" value={newClsTeacherId} onChange={setNewClsTeacherId} options={[{ v: "", l: "-- Chưa phân công --" }, ...teachers.filter(t => !newClsSchool || t.school === newClsSchool).map(t => ({ v: t.id, l: t.name }))] } />

            <ErrBox msg={errCls} />
            <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
              <button onClick={() => setShowAddClass(false)} style={{ flex: 1, padding: "8px 16px", background: "none", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, cursor: "pointer" }}>Hủy</button>
              <button onClick={saveClass} style={{ flex: 2, padding: "8px 16px", background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{editClass ? "Lưu thay đổi" : "Tạo lớp"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
