import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Home, BookOpen, MessageSquare, QrCode, Grid, Shuffle,Library, User, Search, Send, Menu,CheckCircle, Clock, Plus, Upload, Download,FileText, Hash, Paperclip,RefreshCw, Trophy,GraduationCap, LogOut, X, Edit2, Trash2, Save,UserPlus, Settings, Eye, EyeOff,AlertTriangle, Check, GripVertical,Users, School, Key,Shield, Phone, Calendar, ChevronLeft, ChevronRight,BarChart2, Bell, UserCheck, UserX, LayoutGrid
} from "lucide-react";


// css toàn cục 
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;margin:0;padding:0} html{scroll-behavior:smooth}

.ecp{font-family:'Outfit',-apple-system,sans-serif;background:#050C1A;color:#E2EAF4;min-height:100vh;overflow-x:hidden} 
.hfont{font-family:'DM Serif Display',serif} 
.gtext{background:linear-gradient(135deg,#4FACFE 0%,#00F2FE 50%,#43E97B 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;background-size:200%;animation:gshift 6s ease infinite}

@keyframes gshift{0%,100%{background-position:0%}50%{background-position:100%}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scanline{0%{top:-4px}100%{top:100%}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}60%{transform:translateX(6px)}}
@keyframes pop{0%{transform:scale(.9);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
@keyframes glowbeat{0%,100%{box-shadow:0 0 20px rgba(79,172,254,.18)}50%{box-shadow:0 0 40px rgba(79,172,254,.45)}}
@keyframes spin360{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes pulse-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.55);opacity:0}}

.page{animation:fadeUp .32s ease forwards;min-height:calc(100vh - 60px)}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(12px);z-index:300;display:flex;align-items:center;justify-content:center;animation:fadeIn .18s ease}
.modal{background:#0A1628;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;min-width:320px;max-width:95vw;max-height:92vh;overflow-y:auto;animation:pop .22s ease;box-shadow:0 40px 80px rgba(0,0,0,.6)}
.modal-flex{background:#0A1628;border:1px solid rgba(255,255,255,.1);border-radius:20px;min-width:320px;max-width:95vw;max-height:90vh;overflow:hidden;animation:pop .22s ease;box-shadow:0 40px 80px rgba(0,0,0,.6);display:flex;flex-direction:column}

.inp{width:100%;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#E2EAF4;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s}
.inp:focus{border-color:rgba(79,172,254,.55);box-shadow:0 0 0 3px rgba(79,172,254,.1)}
.inp::placeholder{color:#2E4A6A}
.inp:disabled{opacity:.5;cursor:not-allowed}

select.inp{cursor:pointer}

.nbtn{transition:all .2s;cursor:pointer;border-radius:10px;border:none;background:transparent}
.nbtn:hover{background:rgba(79,172,254,.07)!important;color:#4FACFE!important}
.nbtn.act{background:rgba(79,172,254,.12)!important;color:#4FACFE!important}

.glass{background:rgba(255,255,255,.028);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}

.cglow{transition:all .24s ease}
.cglow:hover{border-color:rgba(79,172,254,.25)!important;box-shadow:0 8px 32px rgba(0,0,0,.5)!important;transform:translateY(-1px)}

.bprimary{background:linear-gradient(135deg,#1D6CF5,#7B3FE4);transition:all .22s;cursor:pointer;border:none;color:#fff;font-family:inherit;font-weight:600}
.bprimary:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 8px 24px rgba(29,108,245,.4)}
.bprimary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}

.scard{background:#0A1628;border:1px solid rgba(255,255,255,.07);border-radius:14px;transition:all .22s}
.scard:hover{border-color:rgba(79,172,254,.15)}

.shake{animation:shake .3s ease}

.tag{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:.04em;text-transform:uppercase}

.drag-over{background:rgba(79,172,254,.1)!important;border-color:rgba(79,172,254,.55)!important}

.seat-cell{transition:all .2s ease;position:relative}
.seat-cell.occupied:hover{transform:scale(1.07);z-index:5}

.sidebar-ind{position:absolute;right:0;top:50%;transform:translateY(-50%);width:3px;height:18px;background:linear-gradient(180deg,#4FACFE,#00F2FE);border-radius:2px 0 0 2px}

::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}

.tooltip{position:absolute;bottom:calc(100%+8px);left:50%;transform:translateX(-50%);background:#0D1E38;border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:9px 13px;font-size:10px;white-space:nowrap;pointer-events:none;z-index:200;animation:fadeUp .15s ease;box-shadow:0 10px 24px rgba(0,0,0,.55)}

.row-hover:hover{background:rgba(255,255,255,.02)!important}

.cal-day{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;cursor:pointer;transition:all .18s;border:1px solid transparent}
.cal-day:hover{background:rgba(79,172,254,.1);border-color:rgba(79,172,254,.28)}
.cal-day.present{background:rgba(52,211,153,.15);border-color:rgba(52,211,153,.45);color:#34D399}
.cal-day.absent{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.28);color:#EF4444}
.cal-day.today-mark{box-shadow:0 0 0 2px #4FACFE}
.cal-day.no-session{opacity:.28;cursor:default}
.notification-dot{position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:#EF4444;border:2px solid #050C1A;animation:glowbeat 2s infinite}`;

// Logo E-Class P2K 
const LOGO_SM = "data:image/png;base64,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"; // 72×72 — dùng ở sidebar
const LOGO_LG = "data:image/png;base64,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"; // 120×120 — dùng ở login + loading




// lưu trữ dữ liệu


const DB_KEY = "eclassp2k_v2";

async function loadFromStorage(def) {
  try {
    const r = await window.storage.get(DB_KEY);
    if (r && r.value) return JSON.parse(r.value);
  } catch {}
  return def;
}

async function saveToStorage(data) {
  try {
    await window.storage.set(DB_KEY, JSON.stringify(data));
  } catch {}
}


// tài khoản demo

const SEED_TEACHERS = [
  { id: "t1", name: "Nguyễn Minh Tuấn", username: "admin", password: "admin123", subject: "Quản trị", em: "👨‍💼", isAdmin: true },
];

const EMOJIS = ["😊","🌸","⚡","🦋","🎮","🌺","🔥","🌙","🚀","💫","🌊","🦚","🎯","🌻","🎸","📚","🏆","🌈","🦁","🐯","🦊","🐬","🌟","🎪","🍀","🎭","🦄","🐲","🌴","🎨"];
const SUBJECTS = ["Toán","Vật Lý","Hóa học","Ngữ Văn","Lịch Sử","Địa Lý","Tiếng Anh","Sinh học","GDCD","Tin học","Thể dục","Âm nhạc","Mỹ thuật"];
const SCOLS = { "Toán":"#4FACFE","Vật Lý":"#22D3EE","Hóa học":"#34D399","Ngữ Văn":"#A78BFA","Lịch Sử":"#F59E0B","Địa Lý":"#FB923C","Tiếng Anh":"#F472B6","Sinh học":"#4ADE80","GDCD":"#818CF8","Tin học":"#60A5FA","Thể dục":"#FACC15","Âm nhạc":"#E879F9","Mỹ thuật":"#FCA5A5" };
const FILE_TYPES = ["pdf","docx","pptx","xlsx","mp4","mp3","jpg","png","zip","txt","other"];
const FILE_ICONS = { pdf:"📄",docx:"📝",pptx:"📊",xlsx:"📈",mp4:"🎬",mp3:"🎵",jpg:"🖼️",png:"🖼️",zip:"📦",txt:"📃",other:"📁" };
const FILE_COLORS = { pdf:"#EF4444",docx:"#3B82F6",pptx:"#F59E0B",xlsx:"#10B981",mp4:"#8B5CF6",mp3:"#EC4899",jpg:"#06B6D4",png:"#06B6D4",zip:"#F97316",txt:"#94A3B8",other:"#64748B" };

const SEAT_ROWS = 8;
const SEAT_COLS = 4;
const TO_ROWS = 4;
const TO_COLS = 4;
const TOTAL_SEATS = 64;

const globalSlotIdx = (side, row, col) => side * SEAT_ROWS * SEAT_COLS + row * SEAT_COLS + col;
const toGroupOffset = (groupIdx) => {
  const side = groupIdx < 2 ? 0 : 1;
  const startRow = (groupIdx % 2) * TO_ROWS;
  return { side, startRow };
};
const groupSlots = (groupIdx) => {
  const { side, startRow } = toGroupOffset(groupIdx);
  const slots = [];
  for (let r = 0; r < TO_ROWS; r++)
    for (let c = 0; c < TO_COLS; c++)
      slots.push(globalSlotIdx(side, startRow + r, c));
  return slots;
};

const TO_COLORS = ["#4FACFE","#34D399","#F59E0B","#A78BFA"];
const TO_NAMES = ["Tổ 1","Tổ 2","Tổ 3","Tổ 4"];


// hộp xác nhận


function ConfirmModal({ msg, onOk, onCancel }) {
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal" style={{ width: 340, textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 38, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#E2EAF4", marginBottom: 8 }}>{msg}</div>
        <div style={{ fontSize: 12, color: "#4A6580", marginBottom: 22 }}>Hành động này không thể hoàn tác.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#94A3B8", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Hủy</button>
          <button onClick={onOk} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#EF4444,#DC2626)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Xác nhận xóa</button>
        </div>
      </div>
    </div>
  );
}

// Hàm Hook dùng để kích hoạt/điều khiển hộp thoại xác nhận
function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = useCallback((msg) => new Promise(resolve => {
    setState({ msg, resolve });
  }), []);
  const handleOk = () => { state?.resolve(true); setState(null); };
  const handleCancel = () => { state?.resolve(false); setState(null); };
  const ConfirmUI = state ? <ConfirmModal msg={state.msg} onOk={handleOk} onCancel={handleCancel} /> : null;
  return { confirm, ConfirmUI };
}


// state trung tâm


const DEFAULT_STATE = {
  teachers: SEED_TEACHERS,
  classes: [],
  students: [],
  seats: {},
  messages: {},
  assignments: {},
  attendance: {},
  files: {},
  pendingStudents: [],
  session: null,
};

function useAppState() {
  const [data, setData] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadFromStorage(DEFAULT_STATE).then(saved => {
      setData(saved);
      setLoaded(true);
    });
  }, []);

  const update = useCallback((key, val) => {
    setData(prev => {
      const next = { ...prev, [key]: typeof val === "function" ? val(prev[key]) : val };
      saveToStorage(next);
      return next;
    });
  }, []);

  return {
    loaded,
    teachers:    data.teachers,    setTeachers:    v => update("teachers", v),
    classes:     data.classes,     setClasses:     v => update("classes", v),
    students:    data.students,    setStudents:    v => update("students", v),
    seats:       data.seats,       setSeats:       v => update("seats", v),
    messages:    data.messages,    setMessages:    v => update("messages", v),
    assignments: data.assignments, setAssignments: v => update("assignments", v),
    attendance:  data.attendance,  setAttendance:  v => update("attendance", v),
    files:       data.files,       setFiles:       v => update("files", v),
    pendingStudents: data.pendingStudents, setPendingStudents: v => update("pendingStudents", v),
    session:     data.session,     setSession:     v => update("session", v),
  };
}


// component nhỏ

const Badge = ({ children, c = "blue" }) => {
  const m = { blue:"rgba(79,172,254,.13):#4FACFE", green:"rgba(52,211,153,.13):#34D399", amber:"rgba(245,158,11,.13):#F59E0B", red:"rgba(239,68,68,.13):#EF4444", violet:"rgba(167,139,250,.13):#A78BFA", gray:"rgba(100,116,139,.13):#94A3B8" };
  const [bg, col] = (m[c] || m.blue).split(":");
  return <span className="tag" style={{ background: bg, color: col }}>{children}</span>;
};

const Av = ({ em, photo, sz = 34, glow }) => (
  <div style={{ width: sz, height: sz, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.44, flexShrink: 0, boxShadow: glow ? "0 0 16px rgba(79,172,254,.55)" : "none", transition: "box-shadow .3s", border: glow ? "2px solid rgba(79,172,254,.4)" : "2px solid transparent" }}>
    {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (em || "👤")}
  </div>
);

const Bar = ({ val, max = 100, col = "#4FACFE", h = 4 }) => (
  <div style={{ background: "rgba(255,255,255,.07)", borderRadius: 99, height: h, overflow: "hidden" }}>
    <div style={{ height: "100%", borderRadius: 99, background: col, width: `${Math.min((val / (max || 1)) * 100, 100)}%`, transition: "width 1.1s ease", boxShadow: `0 0 7px ${col}55` }} />
  </div>
);

const Card = ({ children, style = {} }) => (
  <div className="scard cglow" style={{ padding: 20, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, style = {}, variant = "primary", disabled, small }) => {
  const base = { padding: small ? "6px 13px" : "9px 20px", borderRadius: 10, fontSize: small ? 11 : 13, fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5, cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s", border: "none", ...style };
  if (variant === "primary") return <button onClick={onClick} disabled={disabled} className="bprimary" style={base}>{children}</button>;
  if (variant === "ghost")   return <button onClick={onClick} disabled={disabled} style={{ ...base, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#94A3B8" }}>{children}</button>;
  if (variant === "danger")  return <button onClick={onClick} disabled={disabled} style={{ ...base, border: "1px solid rgba(239,68,68,.28)", background: "rgba(239,68,68,.08)", color: "#EF4444" }}>{children}</button>;
  if (variant === "success") return <button onClick={onClick} disabled={disabled} style={{ ...base, border: "1px solid rgba(52,211,153,.28)", background: "rgba(52,211,153,.08)", color: "#34D399" }}>{children}</button>;
  return null;
};

const Inp = ({ label, value, onChange, placeholder, type = "text", note, required }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 5, letterSpacing: ".05em", display: "flex", gap: 4 }}>{label}{required && <span style={{ color: "#EF4444" }}>*</span>}</div>}
    <input className="inp" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ display: "block" }} />
    {note && <div style={{ fontSize: 10, color: "#374D65", marginTop: 4 }}>{note}</div>}
  </div>
);

const Sel = ({ label, value, onChange, options, required }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 5, letterSpacing: ".05em", display: "flex", gap: 4 }}>{label}{required && <span style={{ color: "#EF4444" }}>*</span>}</div>}
    <select className="inp" value={value} onChange={e => onChange(e.target.value)} style={{ display: "block", width: "100%" }}>
      {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

const ErrBox = ({ msg }) => msg ? (
  <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 12, padding: "9px 13px", borderRadius: 9, background: "rgba(239,68,68,.09)", border: "1px solid rgba(239,68,68,.22)", display: "flex", alignItems: "center", gap: 6 }}>
    <AlertTriangle size={12} />{msg}
  </div>
) : null;


// đăng nhập hs

function StudentRegisterPage({ state, onBack }) {
  const [name, setName] = useState("");
  const [classId, setClassId] = useState(state.classes[0]?.id || "");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [em, setEm] = useState("😊");
  const [photo, setPhoto] = useState(null);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef();

  const handlePhoto = file => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setErr("Ảnh quá lớn (tối đa 3MB)"); return; }
    setUploading(true);
    const r = new FileReader();
    r.onload = () => { setPhoto(r.result); setUploading(false); };
    r.readAsDataURL(file);
  };

  const submit = () => {
    setErr("");
    if (!name.trim()) { setErr("Nhập họ và tên"); return; }
    if (!classId) { setErr("Chọn lớp học"); return; }
    const dup = state.pendingStudents.find(p => p.name.toLowerCase() === name.trim().toLowerCase() && p.classId === classId);
    if (dup) { setErr("Bạn đã đăng ký rồi, đang chờ duyệt"); return; }
    state.setPendingStudents(prev => [...prev, {
      id: "pend_" + Date.now() + Math.random(),
      name: name.trim(), classId, phone, dob,
      em, photo, submittedAt: Date.now(),
    }]);
    setSuccess(true);
  };

  if (success) return (
    <div style={{ textAlign: "center", padding: "40px 20px", animation: "pop .4s ease" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#34D399", marginBottom: 8 }}>Đăng ký thành công!</div>
      <div style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>Giáo viên sẽ xem xét và duyệt hồ sơ của bạn sớm nhất.</div>
      <Btn onClick={onBack} variant="ghost">← Quay lại đăng nhập</Btn>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><ChevronLeft size={16} />Quay lại</button>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#E2EAF4" }}>Đăng ký tài khoản học sinh</h2>
      </div>
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <div onClick={() => photoRef.current?.click()} style={{ width: 70, height: 70, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 8px", border: "2px dashed rgba(79,172,254,.35)", cursor: "pointer" }}>
          {photo ? <img src={photo} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : (uploading ? "⏳" : em)}
        </div>
        <div style={{ fontSize: 10, color: "#3D5269" }}>Nhấn để thêm ảnh</div>
        <input ref={photoRef} type="file" accept="image/*" onChange={e => handlePhoto(e.target.files[0])} style={{ display: "none" }} />
      </div>
      <Inp label="HỌ VÀ TÊN" value={name} onChange={setName} placeholder="Nguyễn Văn An" required />
      <Sel label="LỚP ĐĂNG KÝ" value={classId} onChange={setClassId} options={[{ v: "", l: "-- Chọn lớp --" }, ...state.classes.map(c => ({ v: c.id, l: c.name }))]} required />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Inp label="NGÀY SINH" value={dob} onChange={setDob} type="date" />
        <Inp label="SỐ ĐIỆN THOẠI" value={phone} onChange={setPhone} placeholder="0912..." />
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 7, letterSpacing: ".05em" }}>AVATAR</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {EMOJIS.slice(0, 20).map(e => (
            <button key={e} onClick={() => setEm(e)} style={{ width: 30, height: 30, borderRadius: 7, border: `2px solid ${em === e ? "#4FACFE" : "rgba(255,255,255,.08)"}`, background: em === e ? "rgba(79,172,254,.12)" : "rgba(255,255,255,.03)", cursor: "pointer", fontSize: 15 }}>{e}</button>
          ))}
        </div>
      </div>
      <ErrBox msg={err} />
      <Btn onClick={submit} style={{ width: "100%", justifyContent: "center" }} disabled={!name.trim() || !classId}>Gửi đăng ký →</Btn>
      <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 9, background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.18)", fontSize: 11, color: "#F59E0B", display: "flex", alignItems: "flex-start", gap: 7 }}>
        <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        Sau khi đăng ký, giáo viên sẽ duyệt và cấp mã học sinh cho bạn. Bạn sẽ dùng mã đó để đăng nhập.
      </div>
    </div>
  );
}


// trang đăng nhập gv

function LoginPage({ state, onLogin }) {
  const [role, setRole] = useState("teacher");
  const [uname, setUname] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const [shaking, setShaking] = useState(false);
  const [sClass, setSClass] = useState("");
  const [sCode, setSCode] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const shake = () => { setShaking(true); setTimeout(() => setShaking(false), 400); };

  const doLogin = () => {
    setErr("");
    if (role === "teacher") {
      const t = state.teachers.find(t => t.username === uname.trim() && t.password === pass);
      if (!t) { setErr("Sai tên đăng nhập hoặc mật khẩu"); shake(); return; }
      onLogin({ role: "teacher", data: t });
    } else {
      const cls = state.classes.find(c => c.id === sClass);
      if (!cls) { setErr("Không tìm thấy lớp này"); shake(); return; }
      const st = state.students.find(s => s.classId === cls.id && s.code.toUpperCase() === sCode.trim().toUpperCase());
      if (!st) { setErr("Mã học sinh không đúng hoặc không thuộc lớp này"); shake(); return; }
      onLogin({ role: "student", data: st, classId: cls.id });
    }
  };

  if (showRegister) return (
    <div className="ecp" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,108,245,.14),transparent 70%)", top: -150, left: -100, filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,.022) 1px,transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 440, padding: "0 20px" }}>
        <div style={{ background: "#0A1628", border: "1px solid rgba(255,255,255,.09)", borderRadius: 22, padding: 28, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
          <StudentRegisterPage state={state} onBack={() => setShowRegister(false)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="ecp" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,108,245,.13),transparent 70%)", top: -200, left: -200, filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle,rgba(123,63,228,.1),transparent 70%)", bottom: -150, right: -100, filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,.022) 1px,transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420, padding: "0 20px", animation: "fadeUp .4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>

          <div style={{ marginBottom: 16, animation: "float 4s ease-in-out infinite", display: "inline-block" }}>
            <img src={LOGO_LG} alt="E-Class P2K" style={{ width: 96, height: 96, borderRadius: 22, boxShadow: "0 12px 36px rgba(29,108,245,.45)", display: "block" }} />
          </div>
          <h1 className="hfont" style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-.01em", color: "#E2EAF4" }}>
            E-Class <span style={{ color: "#4FACFE" }}>P2K</span>
          </h1>
          <p style={{ fontSize: 12, color: "#2E4A6A", marginTop: 5 }}>Nền tảng quản lý lớp học thông minh</p>
        </div>
        <div style={{ background: "#0A1628", border: "1px solid rgba(255,255,255,.09)", borderRadius: 22, padding: 28, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
          <div style={{ display: "flex", borderRadius: 12, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", overflow: "hidden", marginBottom: 24 }}>
            {[["teacher","👨‍🏫","Giáo viên"],["student","👨‍🎓","Học sinh"]].map(([r, ic, label]) => (
              <button key={r} onClick={() => { setRole(r); setErr(""); }} style={{ flex: 1, padding: "10px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: role === r ? "rgba(79,172,254,.15)" : "transparent", color: role === r ? "#4FACFE" : "#2E4A6A", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>{ic}</span>{label}
              </button>
            ))}
          </div>
          <div className={shaking ? "shake" : ""}>
            {role === "teacher" ? (
              <>
                <Inp label="TÊN ĐĂNG NHẬP" value={uname} onChange={setUname} placeholder="Nhập username" required />
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 5, letterSpacing: ".05em" }}>MẬT KHẨU <span style={{ color: "#EF4444" }}>*</span></div>
                  <div style={{ position: "relative" }}>
                    <input className="inp" type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()} placeholder="Nhập mật khẩu" style={{ display: "block", paddingRight: 42 }} />
                    <button onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#2E4A6A" }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 5, letterSpacing: ".05em" }}>LỚP HỌC <span style={{ color: "#EF4444" }}>*</span></div>
                  <select className="inp" value={sClass} onChange={e => setSClass(e.target.value)} style={{ display: "block", width: "100%" }}>
                    <option value="">-- Chọn lớp --</option>
                    {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Inp label="MÃ HỌC SINH" value={sCode} onChange={setSCode} placeholder="Ví dụ: HS001" required note="Mã được giáo viên cấp sau khi duyệt đăng ký" />
              </>
            )}
            <ErrBox msg={err} />
            <Btn onClick={doLogin} style={{ width: "100%", marginTop: 4, justifyContent: "center" }} disabled={role === "teacher" ? (!uname || !pass) : (!sClass || !sCode)}>
              {role === "teacher" ? "Đăng nhập →" : "Vào lớp học →"}
            </Btn>
          </div>
          {role === "student" && (
            <button onClick={() => setShowRegister(true)} style={{ width: "100%", marginTop: 12, padding: "9px", borderRadius: 10, border: "1px dashed rgba(79,172,254,.3)", background: "transparent", color: "#4FACFE", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <UserPlus size={13} />Đăng ký tài khoản mới
            </button>
          )}
          <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", fontSize: 11, color: "#2E4A6A", lineHeight: 1.9 }}>
            <div style={{ fontWeight: 700, color: "#3D5A78", marginBottom: 4 }}>Demo:</div>
            <div>👔 Admin: <span style={{ color: "#7FA8C8" }}>admin / admin123</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}


// nav

const NAV_TEACHER = [
  { id: "dashboard",   Ic: Home,          l: "Tổng quan" },
  { id: "students",    Ic: Users,         l: "Học sinh" },
  { id: "seating",     Ic: Grid,          l: "Sơ đồ lớp" },
  { id: "attendance",  Ic: QrCode,        l: "Điểm danh" },
  { id: "chat",        Ic: MessageSquare, l: "Chat lớp" },
  { id: "assignments", Ic: BookOpen,      l: "Bài tập" },
  { id: "wheel",       Ic: Shuffle,       l: "Lucky Wheel" },
  { id: "library",     Ic: Library,       l: "Tài liệu" },
  { id: "pending",     Ic: UserCheck,     l: "Duyệt HS" },
  { id: "settings",    Ic: Settings,      l: "Cài đặt" },
];
const NAV_STUDENT = [
  { id: "dashboard",   Ic: Home,          l: "Tổng quan" },
  { id: "seating",     Ic: Grid,          l: "Sơ đồ lớp" },
  { id: "attendance",  Ic: QrCode,        l: "Điểm danh" },
  { id: "chat",        Ic: MessageSquare, l: "Chat lớp" },
  { id: "assignments", Ic: BookOpen,      l: "Bài tập" },
  { id: "wheel",       Ic: Shuffle,       l: "Lucky Wheel" },
  { id: "library",     Ic: Library,       l: "Tài liệu" },
  { id: "profile",     Ic: User,          l: "Hồ sơ" },
];

function Sidebar({ view, setView, col, user, pendingCount }) {
  const nav = user.role === "teacher" ? NAV_TEACHER : NAV_STUDENT;
  return (
    <div style={{ width: col ? 58 : 224, height: "100vh", background: "#060D1E", borderRight: "1px solid rgba(255,255,255,.055)", display: "flex", flexDirection: "column", transition: "width .3s cubic-bezier(.4,0,.2,1)", position: "fixed", left: 0, top: 0, zIndex: 50, overflow: "hidden" }}>
      <div style={{ height: 60, display: "flex", alignItems: "center", padding: col ? "0 11px" : "0 16px", borderBottom: "1px solid rgba(255,255,255,.045)", gap: 11, flexShrink: 0 }}>
        <img src={LOGO_SM} alt="E-Class P2K" style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, boxShadow: "0 4px 16px rgba(29,108,245,.4)", display: "block", objectFit: "cover" }} />
        {!col && <span className="hfont" style={{ fontSize: 15, fontWeight: 400, whiteSpace: "nowrap", color: "#E2EAF4" }}>E-Class <span style={{ color: "#4FACFE" }}>P2K</span></span>}
      </div>
      {!col && (
        <div style={{ padding: "8px 10px 2px" }}>
          <div style={{ padding: "5px 10px", borderRadius: 9, background: user.role === "teacher" ? "rgba(167,139,250,.1)" : "rgba(79,172,254,.08)", border: `1px solid ${user.role === "teacher" ? "rgba(167,139,250,.22)" : "rgba(79,172,254,.18)"}`, display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: user.role === "teacher" ? "#A78BFA" : "#4FACFE" }}>
            {user.role === "teacher" ? <GraduationCap size={11} /> : <Trophy size={11} />}
            {user.role === "teacher" ? "Giáo Viên" : "Học Sinh"}
          </div>
        </div>
      )}
      <div style={{ flex: 1, padding: col ? "6px 0" : "2px 8px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
        {nav.map(({ id, Ic, l }) => (
          <div key={id} className={`nbtn ${view === id ? "act" : ""}`} onClick={() => setView(id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: col ? "10px 0" : "7px 10px", justifyContent: col ? "center" : "flex-start", position: "relative", color: view === id ? "#4FACFE" : "#3D5A78" }}>
            <div style={{ position: "relative" }}>
              <Ic size={15} strokeWidth={view === id ? 2.5 : 1.8} />
              {id === "pending" && pendingCount > 0 && <div className="notification-dot" />}
            </div>
            {!col && <span style={{ fontSize: 12, fontWeight: view === id ? 600 : 400, whiteSpace: "nowrap" }}>{l}</span>}
            {!col && id === "pending" && pendingCount > 0 && <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 99, background: "rgba(239,68,68,.18)", color: "#EF4444" }}>{pendingCount}</span>}
            {view === id && !col && <div className="sidebar-ind" />}
          </div>
        ))}
      </div>
      <div style={{ padding: col ? "11px 0" : "10px 12px", borderTop: "1px solid rgba(255,255,255,.045)", display: "flex", alignItems: "center", gap: 8, justifyContent: col ? "center" : "flex-start" }}>
        <Av em={user.data.em || "👤"} photo={user.data.photo} sz={30} />
        {!col && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#E2EAF4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 134 }}>{user.data.name}</div>
            <div style={{ fontSize: 10, color: "#2E4A6A" }}>{user.role === "teacher" ? user.data.subject || "Giáo viên" : user.data.code}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function TopBar({ view, toggleSide, user, onLogout, classInfo }) {
  const LBL = { dashboard:"Tổng quan", students:"Quản lý học sinh", seating:"Sơ đồ lớp", attendance:"Điểm danh QR", chat:"Chat lớp", assignments:"Bài tập", wheel:"Lucky Wheel", library:"Thư viện tài liệu", settings:"Cài đặt", profile:"Hồ sơ", pending:"Duyệt học sinh" };
  return (
    <div style={{ height: 60, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, background: "rgba(6,13,30,.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.05)", position: "sticky", top: 0, zIndex: 40 }}>
      <button onClick={toggleSide} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,.05)", color: "#3D5A78", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Menu size={14} /></button>
      <h1 className="hfont" style={{ fontSize: 15, fontWeight: 400, color: "#E2EAF4" }}>{LBL[view] || view}</h1>
      {classInfo && <Badge c="blue">{classInfo.name}</Badge>}
      <div style={{ flex: 1 }} />
      <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
        <LogOut size={11} />Đăng xuất
      </button>
    </div>
  );
}


// duyệt hs

function PendingPage({ state, user }) {
  const myClassIds = useMemo(() => state.classes.filter(c => c.teacherId === user.data.id).map(c => c.id), [state.classes, user.data.id]);
  const pending = useMemo(() => state.pendingStudents.filter(p => myClassIds.includes(p.classId)), [state.pendingStudents, myClassIds]);
  const [codeMap, setCodeMap] = useState({});
  const [err, setErr] = useState({});
  const { confirm, ConfirmUI } = useConfirm();

  const approve = (pend) => {
    const code = (codeMap[pend.id] || "").trim().toUpperCase();
    if (!code) { setErr(e => ({ ...e, [pend.id]: "Nhập mã học sinh" })); return; }
    const dup = state.students.find(s => s.classId === pend.classId && s.code.toUpperCase() === code);
    if (dup) { setErr(e => ({ ...e, [pend.id]: "Mã đã tồn tại" })); return; }
    state.setStudents(prev => [...prev, {
      id: "st_" + Date.now() + Math.random(),
      classId: pend.classId,
      name: pend.name,
      code,
      em: pend.em || "😊",
      photo: pend.photo || null,
      phone: pend.phone || "",
      dob: pend.dob || "",
      score: 0,
      createdAt: Date.now(),
    }]);
    state.setPendingStudents(prev => prev.filter(p => p.id !== pend.id));
    setErr(e => { const n = { ...e }; delete n[pend.id]; return n; });
  };

  const reject = async (id) => {
    const ok = await confirm("Từ chối đăng ký này?");
    if (!ok) return;
    state.setPendingStudents(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="page" style={{ padding: 20 }}>
      {ConfirmUI}
      <div className="scard" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <UserCheck size={16} style={{ color: "#4FACFE" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#E2EAF4" }}>Đăng ký đang chờ duyệt</span>
          {pending.length > 0 && <Badge c="red">{pending.length} mới</Badge>}
        </div>
        {pending.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#3D5A78" }}>
            <UserCheck size={36} style={{ margin: "0 auto 14px", opacity: .25 }} />
            <div style={{ fontSize: 13 }}>Không có đăng ký nào đang chờ</div>
          </div>
        ) : pending.map(p => {
          const cls = state.classes.find(c => c.id === p.classId);
          return (
            <div key={p.id} style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <Av em={p.em} photo={p.photo} sz={44} />
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#3D5A78", marginTop: 2 }}>Lớp: <span style={{ color: "#4FACFE" }}>{cls?.name}</span> · {p.phone && `📞 ${p.phone}`}</div>
                <div style={{ fontSize: 10, color: "#2E4A6A", marginTop: 1 }}>Đăng ký: {new Date(p.submittedAt).toLocaleDateString("vi-VN")}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <input className="inp" placeholder="Cấp mã HS (VD: HS001)" value={codeMap[p.id] || ""} onChange={e => { setCodeMap(m => ({ ...m, [p.id]: e.target.value })); setErr(e2 => { const n = { ...e2 }; delete n[p.id]; return n; }); }} style={{ width: 170, fontSize: 12 }} />
                  {err[p.id] && <div style={{ fontSize: 10, color: "#EF4444", marginTop: 3 }}>{err[p.id]}</div>}
                </div>
                <Btn onClick={() => approve(p)} small variant="success"><UserCheck size={12} />Duyệt</Btn>
                <Btn onClick={() => reject(p.id)} small variant="danger"><UserX size={12} />Từ chối</Btn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// quản lý hs

function StudentsPage({ state, user }) {
  const myClasses = useMemo(() => state.classes.filter(c => c.teacherId === user.data.id), [state.classes, user.data.id]);
  const [selClass, setSelClass] = useState(() => myClasses[0]?.id || "");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showEditClass, setShowEditClass] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [newSt, setNewSt] = useState({ name: "", code: "", em: "😊", photo: null, phone: "", dob: "" });
  const [newClassName, setNewClassName] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [errSt, setErrSt] = useState("");
  const [errCls, setErrCls] = useState("");
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkErr, setBulkErr] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoRef = useRef();
  const { confirm, ConfirmUI } = useConfirm();

  const cls = useMemo(() => state.classes.find(c => c.id === selClass), [state.classes, selClass]);
  const classStudents = useMemo(() => state.students.filter(s => s.classId === selClass), [state.students, selClass]);
  const filtered = useMemo(() => classStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  ), [classStudents, search]);

  const handlePhotoUpload = (file) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setErrSt("Ảnh quá lớn (tối đa 3MB)"); return; }
    setPhotoUploading(true);
    const r = new FileReader();
    r.onload = () => { setNewSt(p => ({ ...p, photo: r.result })); setPhotoUploading(false); };
    r.readAsDataURL(file);
  };

  const openAdd = () => {
    setNewSt({ name: "", code: "", em: EMOJIS[Math.floor(Math.random() * EMOJIS.length)], photo: null, phone: "", dob: "" });
    setErrSt(""); setEditStudent(null); setShowAddModal(true);
  };

  const saveStudent = () => {
    if (!newSt.name.trim()) { setErrSt("Vui lòng nhập tên học sinh"); return; }
    if (!newSt.code.trim()) { setErrSt("Vui lòng nhập mã học sinh"); return; }
    const dup = state.students.find(s => s.code.toUpperCase() === newSt.code.trim().toUpperCase() && s.classId === selClass && s.id !== editStudent?.id);
    if (dup) { setErrSt("Mã học sinh đã tồn tại trong lớp này"); return; }
    const payload = { name: newSt.name.trim(), code: newSt.code.trim().toUpperCase(), em: newSt.em, photo: newSt.photo || null, phone: newSt.phone || "", dob: newSt.dob || "" };
    if (editStudent) {
      state.setStudents(p => p.map(s => s.id === editStudent.id ? { ...s, ...payload } : s));
    } else {
      state.setStudents(p => [...p, { id: "st_" + Date.now() + Math.random(), classId: selClass, ...payload, score: 0, createdAt: Date.now() }]);
    }
    setShowAddModal(false); setEditStudent(null);
  };

  const deleteStudent = async id => {
    const ok = await confirm("Xóa học sinh này?");
    if (!ok) return;
    state.setStudents(p => p.filter(s => s.id !== id));
  };

  const addClass = () => {
    if (!newClassName.trim()) { setErrCls("Nhập tên lớp"); return; }
    if (state.classes.find(c => c.name === newClassName.trim())) { setErrCls("Tên lớp đã tồn tại"); return; }
    const id = "cls_" + Date.now();
    state.setClasses(p => [...p, { id, name: newClassName.trim(), teacherId: user.data.id, createdAt: Date.now() }]);
    setSelClass(id); setNewClassName(""); setShowAddClass(false); setErrCls("");
  };

  const saveClassName = () => {
    if (!editClassName.trim()) return;
    const dup = state.classes.find(c => c.name === editClassName.trim() && c.id !== selClass);
    if (dup) { setErrCls("Tên lớp đã tồn tại"); return; }
    state.setClasses(p => p.map(c => c.id === selClass ? { ...c, name: editClassName.trim() } : c));
    setShowEditClass(false); setErrCls("");
  };

  const deleteClass = async cid => {
    const ok = await confirm("Xóa lớp này và toàn bộ học sinh trong lớp?");
    if (!ok) return;
    state.setClasses(p => p.filter(c => c.id !== cid));
    state.setStudents(p => p.filter(s => s.classId !== cid));
    const remaining = myClasses.find(c => c.id !== cid);
    setSelClass(remaining?.id || "");
  };

  const doBulk = () => {
    setBulkErr("");
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) { setBulkErr("Không có dữ liệu"); return; }
    const adds = [], errs = [];
    lines.forEach((line, i) => {
      const parts = line.split(",").map(p => p.trim());
      const name = parts[0];
      const code = parts[1] ? parts[1].toUpperCase() : `HS${String(classStudents.length + adds.length + 1).padStart(3, "0")}`;
      if (!name) { errs.push(`Dòng ${i + 1}: thiếu tên`); return; }
      const dup = state.students.find(s => s.code.toUpperCase() === code && s.classId === selClass) || adds.find(a => a.code === code);
      if (dup) { errs.push(`Dòng ${i + 1}: mã ${code} đã tồn tại`); return; }
      adds.push({ id: "st_" + Date.now() + i + Math.random(), classId: selClass, name, code, em: EMOJIS[Math.floor(Math.random() * EMOJIS.length)], photo: null, phone: "", dob: "", score: 0, createdAt: Date.now() });
    });
    if (errs.length) { setBulkErr(errs.join(" | ")); return; }
    state.setStudents(p => [...p, ...adds]);
    setBulkText(""); setBulkMode(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const attKey = `${selClass}_${today}`;

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {ConfirmUI}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {myClasses.map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", borderRadius: 10, overflow: "hidden", border: `1px solid ${selClass === c.id ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`, background: selClass === c.id ? "rgba(79,172,254,.1)" : "rgba(255,255,255,.03)", transition: "all .2s" }}>
            <button onClick={() => setSelClass(c.id)} style={{ padding: "6px 14px", border: "none", cursor: "pointer", background: "transparent", color: selClass === c.id ? "#4FACFE" : "#4A6580", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>{c.name}</button>
            {selClass === c.id && <button onClick={() => { setEditClassName(c.name); setShowEditClass(true); setErrCls(""); }} style={{ padding: "6px", border: "none", cursor: "pointer", background: "rgba(79,172,254,.08)", color: "#4FACFE", display: "flex" }}><Edit2 size={11} /></button>}
            <button onClick={() => deleteClass(c.id)} style={{ padding: "6px 7px", border: "none", cursor: "pointer", background: "rgba(239,68,68,.06)", color: "#EF4444", display: "flex" }}><X size={11} /></button>
          </div>
        ))}
        <button onClick={() => { setShowAddClass(true); setErrCls(""); setNewClassName(""); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 10, border: "1px dashed rgba(79,172,254,.32)", background: "transparent", color: "#4FACFE", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          <Plus size={13} />Thêm lớp
        </button>
      </div>

      {selClass ? (
        <div className="scard" style={{ overflow: "hidden" }}>
          <div style={{ padding: "13px 17px", borderBottom: "1px solid rgba(255,255,255,.055)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4" }}>Lớp {cls?.name}</div>
            <span style={{ fontSize: 11, color: "#3D5A78" }}>{classStudents.length} học sinh</span>
            <div style={{ flex: 1, maxWidth: 220, display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 9, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)" }}>
              <Search size={12} style={{ color: "#3D5A78", flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm học sinh..." style={{ background: "none", border: "none", outline: "none", color: "#E2EAF4", fontSize: 11, fontFamily: "inherit", width: "100%" }} />
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Btn onClick={() => setBulkMode(p => !p)} variant="ghost" small>{bulkMode ? "Đóng" : "Nhập hàng loạt"}</Btn>
              <Btn onClick={openAdd} small><UserPlus size={12} />Thêm học sinh</Btn>
            </div>
          </div>
          {bulkMode && (
            <div style={{ padding: "14px 17px", borderBottom: "1px solid rgba(255,255,255,.055)", background: "rgba(79,172,254,.03)" }}>
              <div style={{ fontSize: 11, color: "#4A6580", marginBottom: 7 }}>Mỗi dòng: <code style={{ color: "#4FACFE" }}>Tên học sinh, MãHS</code></div>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"Nguyễn Văn An, HS001\nTrần Thị Bình, HS002"} rows={5} style={{ width: "100%", padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", color: "#E2EAF4", fontSize: 12, fontFamily: "monospace", outline: "none", resize: "vertical" }} />
              <ErrBox msg={bulkErr} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Btn onClick={() => setBulkMode(false)} variant="ghost" small>Hủy</Btn>
                <Btn onClick={doBulk} small>Nhập danh sách</Btn>
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#3D5A78" }}>
              <Users size={36} style={{ margin: "0 auto 12px", opacity: .22 }} />
              <div style={{ fontSize: 13, marginBottom: 14 }}>{search ? "Không tìm thấy học sinh" : "Chưa có học sinh."}</div>
              {!search && <Btn onClick={openAdd}><UserPlus size={13} />Thêm học sinh đầu tiên</Btn>}
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "28px 44px 1fr 100px 100px 88px", gap: 10, padding: "8px 17px", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: 10, fontWeight: 700, color: "#2E4A6A", letterSpacing: ".06em" }}>
                <span>STT</span><span></span><span>HỌ VÀ TÊN</span><span>MÃ HS</span><span>TRẠNG THÁI</span><span style={{ textAlign: "right" }}>THAO TÁC</span>
              </div>
              {filtered.map((s, i) => {
                const present = (state.attendance[attKey] || []).includes(s.id);
                return (
                  <div key={s.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: "28px 44px 1fr 100px 100px 88px", gap: 10, padding: "10px 17px", borderBottom: "1px solid rgba(255,255,255,.025)", alignItems: "center", cursor: "pointer" }} onClick={() => setViewStudent(s)}>
                    <div style={{ fontSize: 11, color: "#2E4A6A", fontWeight: 600, textAlign: "center" }}>{i + 1}</div>
                    <Av em={s.em} photo={s.photo} sz={36} glow={present} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#E2EAF4" }}>{s.name}</div>
                      {s.phone && <div style={{ fontSize: 10, color: "#2E4A6A", marginTop: 1 }}>{s.phone}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: "#4A6580", fontFamily: "monospace" }}>{s.code}</div>
                    <div>{present ? <Badge c="green">✓ Có mặt</Badge> : <Badge c="gray">Chưa ĐD</Badge>}</div>
                    <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditStudent(s); setNewSt({ name: s.name, code: s.code, em: s.em, photo: s.photo || null, phone: s.phone || "", dob: s.dob || "" }); setErrSt(""); setShowAddModal(true); }} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(79,172,254,.22)", background: "rgba(79,172,254,.06)", color: "#4FACFE", cursor: "pointer", display: "flex" }}><Edit2 size={12} /></button>
                      <button onClick={() => deleteStudent(s.id)} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex" }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: 48, textAlign: "center", color: "#3D5A78" }}>
          <School size={36} style={{ margin: "0 auto 12px", opacity: .22 }} />
          <div style={{ fontSize: 13, marginBottom: 16 }}>Chưa có lớp nào. Hãy tạo lớp học đầu tiên!</div>
          <Btn onClick={() => { setShowAddClass(true); setErrCls(""); setNewClassName(""); }}><Plus size={13} />Tạo lớp học</Btn>
        </div>
      )}

      {(showAddClass || showEditClass) && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) { setShowAddClass(false); setShowEditClass(false); } }}>
          <div className="modal" style={{ width: 340 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#E2EAF4" }}>{showEditClass ? "Đổi tên lớp" : "Thêm lớp mới"}</h2>
              <button onClick={() => { setShowAddClass(false); setShowEditClass(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D5A78" }}><X size={18} /></button>
            </div>
            <Inp label="TÊN LỚP" value={showEditClass ? editClassName : newClassName} onChange={showEditClass ? setEditClassName : setNewClassName} placeholder="12A1, 10B3..." required />
            <ErrBox msg={errCls} />
            <div style={{ display: "flex", gap: 9 }}>
              <Btn variant="ghost" onClick={() => { setShowAddClass(false); setShowEditClass(false); }} style={{ flex: 1 }}>Hủy</Btn>
              <Btn onClick={showEditClass ? saveClassName : addClass} style={{ flex: 2 }}>{showEditClass ? "Lưu tên" : "Tạo lớp"}</Btn>
            </div>
          </div>
        </div>
      )}

      {viewStudent && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setViewStudent(null)}>
          <div className="modal" style={{ width: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#E2EAF4" }}>Hồ sơ học sinh</h2>
              <button onClick={() => setViewStudent(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D5A78" }}><X size={18} /></button>
            </div>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ width: 82, height: 82, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, border: "3px solid rgba(79,172,254,.35)", boxShadow: "0 0 28px rgba(79,172,254,.22)", margin: "0 auto" }}>
                {viewStudent.photo ? <img src={viewStudent.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : viewStudent.em}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#E2EAF4", marginTop: 12 }}>{viewStudent.name}</div>
              <div style={{ fontSize: 11, color: "#3D5A78", marginTop: 3 }}>Mã: <span style={{ color: "#4FACFE", fontWeight: 700 }}>{viewStudent.code}</span></div>
            </div>
            <div style={{ borderRadius: 11, overflow: "hidden", border: "1px solid rgba(255,255,255,.07)", marginBottom: 18 }}>
              {[
                [<Users size={13}/>, "Lớp học", cls?.name || "--"],
                [<Key size={13}/>, "Mã học sinh", viewStudent.code],
                [<Calendar size={13}/>, "Ngày sinh", viewStudent.dob ? new Date(viewStudent.dob + "T00:00:00").toLocaleDateString("vi-VN") : "--"],
                [<Phone size={13}/>, "Số điện thoại", viewStudent.phone || "--"]
              ].map(([icon, label, value], i, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: i % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                  <div style={{ color: "#2E4A6A", flexShrink: 0 }}>{icon}</div>
                  <div style={{ fontSize: 11, color: "#4A6580", width: 110, flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#E2EAF4", fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={() => setViewStudent(null)} style={{ flex: 1 }}>Đóng</Btn>
              <Btn onClick={() => { setEditStudent(viewStudent); setNewSt({ name: viewStudent.name, code: viewStudent.code, em: viewStudent.em, photo: viewStudent.photo || null, phone: viewStudent.phone || "", dob: viewStudent.dob || "" }); setErrSt(""); setShowAddModal(true); setViewStudent(null); }} style={{ flex: 1 }}><Edit2 size={12} />Chỉnh sửa</Btn>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal" style={{ width: 430 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#E2EAF4" }}>{editStudent ? "Sửa thông tin học sinh" : "Thêm học sinh mới"}</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D5A78" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 8, letterSpacing: ".05em" }}>ẢNH HỌC SINH</div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div onClick={() => photoRef.current?.click()} style={{ width: 66, height: 66, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, border: "2px dashed rgba(79,172,254,.35)", flexShrink: 0, cursor: "pointer" }}>
                  {newSt.photo ? <img src={newSt.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (photoUploading ? "⏳" : newSt.em)}
                </div>
                <div>
                  <button onClick={() => photoRef.current?.click()} style={{ padding: "6px 13px", borderRadius: 8, border: "1px solid rgba(79,172,254,.32)", background: "rgba(79,172,254,.07)", color: "#4FACFE", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                    <Upload size={11} />{photoUploading ? "Đang tải..." : "Chọn ảnh"}
                  </button>
                  {newSt.photo && <button onClick={() => setNewSt(p => ({ ...p, photo: null }))} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>Xóa ảnh</button>}
                  <div style={{ fontSize: 10, color: "#2E4A6A", marginTop: 5 }}>JPG, PNG · Tối đa 3MB</div>
                </div>
              </div>
              <input ref={photoRef} type="file" accept="image/*" onChange={e => handlePhotoUpload(e.target.files[0])} style={{ display: "none" }} />
            </div>
            <Inp label="HỌ VÀ TÊN" value={newSt.name} onChange={v => setNewSt(p => ({ ...p, name: v }))} placeholder="Nguyễn Văn An" required />
            <Inp label="MÃ HỌC SINH" value={newSt.code} onChange={v => setNewSt(p => ({ ...p, code: v }))} placeholder="HS001" required note="Dùng để học sinh đăng nhập" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Inp label="NGÀY SINH" value={newSt.dob} onChange={v => setNewSt(p => ({ ...p, dob: v }))} type="date" />
              <Inp label="SỐ ĐIỆN THOẠI" value={newSt.phone} onChange={v => setNewSt(p => ({ ...p, phone: v }))} placeholder="0912345678" />
            </div>
            {!newSt.photo && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 8, letterSpacing: ".05em" }}>EMOJI AVATAR</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {EMOJIS.map(em => (
                    <button key={em} onClick={() => setNewSt(p => ({ ...p, em }))} style={{ width: 32, height: 32, borderRadius: 7, border: `2px solid ${newSt.em === em ? "#4FACFE" : "rgba(255,255,255,.08)"}`, background: newSt.em === em ? "rgba(79,172,254,.12)" : "rgba(255,255,255,.03)", cursor: "pointer", fontSize: 16 }}>{em}</button>
                  ))}
                </div>
              </div>
            )}
            <ErrBox msg={errSt} />
            <div style={{ display: "flex", gap: 9 }}>
              <Btn variant="ghost" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>Hủy</Btn>
              <Btn onClick={saveStudent} style={{ flex: 2 }}>{editStudent ? "Lưu thay đổi" : "Thêm học sinh"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// sơ đồ lớp

function SeatingPage({ state, user }) {
  const myClasses = useMemo(() => user.role === "teacher"
    ? state.classes.filter(c => c.teacherId === user.data.id)
    : state.classes.filter(c => c.id === user.classId), [state.classes, user]);

  const [selClass, setSelClass] = useState(() => myClasses[0]?.id || "");
  const [seatTab, setSeatTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [hovSlot, setHovSlot] = useState(null);

  const seatKey = selClass;
  const classStudents = useMemo(() => state.students.filter(s => s.classId === selClass), [state.students, selClass]);
  const validIds = useMemo(() => new Set(classStudents.map(s => s.id)), [classStudents]);

  useEffect(() => {
    if (!selClass || classStudents.length === 0) return;
    const current = state.seats[seatKey] || {};
    const hasGhosts = Object.values(current).some(id => !validIds.has(id));
    if (!Object.keys(current).length) {
      const init = {};
      classStudents.forEach((s, i) => { if (i < TOTAL_SEATS) init[i] = s.id; });
      state.setSeats(p => ({ ...p, [seatKey]: init }));
    } else if (hasGhosts) {
      const cleaned = {};
      Object.entries(current).forEach(([slot, id]) => { if (validIds.has(id)) cleaned[slot] = id; });
      state.setSeats(p => ({ ...p, [seatKey]: cleaned }));
    }
  }, [selClass, classStudents.length]);

  const seats = state.seats[seatKey] || {};
  const assignedIds = useMemo(() => new Set(Object.values(seats).filter(id => validIds.has(id))), [seats, validIds]);
  const unassigned = useMemo(() => classStudents.filter(s => !assignedIds.has(s.id)), [classStudents, assignedIds]);
  const getStudentAt = useCallback((idx) => classStudents.find(s => s.id === seats[idx]) || null, [classStudents, seats]);
  const getSlotOf = useCallback((sid) => { const e = Object.entries(seats).find(([, v]) => v === sid); return e ? Number(e[0]) : -1; }, [seats]);

  const today = new Date().toISOString().slice(0, 10);
  const attKey = `${selClass}_${today}`;

  const handleDragStart = useCallback((sid) => setDragId(sid), []);
  const handleDragEnd = useCallback(() => { setDragId(null); setHovSlot(null); }, []);

  const handleDrop = useCallback((targetSlot) => {
    if (!editMode || dragId === null) return;
    const targetOccupant = seats[targetSlot];
    const sourceSlot = getSlotOf(dragId);
    state.setSeats(prev => {
      const next = { ...(prev[seatKey] || {}) };
      next[targetSlot] = dragId;
      if (sourceSlot >= 0) {
        if (targetOccupant !== undefined && targetOccupant !== dragId) {
          next[sourceSlot] = targetOccupant;
        } else {
          delete next[sourceSlot];
        }
      }
      return { ...prev, [seatKey]: next };
    });
    setDragId(null); setHovSlot(null);
  }, [editMode, dragId, seats, seatKey, state, getSlotOf]);

  const clearSlot = useCallback((slot) => {
    state.setSeats(prev => {
      const next = { ...(prev[seatKey] || {}) };
      delete next[slot];
      return { ...prev, [seatKey]: next };
    });
  }, [seatKey, state]);

  const autoPlace = () => {
    state.setSeats(prev => {
      const next = { ...(prev[seatKey] || {}) };
      Object.keys(next).forEach(k => { if (!validIds.has(next[k])) delete next[k]; });
      const placed = new Set(Object.values(next));
      const toPlace = classStudents.filter(s => !placed.has(s.id));
      let slot = 0;
      toPlace.forEach(s => {
        while (slot < TOTAL_SEATS && next[slot] !== undefined) slot++;
        if (slot < TOTAL_SEATS) { next[slot] = s.id; slot++; }
      });
      return { ...prev, [seatKey]: next };
    });
  };

  const resetSeats = () => {
    const init = {};
    classStudents.forEach((s, i) => { if (i < TOTAL_SEATS) init[i] = s.id; });
    state.setSeats(p => ({ ...p, [seatKey]: init }));
  };

  const SeatCell = ({ slotI, compact = false }) => {
    const st = getStudentAt(slotI);
    const isHov = hovSlot === slotI && editMode;
    const isDragging = st && dragId === st.id;
    const present = st && (state.attendance[attKey] || []).includes(st.id);
    const isDropTarget = isHov && dragId !== null;
    const sz = compact ? 58 : 64;
    const h = compact ? 64 : 70;
    return (
      <div
        className={`seat-cell${st ? " occupied" : ""}`}
        draggable={editMode && !!st}
        onDragStart={e => { if (!editMode || !st) return; e.dataTransfer.effectAllowed = "move"; handleDragStart(st.id); }}
        onDragEnd={handleDragEnd}
        onDragOver={e => { if (!editMode) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; setHovSlot(slotI); }}
        onDragLeave={e => { if (e.currentTarget.contains(e.relatedTarget)) return; setHovSlot(null); }}
        onDrop={e => { e.preventDefault(); handleDrop(slotI); }}
        onContextMenu={e => { if (editMode && st) { e.preventDefault(); clearSlot(slotI); } }}
        onMouseEnter={() => !editMode && st && setHovSlot(slotI)}
        onMouseLeave={() => setHovSlot(null)}
        style={{ width: sz, height: h, borderRadius: 10, background: isDropTarget ? "rgba(79,172,254,.14)" : st ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.015)", border: `1px solid ${isDropTarget ? "rgba(79,172,254,.6)" : st ? (present ? "rgba(52,211,153,.35)" : "rgba(255,255,255,.1)") : "rgba(255,255,255,.045)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, position: "relative", opacity: isDragging ? 0.35 : 1, cursor: editMode ? (st ? "grab" : "default") : "default", transition: "all .2s", flexShrink: 0, boxShadow: isDropTarget ? "0 0 14px rgba(79,172,254,.25)" : "none" }}
      >
        {st ? (
          <>
            <div style={{ width: compact ? 26 : 30, height: compact ? 26 : 30, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: compact ? 15 : 17, flexShrink: 0 }}>
              {st.photo ? <img src={st.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : st.em}
            </div>
            <div style={{ fontSize: 8, color: "#94A3B8", textAlign: "center", padding: "0 3px", lineHeight: 1.2, maxWidth: sz - 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {st.name.split(" ").pop()}
            </div>
            <div style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: present ? "#34D399" : "#EF4444", boxShadow: present ? "0 0 6px rgba(52,211,153,.7)" : "none" }} />
            {hovSlot === slotI && !editMode && (
              <div className="tooltip" style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: "#E2EAF4", marginBottom: 3 }}>{st.name}</div>
                <div style={{ color: "#4A6580" }}>{st.code}</div>
                <div style={{ color: present ? "#34D399" : "#EF4444", marginTop: 3 }}>{present ? "✓ Có mặt" : "✗ Vắng"}</div>
              </div>
            )}
            {editMode && <GripVertical size={8} style={{ position: "absolute", top: 3, left: 3, color: "#3D5A78", opacity: .5 }} />}
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,.03)", border: "1px dashed rgba(255,255,255,.08)" }} />
            {isDropTarget && <div style={{ fontSize: 8, color: "#4FACFE", fontWeight: 700 }}>Thả vào</div>}
          </div>
        )}
      </div>
    );
  };

  const getGroupStats = useCallback((groupIdx) => {
    const slots = groupSlots(groupIdx);
    const gStudents = slots.map(s => getStudentAt(s)).filter(Boolean);
    const presentCount = gStudents.filter(s => (state.attendance[attKey] || []).includes(s.id)).length;
    return { total: gStudents.length, present: presentCount };
  }, [getStudentAt, state.attendance, attKey]);

  const OverviewView = () => (
    <div style={{ overflowX: "auto", padding: "20px 24px 24px" }}>
      <div style={{ padding: "8px 16px", borderRadius: 9, textAlign: "center", background: "rgba(79,172,254,.04)", border: "1px solid rgba(79,172,254,.14)", fontSize: 11, color: "#4FACFE", letterSpacing: ".08em", fontWeight: 700, marginBottom: 24, maxWidth: 680, margin: "0 auto 24px" }}>
        📋 BẢNG ĐEN · BAN GIÁO VIÊN
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {[0,1,2,3].map(gi => {
          const st = getGroupStats(gi);
          return (
            <div key={gi} onClick={() => setSeatTab(`to${gi+1}`)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 8, background: `${TO_COLORS[gi]}12`, border: `1px solid ${TO_COLORS[gi]}35`, cursor: "pointer", transition: "all .2s" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: TO_COLORS[gi] }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: TO_COLORS[gi] }}>{TO_NAMES[gi]}</span>
              <span style={{ fontSize: 10, color: "#3D5A78" }}>{st.present}/{st.total}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 0 }}>
        {[0, 1].map(side => (
          <div key={side} style={{ display: "flex", alignItems: "stretch" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ height: 16, display: "flex", gap: 5, marginBottom: 2 }}>
                {side === 0 && <div style={{ width: 20 }} />}
                {Array.from({ length: SEAT_COLS }, (_, col) => (
                  <div key={col} style={{ width: 64, textAlign: "center", fontSize: 9, color: "#2E4A6A", fontWeight: 700 }}>
                    {side === 0 ? `A${col + 1}` : `B${col + 1}`}
                  </div>
                ))}
                {side === 1 && <div style={{ width: 20 }} />}
              </div>
              {Array.from({ length: SEAT_ROWS }, (_, row) => {
                const groupIdx = side * 2 + (row < 4 ? 0 : 1);
                const isGroupBorder = row === 4;
                return (
                  <div key={row}>
                    {isGroupBorder && (
                      <div style={{ height: 8, display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                        {side === 0 && <div style={{ width: 20 }} />}
                        <div style={{ flex: 1, borderTop: `1px dashed ${TO_COLORS[side * 2 + 1]}44`, marginTop: 3 }} />
                        {side === 1 && <div style={{ width: 20 }} />}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      {side === 0 && <div style={{ width: 20, fontSize: 9, color: TO_COLORS[groupIdx], fontWeight: 700, textAlign: "right", flexShrink: 0, opacity: .8 }}>{row + 1}</div>}
                      {Array.from({ length: SEAT_COLS }, (_, col) => (
                        <SeatCell key={col} slotI={globalSlotIdx(side, row, col)} />
                      ))}
                      {side === 1 && <div style={{ width: 20, fontSize: 9, color: TO_COLORS[groupIdx], fontWeight: 700, flexShrink: 0, opacity: .8 }}>{row + 1}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            {side === 0 && (
              <div style={{ width: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "18px 0" }}>
                <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,.06)" }} />
                <div style={{ fontSize: 8, color: "#2E4A6A", fontWeight: 700, letterSpacing: ".1em", writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", padding: "8px 0" }}>LỐI ĐI</div>
                <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,.06)" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const ToView = ({ groupIdx }) => {
    const color = TO_COLORS[groupIdx];
    const slots = groupSlots(groupIdx);
    const { side, startRow } = toGroupOffset(groupIdx);
    const sideLabel = side === 0 ? "A" : "B";
    const stats = getGroupStats(groupIdx);
    const groupStudents = slots.map(s => getStudentAt(s)).filter(Boolean);
    const absentStudents = groupStudents.filter(s => !(state.attendance[attKey] || []).includes(s.id));
    const emptySlots = slots.filter(s => !getStudentAt(s)).length;

    return (
      <div style={{ padding: "20px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "14px 18px", borderRadius: 12, background: `${color}08`, border: `1px solid ${color}28` }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            {["🅰","🅱","©","🅳"][groupIdx]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#E2EAF4", marginBottom: 3 }}>{TO_NAMES[groupIdx]}</div>
            <div style={{ fontSize: 11, color: "#3D5A78" }}>Dãy {sideLabel} · Hàng {startRow + 1}–{startRow + TO_ROWS}</div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {[["Sĩ số",groupStudents.length,color],["Có mặt",stats.present,"#34D399"],["Vắng",groupStudents.length-stats.present,"#EF4444"],["Trống",emptySlots,"#4A6580"]].map(([l,v,c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div className="hfont" style={{ fontSize: 18, fontWeight: 400, color: c }}>{v}</div>
                <div style={{ fontSize: 10, color: "#2E4A6A" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div>
            <div style={{ padding: "6px 12px", borderRadius: 8, textAlign: "center", background: `${color}06`, border: `1px solid ${color}22`, fontSize: 10, color: color, fontWeight: 700, marginBottom: 16 }}>
              📋 BÀN GIÁO VIÊN · {TO_NAMES[groupIdx]}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 4, paddingLeft: 22 }}>
              {Array.from({ length: TO_COLS }, (_, c) => (
                <div key={c} style={{ width: 72, textAlign: "center", fontSize: 10, color: color, fontWeight: 700, opacity: .7 }}>{sideLabel}{c+1}</div>
              ))}
            </div>
            {Array.from({ length: TO_ROWS }, (_, localRow) => {
              const globalRow = startRow + localRow;
              return (
                <div key={localRow} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <div style={{ width: 20, fontSize: 10, color: color, fontWeight: 700, textAlign: "right", flexShrink: 0, opacity: .8 }}>{globalRow + 1}</div>
                  {Array.from({ length: TO_COLS }, (_, col) => {
                    const slotI = globalSlotIdx(side, globalRow, col);
                    const st = getStudentAt(slotI);
                    const present = st && (state.attendance[attKey] || []).includes(st.id);
                    const isHov2 = hovSlot === slotI && editMode;
                    const isDragging2 = st && dragId === st.id;
                    const isDropTarget2 = isHov2 && dragId !== null;
                    return (
                      <div key={col} className={`seat-cell${st ? " occupied" : ""}`}
                        draggable={editMode && !!st}
                        onDragStart={e => { if (!editMode || !st) return; e.dataTransfer.effectAllowed = "move"; handleDragStart(st.id); }}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => { if (!editMode) return; e.preventDefault(); setHovSlot(slotI); }}
                        onDragLeave={e => { if (e.currentTarget.contains(e.relatedTarget)) return; setHovSlot(null); }}
                        onDrop={e => { e.preventDefault(); handleDrop(slotI); }}
                        onContextMenu={e => { if (editMode && st) { e.preventDefault(); clearSlot(slotI); } }}
                        onMouseEnter={() => !editMode && st && setHovSlot(slotI)}
                        onMouseLeave={() => setHovSlot(null)}
                        style={{ width: 72, height: 80, borderRadius: 11, background: isDropTarget2 ? `${color}18` : st ? `${color}07` : "rgba(255,255,255,.015)", border: `1.5px solid ${isDropTarget2 ? color : st ? (present ? "#34D399" : `${color}35`) : "rgba(255,255,255,.055)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, position: "relative", opacity: isDragging2 ? 0.3 : 1, cursor: editMode ? (st ? "grab" : "default") : "default", transition: "all .2s", flexShrink: 0, boxShadow: st && !isDropTarget2 ? `0 2px 12px ${color}14` : isDropTarget2 ? `0 0 16px ${color}35` : "none" }}
                      >
                        {st ? (
                          <>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0, border: `2px solid ${present ? "#34D399" : `${color}45`}` }}>
                              {st.photo ? <img src={st.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : st.em}
                            </div>
                            <div style={{ fontSize: 9, color: "#CBD5E1", textAlign: "center", padding: "0 4px", lineHeight: 1.3, maxWidth: 66, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{st.name.split(" ").pop()}</div>
                            <div style={{ fontSize: 8, color: "#3D5A78", fontFamily: "monospace" }}>{st.code}</div>
                            <div style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", background: present ? "#34D399" : "#EF4444", boxShadow: present ? "0 0 7px rgba(52,211,153,.7)" : "none" }} />
                            {hovSlot === slotI && !editMode && (
                              <div className="tooltip">
                                <div style={{ fontWeight: 700, color: "#E2EAF4", marginBottom: 2 }}>{st.name}</div>
                                <div style={{ color: "#4A6580", fontSize: 9 }}>{st.code}</div>
                                <div style={{ color: present ? "#34D399" : "#EF4444", marginTop: 3 }}>{present ? "✓ Có mặt" : "✗ Vắng"}</div>
                              </div>
                            )}
                            {editMode && <GripVertical size={9} style={{ position: "absolute", top: 3, left: 3, color: `${color}88` }} />}
                          </>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${color}08`, border: `1px dashed ${color}25` }} />
                            {isDropTarget2 && <div style={{ fontSize: 8, color, fontWeight: 700 }}>Thả vào</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {absentStudents.length > 0 && (
          <div style={{ padding: "12px 14px", borderRadius: 11, background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.2)", marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", marginBottom: 8 }}>⚠ Vắng mặt hôm nay ({absentStudents.length})</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {absentStudents.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 8, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", fontSize: 11, color: "#EF4444" }}>
                  <Av em={s.em} photo={s.photo} sz={18} />
                  <span>{s.name.split(" ").pop()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SEAT_TABS = [
    { id: "overview", label: "🏫 Tổng thể", color: "#4FACFE" },
    { id: "to1", label: "Tổ 1", color: TO_COLORS[0] },
    { id: "to2", label: "Tổ 2", color: TO_COLORS[1] },
    { id: "to3", label: "Tổ 3", color: TO_COLORS[2] },
    { id: "to4", label: "Tổ 4", color: TO_COLORS[3] },
  ];

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {myClasses.map(c => (
          <button key={c.id} onClick={() => setSelClass(c.id)} style={{ padding: "6px 14px", borderRadius: 9, border: `1px solid ${selClass === c.id ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`, background: selClass === c.id ? "rgba(79,172,254,.1)" : "transparent", color: selClass === c.id ? "#4FACFE" : "#4A6580", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{c.name}</button>
        ))}
        {user.role === "teacher" && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setEditMode(p => !p)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${editMode ? "rgba(167,139,250,.45)" : "rgba(255,255,255,.08)"}`, background: editMode ? "rgba(167,139,250,.1)" : "transparent", color: editMode ? "#A78BFA" : "#4A6580", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              <GripVertical size={12} />{editMode ? "✓ Xong" : "Kéo thả"}
            </button>
            <button onClick={resetSeats} style={{ padding: "5px 11px", borderRadius: 8, border: "1px solid rgba(255,255,255,.08)", background: "transparent", color: "#4A6580", fontSize: 11, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}><RefreshCw size={11} />Reset</button>
          </div>
        )}
      </div>

      {editMode && (
        <div style={{ padding: "9px 14px", borderRadius: 9, background: "rgba(167,139,250,.06)", border: "1px solid rgba(167,139,250,.22)", fontSize: 11, color: "#A78BFA", display: "flex", alignItems: "center", gap: 7 }}>
          <GripVertical size={12} />Kéo thả để đổi chỗ · Chuột phải để bỏ chỗ
        </div>
      )}

      <div className="scard" style={{ overflow: "hidden" }}>
        <div style={{ padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,.055)", display: "flex", alignItems: "center", gap: 2, overflowX: "auto" }}>
          {SEAT_TABS.map(({ id, label, color }) => (
            <button key={id} onClick={() => setSeatTab(id)} style={{ padding: "12px 16px", border: "none", cursor: "pointer", background: "transparent", color: seatTab === id ? color : "#3D5A78", fontSize: 12, fontWeight: seatTab === id ? 700 : 500, fontFamily: "inherit", whiteSpace: "nowrap", borderBottom: `2px solid ${seatTab === id ? color : "transparent"}`, marginBottom: -1, transition: "all .2s" }}>
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#3D5A78", paddingRight: 4 }}>
            {[["#34D399","Có mặt"],["#EF4444","Vắng"]].map(([c, l]) => (
              <span key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />{l}
              </span>
            ))}
            <span style={{ color: "#4A6580" }}>{classStudents.length} HS</span>
          </div>
        </div>

        {seatTab === "overview" && <OverviewView />}
        {seatTab === "to1" && <ToView groupIdx={0} />}
        {seatTab === "to2" && <ToView groupIdx={1} />}
        {seatTab === "to3" && <ToView groupIdx={2} />}
        {seatTab === "to4" && <ToView groupIdx={3} />}

        {unassigned.length > 0 && (
          <div style={{ margin: "0 18px 18px", padding: "14px 16px", borderRadius: 11, background: "rgba(245,158,11,.04)", border: "1px solid rgba(245,158,11,.22)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>⚠ {unassigned.length} học sinh chưa có chỗ ngồi</div>
              {user.role === "teacher" && (
                <div style={{ display: "flex", gap: 7 }}>
                  {!editMode && <button onClick={() => setEditMode(true)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(167,139,250,.32)", background: "rgba(167,139,250,.07)", color: "#A78BFA", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Bật kéo thả</button>}
                  <button onClick={autoPlace} style={{ padding: "4px 12px", borderRadius: 7, border: "1px solid rgba(245,158,11,.38)", background: "rgba(245,158,11,.08)", color: "#F59E0B", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Xếp tự động</button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {unassigned.map(s => (
                <div key={s.id} draggable={editMode} onDragStart={e => { if (!editMode) return; e.dataTransfer.effectAllowed = "move"; handleDragStart(s.id); }} onDragEnd={handleDragEnd}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 9, background: "rgba(255,255,255,.045)", border: `1px solid ${editMode ? "rgba(245,158,11,.32)" : "rgba(255,255,255,.1)"}`, cursor: editMode ? "grab" : "default", fontSize: 11, color: "#94A3B8" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : s.em}
                  </div>
                  <span>{s.name.split(" ").pop()}</span>
                  <span style={{ fontSize: 9, color: "#3D5A78" }}>{s.code}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: "10px 18px", borderTop: "1px solid rgba(255,255,255,.04)", fontSize: 11, color: "#2E4A6A", textAlign: "center" }}>
          {editMode ? "Kéo thả để hoán đổi · Chuột phải để bỏ chỗ" : "Di chuột để xem chi tiết · Tab Tổ để quản lý từng nhóm"}
        </div>
      </div>
    </div>
  );
}


// attendance

const QRSvg = ({ sz = 176 }) => {
  const N = 21, cs = sz / N, cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const tl = r < 7 && c < 7, tr = r < 7 && c >= N - 7, bl = r >= N - 7 && c < 7;
    const seed = ((r * 31 + c * 17) * 7919) % 100;
    if (tl || tr || bl || (r === 7 || c === 7 ? seed < 50 : seed < 44)) cells.push({ r, c });
  }
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
      <rect width={sz} height={sz} fill="#FFF" rx="10" />
      {cells.map(({ r, c }, i) => <rect key={i} x={c * cs + .5} y={r * cs + .5} width={cs - 1} height={cs - 1} fill="#0D1E38" rx={.8} />)}
    </svg>
  );
};

function AttCalendar({ classId, studentId, attendance, onSelectDate, selectedDate }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = today.toISOString().slice(0, 10);
  const sessionDates = useMemo(() => new Set(Object.keys(attendance).filter(k => k.startsWith(classId + "_")).map(k => k.replace(classId + "_", "")).filter(d => { const dt = new Date(d); return dt.getMonth() === month && dt.getFullYear() === year; })), [attendance, classId, month, year]);
  const presentDates = useMemo(() => new Set(Object.entries(attendance).filter(([k, v]) => k.startsWith(classId + "_") && (!studentId || v.includes(studentId))).map(([k]) => k.replace(classId + "_", "")).filter(d => { const dt = new Date(d); return dt.getMonth() === month && dt.getFullYear() === year; })), [attendance, classId, studentId, month, year]);
  const monthNames = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const dayNames = ["CN","T2","T3","T4","T5","T6","T7"];
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.04)", color: "#4A6580", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={13} /></button>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#E2EAF4" }}>{monthNames[month]} {year}</span>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.04)", color: "#4A6580", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={13} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,32px)", gap: 3, justifyContent: "center" }}>
        {dayNames.map(d => <div key={d} style={{ width: 32, textAlign: "center", fontSize: 9, fontWeight: 700, color: "#2E4A6A", paddingBottom: 4 }}>{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const hasSession = sessionDates.has(dateStr);
          const isPresent = presentDates.has(dateStr);
          const isSelected = dateStr === selectedDate;
          const isAbsent = hasSession && !isPresent && studentId;
          return (
            <div key={i} className={`cal-day ${isPresent ? "present" : ""} ${isAbsent ? "absent" : ""} ${!hasSession ? "no-session" : ""} ${isToday ? "today-mark" : ""}`}
              onClick={() => hasSession && onSelectDate(dateStr)} style={{ outline: isSelected ? "2px solid #4FACFE" : "none", outlineOffset: 1 }}>
              {day}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "center", fontSize: 10, color: "#3D5A78" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(52,211,153,.3)", border: "1px solid rgba(52,211,153,.55)" }} />Có mặt</span>
        {studentId && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(239,68,68,.22)", border: "1px solid rgba(239,68,68,.38)" }} />Vắng</span>}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(79,172,254,.18)", border: "2px solid #4FACFE" }} />Hôm nay</span>
      </div>
    </div>
  );
}

function AttPage({ state, user }) {
  const today = new Date().toISOString().slice(0, 10);
  const myClasses = useMemo(() => user.role === "teacher" ? state.classes.filter(c => c.teacherId === user.data.id) : state.classes.filter(c => c.id === user.classId), [state.classes, user]);
  const [selClass, setSelClass] = useState(() => myClasses[0]?.id || "");
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [timer, setTimer] = useState(300);
  const [viewDate, setViewDate] = useState(today);
  const [tab, setTab] = useState("today");
  const [selStudent, setSelStudent] = useState(null);
  const attKey = `${selClass}_${viewDate}`;
  const presentIds = state.attendance[attKey] || [];
  const classStudents = useMemo(() => state.students.filter(s => s.classId === selClass), [state.students, selClass]);

  useEffect(() => { const t = setInterval(() => setTimer(p => p > 0 ? p - 1 : 0), 1000); return () => clearInterval(t); }, []);

  const toggle = sid => {
    if (user.role !== "teacher") return;
    state.setAttendance(p => { const prev = p[attKey] || []; return { ...p, [attKey]: prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid] }; });
  };
  const markAll = yes => state.setAttendance(p => ({ ...p, [attKey]: yes ? classStudents.map(s => s.id) : [] }));
  const doScan = () => {
    if (scanned) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false); setScanned(true);
      state.setAttendance(p => { const prev = p[`${selClass}_${today}`] || []; if (!prev.includes(user.data.id)) return { ...p, [`${selClass}_${today}`]: [...prev, user.data.id] }; return p; });
    }, 2200);
  };
  const mm = Math.floor(timer / 60).toString().padStart(2, "0");
  const ss = (timer % 60).toString().padStart(2, "0");
  const pct = classStudents.length ? Math.round((presentIds.length / classStudents.length) * 100) : 0;
  const allSessions = useMemo(() => Object.keys(state.attendance).filter(k => k.startsWith(selClass + "_")), [state.attendance, selClass]);
  const totalSessions = allSessions.length;
  const getStats = useCallback(sid => { const p = allSessions.filter(k => (state.attendance[k] || []).includes(sid)).length; return { p, a: totalSessions - p, pct: totalSessions ? Math.round((p / totalSessions) * 100) : 0 }; }, [allSessions, state.attendance, totalSessions]);
  const TABS_T = [["today","Điểm danh"],["calendar","Lịch xem"],["stats","Thống kê"]];
  const TABS_S = [["today","Điểm danh"],["calendar","Lịch của tôi"]];
  const tabs = user.role === "teacher" ? TABS_T : TABS_S;

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {myClasses.length > 1 && (
        <div style={{ display: "flex", gap: 8 }}>
          {myClasses.map(c => <button key={c.id} onClick={() => setSelClass(c.id)} style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${selClass === c.id ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`, background: selClass === c.id ? "rgba(79,172,254,.1)" : "transparent", color: selClass === c.id ? "#4FACFE" : "#4A6580", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{c.name}</button>)}
        </div>
      )}
      <div style={{ display: "flex", gap: 4 }}>
        {tabs.map(([v, l]) => <button key={v} onClick={() => setTab(v)} style={{ padding: "6px 15px", borderRadius: 9, border: `1px solid ${tab === v ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`, background: tab === v ? "rgba(79,172,254,.1)" : "transparent", color: tab === v ? "#4FACFE" : "#4A6580", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>)}
      </div>
      {tab === "today" && (
        <div style={{ display: "grid", gridTemplateColumns: user.role === "teacher" ? "1fr 1.3fr" : "1fr", gap: 14, alignItems: "start" }}>
          {user.role === "teacher" ? (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4", marginBottom: 3 }}>Mã QR điểm danh</div>
              <div style={{ fontSize: 11, color: "#3D5A78", marginBottom: 16 }}>Lớp {myClasses.find(c => c.id === selClass)?.name} · {today}</div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <div style={{ borderRadius: 14, overflow: "hidden", border: "2px solid rgba(79,172,254,.38)", boxShadow: "0 0 36px rgba(79,172,254,.22)", animation: "glowbeat 2s ease-in-out infinite" }}><QRSvg sz={170} /></div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "monospace", color: timer < 60 ? "#EF4444" : "#4FACFE", padding: "6px 20px", borderRadius: 10, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>{mm}:{ss}</div>
              </div>
              <div style={{ fontSize: 11, color: "#3D5A78", marginBottom: 14 }}>Thời gian còn lại</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => markAll(true)} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "none", cursor: "pointer", background: "rgba(52,211,153,.1)", color: "#34D399", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>✓ Điểm tất cả</button>
                <button onClick={() => markAll(false)} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "none", cursor: "pointer", background: "rgba(239,68,68,.08)", color: "#EF4444", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>✗ Xóa tất cả</button>
              </div>
            </Card>
          ) : (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E2EAF4", marginBottom: 12 }}>Điểm danh hôm nay</div>
              {!scanned ? (
                <>
                  <div onClick={doScan} style={{ width: 170, height: 170, borderRadius: 14, margin: "0 auto 18px", background: "rgba(79,172,254,.04)", border: scanning ? "2px solid #4FACFE" : "2px dashed rgba(79,172,254,.32)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", boxShadow: scanning ? "0 0 28px rgba(79,172,254,.32)" : "none", transition: "all .3s", cursor: "pointer" }}>
                    {scanning ? <><div style={{ fontSize: 40 }}>📷</div><div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#4FACFE,transparent)", animation: "scanline 1.5s ease-in-out infinite alternate" }} /></> : <div style={{ color: "#2E4A6A" }}><QrCode size={44} /><div style={{ fontSize: 11, marginTop: 6 }}>Nhấn để quét</div></div>}
                  </div>
                  <Btn onClick={doScan} disabled={scanning} style={{ width: "100%", justifyContent: "center" }}>{scanning ? "Đang quét..." : "Quét QR Code 📷"}</Btn>
                </>
              ) : (
                <div style={{ animation: "pop .4s ease", paddingTop: 8 }}>
                  <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#34D399", marginBottom: 5 }}>Điểm danh thành công!</div>
                  <div style={{ fontSize: 11, color: "#3D5A78" }}>{user.data.name}</div>
                </div>
              )}
            </Card>
          )}
          <div className="scard" style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.055)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#E2EAF4" }}>Danh sách</div>
              {user.role === "teacher" && <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.04)", color: "#94A3B8", fontSize: 11, fontFamily: "inherit", outline: "none" }} />}
              <div style={{ display: "flex", gap: 6 }}><Badge c="green">{presentIds.length} có mặt</Badge><Badge c="red">{classStudents.length - presentIds.length} vắng</Badge></div>
            </div>
            {classStudents.length === 0 ? <div style={{ padding: 28, textAlign: "center", color: "#2E4A6A", fontSize: 12 }}>Chưa có học sinh</div> : (
              <>
                <div style={{ maxHeight: 340, overflowY: "auto" }}>
                  {classStudents.map(s => {
                    const present = presentIds.includes(s.id);
                    return (
                      <div key={s.id} onClick={() => toggle(s.id)} style={{ padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,.025)", cursor: user.role === "teacher" ? "pointer" : "default", transition: "background .15s" }}
                        onMouseEnter={e => { if (user.role === "teacher") e.currentTarget.style.background = "rgba(255,255,255,.018)"; }}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <Av em={s.em} photo={s.photo} sz={28} glow={present} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#E2EAF4" }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: "#2E4A6A" }}>{s.code}</div>
                        </div>
                        {user.role === "teacher" && <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${present ? "#34D399" : "rgba(255,255,255,.14)"}`, background: present ? "rgba(52,211,153,.12)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>{present && <Check size={9} color="#34D399" />}</div>}
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: present ? "#34D399" : "#EF4444", boxShadow: present ? "0 0 7px rgba(52,211,153,.65)" : "none" }} />
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,.04)" }}>
                  <Bar val={presentIds.length} max={classStudents.length} col="#34D399" h={5} />
                  <div style={{ fontSize: 10, color: "#2E4A6A", marginTop: 4, textAlign: "center" }}>{presentIds.length}/{classStudents.length} · {pct}%</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {tab === "calendar" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14, alignItems: "start" }}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E2EAF4", marginBottom: 14 }}>{user.role === "student" ? "Lịch điểm danh của tôi" : selStudent ? `Lịch: ${classStudents.find(s => s.id === selStudent)?.name}` : "Chọn học sinh để xem"}</div>
            <AttCalendar classId={selClass} studentId={user.role === "student" ? user.data.id : selStudent} attendance={state.attendance} onSelectDate={setViewDate} selectedDate={viewDate} />
            {viewDate && (
              <div style={{ marginTop: 14, padding: "10px 13px", borderRadius: 10, background: "rgba(79,172,254,.05)", border: "1px solid rgba(79,172,254,.18)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4FACFE", marginBottom: 6 }}>{new Date(viewDate + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</div>
                {(() => { const dp = state.attendance[`${selClass}_${viewDate}`] || []; const sid = user.role === "student" ? user.data.id : selStudent; if (!sid) return <div style={{ fontSize: 11, color: "#3D5A78" }}>{dp.length}/{classStudents.length} có mặt</div>; const ip = dp.includes(sid); return <div style={{ fontSize: 12, fontWeight: 600, color: ip ? "#34D399" : "#EF4444" }}>{ip ? "✓ Có mặt" : "✗ Vắng mặt"}</div>; })()}
              </div>
            )}
          </Card>
          {user.role === "teacher" ? (
            <div className="scard" style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.055)", fontSize: 12, fontWeight: 700, color: "#E2EAF4" }}>Chọn học sinh để xem lịch</div>
              <div style={{ maxHeight: 450, overflowY: "auto" }}>
                {classStudents.map(s => {
                  const stats = getStats(s.id);
                  const isSel = selStudent === s.id;
                  return (
                    <div key={s.id} onClick={() => setSelStudent(isSel ? null : s.id)} style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,.025)", cursor: "pointer", background: isSel ? "rgba(79,172,254,.07)" : "transparent", transition: "background .15s" }}>
                      <Av em={s.em} photo={s.photo} sz={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isSel ? "#4FACFE" : "#E2EAF4" }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: "#2E4A6A" }}>{s.code}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: stats.pct >= 80 ? "#34D399" : stats.pct >= 60 ? "#F59E0B" : "#EF4444" }}>{stats.pct}%</div>
                        <div style={{ fontSize: 9, color: "#2E4A6A" }}>{stats.p}/{totalSessions}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#E2EAF4", marginBottom: 14 }}>Tóm tắt chuyên cần</div>
              {(() => { const s = getStats(user.data.id); return (<><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>{[["Có mặt",s.p,"#34D399"],["Vắng",s.a,"#EF4444"],["Tỉ lệ",s.pct+"%",s.pct>=80?"#34D399":s.pct>=60?"#F59E0B":"#EF4444"]].map(([l,v,c]) => (<div key={l} style={{ textAlign: "center", padding: "12px 8px", borderRadius: 10, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)" }}><div className="hfont" style={{ fontSize: 20, fontWeight: 400, color: c }}>{v}</div><div style={{ fontSize: 10, color: "#3D5A78", marginTop: 2 }}>{l}</div></div>))}</div><Bar val={s.p} max={totalSessions||1} col={s.pct>=80?"#34D399":s.pct>=60?"#F59E0B":"#EF4444"} h={6} /><div style={{ fontSize: 10, color: "#2E4A6A", marginTop: 5, textAlign: "center" }}>{s.p}/{totalSessions} buổi</div></>); })()}
            </Card>
          )}
        </div>
      )}
      {tab === "stats" && user.role === "teacher" && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4", marginBottom: 16 }}>Thống kê chuyên cần toàn lớp</div>
          <div style={{ borderRadius: 11, overflow: "hidden", border: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 120px", gap: 8, padding: "8px 14px", background: "rgba(255,255,255,.025)", fontSize: 10, fontWeight: 700, color: "#2E4A6A", letterSpacing: ".05em" }}>
              <span>HỌC SINH</span><span style={{ textAlign: "center" }}>CÓ MẶT</span><span style={{ textAlign: "center" }}>VẮNG</span><span style={{ textAlign: "center" }}>TỈ LỆ</span><span>BIỂU ĐỒ</span>
            </div>
            {classStudents.map(s => { const st = getStats(s.id); return (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 120px", gap: 8, padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,.035)", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Av em={s.em} photo={s.photo} sz={24} /><div><div style={{ fontSize: 12, color: "#E2EAF4", fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: 10, color: "#2E4A6A" }}>{s.code}</div></div></div>
                <div style={{ textAlign: "center", fontSize: 12, color: "#34D399", fontWeight: 600 }}>{st.p}</div>
                <div style={{ textAlign: "center", fontSize: 12, color: "#EF4444", fontWeight: 600 }}>{st.a}</div>
                <div style={{ textAlign: "center" }}><span style={{ fontSize: 12, fontWeight: 700, color: st.pct>=80?"#34D399":st.pct>=60?"#F59E0B":"#EF4444" }}>{st.pct}%</span></div>
                <div><Bar val={st.p} max={totalSessions||1} col={st.pct>=80?"#34D399":st.pct>=60?"#F59E0B":"#EF4444"} h={5} /></div>
              </div>
            ); })}
          </div>
        </Card>
      )}
    </div>
  );
}


// tin nhắn

function ChatPage({ state, user }) {
  const classId = user.role === "teacher" ? state.classes.find(c => c.teacherId === user.data.id)?.id : user.classId;
  const cls = state.classes.find(c => c.id === classId);
  const [channel, setChannel] = useState("chung");
  const [inp, setInp] = useState("");
  const bot = useRef(null);
  const msgKey = `${classId}_${channel}`;
  const msgs = state.messages[msgKey] || [];
  const classStudents = useMemo(() => state.students.filter(s => s.classId === classId), [state.students, classId]);

  const send = () => {
    if (!inp.trim()) return;
    const msg = { id: Date.now(), user: user.data.name, role: user.role, em: user.data.em || (user.role === "teacher" ? "👨‍🏫" : "😊"), text: inp.trim(), time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) };
    state.setMessages(p => ({ ...p, [msgKey]: [...(p[msgKey] || []), msg] }));
    setInp("");
    setTimeout(() => bot.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const channels = ["chung","bài-tập","hỏi-đáp","thông-báo"];

  return (
    <div className="page" style={{ padding: 20, height: "calc(100vh - 100px)", display: "flex", gap: 12 }}>
      <div style={{ width: 168, borderRadius: 13, background: "#060D1E", border: "1px solid rgba(255,255,255,.06)", padding: 10, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#2E4A6A", letterSpacing: ".08em", padding: "3px 7px", marginBottom: 6 }}>KÊNH — {cls?.name}</div>
        {channels.map(ch => <div key={ch} onClick={() => setChannel(ch)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", borderRadius: 7, cursor: "pointer", background: channel === ch ? "rgba(79,172,254,.1)" : "transparent", color: channel === ch ? "#4FACFE" : "#3D5A78", fontSize: 11, marginBottom: 1, transition: "all .15s" }}><Hash size={11} />{ch}</div>)}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: "#2E4A6A", letterSpacing: ".08em", padding: "6px 7px 4px" }}>THÀNH VIÊN ({classStudents.length})</div>
        <div style={{ overflowY: "auto" }}>
          {classStudents.slice(0, 8).map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 7px", fontSize: 10, color: "#2E4A6A" }}>
              <div style={{ position: "relative" }}><Av em={s.em} photo={s.photo} sz={16} /><div style={{ position: "absolute", bottom: 0, right: 0, width: 4, height: 4, borderRadius: "50%", background: "#34D399", border: "1px solid #060D1E" }} /></div>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name.split(" ").pop()}</span>
            </div>
          ))}
          {classStudents.length > 8 && <div style={{ fontSize: 10, color: "#2E4A6A", padding: "3px 7px" }}>+{classStudents.length - 8} người</div>}
        </div>
      </div>
      <div className="scard" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.055)", display: "flex", alignItems: "center", gap: 6 }}>
          <Hash size={13} style={{ color: "#4FACFE" }} /><span style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4" }}>{channel}</span>
          <div style={{ flex: 1 }} /><span style={{ fontSize: 11, color: "#2E4A6A" }}>{msgs.length} tin</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 0 }}>
          {msgs.length === 0 && <div style={{ color: "#2E4A6A", fontSize: 12, textAlign: "center", paddingTop: 28 }}>Chưa có tin nhắn. Hãy bắt đầu!</div>}
          {msgs.map((m, i) => {
            const showAv = i === 0 || msgs[i - 1].user !== m.user;
            const isT = m.role === "teacher";
            return (
              <div key={m.id} style={{ display: "flex", gap: 9, padding: "3px 0", alignItems: "flex-start", animation: "fadeUp .2s ease" }}>
                {showAv ? <Av em={m.em} sz={28} /> : <div style={{ width: 28, flexShrink: 0 }} />}
                <div>
                  {showAv && (<div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><span style={{ fontSize: 11, fontWeight: 700, color: isT ? "#A78BFA" : "#E2EAF4" }}>{m.user}</span>{isT && <Badge c="violet">GV</Badge>}<span style={{ fontSize: 9, color: "#2E4A6A" }}>{m.time}</span></div>)}
                  <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.65, padding: "6px 12px", borderRadius: showAv ? "2px 10px 10px 10px" : "10px", background: "rgba(255,255,255,.045)", display: "inline-block", maxWidth: 440 }}>{m.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={bot} />
        </div>
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,.045)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.04)", borderRadius: 11, padding: "6px 13px", border: "1px solid rgba(255,255,255,.08)" }}>
            <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={`Nhắn vào #${channel}...`} style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#E2EAF4", fontSize: 12, fontFamily: "inherit" }} />
            <button onClick={send} style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", background: inp.trim() ? "rgba(79,172,254,.22)" : "transparent", color: inp.trim() ? "#4FACFE" : "#2E4A6A", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}><Send size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}


// giao btvn

function TaskPage({ state, user }) {
  const classId = user.role === "teacher" ? state.classes.find(c => c.teacherId === user.data.id)?.id : user.classId;
  const tasks = state.assignments[classId] || [];
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState("all");
  const [newTask, setNewTask] = useState({ title: "", desc: "", subject: SUBJECTS[0], deadline: "", priority: false, attachments: [] });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errTask, setErrTask] = useState("");
  const fileRef = useRef();
  const { confirm, ConfirmUI } = useConfirm();

  const filtered = tab === "all" ? tasks : tasks.filter(t => t.status === tab);
  const counts = { all: tasks.length, pending: tasks.filter(t => t.status === "pending").length, submitted: tasks.filter(t => t.status === "submitted").length, overdue: tasks.filter(t => t.status === "overdue").length };

  const handleFileUpload = e => {
    const files = Array.from(e.target.files); if (!files.length) return;
    setUploadingFile(true);
    Promise.all(files.map(file => new Promise(res => {
      if (file.size > 5 * 1024 * 1024) { res(null); return; }
      const r = new FileReader();
      r.onload = () => res({ name: file.name, size: (file.size / 1024).toFixed(0) + "KB", type: file.name.split(".").pop().toLowerCase(), data: r.result });
      r.readAsDataURL(file);
    }))).then(results => { setNewTask(p => ({ ...p, attachments: [...p.attachments, ...results.filter(Boolean)] })); setUploadingFile(false); });
  };

  const addTask = () => {
    if (!newTask.title.trim()) { setErrTask("Nhập tên bài tập"); return; }
    if (!newTask.deadline) { setErrTask("Chọn deadline"); return; }
    state.setAssignments(p => ({ ...p, [classId]: [...(p[classId] || []), { id: "task_" + Date.now(), ...newTask, status: "pending", createdAt: Date.now() }] }));
    setNewTask({ title: "", desc: "", subject: SUBJECTS[0], deadline: "", priority: false, attachments: [] });
    setShowAdd(false); setErrTask("");
  };

  const submitTask = tid => state.setAssignments(p => ({ ...p, [classId]: (p[classId] || []).map(t => t.id === tid ? { ...t, status: "submitted", submittedAt: Date.now() } : t) }));
  const deleteTask = async tid => {
    const ok = await confirm("Xóa bài tập này?");
    if (!ok) return;
    state.setAssignments(p => ({ ...p, [classId]: (p[classId] || []).filter(t => t.id !== tid) }));
  };

  const STATUS_CFG = { pending:{ l:"Chờ nộp",c:"amber" }, submitted:{ l:"Đã nộp",c:"green" }, overdue:{ l:"Trễ hạn",c:"red" } };

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {ConfirmUI}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
        {[["Tất cả",counts.all,"#4FACFE"],["Chờ nộp",counts.pending,"#F59E0B"],["Đã nộp",counts.submitted,"#34D399"],["Trễ hạn",counts.overdue,"#EF4444"]].map(([l,n,c]) => (
          <div key={l} className="scard" style={{ padding: 14, textAlign: "center" }}>
            <div className="hfont" style={{ fontSize: 22, fontWeight: 400, color: c }}>{n}</div>
            <div style={{ fontSize: 11, color: "#3D5A78", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div className="scard" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.055)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[["all","Tất cả"],["pending","Chờ"],["submitted","Đã nộp"],["overdue","Trễ"]].map(([v,l]) => <button key={v} onClick={() => setTab(v)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${tab===v?"rgba(79,172,254,.4)":"rgba(255,255,255,.07)"}`, background: tab===v?"rgba(79,172,254,.1)":"transparent", color: tab===v?"#4FACFE":"#4A6580", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>)}
          </div>
          {user.role === "teacher" && <Btn onClick={() => setShowAdd(true)} small><Plus size={12} />Thêm bài</Btn>}
        </div>
        {filtered.length === 0 ? <div style={{ padding: 36, textAlign: "center", color: "#2E4A6A", fontSize: 12 }}>Chưa có bài tập nào.</div> : filtered.map(a => (
          <div key={a.id} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.025)", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${SCOLS[a.subject]||"#4FACFE"}14`, display: "flex", alignItems: "center", justifyContent: "center", color: SCOLS[a.subject]||"#4FACFE", fontWeight: 700, fontSize: 8, textAlign: "center", padding: 3 }}>{a.subject}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#E2EAF4", marginBottom: 2 }}>{a.title}</div>
              {a.desc && <div style={{ fontSize: 11, color: "#3D5A78", marginBottom: 4 }}>{a.desc}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: "#4A6580", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{a.deadline}</span>
                {a.priority && <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 600 }}>⚡ Ưu tiên</span>}
                {a.attachments?.length > 0 && <span style={{ fontSize: 10, color: "#4A6580", display: "flex", alignItems: "center", gap: 3 }}><Paperclip size={10} />{a.attachments.length} file</span>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <Badge c={STATUS_CFG[a.status]?.c||"blue"}>{STATUS_CFG[a.status]?.l||a.status}</Badge>
              {user.role === "student" && a.status === "pending" && <Btn onClick={() => submitTask(a.id)} small variant="success">Nộp bài</Btn>}
              {user.role === "teacher" && <button onClick={() => deleteTask(a.id)} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex" }}><Trash2 size={12} /></button>}
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal" style={{ width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#E2EAF4" }}>Thêm bài tập mới</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D5A78" }}><X size={18} /></button>
            </div>
            <Inp label="TÊN BÀI TẬP" value={newTask.title} onChange={v => setNewTask(p => ({ ...p, title: v }))} placeholder="Bài tập chương 3..." required />
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 5, letterSpacing: ".05em" }}>MÔ TẢ</div>
              <textarea value={newTask.desc} onChange={e => setNewTask(p => ({ ...p, desc: e.target.value }))} placeholder="Mô tả chi tiết..." rows={2} style={{ width: "100%", padding: "9px 13px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "#E2EAF4", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Sel label="MÔN HỌC" value={newTask.subject} onChange={v => setNewTask(p => ({ ...p, subject: v }))} options={SUBJECTS} required />
              <Inp label="DEADLINE" value={newTask.deadline} onChange={v => setNewTask(p => ({ ...p, deadline: v }))} placeholder="dd/mm/yyyy" required />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94A3B8", cursor: "pointer", marginBottom: 16 }}>
              <input type="checkbox" checked={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.checked }))} style={{ accentColor: "#F59E0B" }} />⚡ Ưu tiên cao
            </label>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 8, letterSpacing: ".05em" }}>ĐÍNH KÈM FILE</div>
              <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "12px", borderRadius: 11, border: "2px dashed rgba(79,172,254,.27)", background: "rgba(79,172,254,.025)", color: "#2E4A6A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", fontSize: 12 }}>
                <Upload size={16} style={{ color: "#4FACFE" }} />{uploadingFile ? "Đang xử lý..." : "Nhấn để chọn file"}
              </button>
              <input ref={fileRef} type="file" multiple onChange={handleFileUpload} style={{ display: "none" }} />
              {newTask.attachments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {newTask.attachments.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "rgba(79,172,254,.07)", border: "1px solid rgba(79,172,254,.18)", fontSize: 11, color: "#4FACFE" }}>
                      <span>{FILE_ICONS[f.type]||"📁"}</span><span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                      <button onClick={() => setNewTask(p => ({ ...p, attachments: p.attachments.filter((_,j)=>j!==i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", display: "flex", padding: 0, marginLeft: 2 }}><X size={11} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ErrBox msg={errTask} />
            <div style={{ display: "flex", gap: 9 }}>
              <Btn variant="ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Hủy</Btn>
              <Btn onClick={addTask} style={{ flex: 2 }}>Tạo bài tập</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// vòng quay may mắn

function WheelPage({ state, user }) {
  const classId = user.role === "teacher" ? state.classes.find(c => c.teacherId === user.data.id)?.id : user.classId;
  const students = useMemo(() => state.students.filter(s => s.classId === classId), [state.students, classId]);
  const N = students.length;
  const [totalRot, setTotalRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const [history, setHistory] = useState([]);
  const WCOLS = ["#4FACFE","#818CF8","#34D399","#F59E0B","#F472B6","#FB923C","#A78BFA","#4ADE80","#60A5FA","#FACC15","#E879F9","#FCA5A5","#38BDF8","#6EE7B7"];

  if (N === 0) return <div className="page" style={{ padding: 20, textAlign: "center", color: "#2E4A6A", paddingTop: 60 }}>Chưa có học sinh trong lớp.</div>;

  const sliceAngle = 360 / N;
  const spin = () => {
    if (spinning) return;
    setSpinning(true); setWinner(null); setWinnerIdx(null);
    const picked = Math.floor(Math.random() * N);
    const targetAngleInSlice = (picked + 0.5) * sliceAngle;
    const targetMod = (360 - targetAngleInSlice % 360 + 360) % 360;
    const currentMod = ((totalRot % 360) + 360) % 360;
    let delta = (targetMod - currentMod + 360) % 360;
    if (delta < 10) delta += 360;
    const fullSpins = (6 + Math.floor(Math.random() * 5)) * 360;
    const newTotalRot = totalRot + fullSpins + delta;
    setTotalRot(newTotalRot);
    setTimeout(() => {
      setSpinning(false); setWinner(students[picked]); setWinnerIdx(picked);
      setHistory(prev => [{ ...students[picked], at: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) }, ...prev].slice(0, 12));
    }, 4500);
  };

  return (
    <div className="page" style={{ padding: 20, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
        <Card style={{ textAlign: "center" }}>
          <div className="hfont" style={{ fontSize: 18, fontWeight: 400, marginBottom: 4 }}>🎡 Lucky Wheel</div>
          <div style={{ fontSize: 12, color: "#3D5A78", marginBottom: 18 }}>Quay ngẫu nhiên để chọn học sinh</div>
          <div style={{ position: "relative", width: 300, height: 300, margin: "0 auto 18px" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
              <div style={{ width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "24px solid #F59E0B", filter: "drop-shadow(0 4px 8px rgba(245,158,11,.6))" }} />
            </div>
            <div style={{ width: 300, height: 300, transform: `rotate(${totalRot}deg)`, transition: spinning ? "transform 4.5s cubic-bezier(.17,.67,.08,1)" : "none" }}>
              <svg width="300" height="300" viewBox="0 0 300 300">
                {students.map((s, i) => {
                  const startAngle = (i * sliceAngle - 90) * Math.PI / 180;
                  const endAngle = ((i + 1) * sliceAngle - 90) * Math.PI / 180;
                  const x1 = 150 + 140 * Math.cos(startAngle), y1 = 150 + 140 * Math.sin(startAngle);
                  const x2 = 150 + 140 * Math.cos(endAngle), y2 = 150 + 140 * Math.sin(endAngle);
                  const largeArc = sliceAngle > 180 ? 1 : 0;
                  const midAngle = ((i + 0.5) * sliceAngle - 90) * Math.PI / 180;
                  const mx = 150 + 96 * Math.cos(midAngle), my = 150 + 96 * Math.sin(midAngle);
                  const textRot = (i + 0.5) * sliceAngle - 90;
                  const col = WCOLS[i % WCOLS.length];
                  const isWinner = winnerIdx === i && !spinning;
                  return (
                    <g key={i}>
                      <path d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={col} stroke="#050C1A" strokeWidth="1.5" opacity={isWinner ? 1 : .88} />
                      {isWinner && <path d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`} fill="none" stroke="#FFF" strokeWidth="2.5" opacity=".7" />}
                      <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fontSize={N > 20 ? 7 : N > 12 ? 9 : 10} fontWeight="700" fill="rgba(255,255,255,.95)" transform={`rotate(${textRot},${mx},${my})`}>{s.name.split(" ").pop()}</text>
                    </g>
                  );
                })}
                <circle cx="150" cy="150" r="22" fill="#050C1A" />
                <circle cx="150" cy="150" r="10" fill="#4FACFE" />
                <circle cx="150" cy="150" r="5" fill="#FFF" />
              </svg>
            </div>
          </div>
          <Btn onClick={spin} disabled={spinning} style={{ padding: "12px 40px", fontSize: 14, fontWeight: 700, justifyContent: "center" }}>{spinning ? "🌀 Đang quay..." : "🎯 Quay ngay!"}</Btn>
        </Card>
        {winner && !spinning && (
          <div style={{ borderRadius: 14, padding: 22, textAlign: "center", background: "linear-gradient(135deg,rgba(79,172,254,.08),rgba(129,140,248,.08))", border: "1px solid rgba(79,172,254,.25)", animation: "pop .4s ease" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Av em={winner.em} photo={winner.photo} sz={68} glow /></div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#E2EAF4", marginBottom: 5 }}>🎉 {winner.name}</div>
            <div style={{ fontSize: 11, color: "#3D5A78" }}>{winner.code}</div>
          </div>
        )}
      </div>
      <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="scard" style={{ overflow: "hidden" }}>
          <div style={{ padding: "10px 13px", borderBottom: "1px solid rgba(255,255,255,.055)", fontSize: 12, fontWeight: 700, color: "#E2EAF4" }}>DS Học sinh ({N})</div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {students.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderBottom: "1px solid rgba(255,255,255,.02)", fontSize: 11, color: "#4A6580", background: winnerIdx === i && !spinning ? "rgba(79,172,254,.07)" : "transparent" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: WCOLS[i % WCOLS.length], flexShrink: 0 }} />
                <Av em={s.em} photo={s.photo} sz={22} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                {winnerIdx === i && !spinning && <span style={{ fontSize: 12 }}>🏆</span>}
              </div>
            ))}
          </div>
        </div>
        {history.length > 0 && (
          <div className="scard" style={{ overflow: "hidden" }}>
            <div style={{ padding: "10px 13px", borderBottom: "1px solid rgba(255,255,255,.055)", fontSize: 12, fontWeight: 700, color: "#E2EAF4" }}>Lịch sử quay</div>
            {history.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderBottom: "1px solid rgba(255,255,255,.02)", fontSize: 10, color: "#4A6580" }}>
                <Av em={h.em} photo={h.photo} sz={18} />
                <span style={{ flex: 1 }}>{h.name.split(" ").pop()}</span>
                <span style={{ color: "#2E4A6A" }}>{h.at}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// thư viện số


function LibPage({ state, user }) {
  const classId = user.role === "teacher" ? state.classes.find(c => c.teacherId === user.data.id)?.id : user.classId;
  const allFiles = state.files[classId] || [];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); 
  const [showAdd, setShowAdd] = useState(false);
  const [newFile, setNewFile] = useState({ name: "", type: "pdf", subject: SUBJECTS[0], desc: "", data: null, size: "" });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errFile, setErrFile] = useState("");
  const fileRef = useRef();
  const { confirm, ConfirmUI } = useConfirm();

  const filtered = useMemo(() => allFiles.filter(f => {
    const s = f.name.toLowerCase().includes(search.toLowerCase()) || (f.subject || "").toLowerCase().includes(search.toLowerCase());
    const t = filterType === "all" || f.type === filterType;
    const sub = filterSubject === "all" || f.subject === filterSubject;
    return s && t && sub;
  }), [allFiles, search, filterType, filterSubject]);

  const handleFile = file => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setErrFile("File quá lớn (tối đa 10MB)"); return; }
    setUploading(true);
    const r = new FileReader();
    r.onload = () => { const type = file.name.split(".").pop().toLowerCase(); setNewFile(p => ({ ...p, name: file.name, type: FILE_TYPES.includes(type) ? type : "other", size: (file.size / 1024).toFixed(0) + " KB", data: r.result })); setUploading(false); setErrFile(""); };
    r.readAsDataURL(file);
  };

  const addFile = () => {
    if (!newFile.name.trim()) { setErrFile("Nhập tên tài liệu"); return; }
    state.setFiles(p => ({ ...p, [classId]: [...(p[classId] || []), { id: "f_" + Date.now(), name: newFile.name.trim(), type: newFile.type, subject: newFile.subject, desc: newFile.desc, size: newFile.size || "--", data: newFile.data, downloads: 0, uploadedAt: Date.now(), uploader: user.data.name }] }));
    setNewFile({ name: "", type: "pdf", subject: SUBJECTS[0], desc: "", data: null, size: "" }); setShowAdd(false); setErrFile("");
  };

  const deleteFile = async fid => {
    const ok = await confirm("Xóa tài liệu này?");
    if (!ok) return;
    state.setFiles(p => ({ ...p, [classId]: (p[classId] || []).filter(f => f.id !== fid) }));
  };

  const incDownload = fid => state.setFiles(p => ({ ...p, [classId]: (p[classId] || []).map(f => f.id === fid ? { ...f, downloads: (f.downloads || 0) + 1 } : f) }));
  const usedTypes = [...new Set(allFiles.map(f => f.type))];
  const usedSubjects = [...new Set(allFiles.map(f => f.subject).filter(Boolean))];

  const typeStats = useMemo(() => {
    const stats = {};
    allFiles.forEach(f => { stats[f.type] = (stats[f.type] || 0) + 1; });
    return stats;
  }, [allFiles]);

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {ConfirmUI}

      {/* ── Header stats ── */}
      {allFiles.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
          {[
            ["Tổng tài liệu", allFiles.length, "#4FACFE", "📚"],
            ["Lượt tải", allFiles.reduce((a,f) => a + (f.downloads||0), 0), "#34D399", "📥"],
            ["Môn học", usedSubjects.length, "#A78BFA", "🎓"],
            ["Loại file", Object.keys(typeStats).length, "#F59E0B", "📂"],
          ].map(([l, v, c, ic]) => (
            <div key={l} className="scard" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c}16`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{ic}</div>
              <div>
                <div className="hfont" style={{ fontSize: 20, fontWeight: 400, color: c, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 10, color: "#3D5A78", marginTop: 2 }}>{l}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 11, background: "#0A1628", border: "1px solid rgba(255,255,255,.08)" }}>
          <Search size={13} style={{ color: "#2E4A6A", flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tài liệu..." style={{ background: "none", border: "none", outline: "none", color: "#E2EAF4", fontSize: 12, fontFamily: "inherit", flex: 1 }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D5A78", display: "flex", padding: 0 }}><X size={12} /></button>}
        </div>
        <select className="inp" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: "auto", fontSize: 11, padding: "7px 11px" }}>
          <option value="all">Tất cả loại</option>
          {usedTypes.map(t => <option key={t} value={t}>{t.toUpperCase()} ({typeStats[t]||0})</option>)}
        </select>
        <select className="inp" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ width: "auto", fontSize: 11, padding: "7px 11px" }}>
          <option value="all">Tất cả môn</option>
          {usedSubjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* View mode toggle */}
        <div style={{ display: "flex", borderRadius: 9, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
          {[["grid","⊞"],["list","☰"]].map(([m, ic]) => (
            <button key={m} onClick={() => setViewMode(m)} style={{ padding: "7px 11px", border: "none", cursor: "pointer", background: viewMode === m ? "rgba(79,172,254,.15)" : "rgba(255,255,255,.03)", color: viewMode === m ? "#4FACFE" : "#3D5A78", fontSize: 13, fontFamily: "inherit", transition: "all .2s" }}>{ic}</button>
          ))}
        </div>
        {user.role === "teacher" && (
          <Btn onClick={() => { setNewFile({ name: "", type: "pdf", subject: SUBJECTS[0], desc: "", data: null, size: "" }); setErrFile(""); setShowAdd(true); }}>
            <Upload size={13} />Thêm tài liệu
          </Btn>
        )}
      </div>

      {/* ── File list / grid ── */}
      <div className="scard" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.055)", display: "flex", alignItems: "center", gap: 8 }}>
          <Library size={14} style={{ color: "#4FACFE" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4" }}>Thư viện tài liệu</span>
          <span style={{ fontSize: 11, color: "#2E4A6A", marginLeft: 4 }}>
            {search || filterType !== "all" || filterSubject !== "all"
              ? `${filtered.length} / ${allFiles.length} tài liệu`
              : `${allFiles.length} tài liệu`}
          </span>
          {(search || filterType !== "all" || filterSubject !== "all") && (
            <button onClick={() => { setSearch(""); setFilterType("all"); setFilterSubject("all"); }} style={{ marginLeft: "auto", fontSize: 10, color: "#F59E0B", background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.22)", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontFamily: "inherit" }}>Xóa bộ lọc ×</button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "52px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>{allFiles.length === 0 ? "📂" : "🔍"}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3D5A78", marginBottom: 8 }}>
              {allFiles.length === 0 ? "Thư viện còn trống" : "Không tìm thấy tài liệu"}
            </div>
            <div style={{ fontSize: 12, color: "#2E4A6A", marginBottom: 20 }}>
              {allFiles.length === 0
                ? "Hãy thêm tài liệu đầu tiên cho lớp học"
                : "Thử thay đổi từ khoá hoặc bộ lọc"}
            </div>
            {allFiles.length === 0 && user.role === "teacher" && (
              <Btn onClick={() => { setNewFile({ name: "", type: "pdf", subject: SUBJECTS[0], desc: "", data: null, size: "" }); setErrFile(""); setShowAdd(true); }}>
                <Upload size={13} />Thêm tài liệu đầu tiên
              </Btn>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* Grid view */
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
            {filtered.map(f => {
              const col = FILE_COLORS[f.type] || "#64748B";
              return (
                <div key={f.id} style={{ borderRadius: 12, background: "rgba(255,255,255,.03)", border: `1px solid ${col}22`, padding: 14, display: "flex", flexDirection: "column", gap: 8, transition: "all .2s", position: "relative" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${col}55`; e.currentTarget.style.background = `${col}08`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${col}22`; e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.transform = "none"; }}>
                  {/* File icon */}
                  <div style={{ width: "100%", height: 70, borderRadius: 9, background: `${col}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, flexShrink: 0 }}>
                    {FILE_ICONS[f.type] || "📁"}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#E2EAF4", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>{f.name}</div>
                    {f.desc && <div style={{ fontSize: 10, color: "#3D5A78", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.desc}</div>}
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: `${col}20`, color: col, letterSpacing: ".05em", textTransform: "uppercase" }}>{f.type}</span>
                      {f.subject && <span style={{ fontSize: 9, fontWeight: 600, color: "#A78BFA", background: "rgba(167,139,250,.12)", padding: "2px 6px", borderRadius: 5 }}>{f.subject}</span>}
                    </div>
                  </div>
                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid rgba(255,255,255,.05)" }}>
                    <span style={{ fontSize: 10, color: "#2E4A6A" }}>{f.size} · {f.downloads || 0}↓</span>
                    <div style={{ display: "flex", gap: 5 }}>
                      {f.data ? (
                        <a href={f.data} download={f.name} onClick={() => incDownload(f.id)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 9px", borderRadius: 7, border: `1px solid ${col}44`, background: `${col}10`, color: col, fontSize: 10, fontWeight: 700, textDecoration: "none" }}>
                          <Download size={10} />Tải
                        </a>
                      ) : null}
                      {user.role === "teacher" && (
                        <button onClick={() => deleteFile(f.id)} style={{ padding: "4px 7px", borderRadius: 7, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex" }}>
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div>
            {filtered.map((f, i) => {
              const col = FILE_COLORS[f.type] || "#64748B";
              return (
                <div key={f.id} style={{ padding: "11px 16px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,.035)" : "none", display: "flex", alignItems: "center", gap: 12, transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  {/* Icon */}
                  <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: `${col}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>
                    {FILE_ICONS[f.type] || "📁"}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#E2EAF4", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: "uppercase" }}>{f.type}</span>
                      {f.size && <span style={{ fontSize: 10, color: "#3D5A78" }}>{f.size}</span>}
                      {f.desc && <span style={{ fontSize: 10, color: "#3D5A78", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>· {f.desc}</span>}
                    </div>
                  </div>
                  {/* Tags */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    {f.subject && <Badge c="violet">{f.subject}</Badge>}
                    <span style={{ fontSize: 10, color: "#2E4A6A" }}>{f.downloads || 0}↓</span>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    {f.data ? (
                      <a href={f.data} download={f.name} onClick={() => incDownload(f.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(79,172,254,.22)", background: "rgba(79,172,254,.07)", color: "#4FACFE", fontSize: 10, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                        <Download size={11} />Tải về
                      </a>
                    ) : <span style={{ fontSize: 10, color: "#2E4A6A" }}>No file</span>}
                    {user.role === "teacher" && (
                      <button onClick={() => deleteFile(f.id)} style={{ padding: "5px 7px", borderRadius: 7, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex" }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal thêm tài liệu ── */}
      {showAdd && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          {/*
            Dùng class modal-flex thay vì modal thông thường.
            Cấu trúc 3 tầng: Header cố định → Body cuộn → Footer cố định.
            Nhờ vậy nút Hủy/Thêm vào thư viện không bao giờ bị khuất dù nội dung dài.
          */}
          <div className="modal-flex" style={{ width: 460 }}>

            {/* Header — cố định, không cuộn */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#E2EAF4" }}>Thêm tài liệu mới</h2>
                  <div style={{ fontSize: 11, color: "#3D5A78", marginTop: 2 }}>Upload file và điền thông tin bên dưới</div>
                </div>
                <button onClick={() => setShowAdd(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", cursor: "pointer", color: "#3D5A78", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
              </div>
            </div>

            {/* Body — có thể cuộn khi nội dung dài */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

            {/* Khu vực upload file */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8, letterSpacing: ".05em" }}>📎 FILE TÀI LIỆU</div>

              {newFile.data ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: "rgba(52,211,153,.07)", border: "1.5px solid rgba(52,211,153,.35)" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: `${FILE_COLORS[newFile.type] || "#64748B"}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, border: `1px solid ${FILE_COLORS[newFile.type] || "#64748B"}40` }}>
                    {FILE_ICONS[newFile.type] || "📁"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{newFile.name}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: FILE_COLORS[newFile.type] || "#64748B", textTransform: "uppercase", padding: "2px 8px", borderRadius: 5, background: `${FILE_COLORS[newFile.type] || "#64748B"}22`, letterSpacing: ".04em" }}>{newFile.type}</span>
                      <span style={{ fontSize: 11, color: "#64748B" }}>{newFile.size}</span>
                      <span style={{ fontSize: 11, color: "#34D399" }}>✓ Sẵn sàng</span>
                    </div>
                  </div>
                  <button onClick={() => setNewFile(p => ({ ...p, data: null, name: "", size: "" }))} style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid rgba(239,68,68,.35)", background: "rgba(239,68,68,.1)", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                    <X size={11} />Đổi
                  </button>
                </div>
              ) : uploading ? (
                <div style={{ padding: "28px 16px", borderRadius: 12, border: "2px dashed rgba(79,172,254,.4)", background: "rgba(79,172,254,.06)", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 10, animation: "spin360 1.2s linear infinite", display: "inline-block" }}>⚙️</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#4FACFE" }}>Đang xử lý file...</div>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={e => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
                  style={{ borderRadius: 12, border: `2px dashed ${dragActive ? "#4FACFE" : "rgba(100,116,139,.45)"}`, background: dragActive ? "rgba(79,172,254,.08)" : "rgba(255,255,255,.04)", padding: "28px 20px 24px", transition: "all .2s", textAlign: "center" }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(79,172,254,.14)", border: "1px solid rgba(79,172,254,.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <Upload size={22} style={{ color: "#4FACFE" }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#CBD5E1", marginBottom: 5 }}>Kéo &amp; thả file vào đây</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>hoặc nhấn nút bên dưới để chọn từ máy tính</div>
                  <button onClick={() => fileRef.current?.click()} style={{ padding: "9px 24px", borderRadius: 10, border: "1px solid rgba(79,172,254,.5)", background: "rgba(79,172,254,.15)", color: "#4FACFE", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 16, transition: "all .2s" }}>
                    <Upload size={14} />Chọn file để tải lên
                  </button>
                  <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
                    {[["PDF","#EF4444"],["DOCX","#3B82F6"],["PPTX","#F59E0B"],["XLSX","#10B981"],["MP4","#8B5CF6"],["IMG","#06B6D4"]].map(([t, c]) => (
                      <span key={t} style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 5, background: `${c}18`, color: c, letterSpacing: ".05em", border: `1px solid ${c}30` }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 10 }}>Tối đa 10MB mỗi file</div>
                </div>
              )}
              <input ref={fileRef} type="file" onChange={e => handleFile(e.target.files[0])} style={{ display: "none" }} />
            </div>{/* hết khu vực upload */}

            {/* Đường kẻ phân cách */}
            <div style={{ height: 1, background: "rgba(255,255,255,.06)", marginBottom: 16 }} />

            {/* Các trường nhập thông tin tài liệu */}
            <Inp label="TÊN HIỂN THỊ" value={newFile.name} onChange={v => setNewFile(p => ({ ...p, name: v }))} placeholder="Vd: Đề cương ôn thi HK1" required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Sel label="LOẠI FILE" value={newFile.type} onChange={v => setNewFile(p => ({ ...p, type: v }))} options={FILE_TYPES.map(t => ({ v: t, l: t.toUpperCase() }))} />
              <Sel label="MÔN HỌC" value={newFile.subject} onChange={v => setNewFile(p => ({ ...p, subject: v }))} options={SUBJECTS} />
            </div>
            <Inp label="MÔ TẢ (tùy chọn)" value={newFile.desc} onChange={v => setNewFile(p => ({ ...p, desc: v }))} placeholder="Mô tả ngắn về nội dung tài liệu..." />

            <ErrBox msg={errFile} />

            </div>{/* hết body cuộn */}

            {/* Footer — cố định dưới, không bao giờ bị khuất */}
            <div style={{ padding: "12px 24px 18px", borderTop: "1px solid rgba(255,255,255,.07)", flexShrink: 0, background: "#0A1628" }}>
              <div style={{ display: "flex", gap: 9 }}>
                <Btn variant="ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Hủy</Btn>
                <Btn onClick={addFile} style={{ flex: 2, justifyContent: "center" }} disabled={!newFile.name.trim()}>
                  <Upload size={13} />Thêm vào thư viện
                </Btn>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}


// trang cá nhân 

function ProfilePage({ state, user }) {
  const s = user.data;
  const cls = state.classes.find(c => c.id === user.classId);
  const today = new Date().toISOString().slice(0, 10);
  const attKey = `${user.classId}_${today}`;
  const presentToday = (state.attendance[attKey] || []).includes(s.id);
  const allAtt = Object.entries(state.attendance).filter(([k]) => k.startsWith(user.classId + "_"));
  const presentDays = allAtt.filter(([, v]) => v.includes(s.id)).length;
  const totalDays = allAtt.length;
  const tasks = state.assignments[user.classId] || [];

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ borderRadius: 16, padding: "24px", background: "linear-gradient(135deg,rgba(29,108,245,.1),rgba(123,63,228,.08))", border: "1px solid rgba(79,172,254,.12)", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#4FACFE,#A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: "0 0 28px rgba(79,172,254,.45)", border: "3px solid rgba(79,172,254,.35)" }}>
            {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (s.em || "😊")}
          </div>
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: "#34D399", border: "2px solid #050C1A" }} />
        </div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#E2EAF4", marginBottom: 4 }}>{s.name}</div>
          <div style={{ fontSize: 12, color: "#2E4A6A", marginBottom: 10 }}>{s.code} · Lớp {cls?.name}</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {presentToday && <Badge c="green">✓ Đã điểm danh hôm nay</Badge>}
            <Badge c="blue">Học sinh</Badge>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[["Chuyên cần", totalDays ? `${Math.round((presentDays / totalDays) * 100)}%` : "--", "#4FACFE"], ["Ngày học", `${presentDays}/${totalDays}`, "#34D399"], ["Bài tập", `${tasks.filter(t => t.status === "submitted").length}/${tasks.length}`, "#A78BFA"]].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div className="hfont" style={{ fontSize: 21, fontWeight: 400, color: c }}>{v}</div>
              <div style={{ fontSize: 10, color: "#2E4A6A", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4", marginBottom: 14 }}>Thông tin học sinh</div>
        {[["Họ và tên",s.name],["Mã học sinh",s.code],["Lớp",cls?.name||"--"],["Ngày sinh",s.dob?new Date(s.dob+"T00:00:00").toLocaleDateString("vi-VN"):"--"],["Số điện thoại",s.phone||"--"],["Điểm danh hôm nay",presentToday?"✓ Có mặt":"✗ Chưa điểm danh"],["Bài chờ nộp",`${tasks.filter(t=>t.status==="pending").length} bài`]].map(([l,v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,.045)", fontSize: 12 }}>
            <span style={{ color: "#4A6580" }}>{l}</span>
            <span style={{ color: "#E2EAF4", fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}


// trang 


function DashPage({ state, user, setView }) {
  const isT = user.role === "teacher";
  const classId = isT ? state.classes.find(c => c.teacherId === user.data.id)?.id : user.classId;
  const cls = state.classes.find(c => c.id === classId);
  const classStudents = useMemo(() => state.students.filter(s => s.classId === classId), [state.students, classId]);
  const today = new Date().toISOString().slice(0, 10);
  const attKey = `${classId}_${today}`;
  const presentToday = state.attendance[attKey] || [];
  const tasks = state.assignments[classId] || [];
  const todayDate = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const myClasses = useMemo(() => state.classes.filter(c => c.teacherId === user.data.id), [state.classes, user.data.id]);
  const pendingCount = useMemo(() => state.pendingStudents.filter(p => myClasses.map(c => c.id).includes(p.classId)).length, [state.pendingStudents, myClasses]);

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ borderRadius: 16, padding: "22px 24px", background: "linear-gradient(135deg,rgba(29,108,245,.1),rgba(123,63,228,.08))", border: "1px solid rgba(79,172,254,.12)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4, color: "#E2EAF4" }}>{isT ? `Chào, ${user.data.name}! 👋` : `Xin chào, ${user.data.name}! 👋`}</div>
          <div style={{ fontSize: 12, color: "#2E4A6A", marginBottom: 10, textTransform: "capitalize" }}>{todayDate}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {isT ? (
              <>
                <span style={{ fontSize: 11, padding: "4px 11px", borderRadius: 8, background: "rgba(79,172,254,.1)", color: "#4FACFE", fontWeight: 500 }}>{myClasses.length} lớp · {classStudents.length} học sinh</span>
                {pendingCount > 0 && <span onClick={() => setView("pending")} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 8, background: "rgba(239,68,68,.1)", color: "#EF4444", fontWeight: 600, cursor: "pointer" }}>⚠ {pendingCount} đăng ký chờ duyệt</span>}
              </>
            ) : (
              <>
                {presentToday.includes(user.data.id) ? <span style={{ fontSize: 11, padding: "4px 11px", borderRadius: 8, background: "rgba(52,211,153,.1)", color: "#34D399", fontWeight: 500 }}>✓ Đã điểm danh</span> : <span style={{ fontSize: 11, padding: "4px 11px", borderRadius: 8, background: "rgba(245,158,11,.1)", color: "#F59E0B", fontWeight: 500 }}>⚠ Chưa điểm danh</span>}
                <span style={{ fontSize: 11, padding: "4px 11px", borderRadius: 8, background: "rgba(239,68,68,.08)", color: "#EF4444", fontWeight: 500 }}>{tasks.filter(t => t.status === "pending").length} bài chờ nộp</span>
              </>
            )}
          </div>
        </div>
        <div style={{ fontSize: 54, animation: "float 4s ease-in-out infinite" }}>{isT ? "📋" : "📚"}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 11 }}>
        {(isT ? [
          { l:"Lớp quản lý", v:myClasses.length, c:"#4FACFE", Ic:School, s:"Tất cả lớp" },
          { l:"Học sinh", v:classStudents.length, c:"#A78BFA", Ic:Users, s:cls?.name||"Chọn lớp" },
          { l:"Có mặt", v:presentToday.length, c:"#34D399", Ic:CheckCircle, s:"Hôm nay" },
          { l:"Bài tập", v:tasks.length, c:"#F59E0B", Ic:BookOpen, s:"Đã tạo" },
          { l:"Chờ duyệt", v:pendingCount, c:"#EF4444", Ic:UserCheck, s:"Học sinh mới" },
        ] : [
          { l:"Điểm danh", v:presentToday.includes(user.data.id)?"✓":"✗", c:presentToday.includes(user.data.id)?"#34D399":"#EF4444", Ic:CheckCircle, s:"Hôm nay" },
          { l:"Chờ nộp", v:tasks.filter(t=>t.status==="pending").length, c:"#F59E0B", Ic:Clock, s:"Bài tập" },
          { l:"Đã nộp", v:tasks.filter(t=>t.status==="submitted").length, c:"#34D399", Ic:Trophy, s:"Bài tập" },
          { l:"Bạn lớp", v:classStudents.length, c:"#4FACFE", Ic:Users, s:cls?.name||"--" },
        ]).map(({ l, v, c, Ic, s }) => (
          <div key={l} className="scard cglow" style={{ padding: 15 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${c}16`, display: "flex", alignItems: "center", justifyContent: "center", color: c, marginBottom: 12 }}><Ic size={15} /></div>
            <div className="hfont" style={{ fontSize: 23, fontWeight: 400, color: "#E2EAF4", marginBottom: 2 }}>{v}</div>
            <div style={{ fontSize: 11, color: "#3D5A78" }}>{l}</div>
            <div style={{ fontSize: 10, color: "#2E4A6A", marginTop: 1 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#E2EAF4", marginBottom: 12 }}>Truy cập nhanh</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {(isT ? [
              { Ic:Users, l:"Học sinh", v:"students", c:"#4FACFE" },
              { Ic:QrCode, l:"Điểm danh", v:"attendance", c:"#34D399" },
              { Ic:MessageSquare, l:"Chat", v:"chat", c:"#A78BFA" },
              { Ic:Shuffle, l:"Lucky Wheel", v:"wheel", c:"#F59E0B" },
            ] : [
              { Ic:QrCode, l:"Điểm danh", v:"attendance", c:"#4FACFE" },
              { Ic:MessageSquare, l:"Chat", v:"chat", c:"#A78BFA" },
              { Ic:BookOpen, l:"Bài tập", v:"assignments", c:"#34D399" },
              { Ic:Shuffle, l:"Lucky Wheel", v:"wheel", c:"#F59E0B" },
            ]).map(({ Ic, l, v, c }) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "12px 7px", borderRadius: 10, cursor: "pointer", background: `${c}09`, border: `1px solid ${c}18`, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, fontFamily: "inherit", color: c, transition: "all .2s" }}>
                <Ic size={17} /><span style={{ fontSize: 10, fontWeight: 500, color: "#4A6580" }}>{l}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#E2EAF4", marginBottom: 12 }}>{isT ? "Điểm danh hôm nay" : "Bài tập gần đây"}</div>
          {isT ? (
            classStudents.length === 0 ? <div style={{ color: "#2E4A6A", fontSize: 12 }}>{myClasses.length === 0 ? "Tạo lớp học để bắt đầu →" : "Chưa có học sinh."}</div> : (<>
              <Bar val={presentToday.length} max={classStudents.length} col="#34D399" h={5} />
              <div style={{ fontSize: 11, color: "#2E4A6A", marginTop: 5, marginBottom: 11 }}>{presentToday.length}/{classStudents.length} · {classStudents.length ? Math.round((presentToday.length / classStudents.length) * 100) : 0}%</div>
              {classStudents.slice(0, 5).map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <Av em={s.em} photo={s.photo} sz={20} /><span style={{ fontSize: 11, color: "#4A6580", flex: 1 }}>{s.name}</span>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: presentToday.includes(s.id) ? "#34D399" : "#EF4444" }} />
                </div>
              ))}
            </>)
          ) : (
            tasks.length === 0 ? <div style={{ color: "#2E4A6A", fontSize: 12 }}>Chưa có bài tập.</div> :
              tasks.slice(0, 4).map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: SCOLS[t.subject]||"#4FACFE", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#4A6580", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                  <Badge c={{ pending:"amber", submitted:"green", overdue:"red" }[t.status]||"blue"}>{t.status==="pending"?"Chờ":t.status==="submitted"?"Đã nộp":"Trễ"}</Badge>
                </div>
              ))
          )}
        </Card>
      </div>
    </div>
  );
}


// cài đặt

function SettingsPage({ state, user }) {
  const t = user.data;
  const [tab, setTab] = useState("profile");
  const [name, setName] = useState(t.name);
  const [subject, setSubject] = useState(t.subject || "");
  const [pw, setPw] = useState("");
  const [pwOld, setPwOld] = useState("");
  const [em, setEm] = useState(t.em || "👨‍🏫");
  const [saved, setSaved] = useState(false);
  const [errP, setErrP] = useState("");
  const [showAddT, setShowAddT] = useState(false);
  const [newT, setNewT] = useState({ name: "", username: "", password: "", subject: SUBJECTS[0], em: "👨‍🏫" });
  const [errT, setErrT] = useState("");
  const [editT, setEditT] = useState(null);
  const [exportMsg, setExportMsg] = useState("");
  const importRef = useRef();
  const { confirm, ConfirmUI } = useConfirm();

  const saveProfile = () => {
    setErrP("");
    if (!name.trim()) { setErrP("Nhập tên của bạn"); return; }
    if (pw && pw.length < 4) { setErrP("Mật khẩu mới tối thiểu 4 ký tự"); return; }
    if (pw && !pwOld) { setErrP("Nhập mật khẩu hiện tại để đổi"); return; }
    if (pw && t.password !== pwOld) { setErrP("Mật khẩu hiện tại không đúng"); return; }
    state.setTeachers(p => p.map(x => x.id === t.id ? { ...x, name: name.trim(), subject, em, ...(pw ? { password: pw } : {}) } : x));
    setSaved(true); setPw(""); setPwOld("");
    setTimeout(() => setSaved(false), 2500);
  };

  const addOrEditTeacher = () => {
    setErrT("");
    if (!newT.name.trim() || !newT.username.trim() || (!editT && !newT.password)) { setErrT("Điền đầy đủ thông tin bắt buộc"); return; }
    if (state.teachers.find(x => x.username === newT.username.trim() && x.id !== editT?.id)) { setErrT("Username đã tồn tại"); return; }
    if (editT) {
      state.setTeachers(p => p.map(x => x.id === editT.id ? { ...x, name: newT.name.trim(), username: newT.username.trim(), subject: newT.subject, em: newT.em, ...(newT.password ? { password: newT.password } : {}) } : x));
    } else {
      if (newT.password.length < 4) { setErrT("Mật khẩu tối thiểu 4 ký tự"); return; }
      state.setTeachers(p => [...p, { id: "t_" + Date.now(), name: newT.name.trim(), username: newT.username.trim(), password: newT.password, subject: newT.subject, em: newT.em, isAdmin: false }]);
    }
    setNewT({ name: "", username: "", password: "", subject: SUBJECTS[0], em: "👨‍🏫" }); setShowAddT(false); setEditT(null); setErrT("");
  };

  const deleteTeacher = async tid => {
    if (tid === t.id) { setErrT("Không thể xóa tài khoản đang đăng nhập!"); return; }
    const ok = await confirm("Xóa giáo viên này?");
    if (!ok) return;
    state.setTeachers(p => p.filter(x => x.id !== tid));
  };

  // xuất json
  const exportData = () => {
    const data = { teachers: state.teachers, classes: state.classes, students: state.students, assignments: state.assignments, attendance: state.attendance };
    const json = JSON.stringify(data, null, 2);
    const uri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    const a = document.createElement("a");
    a.href = uri;
    a.download = "eclassp2k-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setExportMsg("Đã xuất dữ liệu!");
    setTimeout(() => setExportMsg(""), 3000);
  };

  const importData = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (data.teachers) state.setTeachers(data.teachers);
        if (data.classes) state.setClasses(data.classes);
        if (data.students) state.setStudents(data.students);
        if (data.assignments) state.setAssignments(data.assignments);
        if (data.attendance) state.setAttendance(data.attendance);
        setExportMsg("Import thành công!");
        setTimeout(() => setExportMsg(""), 3000);
      } catch { setExportMsg("File không hợp lệ!"); setTimeout(() => setExportMsg(""), 3000); }
    };
    r.readAsText(file);
  };

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {ConfirmUI}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {[["profile","Hồ sơ"],["teachers","Quản lý GV"],["data","Dữ liệu"]].map(([v, l]) => <button key={v} onClick={() => setTab(v)} style={{ padding: "6px 15px", borderRadius: 9, border: `1px solid ${tab===v?"rgba(79,172,254,.4)":"rgba(255,255,255,.07)"}`, background: tab===v?"rgba(79,172,254,.1)":"transparent", color: tab===v?"#4FACFE":"#4A6580", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>)}
      </div>
      {tab === "profile" && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4", marginBottom: 16 }}>Thông tin tài khoản</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 8, letterSpacing: ".05em" }}>AVATAR</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJIS.slice(0, 16).map(e => <button key={e} onClick={() => setEm(e)} style={{ width: 34, height: 34, borderRadius: 9, border: `2px solid ${em===e?"#4FACFE":"rgba(255,255,255,.08)"}`, background: em===e?"rgba(79,172,254,.1)":"rgba(255,255,255,.03)", cursor: "pointer", fontSize: 17 }}>{e}</button>)}
            </div>
          </div>
          <Inp label="HỌ VÀ TÊN" value={name} onChange={setName} required />
          <Inp label="MÔN PHỤ TRÁCH" value={subject} onChange={setSubject} placeholder="Toán, Lý..." />
          <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 14, marginTop: 4, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 10 }}>ĐỔI MẬT KHẨU (để trống nếu không đổi)</div>
            <Inp label="MẬT KHẨU HIỆN TẠI" value={pwOld} onChange={setPwOld} type="password" placeholder="Mật khẩu hiện tại" />
            <Inp label="MẬT KHẨU MỚI" value={pw} onChange={setPw} type="password" placeholder="Tối thiểu 4 ký tự" />
          </div>
          <ErrBox msg={errP} />
          {saved && <div style={{ fontSize: 12, color: "#34D399", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Check size={13} />Đã lưu thành công!</div>}
          <Btn onClick={saveProfile}><Save size={13} />Lưu thay đổi</Btn>
        </Card>
      )}
      {tab === "teachers" && (
        <div className="scard" style={{ overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,.055)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4" }}>Danh sách giáo viên ({state.teachers.length})</div>
            <Btn onClick={() => { setShowAddT(true); setEditT(null); setNewT({ name: "", username: "", password: "", subject: SUBJECTS[0], em: "👨‍🏫" }); setErrT(""); }} small><Plus size={12} />Thêm GV</Btn>
          </div>
          {state.teachers.map(x => (
            <div key={x.id} style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,.03)", display: "flex", alignItems: "center", gap: 12 }}>
              <Av em={x.em||"👨‍🏫"} sz={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#E2EAF4" }}>{x.name}</div>
                <div style={{ fontSize: 10, color: "#2E4A6A" }}>@{x.username} · {x.subject||"—"}{x.isAdmin?" · Admin":""}</div>
              </div>
              {x.id === t.id && <Badge c="violet">Bạn</Badge>}
              {x.isAdmin && x.id !== t.id && <Badge c="amber">Admin</Badge>}
              <button onClick={() => { setEditT(x); setNewT({ name: x.name, username: x.username, password: "", subject: x.subject||SUBJECTS[0], em: x.em||"👨‍🏫" }); setErrT(""); setShowAddT(true); }} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(79,172,254,.22)", background: "rgba(79,172,254,.06)", color: "#4FACFE", cursor: "pointer", display: "flex" }}><Edit2 size={12} /></button>
              {x.id !== t.id && <button onClick={() => deleteTeacher(x.id)} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex" }}><Trash2 size={12} /></button>}
            </div>
          ))}
          {errT && <div style={{ padding: "10px 16px" }}><ErrBox msg={errT} /></div>}
        </div>
      )}
      {tab === "data" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4", marginBottom: 12 }}>Sao lưu & phục hồi</div>
            <div style={{ fontSize: 12, color: "#3D5A78", marginBottom: 16 }}>Xuất toàn bộ dữ liệu dưới dạng JSON để sao lưu.</div>
            {exportMsg && <div style={{ fontSize: 12, color: "#34D399", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Check size={13} />{exportMsg}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={exportData} variant="success"><Download size={13} />Xuất JSON</Btn>
              <Btn onClick={() => importRef.current?.click()} variant="ghost"><Upload size={13} />Nhập dữ liệu</Btn>
              <input ref={importRef} type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444", marginBottom: 8 }}>Vùng nguy hiểm</div>
            <Btn variant="danger" onClick={async () => {
              const ok = await confirm("Xóa toàn bộ dữ liệu lớp học, học sinh, bài tập, điểm danh?");
              if (!ok) return;
              state.setClasses([]); state.setStudents([]); state.setAssignments({}); state.setAttendance({}); state.setFiles({}); state.setMessages({}); state.setSeats({}); state.setPendingStudents([]);
            }}><Trash2 size={13} />Xóa toàn bộ</Btn>
          </Card>
        </div>
      )}
      {showAddT && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAddT(false)}>
          <div className="modal" style={{ width: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#E2EAF4" }}>{editT ? "Sửa giáo viên" : "Thêm giáo viên"}</h2>
              <button onClick={() => { setShowAddT(false); setEditT(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D5A78" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 7, letterSpacing: ".05em" }}>AVATAR</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {["👨‍🏫","👩‍🏫","👨‍💼","👩‍💼","🧑‍🏫","👨‍🔬","👩‍🔬","👨‍💻","👩‍💻","🎓","📚","⭐"].map(e => <button key={e} onClick={() => setNewT(p => ({ ...p, em: e }))} style={{ width: 32, height: 32, borderRadius: 7, border: `2px solid ${newT.em===e?"#4FACFE":"rgba(255,255,255,.08)"}`, background: newT.em===e?"rgba(79,172,254,.1)":"rgba(255,255,255,.03)", cursor: "pointer", fontSize: 16 }}>{e}</button>)}
              </div>
            </div>
            <Inp label="HỌ VÀ TÊN" value={newT.name} onChange={v => setNewT(p => ({ ...p, name: v }))} placeholder="Tên giáo viên" required />
            <Inp label="USERNAME" value={newT.username} onChange={v => setNewT(p => ({ ...p, username: v }))} placeholder="vd: gv.nam" required note="Phải là duy nhất" />
            <Inp label={editT ? "MẬT KHẨU MỚI (để trống nếu không đổi)" : "MẬT KHẨU"} value={newT.password} onChange={v => setNewT(p => ({ ...p, password: v }))} type="password" placeholder="Tối thiểu 4 ký tự" required={!editT} />
            <Sel label="MÔN PHỤ TRÁCH" value={newT.subject} onChange={v => setNewT(p => ({ ...p, subject: v }))} options={SUBJECTS} />
            <ErrBox msg={errT} />
            <div style={{ display: "flex", gap: 9 }}>
              <Btn variant="ghost" onClick={() => { setShowAddT(false); setEditT(null); }} style={{ flex: 1 }}>Hủy</Btn>
              <Btn onClick={addOrEditTeacher} style={{ flex: 2 }}>{editT ? "Lưu" : "Tạo tài khoản"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




function App({ user, state, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [col, setCol] = useState(false);

  const classId = user.role === "teacher"
    ? state.classes.find(c => c.teacherId === user.data.id)?.id
    : user.classId;
  const classInfo = state.classes.find(c => c.id === classId);
  const myClassIds = useMemo(() => state.classes.filter(c => c.teacherId === user?.data?.id).map(c => c.id), [state.classes, user]);
  const pendingCount = user.role === "teacher" ? state.pendingStudents.filter(p => myClassIds.includes(p.classId)).length : 0;

  const PAGES = useMemo(() => ({
    dashboard:   p => <DashPage    {...p} setView={setView} />,
    students:    p => <StudentsPage  {...p} />,
    seating:     p => <SeatingPage   {...p} />,
    attendance:  p => <AttPage       {...p} />,
    chat:        p => <ChatPage      {...p} />,
    assignments: p => <TaskPage      {...p} />,
    wheel:       p => <WheelPage     {...p} />,
    library:     p => <LibPage       {...p} />,
    settings:    p => <SettingsPage  {...p} />,
    profile:     p => <ProfilePage   {...p} />,
    pending:     p => <PendingPage   {...p} />,
  }), []);

  const PageFn = PAGES[view] || PAGES.dashboard;

  return (
    <div className="ecp" style={{ display: "flex" }}>
      <Sidebar view={view} setView={setView} col={col} user={user} pendingCount={pendingCount} />
      <div style={{ marginLeft: col ? 58 : 224, flex: 1, minHeight: "100vh", transition: "margin-left .3s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column" }}>
        <TopBar view={view} toggleSide={() => setCol(p => !p)} user={user} onLogout={onLogout} classInfo={classInfo} />
        <div style={{ flex: 1 }}>
          <PageFn state={state} user={user} />
        </div>
      </div>
    </div>
  );
}


// Component gốc

export default function EClassP2K() {
  const state = useAppState();
  const [user, setUser] = useState(null);

  
  useEffect(() => {
    if (state.loaded && state.session) {
      
      if (state.session.role === "teacher") {
        const t = state.teachers.find(t => t.id === state.session.data.id);
        if (t) setUser({ ...state.session, data: t });
      } else if (state.session.role === "student") {
        const s = state.students.find(s => s.id === state.session.data.id);
        if (s) setUser({ ...state.session, data: s });
      }
    }
  }, [state.loaded]);

  
  useEffect(() => {
    if (!user || user.role !== "student") return;
    const updated = state.students.find(s => s.id === user.data.id);
    if (updated && JSON.stringify(updated) !== JSON.stringify(user.data)) {
      setUser(prev => ({ ...prev, data: updated }));
    }
  }, [state.students]);

  const handleLogin = session => {
    setUser(session);
    state.setSession(session);
  };

  const handleLogout = () => {
    setUser(null);
    state.setSession(null);
  };

  if (!state.loaded) {
    return (
      <>
        <style>{CSS}</style>
        <div className="ecp" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <img src={LOGO_LG} alt="E-Class P2K" style={{ width: 72, height: 72, borderRadius: 20, boxShadow: "0 12px 36px rgba(29,108,245,.45)", marginBottom: 20, animation: "float 2s ease-in-out infinite", display: "inline-block" }} />
            <div style={{ fontSize: 14, color: "#3D5A78" }}>Đang tải dữ liệu...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      {!user
        ? <LoginPage state={state} onLogin={handleLogin} />
        : <App user={user} state={state} onLogout={handleLogout} />
      }
    </>
  );
}