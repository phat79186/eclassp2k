import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Home, BookOpen, MessageSquare, QrCode, Grid, Shuffle,Library, User, Search, Send, Menu,CheckCircle, Clock, Plus, Upload, Download,FileText, Hash, Paperclip,RefreshCw, Trophy,GraduationCap, LogOut, X, Edit2, Trash2, Save,UserPlus, Settings, Eye, EyeOff,AlertTriangle, Check, GripVertical,Users, School, Key,Shield, Phone, Calendar, ChevronLeft, ChevronRight,BarChart2, Bell, UserCheck, UserX, LayoutGrid, Camera
} from "lucide-react";


// css toàn cục 
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;margin:0;padding:0} html{scroll-behavior:smooth}

/* ─── KEYFRAMES ─── */
@keyframes gshift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scanline{0%{top:-4px}100%{top:100%}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-5px)}80%{transform:translateX(4px)}}
@keyframes pop{0%{transform:scale(.82) translateY(12px);opacity:0}55%{transform:scale(1.04) translateY(-2px)}80%{transform:scale(.98)}100%{transform:scale(1) translateY(0);opacity:1}}
@keyframes glowbeat{0%,100%{box-shadow:0 0 18px rgba(79,172,254,.2),0 0 0 0 rgba(79,172,254,.15)}50%{box-shadow:0 0 48px rgba(79,172,254,.55),0 0 0 6px rgba(79,172,254,.08)}}
@keyframes spin360{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-9px) rotate(1deg)}}
@keyframes pulse-ring{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.7);opacity:0}}
@keyframes slideInLeft{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideInRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes orbit{from{transform:rotate(0deg) translateX(70px) rotate(0deg)}to{transform:rotate(360deg) translateX(70px) rotate(-360deg)}}
@keyframes breathe{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.08);opacity:1}}
@keyframes countUp{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes borderGlow{0%,100%{border-color:rgba(79,172,254,.12)}50%{border-color:rgba(79,172,254,.45)}}
@keyframes ripple{0%{transform:scale(0);opacity:.7}100%{transform:scale(3);opacity:0}}
@keyframes particleFly{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--px),var(--py)) scale(0);opacity:0}}
@keyframes typewriter{from{width:0}to{width:100%}}
@keyframes slideDown{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
@keyframes winnerGlow{0%,100%{box-shadow:0 0 0 0 rgba(79,172,254,0),0 8px 32px rgba(0,0,0,.5)}50%{box-shadow:0 0 0 8px rgba(79,172,254,.15),0 8px 48px rgba(79,172,254,.3)}}
@keyframes navActive{from{width:0;opacity:0}to{width:3px;opacity:1}}
@keyframes stagger1{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes stagger2{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes stagger3{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes stagger4{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes morphGrad{0%{background-position:0% 50%}33%{background-position:100% 50%}66%{background-position:50% 0%}100%{background-position:0% 50%}}
@keyframes cardReveal{from{opacity:0;transform:scale(.93) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes toastIn{from{opacity:0;transform:translateX(100%) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes rotateGlow{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}
@keyframes glowPulseGreen{0%,100%{box-shadow:0 0 12px rgba(52,211,153,.25)}50%{box-shadow:0 0 28px rgba(52,211,153,.6)}}
@keyframes dash{to{stroke-dashoffset:0}}
@keyframes logoEntrance{0%{opacity:0;transform:scale(.5) rotate(-15deg)}60%{transform:scale(1.08) rotate(3deg)}80%{transform:scale(.97) rotate(-1deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}

/* ─── BASE ─── */
.ecp{font-family:'Outfit',-apple-system,sans-serif;background:#050C1A;color:#E2EAF4;min-height:100vh;overflow-x:hidden}
.hfont{font-family:'DM Serif Display',serif}
.gtext{background:linear-gradient(135deg,#4FACFE 0%,#00F2FE 35%,#43E97B 70%,#A78BFA 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;background-size:300% 300%;animation:gshift 5s ease infinite}

/* ─── PAGE TRANSITIONS ─── */
.page{animation:fadeUp .45s cubic-bezier(.22,.68,0,1.2) forwards;min-height:calc(100vh - 60px)}
.page > *:nth-child(1){animation:stagger1 .4s .05s cubic-bezier(.22,.68,0,1.2) both}
.page > *:nth-child(2){animation:stagger2 .4s .12s cubic-bezier(.22,.68,0,1.2) both}
.page > *:nth-child(3){animation:stagger3 .4s .19s cubic-bezier(.22,.68,0,1.2) both}
.page > *:nth-child(4){animation:stagger4 .4s .26s cubic-bezier(.22,.68,0,1.2) both}

/* ─── MODALS ─── */
.modal-bg{position:fixed;inset:0;background:rgba(2,6,18,.85);backdrop-filter:blur(18px) saturate(1.4);-webkit-backdrop-filter:blur(18px) saturate(1.4);z-index:300;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease}
.modal{background:linear-gradient(145deg,#0B1B32,#080F21);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:28px;min-width:320px;max-width:95vw;max-height:92vh;overflow-y:auto;animation:pop .38s cubic-bezier(.34,1.56,.64,1);box-shadow:0 50px 100px rgba(0,0,0,.7),0 0 0 1px rgba(79,172,254,.07),inset 0 1px 0 rgba(255,255,255,.07)}
.modal-flex{background:linear-gradient(145deg,#0B1B32,#080F21);border:1px solid rgba(255,255,255,.1);border-radius:22px;min-width:320px;max-width:95vw;max-height:90vh;overflow:hidden;animation:pop .38s cubic-bezier(.34,1.56,.64,1);box-shadow:0 50px 100px rgba(0,0,0,.7),0 0 0 1px rgba(79,172,254,.07),inset 0 1px 0 rgba(255,255,255,.07);display:flex;flex-direction:column}

/* ─── INPUTS ─── */
.inp{width:100%;padding:10px 14px;border-radius:11px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);color:#E2EAF4;font-size:13px;font-family:inherit;outline:none;transition:all .25s cubic-bezier(.4,0,.2,1)}
.inp:focus{border-color:rgba(79,172,254,.6);box-shadow:0 0 0 3px rgba(79,172,254,.12),0 2px 12px rgba(79,172,254,.1);background:rgba(79,172,254,.04)}
.inp::placeholder{color:#1E3450}
.inp:disabled{opacity:.45;cursor:not-allowed}
.inp:hover:not(:focus):not(:disabled){border-color:rgba(255,255,255,.15);background:rgba(255,255,255,.055)}
select.inp{cursor:pointer;color-scheme:dark}
select.inp option{background:#0A1628;color:#E2EAF4}

/* ─── NAV BUTTONS ─── */
.nbtn{transition:all .25s cubic-bezier(.4,0,.2,1);cursor:pointer;border-radius:11px;border:none;background:transparent;position:relative;overflow:hidden}
.nbtn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(79,172,254,.1),rgba(167,139,250,.06));opacity:0;transition:opacity .25s;border-radius:inherit}
.nbtn:hover::before{opacity:1}
.nbtn:hover{color:#4FACFE!important;transform:translateX(2px)}
.nbtn.act{background:linear-gradient(135deg,rgba(79,172,254,.14),rgba(167,139,250,.08))!important;color:#4FACFE!important;box-shadow:inset 0 0 0 1px rgba(79,172,254,.2)}
.nbtn:active{transform:scale(.97) translateX(1px)}

/* ─── GLASS ─── */
.glass{background:rgba(255,255,255,.025);backdrop-filter:blur(24px) saturate(1.3);-webkit-backdrop-filter:blur(24px) saturate(1.3);border:1px solid rgba(255,255,255,.075)}

/* ─── CARDS ─── */
.cglow{transition:all .3s cubic-bezier(.4,0,.2,1)}
.cglow:hover{transform:translateY(-2px) scale(1.005);box-shadow:0 16px 48px rgba(0,0,0,.55),0 0 0 1px rgba(79,172,254,.15)!important;border-color:rgba(79,172,254,.22)!important}

/* ─── PRIMARY BUTTON ─── */
.bprimary{background:linear-gradient(135deg,#1D6CF5,#7B3FE4);transition:all .28s cubic-bezier(.4,0,.2,1);cursor:pointer;border:none;color:#fff;font-family:inherit;font-weight:600;position:relative;overflow:hidden}
.bprimary::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.2),transparent);opacity:0;transition:opacity .2s}
.bprimary::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.3),transparent 70%);opacity:0;transition:opacity .3s;transform:translateY(-50%)}
.bprimary:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 12px 32px rgba(29,108,245,.5),0 4px 16px rgba(123,63,228,.3)}
.bprimary:hover::before{opacity:1}
.bprimary:hover::after{opacity:1}
.bprimary:active{transform:translateY(0) scale(.98);box-shadow:0 4px 12px rgba(29,108,245,.4)}
.bprimary:disabled{opacity:.38;cursor:not-allowed;transform:none;box-shadow:none}

/* ─── CARDS ─── */
.scard{background:linear-gradient(145deg,#0A1628,#07101F);border:1px solid rgba(255,255,255,.065);border-radius:15px;transition:all .28s cubic-bezier(.4,0,.2,1)}
.scard:hover{border-color:rgba(79,172,254,.18);background:linear-gradient(145deg,#0C1D30,#090F1E)}

/* ─── ANIMATIONS ─── */
.shake{animation:shake .4s cubic-bezier(.36,.07,.19,.97)}

.tag{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:.04em;text-transform:uppercase;transition:all .2s}
.tag:hover{filter:brightness(1.15) saturate(1.2);transform:scale(1.04)}

.drag-over{background:rgba(79,172,254,.1)!important;border-color:rgba(79,172,254,.55)!important;box-shadow:0 0 0 2px rgba(79,172,254,.3),inset 0 0 20px rgba(79,172,254,.05)!important}

/* ─── SEAT CELLS ─── */
.seat-cell{transition:all .25s cubic-bezier(.34,1.56,.64,1);position:relative}
.seat-cell.occupied:hover{transform:scale(1.1) translateY(-2px);z-index:5;filter:brightness(1.1)}
.seat-cell::after{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 0 rgba(79,172,254,0);transition:box-shadow .25s}
.seat-cell.occupied:hover::after{box-shadow:inset 0 0 0 2px rgba(79,172,254,.4),0 8px 24px rgba(79,172,254,.2)}

/* ─── SIDEBAR INDICATOR ─── */
.sidebar-ind{position:absolute;right:0;top:50%;transform:translateY(-50%);width:3px;height:0;background:linear-gradient(180deg,#4FACFE,#00F2FE,#43E97B);border-radius:2px 0 0 2px;animation:navActive .3s cubic-bezier(.34,1.56,.64,1) forwards;box-shadow:0 0 8px rgba(79,172,254,.6)}

/* ─── SCROLLBAR ─── */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(79,172,254,.25),rgba(167,139,250,.25));border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,rgba(79,172,254,.5),rgba(167,139,250,.5))}

/* ─── TOOLTIP ─── */
.tooltip{position:absolute;bottom:calc(100%+10px);left:50%;transform:translateX(-50%);background:linear-gradient(145deg,#0E2040,#091628);border:1px solid rgba(79,172,254,.2);border-radius:10px;padding:9px 14px;font-size:10px;white-space:nowrap;pointer-events:none;z-index:200;animation:slideDown .18s cubic-bezier(.34,1.56,.64,1);box-shadow:0 12px 32px rgba(0,0,0,.6),0 0 0 1px rgba(79,172,254,.08)}
.tooltip::before{content:'';position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:linear-gradient(145deg,#0E2040,#091628);border-right:1px solid rgba(79,172,254,.2);border-bottom:1px solid rgba(79,172,254,.2);transform:translateX(-50%) rotate(45deg)}

/* ─── TABLE ROWS ─── */
.row-hover{transition:background .18s}
.row-hover:hover{background:linear-gradient(90deg,rgba(79,172,254,.04),rgba(79,172,254,.025),transparent)!important}

/* ─── CALENDAR ─── */
.cal-day{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;cursor:pointer;transition:all .22s cubic-bezier(.34,1.56,.64,1);border:1px solid transparent;position:relative;overflow:hidden}
.cal-day::before{content:'';position:absolute;inset:0;opacity:0;background:radial-gradient(circle at 50% 50%,rgba(79,172,254,.3),transparent);transition:opacity .2s}
.cal-day:hover{background:rgba(79,172,254,.12);border-color:rgba(79,172,254,.35);transform:scale(1.12)}
.cal-day:hover::before{opacity:1}
.cal-day:active{transform:scale(.95)}
.cal-day.present{background:linear-gradient(135deg,rgba(52,211,153,.18),rgba(52,211,153,.08));border-color:rgba(52,211,153,.5);color:#34D399;box-shadow:0 0 12px rgba(52,211,153,.15)}
.cal-day.absent{background:linear-gradient(135deg,rgba(239,68,68,.12),rgba(239,68,68,.06));border-color:rgba(239,68,68,.35);color:#EF4444}
.cal-day.today-mark{box-shadow:0 0 0 2px #4FACFE,0 0 12px rgba(79,172,254,.3);color:#4FACFE!important;font-weight:800!important}
.cal-day.no-session{opacity:.25;cursor:default}

/* ─── NOTIFICATION DOT ─── */
.notification-dot{position:absolute;top:-3px;right:-3px;width:9px;height:9px;border-radius:50%;background:linear-gradient(135deg,#EF4444,#DC2626);border:2px solid #050C1A;animation:glowbeat 1.8s ease-in-out infinite;box-shadow:0 0 8px rgba(239,68,68,.6)}

/* ─── SPECIAL EFFECTS ─── */
.shimmer{background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);background-size:800px 100%;animation:shimmer 2s infinite linear}

.pulse-green{animation:glowPulseGreen 2s ease-in-out infinite}

.card-reveal{animation:cardReveal .5s cubic-bezier(.22,.68,0,1.2) both}

/* ─── LOGO ANIMATION ─── */
.logo-entrance{animation:logoEntrance .8s cubic-bezier(.34,1.56,.64,1) both}

/* ─── RIPPLE ─── */
.ripple-host{position:relative;overflow:hidden}
.ripple-host .ripple-el{position:absolute;border-radius:50%;background:rgba(255,255,255,.25);animation:ripple .55s ease-out forwards;pointer-events:none;transform:scale(0)}

/* ─── WINNER HIGHLIGHT ─── */
.winner-card{animation:winnerGlow 1.5s ease-in-out infinite}

/* ─── GRADIENT BORDERS ─── */
.grad-border{position:relative;transition:box-shadow .3s,border-color .3s}
.grad-border:hover{border-color:rgba(79,172,254,.28)!important;box-shadow:0 0 0 1px rgba(79,172,254,.18),0 16px 48px rgba(0,0,0,.55)!important}

/* ─── QR GLOW ─── */
.qr-glow{box-shadow:0 0 0 1px rgba(79,172,254,.3),0 0 32px rgba(79,172,254,.2),0 0 64px rgba(79,172,254,.08);animation:borderGlow 3s ease-in-out infinite}

/* ─── NAV ITEMS STAGGER ─── */
.nav-item-0{animation:slideInLeft .35s .05s cubic-bezier(.22,.68,0,1.2) both}
.nav-item-1{animation:slideInLeft .35s .09s cubic-bezier(.22,.68,0,1.2) both}
.nav-item-2{animation:slideInLeft .35s .13s cubic-bezier(.22,.68,0,1.2) both}
.nav-item-3{animation:slideInLeft .35s .17s cubic-bezier(.22,.68,0,1.2) both}
.nav-item-4{animation:slideInLeft .35s .21s cubic-bezier(.22,.68,0,1.2) both}
.nav-item-5{animation:slideInLeft .35s .25s cubic-bezier(.22,.68,0,1.2) both}
.nav-item-6{animation:slideInLeft .35s .29s cubic-bezier(.22,.68,0,1.2) both}
.nav-item-7{animation:slideInLeft .35s .33s cubic-bezier(.22,.68,0,1.2) both}
.nav-item-8{animation:slideInLeft .35s .37s cubic-bezier(.22,.68,0,1.2) both}
.nav-item-9{animation:slideInLeft .35s .41s cubic-bezier(.22,.68,0,1.2) both}

/* ─── STAT COUNTERS ─── */
.stat-val{animation:countUp .5s cubic-bezier(.22,.68,0,1.2) both}

/* ─── TOPBAR ─── */
.topbar{animation:slideDown .4s cubic-bezier(.22,.68,0,1.2) both}

/* ─── BADGE HOVER ─── */
.tag{transition:all .2s cubic-bezier(.34,1.56,.64,1)}

/* ─── PROGRESS BAR ─── */
.progress-fill{transition:width 1.4s cubic-bezier(.25,.46,.45,.94)!important}

/* ─── WHEEL WINNER ─── */
@keyframes confettiBurst{0%{transform:translateY(0) rotate(0deg) scale(1);opacity:1}100%{transform:translateY(-80px) rotate(720deg) scale(0);opacity:0}}
.confetti{animation:confettiBurst .8s ease-out both}

/* ─── RESPONSIVE ─── */
@media (max-width: 768px) {
  .modal{padding:20px!important;max-height:88vh!important;border-radius:18px 18px 0 0!important}
  .modal-bg{align-items:flex-end!important}
  .modal-flex{max-height:88vh!important;border-radius:18px 18px 0 0!important}
}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:100;background:rgba(5,12,26,.97);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid rgba(79,172,254,.08);padding:6px 0 max(6px,env(safe-area-inset-bottom));gap:0}
`;

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
const dragIdRef_global = { current: null };
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
  const m = { blue:"rgba(79,172,254,.12):#4FACFE:rgba(79,172,254,.25)", green:"rgba(52,211,153,.12):#34D399:rgba(52,211,153,.25)", amber:"rgba(245,158,11,.12):#F59E0B:rgba(245,158,11,.25)", red:"rgba(239,68,68,.12):#EF4444:rgba(239,68,68,.25)", violet:"rgba(167,139,250,.12):#A78BFA:rgba(167,139,250,.25)", gray:"rgba(100,116,139,.12):#94A3B8:rgba(100,116,139,.2)" };
  const [bg, col, border] = (m[c] || m.blue).split(":");
  return <span className="tag" style={{ background: bg, color: col, border: `1px solid ${border}` }}>{children}</span>;
};

const Av = ({ em, photo, sz = 34, glow }) => (
  <div style={{ width: sz, height: sz, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,rgba(79,172,254,.12),rgba(167,139,250,.08))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.44, flexShrink: 0, boxShadow: glow ? "0 0 0 2px rgba(79,172,254,.5),0 0 20px rgba(79,172,254,.4),0 0 40px rgba(79,172,254,.15)" : "0 2px 8px rgba(0,0,0,.3)", transition: "all .35s cubic-bezier(.34,1.56,.64,1)", border: glow ? "2px solid rgba(79,172,254,.55)" : "2px solid rgba(255,255,255,.08)", animation: glow ? "glowPulseGreen 2s ease-in-out infinite" : "none" }}>
    {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (em || "👤")}
  </div>
);

const Bar = ({ val, max = 100, col = "#4FACFE", h = 4 }) => (
  <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 99, height: h, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,.3)" }}>
    <div className="progress-fill" style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${col},${col}CC)`, width: `${Math.min((val / (max || 1)) * 100, 100)}%`, boxShadow: `0 0 10px ${col}66, 0 0 20px ${col}22` }} />
  </div>
);

const Card = ({ children, style = {} }) => (
  <div className="scard cglow grad-border" style={{ padding: 20, isolation: "isolate", ...style }}>{children}</div>
);

const Btn = ({ children, onClick, style = {}, variant = "primary", disabled, small }) => {
  const handleClick = (e) => {
    if (disabled) return;
    const btn = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.className = "ripple-el";
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px;`;
    btn.classList.add("ripple-host");
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    onClick && onClick(e);
  };
  const base = { padding: small ? "6px 13px" : "9px 20px", borderRadius: 11, fontSize: small ? 11 : 13, fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5, cursor: disabled ? "not-allowed" : "pointer", transition: "all .28s cubic-bezier(.4,0,.2,1)", border: "none", ...style };
  if (variant === "primary") return <button onClick={handleClick} disabled={disabled} className="bprimary" style={base}>{children}</button>;
  if (variant === "ghost")   return <button onClick={handleClick} disabled={disabled} style={{ ...base, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.035)", color: "#94A3B8", transition: "all .25s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.18)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.035)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.09)"; }}>{children}</button>;
  if (variant === "danger")  return <button onClick={handleClick} disabled={disabled} style={{ ...base, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.07)", color: "#EF4444", transition: "all .25s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,.14)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,.25)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,.07)"; e.currentTarget.style.boxShadow = ""; }}>{children}</button>;
  if (variant === "success") return <button onClick={handleClick} disabled={disabled} style={{ ...base, border: "1px solid rgba(52,211,153,.3)", background: "rgba(52,211,153,.07)", color: "#34D399", transition: "all .25s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(52,211,153,.14)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(52,211,153,.25)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(52,211,153,.07)"; e.currentTarget.style.boxShadow = ""; }}>{children}</button>;
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
  <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 12, padding: "10px 14px", borderRadius: 11, background: "linear-gradient(135deg,rgba(239,68,68,.1),rgba(239,68,68,.06))", border: "1px solid rgba(239,68,68,.25)", display: "flex", alignItems: "center", gap: 7, animation: "slideDown .3s cubic-bezier(.34,1.56,.64,1)", boxShadow: "0 4px 16px rgba(239,68,68,.1)" }}>
    <AlertTriangle size={13} style={{ flexShrink: 0 }} />{msg}
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
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    if (password && password.length < 4) { setErr("Mật khẩu tối thiểu 4 ký tự"); return; }
    if (password !== password2) { setErr("Mật khẩu xác nhận không khớp"); return; }
    const dup = state.pendingStudents.find(p => p.name.toLowerCase() === name.trim().toLowerCase() && p.classId === classId);
    if (dup) { setErr("Bạn đã đăng ký rồi, đang chờ duyệt"); return; }
    state.setPendingStudents(prev => [...prev, {
      id: "pend_" + Date.now() + Math.random(),
      name: name.trim(), classId, phone, dob,
      em, photo, password: password || null, submittedAt: Date.now(),
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
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 5, letterSpacing: ".05em" }}>MẬT KHẨU <span style={{ color: "#3D5A78", fontWeight: 400, fontSize: 10 }}>(tuỳ chọn)</span></div>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input className="inp" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Tối thiểu 4 ký tự" style={{ display: "block", paddingRight: 42 }} />
          <button onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#2E4A6A" }}>{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
        </div>
        <input className="inp" type={showPw ? "text" : "password"} value={password2} onChange={e => setPassword2(e.target.value)} placeholder="Xác nhận mật khẩu" style={{ display: "block" }} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 10, letterSpacing: ".05em" }}>AVATAR</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: "linear-gradient(135deg,rgba(79,172,254,.15),rgba(167,139,250,.1))", border: "2px solid rgba(79,172,254,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, boxShadow: "0 0 16px rgba(79,172,254,.2)" }}>{em}</div>
          <div style={{ fontSize: 11, color: "#3D5A78" }}>Chọn avatar của bạn</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {EMOJIS.slice(0, 20).map(e => (
            <button key={e} onClick={() => setEm(e)} style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${em === e ? "rgba(79,172,254,.7)" : "rgba(255,255,255,.07)"}`, background: em === e ? "linear-gradient(135deg,rgba(79,172,254,.18),rgba(79,172,254,.08))" : "rgba(255,255,255,.03)", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .22s cubic-bezier(.34,1.56,.64,1)", transform: em===e ? "scale(1.12)" : "scale(1)", boxShadow: em===e ? "0 4px 14px rgba(79,172,254,.25)" : "none" }}>{e}</button>
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
  const [sPass, setSPass] = useState("");
  const [showSPass, setShowSPass] = useState(false);
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
      const pending = state.pendingStudents.find(s => s.classId === cls.id && s.code.toUpperCase() === sCode.trim().toUpperCase());
      if (pending) { setErr("Tài khoản chưa được giáo viên xét duyệt. Vui lòng chờ!"); shake(); return; }
      const st = state.students.find(s => s.classId === cls.id && s.code.toUpperCase() === sCode.trim().toUpperCase());
      if (!st) { setErr("Mã học sinh không đúng hoặc không thuộc lớp này"); shake(); return; }
      if (st.password && st.password !== sPass) { setErr("Sai mật khẩu"); shake(); return; }
      if (!st.password && sPass) { setErr("Tài khoản này chưa có mật khẩu, bỏ trống để đăng nhập"); shake(); return; }
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
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,108,245,.18),transparent 70%)", top: -200, left: -200, filter: "blur(80px)", animation: "breathe 4s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle,rgba(123,63,228,.15),transparent 70%)", bottom: -150, right: -100, filter: "blur(70px)", animation: "breathe 5s 1s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420, padding: "0 20px", animation: "fadeUp .5s cubic-bezier(.22,.68,0,1.2)" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ marginBottom: 18, display: "inline-block", position: "relative", animation: "float 4s ease-in-out infinite" }}>
            <img src={LOGO_LG} alt="E-Class P2K" className="logo-entrance" style={{ width: 96, height: 96, borderRadius: 24, boxShadow: "0 16px 48px rgba(29,108,245,.55),0 0 0 1px rgba(79,172,254,.15)", display: "block" }} />
            <div style={{ position: "absolute", inset: -10, borderRadius: 34, border: "1.5px solid rgba(79,172,254,.2)", animation: "glowbeat 2.5s ease-in-out infinite", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: -20, borderRadius: 44, border: "1px solid rgba(79,172,254,.08)", animation: "glowbeat 2.5s .5s ease-in-out infinite", pointerEvents: "none" }} />
          </div>
          <h1 className="hfont" style={{ fontSize: 33, fontWeight: 400, letterSpacing: "-.01em", color: "#E2EAF4", animation: "fadeUp .5s .15s both" }}>
            E-Class <span className="gtext">P2K</span>
          </h1>
          <p style={{ fontSize: 12, color: "#2E4A6A", marginTop: 6, animation: "fadeUp .5s .25s both", letterSpacing: ".03em" }}>Nền tảng quản lý lớp học thông minh</p>
        </div>
        <div style={{ background: "linear-gradient(145deg,#0B1B32,#080F21)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 24, padding: 28, boxShadow: "0 40px 100px rgba(0,0,0,.7),0 0 0 1px rgba(79,172,254,.05),inset 0 1px 0 rgba(255,255,255,.06)", animation: "fadeUp .5s .3s both" }}>
          <div style={{ display: "flex", borderRadius: 13, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", overflow: "hidden", marginBottom: 24 }}>
            {[["teacher","👨‍🏫","Giáo viên"],["student","👨‍🎓","Học sinh"]].map(([r, ic, label]) => (
              <button key={r} onClick={() => { setRole(r); setErr(""); }} style={{ flex: 1, padding: "11px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: role === r ? "linear-gradient(135deg,rgba(79,172,254,.2),rgba(123,63,228,.12))" : "transparent", color: role === r ? "#4FACFE" : "#2E4A6A", transition: "all .28s cubic-bezier(.4,0,.2,1)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: role === r ? "inset 0 0 0 1px rgba(79,172,254,.25)" : "none" }}>
                <span style={{ transition: "transform .28s cubic-bezier(.34,1.56,.64,1)", transform: role === r ? "scale(1.2)" : "scale(1)" }}>{ic}</span>{label}
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
                    <button onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#2E4A6A", transition: "color .2s" }}>
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
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 5, letterSpacing: ".05em" }}>MẬT KHẨU <span style={{ color: "#3D5A78", fontWeight: 400, fontSize: 10 }}>(nếu được đặt)</span></div>
                  <div style={{ position: "relative" }}>
                    <input className="inp" type={showSPass ? "text" : "password"} value={sPass} onChange={e => setSPass(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()} placeholder="Nhập mật khẩu học sinh" style={{ display: "block", paddingRight: 42 }} />
                    <button onClick={() => setShowSPass(p => !p)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#2E4A6A", transition: "color .2s" }}>
                      {showSPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}
            <ErrBox msg={err} />
            <Btn onClick={doLogin} style={{ width: "100%", marginTop: 6, justifyContent: "center", padding: "11px 20px", fontSize: 14, letterSpacing: ".02em" }} disabled={role === "teacher" ? (!uname || !pass) : (!sClass || !sCode)}>
              {role === "teacher" ? "Đăng nhập →" : "Vào lớp học →"}
            </Btn>
          </div>
          {role === "student" && (
            <button onClick={() => setShowRegister(true)} style={{ width: "100%", marginTop: 12, padding: "10px", borderRadius: 11, border: "1px dashed rgba(79,172,254,.35)", background: "transparent", color: "#4FACFE", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .28s cubic-bezier(.4,0,.2,1)" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,172,254,.07)"; e.currentTarget.style.borderStyle = "solid"; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderStyle = "dashed"; e.currentTarget.style.transform = ""; }}>
              <UserPlus size={13} />Đăng ký tài khoản mới
            </button>
          )}
          <div style={{ marginTop: 18, padding: 13, borderRadius: 12, background: "linear-gradient(135deg,rgba(255,255,255,.025),rgba(255,255,255,.015))", border: "1px solid rgba(255,255,255,.06)", fontSize: 11, color: "#2E4A6A", lineHeight: 1.9 }}>
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
  { id: "library",     Ic: Library,       l: "Tài liệu" },
  { id: "profile",     Ic: User,          l: "Hồ sơ" },
];

function Sidebar({ view, setView, col, user, pendingCount }) {
  const nav = user.role === "teacher" ? NAV_TEACHER : NAV_STUDENT;
  return (
    <div style={{ width: col ? 58 : 224, height: "100vh", background: "linear-gradient(180deg,#06101E 0%,#050C1A 100%)", borderRight: "1px solid rgba(79,172,254,.07)", display: "flex", flexDirection: "column", transition: "width .32s cubic-bezier(.4,0,.2,1)", position: "fixed", left: 0, top: 0, zIndex: 50, overflow: "hidden", boxShadow: "4px 0 32px rgba(0,0,0,.4)" }}>
      <div style={{ height: 60, display: "flex", alignItems: "center", padding: col ? "0 11px" : "0 16px", borderBottom: "1px solid rgba(79,172,254,.06)", gap: 11, flexShrink: 0, background: "rgba(79,172,254,.02)" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={LOGO_SM} alt="E-Class P2K" style={{ width: 36, height: 36, borderRadius: 11, display: "block", objectFit: "cover", boxShadow: "0 4px 20px rgba(29,108,245,.5),0 0 0 1px rgba(79,172,254,.2)", transition: "transform .3s cubic-bezier(.34,1.56,.64,1)" }} onMouseEnter={e => e.target.style.transform = "scale(1.1) rotate(3deg)"} onMouseLeave={e => e.target.style.transform = ""} />
        </div>
        {!col && <span className="hfont" style={{ fontSize: 15, fontWeight: 400, whiteSpace: "nowrap", color: "#E2EAF4", animation: "fadeIn .3s ease" }}>E-Class <span className="gtext">P2K</span></span>}
      </div>
      {!col && (
        <div style={{ padding: "8px 10px 2px" }}>
          <div style={{ padding: "5px 10px", borderRadius: 9, background: user.role === "teacher" ? "linear-gradient(135deg,rgba(167,139,250,.12),rgba(167,139,250,.06))" : "linear-gradient(135deg,rgba(79,172,254,.1),rgba(79,172,254,.05))", border: `1px solid ${user.role === "teacher" ? "rgba(167,139,250,.25)" : "rgba(79,172,254,.22)"}`, display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: user.role === "teacher" ? "#A78BFA" : "#4FACFE", boxShadow: user.role === "teacher" ? "0 2px 12px rgba(167,139,250,.1)" : "0 2px 12px rgba(79,172,254,.1)" }}>
            {user.role === "teacher" ? <GraduationCap size={11} style={{ filter: "drop-shadow(0 0 4px rgba(167,139,250,.8))" }} /> : <Trophy size={11} style={{ filter: "drop-shadow(0 0 4px rgba(79,172,254,.8))" }} />}
            {user.role === "teacher" ? "Giáo Viên" : "Học Sinh"}
          </div>
        </div>
      )}
      <div style={{ flex: 1, padding: col ? "6px 0" : "2px 8px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
        {nav.map(({ id, Ic, l }, idx) => (
          <div key={id} className={`nbtn nav-item-${idx} ${view === id ? "act" : ""}`} onClick={() => setView(id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: col ? "10px 0" : "7px 10px", justifyContent: col ? "center" : "flex-start", position: "relative", color: view === id ? "#4FACFE" : "#3D5A78" }}>
            <div style={{ position: "relative", transition: "transform .25s cubic-bezier(.34,1.56,.64,1)", ...(view === id ? { transform: "scale(1.15)" } : {}) }}>
              <Ic size={15} strokeWidth={view === id ? 2.5 : 1.8} style={{ filter: view === id ? "drop-shadow(0 0 6px rgba(79,172,254,.7))" : "none", transition: "filter .3s" }} />
              {id === "pending" && pendingCount > 0 && <div className="notification-dot" />}
            </div>
            {!col && <span style={{ fontSize: 12, fontWeight: view === id ? 700 : 400, whiteSpace: "nowrap", transition: "all .2s", letterSpacing: view === id ? ".01em" : "0" }}>{l}</span>}
            {!col && id === "pending" && pendingCount > 0 && <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 99, background: "rgba(239,68,68,.18)", color: "#EF4444", animation: "glowbeat 2s infinite" }}>{pendingCount}</span>}
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

function TopBar({ view, toggleSide, toggleMobile, user, onLogout, classInfo }) {
  const LBL = { dashboard:"Tổng quan", students:"Quản lý học sinh", seating:"Sơ đồ lớp", attendance:"Điểm danh QR", chat:"Chat lớp", assignments:"Bài tập", wheel:"Lucky Wheel", library:"Thư viện tài liệu", settings:"Cài đặt", profile:"Hồ sơ", pending:"Duyệt học sinh" };
  return (
    <div className="topbar" style={{ height: 60, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, background: "rgba(5,12,26,.92)", backdropFilter: "blur(24px) saturate(1.5)", WebkitBackdropFilter: "blur(24px) saturate(1.5)", borderBottom: "1px solid rgba(79,172,254,.06)", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 4px 24px rgba(0,0,0,.4)" }}>
      <button onClick={toggleSide} className="hide-mobile" style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,.05)", color: "#3D5A78", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}><Menu size={14} /></button>
      <button onClick={toggleMobile} className="hide-desktop" style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "rgba(255,255,255,.05)", color: "#3D5A78", cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center" }}><Menu size={16} /></button>
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
      password: pend.password || null,
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
    if (newSt.password && newSt.password.length < 4) { setErrSt("Mật khẩu tối thiểu 4 ký tự"); return; }
    const dup = state.students.find(s => s.code.toUpperCase() === newSt.code.trim().toUpperCase() && s.classId === selClass && s.id !== editStudent?.id);
    if (dup) { setErrSt("Mã học sinh đã tồn tại trong lớp này"); return; }
    const payload = { name: newSt.name.trim(), code: newSt.code.trim().toUpperCase(), em: newSt.em, photo: newSt.photo || null, phone: newSt.phone || "", dob: newSt.dob || "" };
    if (newSt.password) payload.password = newSt.password;
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
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 10, letterSpacing: ".05em" }}>EMOJI AVATAR</div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 15, background: "linear-gradient(135deg,rgba(79,172,254,.15),rgba(167,139,250,.1))", border: "2px solid rgba(79,172,254,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, boxShadow: "0 0 16px rgba(79,172,254,.2)" }}>{newSt.em}</div>
                  <div style={{ fontSize: 11, color: "#3D5A78" }}>Chọn avatar cho học sinh</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {EMOJIS.map(em => (
                    <button key={em} onClick={() => setNewSt(p => ({ ...p, em }))} style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${newSt.em === em ? "rgba(79,172,254,.7)" : "rgba(255,255,255,.07)"}`, background: newSt.em === em ? "linear-gradient(135deg,rgba(79,172,254,.18),rgba(79,172,254,.08))" : "rgba(255,255,255,.03)", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .22s cubic-bezier(.34,1.56,.64,1)", transform: newSt.em===em ? "scale(1.12)" : "scale(1)", boxShadow: newSt.em===em ? "0 4px 14px rgba(79,172,254,.25)" : "none" }}>{em}</button>
                  ))}
                </div>
              </div>
            )}
            <Inp label={editStudent ? "MẬT KHẨU MỚI (để trống nếu không đổi)" : "MẬT KHẨU (tuỳ chọn)"} value={newSt.password || ""} onChange={v => setNewSt(p => ({ ...p, password: v }))} type="password" placeholder="Tối thiểu 4 ký tự" />
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

function SeatCell({ slotI, compact, cellSz, cellH, editMode, dragId, hovSlot, getStudentAt, attKey, attendance, handleDragStart, handleDragEnd, handleDrop, setHovSlot, clearSlot, showTooltip, moveTooltip, hideTooltip }) {
  const st = getStudentAt(slotI);
  const isDragging = st && dragId === st.id;
  const isHov = hovSlot === slotI;
  const present = st && (attendance[attKey] || []).includes(st.id);
  const isDropTarget = isHov && dragId !== null && dragId !== st?.id;
  const sz = cellSz || (compact ? 58 : 64);
  const h  = cellH  || (compact ? 64 : 70);
  const avSz = Math.round(sz * 0.47);
  const fSize = Math.round(sz * 0.26);

  const onTouchStart = e => {
    if (!editMode || !st) return;
    e.preventDefault();
    handleDragStart(st.id);
    setHovSlot(slotI);
  };

  const onTouchMove = e => {
    if (!dragIdRef_global.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    window._dragX = touch.clientX;
    window._dragY = touch.clientY;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = el?.closest("[data-slot]");
    const targetSlot = cell ? Number(cell.dataset.slot) : null;
    setHovSlot(targetSlot);
  };

  const onTouchEnd = e => {
    if (!dragIdRef_global.current) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = el?.closest("[data-slot]");
    if (cell) handleDrop(Number(cell.dataset.slot));
    else { dragIdRef_global.current = null; setHovSlot(null); }
  };

  return (
    <div
      data-slot={slotI}
      className={`seat-cell${st ? " occupied" : ""}`}
      draggable={editMode && !!st}
      onDragStart={e => {
        if (!editMode || !st) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", st.id);
        handleDragStart(st.id);
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onContextMenu={e => { if (editMode && st) { e.preventDefault(); clearSlot(slotI); } }}
      onMouseEnter={e => {
        if (editMode && dragIdRef_global.current) { setHovSlot(slotI); return; }
        if (!editMode && st) { setHovSlot(slotI); showTooltip(st, present, e.clientX, e.clientY); }
      }}
      onMouseMove={e => { if (!editMode && st) moveTooltip(e.clientX, e.clientY); }}
      onMouseLeave={() => { setHovSlot(null); if (!editMode) hideTooltip(); }}
      style={{ width: sz, height: h, borderRadius: Math.round(sz*0.18), background: isDropTarget ? "rgba(79,172,254,.14)" : st ? (present ? "linear-gradient(135deg,rgba(52,211,153,.08),rgba(52,211,153,.04))" : "linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.03))") : "rgba(255,255,255,.012)", border: `1px solid ${isDropTarget ? "rgba(79,172,254,.7)" : st ? (present ? "rgba(52,211,153,.4)" : "rgba(255,255,255,.1)") : "rgba(255,255,255,.04)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, position: "relative", opacity: isDragging ? 0.3 : 1, cursor: editMode ? (st ? "grab" : "default") : "default", transition: "all .28s cubic-bezier(.34,1.56,.64,1)", flexShrink: 0, touchAction: editMode ? "none" : "auto", userSelect: "none", boxShadow: isDropTarget ? "0 0 20px rgba(79,172,254,.3),0 0 0 3px rgba(79,172,254,.15)" : present ? "0 0 14px rgba(52,211,153,.15)" : "none" }}
    >
      {st ? (
        <>
          <div style={{ width: avSz, height: avSz, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,rgba(79,172,254,.15),rgba(167,139,250,.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: fSize, flexShrink: 0, border: present ? "1.5px solid rgba(52,211,153,.4)" : "1.5px solid rgba(255,255,255,.08)" }}>
            {st.photo ? <img src={st.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : st.em}
          </div>
          <div style={{ fontSize: Math.max(7, Math.round(sz*0.13)), color: "#94A3B8", textAlign: "center", padding: "0 2px", lineHeight: 1.2, maxWidth: sz - 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {st.name.split(" ").pop()}
          </div>
          <div style={{ position: "absolute", top: 3, right: 3, width: Math.max(5,Math.round(sz*0.11)), height: Math.max(5,Math.round(sz*0.11)), borderRadius: "50%", background: present ? "#34D399" : "#EF4444", boxShadow: present ? "0 0 8px rgba(52,211,153,.8)" : "0 0 6px rgba(239,68,68,.5)", transition: "all .3s" }} />
          {editMode && sz >= 48 && <GripVertical size={7} style={{ position: "absolute", top: 2, left: 2, color: "#3D5A78", opacity: .6 }} />}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: Math.round(sz*0.28), height: Math.round(sz*0.28), borderRadius: "50%", background: "rgba(255,255,255,.025)", border: "1px dashed rgba(255,255,255,.06)" }} />
          {isDropTarget && <div style={{ fontSize: 7, color: "#4FACFE", fontWeight: 700, animation: "breathe .8s ease-in-out infinite" }}>Thả</div>}
        </div>
      )}
    </div>
  );
}

function SeatingPage({ state, user, isMobile }) {
  const cellSz    = isMobile ? 44 : 64;
  const cellH     = isMobile ? 50 : 70;
  const compactSz = isMobile ? 40 : 58;
  const compactH  = isMobile ? 46 : 64;
  const gridMinW  = isMobile ? 0 : 580;
  const toMinW    = isMobile ? 0 : 520;
  const myClasses = useMemo(() => user.role === "teacher"
    ? state.classes.filter(c => c.teacherId === user.data.id)
    : state.classes.filter(c => c.id === user.classId), [state.classes, user]);

  const [selClass, setSelClass] = useState(() => myClasses[0]?.id || "");
  const [seatTab, setSeatTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [dragId, setDragId] = useState(null);
  const dragIdRef = useRef(null);
  const [hovSlot, setHovSlot] = useState(null);

  const seatsRef = useRef(null);
  const stateRef = useRef(state);
  const seatKeyRef = useRef(null);

  useEffect(() => {
    const onMouseUp = () => {
      if (!dragIdRef.current) return;
      const el = document.elementFromPoint(window._dragX || 0, window._dragY || 0);
      const cell = el?.closest("[data-slot]");
      if (cell) {
        const targetSlot = Number(cell.dataset.slot);
        const activeDragId = dragIdRef.current;
        const seatsNow = seatsRef.current;
        const targetOccupant = seatsNow[targetSlot];
        const sourceSlot = Object.entries(seatsNow).find(([, v]) => v === activeDragId);
        const srcIdx = sourceSlot ? Number(sourceSlot[0]) : -1;
        stateRef.current.setSeats(prev => {
          const next = { ...(prev[seatKeyRef.current] || {}) };
          next[targetSlot] = activeDragId;
          if (srcIdx >= 0) {
            if (targetOccupant !== undefined && targetOccupant !== activeDragId) next[srcIdx] = targetOccupant;
            else delete next[srcIdx];
          }
          return { ...prev, [seatKeyRef.current]: next };
        });
      }
      dragIdRef.current = null;
      dragIdRef_global.current = null;
      setDragId(null);
      setHovSlot(null);
    };
    const onMouseMove = (e) => { window._dragX = e.clientX; window._dragY = e.clientY; };
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    return () => { document.removeEventListener("mouseup", onMouseUp); document.removeEventListener("mousemove", onMouseMove); };
  }, []);

  const tooltipElRef = useRef(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;z-index:99999;pointer-events:none;opacity:0;visibility:hidden;transition:opacity .12s;background:linear-gradient(145deg,#0E2040,#091628);border:1px solid rgba(79,172,254,.25);border-radius:12px;padding:10px 14px;font-size:11px;white-space:nowrap;box-shadow:0 16px 40px rgba(0,0,0,.7),0 0 0 1px rgba(79,172,254,.1);left:-9999px;top:-9999px";
    el.innerHTML = `<div class="tt-name" style="font-weight:700;color:#E2EAF4;margin-bottom:4px"></div><div class="tt-code" style="color:#4A6580;font-size:10px"></div><div class="tt-status" style="margin-top:5px;font-size:10px;font-weight:600"></div>`;
    document.body.appendChild(el);
    tooltipElRef.current = el;
    return () => { document.body.removeChild(el); tooltipElRef.current = null; };
  }, []);

  const showTooltip = useCallback((st, present, x, y) => {
    const el = tooltipElRef.current;
    if (!el) return;
    el.querySelector(".tt-name").textContent = st.name;
    el.querySelector(".tt-code").textContent = st.code;
    const status = el.querySelector(".tt-status");
    status.textContent = present ? "✓ Có mặt" : "✗ Vắng";
    status.style.color = present ? "#34D399" : "#EF4444";
    el.style.left = (x + 5) + "px";
    el.style.top = (y - 5) + "px";
    el.style.opacity = "1";
    el.style.visibility = "visible";
  }, []);

  const moveTooltip = useCallback((x, y) => {
    const el = tooltipElRef.current;
    if (!el) return;
    el.style.left = (x + 5) + "px";
    el.style.top = (y - 5) + "px";
  }, []);

  const hideTooltip = useCallback(() => {
    const el = tooltipElRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.visibility = "hidden";
  }, []);

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
  useEffect(() => { seatsRef.current = seats; });
  useEffect(() => { stateRef.current = state; });
  useEffect(() => { seatKeyRef.current = seatKey; });
  const assignedIds = useMemo(() => new Set(Object.values(seats).filter(id => validIds.has(id))), [seats, validIds]);
  const unassigned = useMemo(() => classStudents.filter(s => !assignedIds.has(s.id)), [classStudents, assignedIds]);
  const getStudentAt = useCallback((idx) => classStudents.find(s => s.id === seats[idx]) || null, [classStudents, seats]);
  const getSlotOf = useCallback((sid) => { const e = Object.entries(seats).find(([, v]) => v === sid); return e ? Number(e[0]) : -1; }, [seats]);

  const today = new Date().toISOString().slice(0, 10);
  const attKey = `${selClass}_${today}`;

  const handleDragStart = useCallback((sid) => { dragIdRef.current = sid; dragIdRef_global.current = sid; setDragId(sid); }, []);
  const handleDragEnd = useCallback(() => { /* handled by mouseup/touchend */ }, []);

  const handleDrop = useCallback((targetSlot) => {
    const activeDragId = dragIdRef.current || dragIdRef_global.current;
    if (!editMode || !activeDragId) return;
    const seatsNow = seatsRef.current;
    const targetOccupant = seatsNow[targetSlot];
    const srcEntry = Object.entries(seatsNow).find(([, v]) => v === activeDragId);
    const srcIdx = srcEntry ? Number(srcEntry[0]) : -1;
    stateRef.current.setSeats(prev => {
      const next = { ...(prev[seatKeyRef.current] || {}) };
      next[targetSlot] = activeDragId;
      if (srcIdx >= 0) {
        if (targetOccupant !== undefined && targetOccupant !== activeDragId) next[srcIdx] = targetOccupant;
        else delete next[srcIdx];
      }
      return { ...prev, [seatKeyRef.current]: next };
    });
    dragIdRef.current = null; dragIdRef_global.current = null;
    setDragId(null); setHovSlot(null);
  }, [editMode]);

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

  const getGroupStats = useCallback((groupIdx) => {
    const slots = groupSlots(groupIdx);
    const gStudents = slots.map(s => getStudentAt(s)).filter(Boolean);
    const presentCount = gStudents.filter(s => (state.attendance[attKey] || []).includes(s.id)).length;
    return { total: gStudents.length, present: presentCount };
  }, [getStudentAt, state.attendance, attKey]);

  const OverviewView = () => (
    <div style={{ overflowX: "auto", padding: "20px 16px 24px", WebkitOverflowScrolling: "touch" }}>
      <div style={{ minWidth: gridMinW }}>
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
                        <SeatCell key={col} slotI={globalSlotIdx(side, row, col)} compact={false} cellSz={cellSz} cellH={cellH} editMode={editMode} dragId={dragId} hovSlot={hovSlot} getStudentAt={getStudentAt} attKey={attKey} attendance={state.attendance} handleDragStart={handleDragStart} handleDragEnd={handleDragEnd} handleDrop={handleDrop} setHovSlot={setHovSlot} clearSlot={clearSlot} showTooltip={showTooltip} moveTooltip={moveTooltip} hideTooltip={hideTooltip} />
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
      <div style={{ padding: "16px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ minWidth: toMinW }}>
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
                    return (
                      <SeatCell key={col} slotI={slotI} compact={true} cellSz={compactSz} cellH={compactH} editMode={editMode} dragId={dragId} hovSlot={hovSlot} getStudentAt={getStudentAt} attKey={attKey} attendance={state.attendance} handleDragStart={handleDragStart} handleDragEnd={handleDragEnd} handleDrop={handleDrop} setHovSlot={setHovSlot} clearSlot={clearSlot} showTooltip={showTooltip} moveTooltip={moveTooltip} hideTooltip={hideTooltip} />
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
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {myClasses.map(c => (
            <button key={c.id} onClick={() => setSelClass(c.id)} style={{ padding: "6px 14px", borderRadius: 9, border: `1px solid ${selClass === c.id ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`, background: selClass === c.id ? "rgba(79,172,254,.1)" : "transparent", color: selClass === c.id ? "#4FACFE" : "#4A6580", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{c.name}</button>
          ))}
        </div>
        {user.role === "teacher" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setEditMode(p => !p)} style={{ padding: "7px 14px", borderRadius: 9, border: `1px solid ${editMode ? "rgba(167,139,250,.45)" : "rgba(255,255,255,.08)"}`, background: editMode ? "rgba(167,139,250,.12)" : "rgba(255,255,255,.04)", color: editMode ? "#A78BFA" : "#94A3B8", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, transition: "all .2s", boxShadow: editMode ? "0 0 12px rgba(167,139,250,.2)" : "none" }}>
              <GripVertical size={13} />{editMode ? "✓ Xong" : "Kéo thả"}
            </button>
            <button onClick={resetSeats} style={{ padding: "7px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "#94A3B8", fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, transition: "all .2s" }} onMouseEnter={e => e.currentTarget.style.color="#EF4444"} onMouseLeave={e => e.currentTarget.style.color="#94A3B8"}><RefreshCw size={12} />Reset</button>
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
                <div key={s.id} draggable={editMode} onDragStart={e => { if (!editMode) return; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", s.id); handleDragStart(s.id); }} onDragEnd={handleDragEnd}
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
              onClick={() => hasSession && onSelectDate(dateStr)} style={{ outline: isSelected && !isToday ? "2px solid #A78BFA" : isSelected && isToday ? "2px solid #A78BFA" : "none", outlineOffset: 2, background: isSelected ? (isPresent ? "rgba(52,211,153,.25)" : isAbsent ? "rgba(239,68,68,.2)" : "rgba(167,139,250,.18)") : undefined, boxShadow: isSelected ? "0 0 0 2px rgba(167,139,250,.5)" : undefined }}>
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
        {tabs.map(([v, l]) => <button key={v} onClick={() => setTab(v)} style={{ padding: "6px 15px", borderRadius: 9, border: `1px solid ${tab === v ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`, background: tab === v ? "linear-gradient(135deg,rgba(79,172,254,.15),rgba(79,172,254,.07))" : "transparent", color: tab === v ? "#4FACFE" : "#4A6580", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .25s cubic-bezier(.4,0,.2,1)", boxShadow: tab === v ? "0 4px 16px rgba(79,172,254,.15)" : "none" }}>{l}</button>)}
      </div>
      {tab === "today" && (
        <div style={{ display: "grid", gridTemplateColumns: user.role === "teacher" ? "1fr 1.3fr" : "1fr", gap: 14, alignItems: "start" }}>
          {user.role === "teacher" ? (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4", marginBottom: 3 }}>Mã QR điểm danh</div>
              <div style={{ fontSize: 11, color: "#3D5A78", marginBottom: 16 }}>Lớp {myClasses.find(c => c.id === selClass)?.name} · {today}</div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, position: "relative" }}>
                <div style={{ borderRadius: 16, overflow: "hidden", border: "2px solid rgba(79,172,254,.4)", boxShadow: "0 0 0 4px rgba(79,172,254,.08),0 0 48px rgba(79,172,254,.3),0 0 80px rgba(79,172,254,.1)", animation: "glowbeat 2.5s ease-in-out infinite" }} className="qr-glow"><QRSvg sz={170} /></div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color: timer < 60 ? "#EF4444" : "#4FACFE", padding: "7px 22px", borderRadius: 12, background: timer < 60 ? "rgba(239,68,68,.08)" : "rgba(79,172,254,.08)", border: `1px solid ${timer < 60 ? "rgba(239,68,68,.25)" : "rgba(79,172,254,.2)"}`, animation: timer < 60 ? "glowbeat 1s ease-in-out infinite" : "none", transition: "all .5s", letterSpacing: ".05em" }}>{mm}:{ss}</div>
              </div>
              <div style={{ fontSize: 11, color: "#3D5A78", marginBottom: 14 }}>Thời gian còn lại</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => markAll(true)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid rgba(52,211,153,.25)", cursor: "pointer", background: "rgba(52,211,153,.08)", color: "#34D399", fontSize: 11, fontWeight: 600, fontFamily: "inherit", transition: "all .25s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(52,211,153,.15)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(52,211,153,.2)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(52,211,153,.08)"; e.currentTarget.style.boxShadow = ""; }}>✓ Điểm tất cả</button>
                <button onClick={() => markAll(false)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid rgba(239,68,68,.22)", cursor: "pointer", background: "rgba(239,68,68,.07)", color: "#EF4444", fontSize: 11, fontWeight: 600, fontFamily: "inherit", transition: "all .25s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,.14)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,.2)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,.07)"; e.currentTarget.style.boxShadow = ""; }}>✗ Xóa tất cả</button>
              </div>
            </Card>
          ) : (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E2EAF4", marginBottom: 12 }}>Điểm danh hôm nay</div>
              {!scanned ? (
                <>
                  <div onClick={doScan} style={{ width: 174, height: 174, borderRadius: 16, margin: "0 auto 18px", background: scanning ? "rgba(79,172,254,.06)" : "rgba(79,172,254,.03)", border: scanning ? "2px solid #4FACFE" : "2px dashed rgba(79,172,254,.35)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", boxShadow: scanning ? "0 0 40px rgba(79,172,254,.35),0 0 0 4px rgba(79,172,254,.08)" : "none", transition: "all .35s cubic-bezier(.4,0,.2,1)", cursor: "pointer" }} onMouseEnter={e => { if (!scanning) { e.currentTarget.style.borderStyle = "solid"; e.currentTarget.style.background = "rgba(79,172,254,.07)"; }}} onMouseLeave={e => { if (!scanning) { e.currentTarget.style.borderStyle = "dashed"; e.currentTarget.style.background = "rgba(79,172,254,.03)"; }}}>
                    {scanning ? <><div style={{ fontSize: 44, animation: "breathe 1s ease-in-out infinite" }}>📷</div><div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#4FACFE,transparent)", animation: "scanline 1.5s ease-in-out infinite alternate", boxShadow: "0 0 12px rgba(79,172,254,.8)" }} /></> : <div style={{ color: "#2E4A6A", textAlign: "center", transition: "all .2s" }}><QrCode size={46} /><div style={{ fontSize: 11, marginTop: 8 }}>Nhấn để quét</div></div>}
                  </div>
                  <Btn onClick={doScan} disabled={scanning} style={{ width: "100%", justifyContent: "center" }}>{scanning ? "Đang quét..." : "Quét QR Code 📷"}</Btn>
                </>
              ) : (
                <div style={{ animation: "pop .5s cubic-bezier(.34,1.56,.64,1)", paddingTop: 8 }}>
                  <div style={{ fontSize: 70, marginBottom: 14, animation: "float 2s ease-in-out infinite", filter: "drop-shadow(0 8px 16px rgba(52,211,153,.4))" }}>✅</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#34D399", marginBottom: 6, animation: "countUp .4s .1s both" }}>Điểm danh thành công!</div>
                  <div style={{ fontSize: 11, color: "#3D5A78", animation: "fadeUp .4s .2s both" }}>{user.data.name}</div>
                </div>
              )}
            </Card>
          )}
          <div className="scard" style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(79,172,254,.05)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", background: "rgba(79,172,254,.015)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#E2EAF4" }}>Danh sách</div>
              {user.role === "teacher" && <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.04)", color: "#94A3B8", fontSize: 11, fontFamily: "inherit", outline: "none", transition: "border-color .2s" }} onFocus={e => e.target.style.borderColor = "rgba(79,172,254,.4)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.09)"} />}
              <div style={{ display: "flex", gap: 6 }}><Badge c="green">{presentIds.length} có mặt</Badge><Badge c="red">{classStudents.length - presentIds.length} vắng</Badge></div>
            </div>
            {classStudents.length === 0 ? <div style={{ padding: 28, textAlign: "center", color: "#2E4A6A", fontSize: 12 }}>Chưa có học sinh</div> : (
              <>
                <div style={{ maxHeight: 340, overflowY: "auto" }}>
                  {classStudents.map((s, rowIdx) => {
                    const present = presentIds.includes(s.id);
                    return (
                      <div key={s.id} onClick={() => toggle(s.id)} className="row-hover" style={{ padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,.025)", cursor: user.role === "teacher" ? "pointer" : "default", transition: "all .2s", animation: `fadeUp .3s ${rowIdx * .03}s both` }}
                        >
                        <Av em={s.em} photo={s.photo} sz={28} glow={present} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#E2EAF4" }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: "#2E4A6A" }}>{s.code}</div>
                        </div>
                        {user.role === "teacher" && <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${present ? "#34D399" : "rgba(255,255,255,.12)"}`, background: present ? "rgba(52,211,153,.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .28s cubic-bezier(.34,1.56,.64,1)", boxShadow: present ? "0 0 12px rgba(52,211,153,.3)" : "none" }}>{present && <Check size={10} color="#34D399" />}</div>}
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: present ? "#34D399" : "#EF4444", boxShadow: present ? "0 0 10px rgba(52,211,153,.7)" : "0 0 6px rgba(239,68,68,.4)", transition: "all .3s" }} />
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
    const msg = { id: Date.now(), user: user.data.name, role: user.role, em: user.data.em || (user.role === "teacher" ? "👨‍🏫" : "😊"), photo: user.data.photo || null, text: inp.trim(), time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) };
    state.setMessages(p => ({ ...p, [msgKey]: [...(p[msgKey] || []), msg] }));
    setInp("");
    setTimeout(() => bot.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const channels = ["chung","bài-tập","hỏi-đáp","thông-báo"];

  return (
    <div className="page" style={{ padding: 20, height: "calc(100vh - 100px)", display: "flex", gap: 12 }}>
      <div style={{ width: 168, borderRadius: 15, background: "linear-gradient(180deg,#060E1C,#050B18)", border: "1px solid rgba(79,172,254,.06)", padding: 10, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.3)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#1E3450", letterSpacing: ".1em", padding: "3px 7px", marginBottom: 8 }}>KÊNH — {cls?.name}</div>
        {channels.map((ch, idx) => <div key={ch} onClick={() => setChannel(ch)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 9px", borderRadius: 9, cursor: "pointer", background: channel === ch ? "linear-gradient(135deg,rgba(79,172,254,.14),rgba(79,172,254,.07))" : "transparent", color: channel === ch ? "#4FACFE" : "#3D5A78", fontSize: 11, marginBottom: 2, transition: "all .22s cubic-bezier(.4,0,.2,1)", border: channel === ch ? "1px solid rgba(79,172,254,.2)" : "1px solid transparent", boxShadow: channel === ch ? "0 2px 12px rgba(79,172,254,.15)" : "none", fontWeight: channel === ch ? 600 : 400 }} onMouseEnter={e => { if (channel !== ch) { e.currentTarget.style.background = "rgba(79,172,254,.05)"; e.currentTarget.style.color = "#6CB8FE"; }}} onMouseLeave={e => { if (channel !== ch) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3D5A78"; }}}><Hash size={11} />{ch}</div>)}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: "#1E3450", letterSpacing: ".1em", padding: "6px 7px 4px" }}>THÀNH VIÊN ({classStudents.length})</div>
        <div style={{ overflowY: "auto" }}>
          {classStudents.slice(0, 8).map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", fontSize: 10, color: "#2E4A6A", borderRadius: 6, transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"} onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div style={{ position: "relative" }}><Av em={s.em} photo={s.photo} sz={16} /><div style={{ position: "absolute", bottom: 0, right: 0, width: 5, height: 5, borderRadius: "50%", background: "#34D399", border: "1px solid #060D1E", animation: "glowPulseGreen 2.5s ease-in-out infinite" }} /></div>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name.split(" ").pop()}</span>
            </div>
          ))}
          {classStudents.length > 8 && <div style={{ fontSize: 10, color: "#2E4A6A", padding: "3px 7px" }}>+{classStudents.length - 8} người</div>}
        </div>
      </div>
      <div className="scard" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(79,172,254,.06)", display: "flex", alignItems: "center", gap: 6, background: "rgba(79,172,254,.02)" }}>
          <Hash size={13} style={{ color: "#4FACFE", filter: "drop-shadow(0 0 6px rgba(79,172,254,.7))" }} /><span style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4" }}>{channel}</span>
          <div style={{ flex: 1 }} /><span style={{ fontSize: 11, color: "#2E4A6A" }}>{msgs.length} tin</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 0 }}>
          {msgs.length === 0 && <div style={{ color: "#1E3450", fontSize: 12, textAlign: "center", paddingTop: 40, animation: "fadeUp .5s ease" }}>Chưa có tin nhắn. Hãy bắt đầu! 💬</div>}
          {msgs.map((m, i) => {
            const showAv = i === 0 || msgs[i - 1].user !== m.user;
            const isT = m.role === "teacher";
            return (
              <div key={m.id} style={{ display: "flex", gap: 9, padding: "3px 0", alignItems: "flex-start", animation: "fadeUp .25s cubic-bezier(.22,.68,0,1.2)" }}>
                {showAv ? <Av em={m.em} photo={m.photo} sz={28} /> : <div style={{ width: 28, flexShrink: 0 }} />}
                <div>
                  {showAv && (<div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><span style={{ fontSize: 11, fontWeight: 700, color: isT ? "#A78BFA" : "#E2EAF4" }}>{m.user}</span>{isT && <Badge c="violet">GV</Badge>}<span style={{ fontSize: 9, color: "#2E4A6A" }}>{m.time}</span></div>)}
                  <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.7, padding: "7px 13px", borderRadius: showAv ? "2px 12px 12px 12px" : "12px", background: isT ? "linear-gradient(135deg,rgba(167,139,250,.09),rgba(167,139,250,.05))" : "rgba(255,255,255,.045)", display: "inline-block", maxWidth: 440, border: isT ? "1px solid rgba(167,139,250,.12)" : "1px solid rgba(255,255,255,.05)", transition: "all .2s" }} onMouseEnter={e => e.currentTarget.style.background = isT ? "rgba(167,139,250,.13)" : "rgba(255,255,255,.065)"} onMouseLeave={e => e.currentTarget.style.background = isT ? "linear-gradient(135deg,rgba(167,139,250,.09),rgba(167,139,250,.05))" : "rgba(255,255,255,.045)"}>{m.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={bot} />
        </div>
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(79,172,254,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.035)", borderRadius: 13, padding: "7px 14px", border: "1px solid rgba(255,255,255,.07)", transition: "all .25s" }} onFocusCapture={e => { e.currentTarget.style.borderColor = "rgba(79,172,254,.4)"; e.currentTarget.style.background = "rgba(79,172,254,.04)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,172,254,.1)"; }} onBlurCapture={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.background = "rgba(255,255,255,.035)"; e.currentTarget.style.boxShadow = ""; }}>
            <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={`Nhắn vào #${channel}...`} style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#E2EAF4", fontSize: 12, fontFamily: "inherit" }} />
            <button onClick={send} style={{ width: 30, height: 30, borderRadius: 9, border: "none", cursor: "pointer", background: inp.trim() ? "linear-gradient(135deg,#1D6CF5,#7B3FE4)" : "transparent", color: inp.trim() ? "#fff" : "#2E4A6A", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .28s cubic-bezier(.34,1.56,.64,1)", transform: inp.trim() ? "scale(1)" : "scale(0.9)", boxShadow: inp.trim() ? "0 4px 16px rgba(29,108,245,.4)" : "none" }}><Send size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}


function QuizModal({ task, classId, user, state, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const qs = task.questions || [];

  const submitQuiz = () => {
    const correct = qs.filter((q, i) => answers[i] === q.ans).length;
    const pct = Math.round((correct / qs.length) * 100);
    setScore({ correct, pct });
    setSubmitted(true);
    const sub = { studentId: user.data.id, studentName: user.data.name, submittedAt: Date.now(), quizScore: pct, quizCorrect: correct, quizAnswers: answers };
    state.setAssignments(p => ({ ...p, [classId]: (p[classId] || []).map(t => t.id === task.id ? { ...t, status: "submitted", submittedAt: Date.now(), quizScore: pct, quizCorrect: correct, quizAnswers: answers, submissions: [...(t.submissions||[]).filter(s=>s.studentId!==user.data.id), sub] } : t) }));
  };

  const answered = Object.keys(answers).length;
  const OPTS = ["A","B","C","D"];

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && submitted && onClose()}>
      <div className="modal-flex" style={{ width: 520 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(79,172,254,.03)" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#E2EAF4" }}>🧠 {task.title}</div>
            <div style={{ fontSize: 11, color: "#3D5A78", marginTop: 2 }}>{task.subject} · {qs.length} câu hỏi</div>
          </div>
          {submitted ? <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D5A78" }}><X size={18} /></button> : <div style={{ fontSize: 11, color: answered === qs.length ? "#34D399" : "#F59E0B", fontWeight: 600 }}>{answered}/{qs.length} đã trả lời</div>}
        </div>
        {submitted && score ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16, animation: "pop .5s cubic-bezier(.34,1.56,.64,1)" }}>{score.pct >= 80 ? "🏆" : score.pct >= 50 ? "😊" : "📚"}</div>
            <div className="hfont" style={{ fontSize: 42, fontWeight: 400, color: score.pct >= 80 ? "#34D399" : score.pct >= 50 ? "#F59E0B" : "#EF4444", marginBottom: 8, animation: "countUp .5s .1s both" }}>{score.pct}%</div>
            <div style={{ fontSize: 14, color: "#94A3B8", marginBottom: 20 }}>Đúng {score.correct}/{qs.length} câu</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", marginBottom: 20 }}>
              {qs.map((q, i) => {
                const isCorrect = answers[i] === q.ans;
                return (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: isCorrect ? "rgba(52,211,153,.07)" : "rgba(239,68,68,.07)", border: `1px solid ${isCorrect ? "rgba(52,211,153,.25)" : "rgba(239,68,68,.2)"}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#E2EAF4", marginBottom: 4 }}>{i+1}. {q.q}</div>
                    <div style={{ fontSize: 10, color: isCorrect ? "#34D399" : "#EF4444" }}>{isCorrect ? "✓" : "✗"} Bạn chọn: {OPTS[answers[i]] ?? "–"} · Đáp án: {OPTS[q.ans]}: {q.opts[q.ans]}</div>
                  </div>
                );
              })}
            </div>
            <Btn onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>Đóng</Btn>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {qs.map((q, qi) => (
                <div key={qi} style={{ background: "rgba(255,255,255,.025)", border: `1px solid ${answers[qi] !== undefined ? "rgba(79,172,254,.2)" : "rgba(255,255,255,.06)"}`, borderRadius: 13, padding: 16, transition: "border-color .2s" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#E2EAF4", marginBottom: 12 }}><span style={{ color: "#4FACFE", marginRight: 8 }}>Câu {qi+1}.</span>{q.q}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {q.opts.map((opt, oi) => {
                      const sel = answers[qi] === oi;
                      return (
                        <button key={oi} onClick={() => setAnswers(p => ({ ...p, [qi]: oi }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", borderRadius: 9, border: `1px solid ${sel ? "rgba(79,172,254,.55)" : "rgba(255,255,255,.07)"}`, background: sel ? "linear-gradient(135deg,rgba(79,172,254,.15),rgba(79,172,254,.07))" : "rgba(255,255,255,.025)", cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: sel ? "#4FACFE" : "#94A3B8", textAlign: "left", transition: "all .2s cubic-bezier(.34,1.56,.64,1)", transform: sel ? "scale(1.01)" : "scale(1)" }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${sel ? "#4FACFE" : "rgba(255,255,255,.15)"}`, background: sel ? "rgba(79,172,254,.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: sel ? "#4FACFE" : "#4A6580", flexShrink: 0, transition: "all .2s" }}>{OPTS[oi]}</div>
                          {opt || <span style={{ color: "#2E4A6A", fontStyle: "italic" }}>(chưa có đáp án)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", gap: 9 }}>
              <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Hủy</Btn>
              <Btn onClick={submitQuiz} disabled={answered < qs.length} style={{ flex: 2, justifyContent: "center" }}>
                {answered < qs.length ? `Còn ${qs.length - answered} câu chưa trả lời` : "✓ Nộp quiz"}
              </Btn>
            </div>
          </>
        )}
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
  const [newTask, setNewTask] = useState({ title: "", desc: "", subject: SUBJECTS[0], deadline: "", priority: false, attachments: [], taskType: "normal", questions: [] });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errTask, setErrTask] = useState("");
  const fileRef = useRef();
  const { confirm, ConfirmUI } = useConfirm();

  const [quizModal, setQuizModal] = useState(null);
  const [submitModal, setSubmitModal] = useState(null);
  const [submitImgs, setSubmitImgs] = useState([]);
  const [submitNote, setSubmitNote] = useState("");
  const [uploadingSubmit, setUploadingSubmit] = useState(false);
  const submitImgRef = useRef();

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

  const handleSubmitImgUpload = e => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;
    setUploadingSubmit(true);
    Promise.all(files.map(f => new Promise(res => {
      if (f.size > 8 * 1024 * 1024) { res(null); return; }
      const r = new FileReader();
      r.onload = () => res({ name: f.name, data: r.result });
      r.readAsDataURL(f);
    }))).then(results => { setSubmitImgs(p => [...p, ...results.filter(Boolean)]); setUploadingSubmit(false); });
  };

  const [taskDetailModal, setTaskDetailModal] = useState(null);

  const openSubmitModal = task => { setSubmitModal(task); setSubmitImgs([]); setSubmitNote(""); };

  const confirmSubmit = () => {
    if (submitImgs.length === 0) return;
    const sub = { studentId: user.data.id, studentName: user.data.name, submittedAt: Date.now(), submitImgs, submitNote };
    state.setAssignments(p => ({ ...p, [classId]: (p[classId] || []).map(t => t.id === submitModal.id ? { ...t, status: "submitted", submittedAt: Date.now(), submitImgs, submitNote, submissions: [...(t.submissions||[]).filter(s=>s.studentId!==user.data.id), sub] } : t) }));
    setSubmitModal(null);
  };

  const addTask = () => {
    if (!newTask.title.trim()) { setErrTask("Nhập tên bài tập"); return; }
    if (!newTask.deadline) { setErrTask("Chọn deadline"); return; }
    if ((newTask.taskType||"normal") === "quiz" && !(newTask.questions||[]).length) { setErrTask("Thêm ít nhất 1 câu hỏi"); return; }
    if ((newTask.taskType||"normal") === "quiz" && (newTask.questions||[]).some(q => !q.q.trim())) { setErrTask("Điền đầy đủ nội dung các câu hỏi"); return; }
    state.setAssignments(p => ({ ...p, [classId]: [...(p[classId] || []), { id: "task_" + Date.now(), ...newTask, taskType: newTask.taskType||"normal", status: "pending", createdAt: Date.now() }] }));
    setNewTask({ title: "", desc: "", subject: SUBJECTS[0], deadline: "", priority: false, attachments: [], taskType: "normal", questions: [] });
    setShowAdd(false); setErrTask("");
  };

  const deleteTask = async tid => {
    const ok = await confirm("Xóa bài tập này?");
    if (!ok) return;
    state.setAssignments(p => ({ ...p, [classId]: (p[classId] || []).filter(t => t.id !== tid) }));
  };

  const STATUS_CFG = { pending:{ l:"Chờ nộp",c:"amber" }, submitted:{ l:"Đã nộp",c:"green" }, overdue:{ l:"Trễ hạn",c:"red" } };

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {ConfirmUI}

      {submitModal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setSubmitModal(null)}>
          <div className="modal" style={{ width: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#E2EAF4" }}>Nộp bài: {submitModal.title}</h2>
              <button onClick={() => setSubmitModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D5A78" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 8, letterSpacing: ".05em" }}>ẢNH BÀI LÀM <span style={{ color: "#EF4444" }}>*</span></div>
              <button onClick={() => submitImgRef.current?.click()} style={{ width: "100%", padding: "18px", borderRadius: 12, border: `2px dashed ${submitImgs.length > 0 ? "rgba(52,211,153,.4)" : "rgba(79,172,254,.3)"}`, background: submitImgs.length > 0 ? "rgba(52,211,153,.04)" : "rgba(79,172,254,.025)", color: "#2E4A6A", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", transition: "all .2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = submitImgs.length > 0 ? "rgba(52,211,153,.6)" : "rgba(79,172,254,.5)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = submitImgs.length > 0 ? "rgba(52,211,153,.4)" : "rgba(79,172,254,.3)"}>
                <div style={{ fontSize: 28 }}>{uploadingSubmit ? "⏳" : submitImgs.length > 0 ? "✅" : "📷"}</div>
                <div style={{ fontSize: 12, color: submitImgs.length > 0 ? "#34D399" : "#4FACFE", fontWeight: 600 }}>
                  {uploadingSubmit ? "Đang tải..." : submitImgs.length > 0 ? `${submitImgs.length} ảnh đã chọn — nhấn để thêm` : "Chụp/chọn ảnh bài làm"}
                </div>
                <div style={{ fontSize: 10, color: "#2E4A6A" }}>Hỗ trợ JPG, PNG — tối đa 8MB/ảnh</div>
              </button>
              <input ref={submitImgRef} type="file" accept="image/*" multiple onChange={handleSubmitImgUpload} style={{ display: "none" }} />
              {submitImgs.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {submitImgs.map((img, i) => (
                    <div key={i} style={{ position: "relative", width: 72, height: 72, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(52,211,153,.3)" }}>
                      <img src={img.data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button onClick={() => setSubmitImgs(p => p.filter((_,j) => j !== i))} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(239,68,68,.9)", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 5, letterSpacing: ".05em" }}>GHI CHÚ (tuỳ chọn)</div>
              <textarea value={submitNote} onChange={e => setSubmitNote(e.target.value)} placeholder="Ghi chú thêm cho giáo viên..." rows={2} style={{ width: "100%", padding: "9px 13px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "#E2EAF4", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "none" }} />
            </div>
            {submitImgs.length === 0 && <div style={{ fontSize: 11, color: "#EF4444", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><AlertTriangle size={12} />Cần ít nhất 1 ảnh bài làm</div>}
            <div style={{ display: "flex", gap: 9 }}>
              <Btn variant="ghost" onClick={() => setSubmitModal(null)} style={{ flex: 1 }}>Hủy</Btn>
              <Btn onClick={confirmSubmit} disabled={submitImgs.length === 0} style={{ flex: 2 }}><Upload size={13} />Nộp bài</Btn>
            </div>
          </div>
        </div>
      )}
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
                {a.taskType === "quiz" && <span style={{ fontSize: 10, color: "#A78BFA", fontWeight: 600 }}>🧠 Quiz · {(a.questions||[]).length} câu</span>}
                {a.attachments?.length > 0 && <span style={{ fontSize: 10, color: "#4A6580", display: "flex", alignItems: "center", gap: 3 }}><Paperclip size={10} />{a.attachments.length} file</span>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <Badge c={STATUS_CFG[a.status]?.c||"blue"}>{STATUS_CFG[a.status]?.l||a.status}</Badge>
              {user.role === "student" && a.status === "pending" && a.taskType === "quiz" && <Btn onClick={() => setQuizModal(a)} small style={{ background: "linear-gradient(135deg,#7B3FE4,#4FACFE)" }}>🧠 Làm quiz</Btn>}
              {user.role === "student" && a.status === "pending" && a.taskType !== "quiz" && <Btn onClick={() => openSubmitModal(a)} small variant="success"><Upload size={11} />Nộp bài</Btn>}
              {user.role === "student" && a.status === "submitted" && a.taskType === "quiz" && a.quizScore !== undefined && (
                <div style={{ fontSize: 11, fontWeight: 700, color: a.quizScore >= 80 ? "#34D399" : a.quizScore >= 50 ? "#F59E0B" : "#EF4444", padding: "3px 10px", borderRadius: 8, background: a.quizScore >= 80 ? "rgba(52,211,153,.1)" : a.quizScore >= 50 ? "rgba(245,158,11,.1)" : "rgba(239,68,68,.1)", border: `1px solid ${a.quizScore >= 80 ? "rgba(52,211,153,.3)" : a.quizScore >= 50 ? "rgba(245,158,11,.3)" : "rgba(239,68,68,.3)"}` }}>
                  {a.quizScore}% · {a.quizCorrect}/{(a.questions||[]).length} câu
                </div>
              )}
              {user.role === "student" && a.status === "submitted" && a.taskType !== "quiz" && a.submitImgs?.length > 0 && (
                <div style={{ display: "flex", gap: 4 }}>
                  {a.submitImgs.slice(0, 3).map((img, i) => <img key={i} src={img.data} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", border: "1px solid rgba(52,211,153,.3)" }} />)}
                  {a.submitImgs.length > 3 && <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#94A3B8" }}>+{a.submitImgs.length - 3}</div>}
                </div>
              )}
              {user.role === "teacher" && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Btn onClick={() => setTaskDetailModal(a)} small variant="ghost"><Users size={11} />Chi tiết</Btn>
                  <button onClick={() => deleteTask(a.id)} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex" }}><Trash2 size={12} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal" style={{ width: 480 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D5A78" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[["normal","📝","Bài tập thường"],["quiz","🧠","Quiz trắc nghiệm"]].map(([t,ic,l]) => (
                <button key={t} onClick={() => setNewTask(p => ({ ...p, taskType: t }))} style={{ flex: 1, padding: "10px 8px", borderRadius: 11, border: `1px solid ${(newTask.taskType||"normal") === t ? "rgba(79,172,254,.5)" : "rgba(255,255,255,.08)"}`, background: (newTask.taskType||"normal") === t ? "linear-gradient(135deg,rgba(79,172,254,.15),rgba(79,172,254,.07))" : "transparent", color: (newTask.taskType||"normal") === t ? "#4FACFE" : "#4A6580", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>{ic} {l}</button>
              ))}
            </div>
            <Inp label="TÊN BÀI TẬP" value={newTask.title} onChange={v => setNewTask(p => ({ ...p, title: v }))} placeholder={(newTask.taskType||"normal")==="quiz" ? "Quiz chương 5..." : "Bài tập chương 3..."} required />
            {(newTask.taskType||"normal") !== "quiz" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 5, letterSpacing: ".05em" }}>MÔ TẢ</div>
                <textarea value={newTask.desc} onChange={e => setNewTask(p => ({ ...p, desc: e.target.value }))} placeholder="Mô tả chi tiết..." rows={2} style={{ width: "100%", padding: "9px 13px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "#E2EAF4", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <Sel label="MÔN HỌC" value={newTask.subject} onChange={v => setNewTask(p => ({ ...p, subject: v }))} options={SUBJECTS} required />
              <Inp label="DEADLINE" value={newTask.deadline} onChange={v => setNewTask(p => ({ ...p, deadline: v }))} placeholder="dd/mm/yyyy" required />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94A3B8", cursor: "pointer", marginBottom: 16 }}>
              <input type="checkbox" checked={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.checked }))} style={{ accentColor: "#F59E0B" }} />⚡ Ưu tiên cao
            </label>
            {(newTask.taskType||"normal") === "quiz" ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", letterSpacing: ".05em" }}>CÂU HỎI ({(newTask.questions||[]).length})</div>
                  <Btn small onClick={() => setNewTask(p => ({ ...p, questions: [...(p.questions||[]), { q: "", opts: ["","","",""], ans: 0 }] }))}>+ Thêm câu</Btn>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
                  {(newTask.questions||[]).map((qq, qi) => (
                    <div key={qi} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: 12 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#4FACFE", minWidth: 22 }}>C{qi+1}</div>
                        <input value={qq.q} onChange={e => setNewTask(p => { const qs=[...p.questions]; qs[qi]={...qs[qi],q:e.target.value}; return {...p,questions:qs}; })} placeholder="Nội dung câu hỏi..." style={{ flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, padding: "6px 10px", color: "#E2EAF4", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                        <button onClick={() => setNewTask(p => ({ ...p, questions: p.questions.filter((_,i)=>i!==qi) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 4 }}><X size={13} /></button>
                      </div>
                      {["A","B","C","D"].map((lbl, oi) => (
                        <div key={oi} style={{ display: "flex", gap: 6, marginBottom: 5, alignItems: "center" }}>
                          <button onClick={() => setNewTask(p => { const qs=[...p.questions]; qs[qi]={...qs[qi],ans:oi}; return {...p,questions:qs}; })} style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${qq.ans===oi?"#34D399":"rgba(255,255,255,.12)"}`, background: qq.ans===oi?"rgba(52,211,153,.15)":"transparent", cursor: "pointer", fontSize: 9, fontWeight: 700, color: qq.ans===oi?"#34D399":"#4A6580", transition: "all .2s", flexShrink: 0 }}>{lbl}</button>
                          <input value={qq.opts[oi]} onChange={e => setNewTask(p => { const qs=[...p.questions]; const opts=[...qs[qi].opts]; opts[oi]=e.target.value; qs[qi]={...qs[qi],opts}; return {...p,questions:qs}; })} placeholder={`Đáp án ${lbl}...`} style={{ flex: 1, background: "rgba(255,255,255,.03)", border: `1px solid ${qq.ans===oi?"rgba(52,211,153,.3)":"rgba(255,255,255,.07)"}`, borderRadius: 7, padding: "5px 9px", color: qq.ans===oi?"#34D399":"#94A3B8", fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                        </div>
                      ))}
                    </div>
                  ))}
                  {(newTask.questions||[]).length === 0 && <div style={{ textAlign: "center", color: "#2E4A6A", fontSize: 12, padding: "20px 0" }}>Chưa có câu hỏi. Nhấn "+ Thêm câu" để bắt đầu.</div>}
                </div>
              </div>
            ) : (
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
            )}
            <ErrBox msg={errTask} />
            <div style={{ display: "flex", gap: 9 }}>
              <Btn variant="ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Hủy</Btn>
              <Btn onClick={addTask} style={{ flex: 2 }}>{(newTask.taskType||"normal")==="quiz" ? "🧠 Tạo Quiz" : "Tạo bài tập"}</Btn>
            </div>
          </div>
        </div>
      )}
      {quizModal && <QuizModal task={quizModal} classId={classId} user={user} state={state} onClose={() => setQuizModal(null)} />}
      {taskDetailModal && <TaskDetailModal task={taskDetailModal} classId={classId} state={state} onClose={() => setTaskDetailModal(null)} />}
    </div>
  );
}

function TaskDetailModal({ task, classId, state, onClose }) {
  const allStudents = state.students.filter(s => s.classId === classId);
  const subs = task.submissions || [];
  const [detailTab, setDetailTab] = useState("notyet");

  const getStatus = s => {
    const sub = subs.find(sb => sb.studentId === s.id);
    if (!sub) return "notyet";
    const isLate = task.deadline && sub.submittedAt > new Date(task.deadline.split("/").reverse().join("-") + "T23:59:59").getTime();
    return isLate ? "late" : "done";
  };

  const groups = {
    done:   allStudents.filter(s => getStatus(s) === "done"),
    late:   allStudents.filter(s => getStatus(s) === "late"),
    notyet: allStudents.filter(s => getStatus(s) === "notyet"),
  };
  const shown = groups[detailTab] || [];

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-flex" style={{ width: 500 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#E2EAF4" }}>{task.title}</div>
            <div style={{ fontSize: 11, color: "#3D5A78", marginTop: 2 }}>{task.subject} · Deadline: {task.deadline} · {allStudents.length} học sinh</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#3D5A78" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          {[["notyet","⏳ Chưa nộp",groups.notyet.length,"#F59E0B"],["done","✓ Đã nộp",groups.done.length,"#34D399"],["late","⚠ Nộp trễ",groups.late.length,"#EF4444"]].map(([v,l,n,c]) => (
            <button key={v} onClick={() => setDetailTab(v)} style={{ flex: 1, padding: "11px 8px", border: "none", background: detailTab===v ? "rgba(255,255,255,.04)" : "transparent", borderBottom: detailTab===v ? `2px solid ${c}` : "2px solid transparent", color: detailTab===v ? c : "#4A6580", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>
              {l} <span style={{ marginLeft: 4, padding: "1px 7px", borderRadius: 99, background: `${c}18`, color: c, fontSize: 10 }}>{n}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8, minHeight: 200 }}>
          {shown.length === 0 && <div style={{ textAlign: "center", color: "#2E4A6A", fontSize: 12, paddingTop: 32 }}>Không có học sinh nào.</div>}
          {shown.map(s => {
            const sub = subs.find(sb => sb.studentId === s.id);
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 11, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.05)", animation: "fadeUp .25s both" }}>
                <Av em={s.em} photo={s.photo} sz={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#E2EAF4" }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: "#3D5A78" }}>{s.code}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {sub ? (
                    <>
                      <div style={{ fontSize: 10, color: detailTab==="late" ? "#EF4444" : "#34D399", fontWeight: 600 }}>
                        {new Date(sub.submittedAt).toLocaleString("vi-VN",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"})}
                      </div>
                      {sub.submitNote && <div style={{ fontSize: 10, color: "#4A6580", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>"{sub.submitNote}"</div>}
                      {task.taskType !== "quiz" && sub.submitImgs?.length > 0 && (
                        <div style={{ display: "flex", gap: 3, marginTop: 4, justifyContent: "flex-end" }}>
                          {sub.submitImgs.slice(0,3).map((img,i) => <img key={i} src={img.data} alt="" style={{ width: 26, height: 26, borderRadius: 5, objectFit: "cover", border: "1px solid rgba(52,211,153,.3)" }} />)}
                          {sub.submitImgs.length > 3 && <div style={{ width: 26, height: 26, borderRadius: 5, background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#94A3B8" }}>+{sub.submitImgs.length-3}</div>}
                        </div>
                      )}
                      {task.taskType === "quiz" && sub.quizScore !== undefined && (
                        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: sub.quizScore>=80?"#34D399":sub.quizScore>=50?"#F59E0B":"#EF4444" }}>{sub.quizScore}% · {sub.quizCorrect}/{(task.questions||[]).length} câu</div>
                      )}
                    </>
                  ) : <Badge c="amber">Chưa nộp</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WheelPage({ state, user }) {
  const classId = user.role === "teacher" ? state.classes.find(c => c.teacherId === user.data.id)?.id : user.classId;
  const today = new Date().toISOString().slice(0, 10);
  const attKey = `${classId}_${today}`;
  const presentIds = useMemo(() => new Set(state.attendance[attKey] || []), [state.attendance, attKey]);
  const allStudents = useMemo(() => state.students.filter(s => s.classId === classId), [state.students, classId]);
  const [filterPresent, setFilterPresent] = useState(user.role === "teacher");
  const students = useMemo(() => filterPresent ? allStudents.filter(s => presentIds.has(s.id)) : allStudents, [allStudents, presentIds, filterPresent]);
  const N = students.length;
  const [totalRot, setTotalRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const [history, setHistory] = useState([]);
  const WCOLS = ["#4FACFE","#818CF8","#34D399","#F59E0B","#F472B6","#FB923C","#A78BFA","#4ADE80","#60A5FA","#FACC15","#E879F9","#FCA5A5","#38BDF8","#6EE7B7"];

  if (allStudents.length === 0) return <div className="page" style={{ padding: 20, textAlign: "center", color: "#2E4A6A", paddingTop: 60 }}>Chưa có học sinh trong lớp.</div>;

  const sliceAngle = 360 / (N || 1);
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
        <div className="scard" style={{ padding: 20, textAlign: "center" }}>
          <div className="hfont" style={{ fontSize: 18, fontWeight: 400, marginBottom: 4 }}>🎡 Lucky Wheel</div>
          <div style={{ fontSize: 12, color: "#3D5A78", marginBottom: 12 }}>Quay ngẫu nhiên để chọn học sinh</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18 }}>
            <button onClick={() => { setFilterPresent(true); setWinner(null); setWinnerIdx(null); setTotalRot(0); }} style={{ padding: "5px 14px", borderRadius: 9, border: `1px solid ${filterPresent ? "rgba(52,211,153,.4)" : "rgba(255,255,255,.08)"}`, background: filterPresent ? "rgba(52,211,153,.12)" : "transparent", color: filterPresent ? "#34D399" : "#4A6580", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>✓ Có mặt ({allStudents.filter(s => presentIds.has(s.id)).length})</button>
            <button onClick={() => { setFilterPresent(false); setWinner(null); setWinnerIdx(null); setTotalRot(0); }} style={{ padding: "5px 14px", borderRadius: 9, border: `1px solid ${!filterPresent ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.08)"}`, background: !filterPresent ? "rgba(79,172,254,.12)" : "transparent", color: !filterPresent ? "#4FACFE" : "#4A6580", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>👥 Tất cả ({allStudents.length})</button>
          </div>
          {N === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>😴</div>
              <div style={{ fontSize: 13, color: "#3D5A78", fontWeight: 600 }}>Không có học sinh có mặt hôm nay</div>
              <div style={{ fontSize: 11, color: "#2E4A6A", marginTop: 6 }}>Chuyển sang "Tất cả" hoặc điểm danh trước</div>
            </div>
          ) : (<>
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
                  const mx = 150 + 88 * Math.cos(midAngle), my = 150 + 88 * Math.sin(midAngle);
                  const textRot = (i + 0.5) * sliceAngle - 90;
                  const col = WCOLS[i % WCOLS.length];
                  const isWinner = winnerIdx === i && !spinning;
                  const dimmed = winnerIdx !== null && !spinning && !isWinner;
                  const label = s.name.split(" ").pop();
                  const fs = N > 20 ? 8 : N > 12 ? 10 : N > 6 ? 11 : 12;
                  if (N === 1) return (
                    <g key={i}>
                      <circle cx="150" cy="150" r="140" fill={col} stroke="#050C1A" strokeWidth="1.5" />
                      <text x="150" y="150" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="bold" fontFamily="Outfit,sans-serif" fill="#fff">{label}</text>
                    </g>
                  );
                  return (
                    <g key={i}>
                      <path d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={col} stroke="#050C1A" strokeWidth="1.5" opacity={dimmed ? 0.45 : 1} />
                      {isWinner && <path d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`} fill="none" stroke="#FFF" strokeWidth="3" opacity="0.9" />}
                      <text
                        x={mx} y={my}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={fs}
                        fontWeight="bold"
                        fontFamily="Outfit,sans-serif"
                        fill={dimmed ? "rgba(255,255,255,.4)" : "#fff"}
                        transform={`rotate(${textRot},${mx},${my})`}
                        style={{ userSelect: "none" }}
                      >{label}</text>
                    </g>
                  );
                })}
                <circle cx="150" cy="150" r="22" fill="#050C1A" />
                <circle cx="150" cy="150" r="10" fill="#4FACFE" />
                <circle cx="150" cy="150" r="5" fill="#FFF" />
              </svg>
            </div>
          </div>
          <Btn onClick={spin} disabled={spinning || N < 2} style={{ padding: "13px 48px", fontSize: 15, fontWeight: 700, justifyContent: "center", animation: spinning || N < 2 ? "none" : "breathe 2.5s ease-in-out infinite" }}>{spinning ? "🌀 Đang quay..." : N < 2 ? "⚠ Cần ít nhất 2 học sinh" : "🎯 Quay ngay!"}</Btn>
          </>)}
        </div>
        {winner && !spinning && (
          <div style={{ borderRadius: 18, padding: 28, textAlign: "center", background: "linear-gradient(135deg,rgba(79,172,254,.1),rgba(167,139,250,.08),rgba(0,242,254,.05))", border: "1px solid rgba(79,172,254,.3)", animation: "pop .5s cubic-bezier(.34,1.56,.64,1)" }} className="winner-card">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Av em={winner.em} photo={winner.photo} sz={68} glow /></div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#E2EAF4", marginBottom: 5, animation: "countUp .4s cubic-bezier(.34,1.56,.64,1)" }}>🎉 {winner.name}</div>
            <div style={{ fontSize: 11, color: "#3D5A78" }}>{winner.code}</div>
          </div>
        )}
      </div>
      <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="scard" style={{ overflow: "hidden" }}>
          <div style={{ padding: "10px 13px", borderBottom: "1px solid rgba(255,255,255,.055)", fontSize: 12, fontWeight: 700, color: "#E2EAF4" }}>
            {filterPresent ? `Có mặt (${N})` : `Tất cả (${allStudents.length})`}
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {(filterPresent ? students : allStudents).map((s, i) => {
              const isPresent = presentIds.has(s.id);
              const inWheel = students.some(ws => ws.id === s.id);
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderBottom: "1px solid rgba(255,255,255,.02)", fontSize: 11, color: inWheel ? "#4A6580" : "#2E3A50", background: winnerIdx !== null && !spinning && students[winnerIdx]?.id === s.id ? "rgba(79,172,254,.07)" : "transparent", opacity: !filterPresent && !isPresent ? 0.45 : 1, transition: "all .2s" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: inWheel ? WCOLS[i % WCOLS.length] : "#2E3A50", flexShrink: 0 }} />
                  <Av em={s.em} photo={s.photo} sz={22} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  {!filterPresent && <span style={{ fontSize: 9, fontWeight: 700, color: isPresent ? "#34D399" : "#EF4444" }}>{isPresent ? "✓" : "✗"}</span>}
                  {winnerIdx !== null && !spinning && students[winnerIdx]?.id === s.id && <span style={{ fontSize: 12 }}>🏆</span>}
                </div>
              );
            })}
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

  const [pwNew, setPwNew] = useState("");
  const [pwNew2, setPwNew2] = useState("");
  const [pwOld, setPwOld] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const changePw = () => {
    setPwErr(""); setPwMsg("");
    if (s.password && !pwOld) { setPwErr("Nhập mật khẩu cũ"); return; }
    if (s.password && s.password !== pwOld) { setPwErr("Mật khẩu cũ không đúng"); return; }
    if (!pwNew || pwNew.length < 4) { setPwErr("Mật khẩu mới tối thiểu 4 ký tự"); return; }
    if (pwNew !== pwNew2) { setPwErr("Xác nhận mật khẩu không khớp"); return; }
    state.setStudents(p => p.map(x => x.id === s.id ? { ...x, password: pwNew } : x));
    setPwNew(""); setPwNew2(""); setPwOld("");
    setPwMsg("Đổi mật khẩu thành công!");
    setTimeout(() => setPwMsg(""), 3000);
  };

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ borderRadius: 20, padding: "26px 28px", background: "linear-gradient(135deg,rgba(29,108,245,.12),rgba(123,63,228,.09),rgba(0,242,254,.05))", backgroundSize: "300% 300%", animation: "morphGrad 9s ease infinite", border: "1px solid rgba(79,172,254,.15)", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", boxShadow: "0 8px 40px rgba(29,108,245,.12),inset 0 1px 0 rgba(255,255,255,.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -20, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,172,254,.1),transparent)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#4FACFE,#A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, boxShadow: "0 0 0 3px rgba(79,172,254,.3),0 0 32px rgba(79,172,254,.4)", border: "3px solid rgba(79,172,254,.4)", animation: "float 4s ease-in-out infinite" }}>
            {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (s.em || "😊")}
          </div>
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 15, height: 15, borderRadius: "50%", background: "linear-gradient(135deg,#34D399,#10B981)", border: "2px solid #050C1A", animation: "glowPulseGreen 2s ease-in-out infinite" }} />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#E2EAF4", marginBottom: 4, animation: "fadeUp .4s .1s both" }}>{s.name}</div>
          <div style={{ fontSize: 12, color: "#3D5A78", marginBottom: 10, animation: "fadeUp .4s .18s both" }}>{s.code} · Lớp {cls?.name}</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", animation: "fadeUp .4s .26s both" }}>
            {presentToday && <Badge c="green">✓ Đã điểm danh hôm nay</Badge>}
            <Badge c="blue">Học sinh</Badge>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[["Chuyên cần", totalDays ? `${Math.round((presentDays / totalDays) * 100)}%` : "--", "#4FACFE"], ["Ngày học", `${presentDays}/${totalDays}`, "#34D399"], ["Bài tập", `${tasks.filter(t => t.status === "submitted").length}/${tasks.length}`, "#A78BFA"]].map(([l, v, c], i) => (
            <div key={l} style={{ textAlign: "center", animation: `countUp .5s ${i * .1 + .2}s cubic-bezier(.34,1.56,.64,1) both` }}>
              <div className="hfont stat-val" style={{ fontSize: 22, fontWeight: 400, color: c, filter: `drop-shadow(0 0 8px ${c}66)` }}>{v}</div>
              <div style={{ fontSize: 10, color: "#3D5A78", marginTop: 3, fontWeight: 500 }}>{l}</div>
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
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E2EAF4", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}><Key size={14} style={{ color: "#4FACFE" }} />Đổi mật khẩu</div>
        {s.password && <Inp label="MẬT KHẨU CŨ" value={pwOld} onChange={setPwOld} type={showPw ? "text" : "password"} placeholder="Nhập mật khẩu hiện tại" required />}
        <Inp label="MẬT KHẨU MỚI" value={pwNew} onChange={setPwNew} type={showPw ? "text" : "password"} placeholder="Tối thiểu 4 ký tự" required />
        <Inp label="XÁC NHẬN MẬT KHẨU" value={pwNew2} onChange={setPwNew2} type={showPw ? "text" : "password"} placeholder="Nhập lại mật khẩu mới" required />
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#94A3B8", cursor: "pointer", marginBottom: 14 }}>
          <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} style={{ accentColor: "#4FACFE" }} />Hiện mật khẩu
        </label>
        {pwErr && <ErrBox msg={pwErr} />}
        {pwMsg && <div style={{ fontSize: 12, color: "#34D399", marginBottom: 12, padding: "9px 13px", borderRadius: 10, background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.25)" }}>✓ {pwMsg}</div>}
        <Btn onClick={changePw} style={{ width: "100%", justifyContent: "center" }} disabled={!pwNew || !pwNew2}><Key size={13} />Đổi mật khẩu</Btn>
        {!s.password && <div style={{ fontSize: 11, color: "#3D5A78", marginTop: 10, textAlign: "center" }}>Tài khoản chưa có mật khẩu — đặt mật khẩu để bảo mật hơn</div>}
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
      <div style={{ borderRadius: 18, padding: "24px 28px", background: "linear-gradient(135deg,rgba(29,108,245,.12),rgba(123,63,228,.09),rgba(0,242,254,.06))", backgroundSize: "300% 300%", animation: "morphGrad 8s ease infinite", border: "1px solid rgba(79,172,254,.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, boxShadow: "0 4px 32px rgba(29,108,245,.1),inset 0 1px 0 rgba(255,255,255,.05)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: 120, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,172,254,.12),transparent)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4, color: "#E2EAF4", animation: "fadeUp .4s .1s both" }}>{isT ? `Chào, ${user.data.name}! 👋` : `Xin chào, ${user.data.name}! 👋`}</div>
          <div style={{ fontSize: 12, color: "#3D5A78", marginBottom: 10, textTransform: "capitalize", animation: "fadeUp .4s .18s both" }}>{todayDate}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", animation: "fadeUp .4s .26s both" }}>
            {isT ? (
              <>
                <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 9, background: "rgba(79,172,254,.12)", color: "#4FACFE", fontWeight: 600, border: "1px solid rgba(79,172,254,.2)", backdropFilter: "blur(8px)" }}>{myClasses.length} lớp · {classStudents.length} học sinh</span>
                {pendingCount > 0 && <span onClick={() => setView("pending")} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 9, background: "rgba(239,68,68,.12)", color: "#EF4444", fontWeight: 700, cursor: "pointer", border: "1px solid rgba(239,68,68,.25)", animation: "glowbeat 2s infinite", backdropFilter: "blur(8px)" }}>⚠ {pendingCount} đăng ký chờ duyệt</span>}
              </>
            ) : (
              <>
                {presentToday.includes(user.data.id) ? <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 9, background: "rgba(52,211,153,.12)", color: "#34D399", fontWeight: 600, border: "1px solid rgba(52,211,153,.25)", animation: "glowPulseGreen 2.5s infinite" }}>✓ Đã điểm danh</span> : <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 9, background: "rgba(245,158,11,.12)", color: "#F59E0B", fontWeight: 600, border: "1px solid rgba(245,158,11,.25)" }}>⚠ Chưa điểm danh</span>}
                <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 9, background: "rgba(239,68,68,.1)", color: "#EF4444", fontWeight: 500, border: "1px solid rgba(239,68,68,.18)" }}>{tasks.filter(t => t.status === "pending").length} bài chờ nộp</span>
              </>
            )}
          </div>
        </div>
        <div style={{ fontSize: 58, animation: "float 4s ease-in-out infinite", filter: "drop-shadow(0 8px 24px rgba(79,172,254,.3))" }}>{isT ? "📋" : "📚"}</div>
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
        ]).map(({ l, v, c, Ic, s }, i) => (
          <div key={l} className="scard cglow card-reveal" style={{ padding: 16, animationDelay: `${i * .07}s`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: `radial-gradient(circle,${c}18,transparent)`, pointerEvents: "none" }} />
            <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg,${c}22,${c}10)`, display: "flex", alignItems: "center", justifyContent: "center", color: c, marginBottom: 13, border: `1px solid ${c}25`, boxShadow: `0 4px 16px ${c}20`, transition: "all .3s cubic-bezier(.34,1.56,.64,1)" }}><Ic size={16} /></div>
            <div className="hfont stat-val" style={{ fontSize: 24, fontWeight: 400, color: "#E2EAF4", marginBottom: 2, animationDelay: `${i * .07 + .1}s` }}>{v}</div>
            <div style={{ fontSize: 11, color: "#4A6580", fontWeight: 500 }}>{l}</div>
            <div style={{ fontSize: 10, color: "#2E4A6A", marginTop: 2 }}>{s}</div>
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
              { Ic:Library, l:"Tài liệu", v:"library", c:"#F59E0B" },
            ]).map(({ Ic, l, v, c }) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "12px 7px", borderRadius: 12, cursor: "pointer", background: `${c}0A`, border: `1px solid ${c}20`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: "inherit", color: c, transition: "all .3s cubic-bezier(.34,1.56,.64,1)" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.05)"; e.currentTarget.style.boxShadow = `0 8px 24px ${c}30`; e.currentTarget.style.background = `${c}16`; }} onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.background = `${c}0A`; }}>
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
  const [photo, setPhoto] = useState(t.photo || null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const profilePhotoRef = useRef();
  const modalPhotoRef = useRef();

  const handleProfilePhoto = file => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    setPhotoUploading(true);
    const r = new FileReader();
    r.onload = () => { setPhoto(r.result); setPhotoUploading(false); };
    r.readAsDataURL(file);
  };

  const handleModalPhoto = file => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => setNewT(p => ({ ...p, photo: r.result }));
    r.readAsDataURL(file);
  };
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
    state.setTeachers(p => p.map(x => x.id === t.id ? { ...x, name: name.trim(), subject, em, photo: photo || x.photo, ...(pw ? { password: pw } : {}) } : x));
    setSaved(true); setPw(""); setPwOld("");
    setTimeout(() => setSaved(false), 2500);
  };

  const addOrEditTeacher = () => {
    setErrT("");
    if (!newT.name.trim() || !newT.username.trim() || (!editT && !newT.password)) { setErrT("Điền đầy đủ thông tin bắt buộc"); return; }
    if (state.teachers.find(x => x.username === newT.username.trim() && x.id !== editT?.id)) { setErrT("Username đã tồn tại"); return; }
    if (editT) {
      state.setTeachers(p => p.map(x => x.id === editT.id ? { ...x, name: newT.name.trim(), username: newT.username.trim(), subject: newT.subject, em: newT.em, photo: newT.photo ?? x.photo, ...(newT.password ? { password: newT.password } : {}) } : x));
    } else {
      if (newT.password.length < 4) { setErrT("Mật khẩu tối thiểu 4 ký tự"); return; }
      state.setTeachers(p => [...p, { id: "t_" + Date.now(), name: newT.name.trim(), username: newT.username.trim(), password: newT.password, subject: newT.subject, em: newT.em, photo: newT.photo || null, isAdmin: false }]);
    }
    setNewT({ name: "", username: "", password: "", subject: SUBJECTS[0], em: "👨‍🏫", photo: null }); setShowAddT(false); setEditT(null); setErrT("");
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
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 10, letterSpacing: ".05em" }}>AVATAR</div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
              <div onClick={() => profilePhotoRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg,rgba(79,172,254,.15),rgba(167,139,250,.1))", border: "2px solid rgba(79,172,254,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: photo ? undefined : 30, flexShrink: 0, boxShadow: "0 0 18px rgba(79,172,254,.2)", cursor: "pointer", position: "relative" }}>
                {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (photoUploading ? "⏳" : em)}
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s" }} onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}><Camera size={18} color="#fff" /></div>
              </div>
              <div>
                <button onClick={() => profilePhotoRef.current?.click()} style={{ padding: "6px 13px", borderRadius: 9, border: "1px solid rgba(79,172,254,.32)", background: "rgba(79,172,254,.07)", color: "#4FACFE", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <Camera size={12} />Tải ảnh lên
                </button>
                {photo && <button onClick={() => setPhoto(null)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,.25)", background: "rgba(239,68,68,.06)", color: "#EF4444", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Xóa ảnh</button>}
              </div>
            </div>
            <input ref={profilePhotoRef} type="file" accept="image/*" onChange={e => handleProfilePhoto(e.target.files[0])} style={{ display: "none" }} />
            {!photo && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EMOJIS.slice(0, 16).map(e => (
                  <button key={e} onClick={() => setEm(e)} style={{ width: 40, height: 40, borderRadius: 11, border: `2px solid ${em===e ? "rgba(79,172,254,.7)" : "rgba(255,255,255,.07)"}`, background: em===e ? "linear-gradient(135deg,rgba(79,172,254,.18),rgba(79,172,254,.08))" : "rgba(255,255,255,.03)", cursor: "pointer", fontSize: 21, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .22s cubic-bezier(.34,1.56,.64,1)", transform: em===e ? "scale(1.12)" : "scale(1)", boxShadow: em===e ? "0 4px 14px rgba(79,172,254,.25)" : "none" }}>{e}</button>
                ))}
              </div>
            )}
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
              <Av em={x.em||"👨‍🏫"} photo={x.photo||null} sz={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#E2EAF4" }}>{x.name}</div>
                <div style={{ fontSize: 10, color: "#2E4A6A" }}>@{x.username} · {x.subject||"—"}{x.isAdmin?" · Admin":""}</div>
              </div>
              {x.id === t.id && <Badge c="violet">Bạn</Badge>}
              {x.isAdmin && x.id !== t.id && <Badge c="amber">Admin</Badge>}
              <button onClick={() => { setEditT(x); setNewT({ name: x.name, username: x.username, password: "", subject: x.subject||SUBJECTS[0], em: x.em||"👨‍🏫", photo: x.photo||null }); setErrT(""); setShowAddT(true); }} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(79,172,254,.22)", background: "rgba(79,172,254,.06)", color: "#4FACFE", cursor: "pointer", display: "flex" }}><Edit2 size={12} /></button>
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
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4A6580", marginBottom: 10, letterSpacing: ".05em" }}>AVATAR</div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
                  <div onClick={() => modalPhotoRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 18, overflow: "hidden", background: "linear-gradient(135deg,rgba(79,172,254,.15),rgba(167,139,250,.1))", border: "2px solid rgba(79,172,254,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: newT.photo ? undefined : 34, flexShrink: 0, boxShadow: "0 0 20px rgba(79,172,254,.2)", cursor: "pointer", position: "relative" }}>
                    {newT.photo ? <img src={newT.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : newT.em}
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s" }} onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}><Camera size={18} color="#fff" /></div>
                  </div>
                  <div>
                    <button onClick={() => modalPhotoRef.current?.click()} style={{ padding: "6px 13px", borderRadius: 9, border: "1px solid rgba(79,172,254,.32)", background: "rgba(79,172,254,.07)", color: "#4FACFE", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                      <Camera size={12} />Tải ảnh lên
                    </button>
                    {newT.photo && <button onClick={() => setNewT(p => ({ ...p, photo: null }))} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,.25)", background: "rgba(239,68,68,.06)", color: "#EF4444", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Xóa ảnh</button>}
                  </div>
                </div>
                <input ref={modalPhotoRef} type="file" accept="image/*" onChange={e => handleModalPhoto(e.target.files[0])} style={{ display: "none" }} />
                {!newT.photo && (
                  <div style={{ background: "rgba(255,255,255,.025)", borderRadius: 13, padding: 10, border: "1px solid rgba(255,255,255,.06)" }}>
                    {[
                      { label: "Giáo viên", items: ["👨‍🏫","👩‍🏫","🧑‍🏫","👨‍🎓","👩‍🎓"] },
                      { label: "Chuyên môn", items: ["👨‍🔬","👩‍🔬","👨‍💻","👩‍💻","👨‍💼","👩‍💼"] },
                      { label: "Biểu tượng", items: ["🎓","📚","⭐","🏆","💡","🎯","✏️","📝"] },
                    ].map(({ label, items }) => (
                      <div key={label} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#2E4A6A", letterSpacing: ".08em", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {items.map(e => (
                            <button key={e} onClick={() => setNewT(p => ({ ...p, em: e }))} style={{ width: 42, height: 42, borderRadius: 11, border: `2px solid ${newT.em===e ? "rgba(79,172,254,.7)" : "rgba(255,255,255,.07)"}`, background: newT.em===e ? "linear-gradient(135deg,rgba(79,172,254,.18),rgba(79,172,254,.08))" : "rgba(255,255,255,.03)", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .22s cubic-bezier(.34,1.56,.64,1)", transform: newT.em===e ? "scale(1.12)" : "scale(1)", boxShadow: newT.em===e ? "0 4px 16px rgba(79,172,254,.25)" : "none" }}>{e}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [winW, setWinW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);

  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = winW <= 768;
  const isTablet = winW > 768 && winW <= 1100;
  const sideW = isMobile ? 0 : (col || isTablet) ? 58 : 224;

  const classId = user.role === "teacher"
    ? state.classes.find(c => c.teacherId === user.data.id)?.id
    : user.classId;
  const classInfo = state.classes.find(c => c.id === classId);
  const myClassIds = useMemo(() => state.classes.filter(c => c.teacherId === user?.data?.id).map(c => c.id), [state.classes, user]);
  const pendingCount = user.role === "teacher" ? state.pendingStudents.filter(p => myClassIds.includes(p.classId)).length : 0;

  const nav = user.role === "teacher" ? NAV_TEACHER : NAV_STUDENT;
  const bottomNav = nav.slice(0, 5);

  const PAGES = useMemo(() => ({
    dashboard:   p => <DashPage    {...p} setView={setView} />,
    students:    p => <StudentsPage  {...p} />,
    seating:     p => <SeatingPage   {...p} isMobile={isMobile} />,
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

  const handleSetView = v => { setView(v); setMobileOpen(false); };

  return (
    <div className="ecp" style={{ display: "flex" }}>
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 49, backdropFilter: "blur(4px)" }} />
      )}
      {!isMobile && (
        <div className="sidebar-desktop" style={{ display: "flex" }}>
          <Sidebar view={view} setView={handleSetView} col={col || isTablet} user={user} pendingCount={pendingCount} />
        </div>
      )}
      {mobileOpen && (
        <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 240, zIndex: 50, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#06101E,#050C1A)", borderRight: "1px solid rgba(79,172,254,.1)", boxShadow: "8px 0 40px rgba(0,0,0,.6)", animation: "slideInLeft .25s cubic-bezier(.34,1.2,.64,1)" }}>
          <div style={{ height: 60, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid rgba(79,172,254,.06)", gap: 10, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={LOGO_SM} alt="" style={{ width: 32, height: 32, borderRadius: 9, boxShadow: "0 4px 16px rgba(29,108,245,.4)" }} />
              <span className="hfont" style={{ fontSize: 14, color: "#E2EAF4" }}>E-Class <span className="gtext">P2K</span></span>
            </div>
            <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4A6580" }}><X size={18} /></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {nav.map(({ id, Ic, l }) => (
              <div key={id} onClick={() => handleSetView(id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, marginBottom: 2, cursor: "pointer", background: view === id ? "linear-gradient(135deg,rgba(79,172,254,.14),rgba(79,172,254,.07))" : "transparent", color: view === id ? "#4FACFE" : "#3D5A78", border: view === id ? "1px solid rgba(79,172,254,.2)" : "1px solid transparent", transition: "all .2s", position: "relative" }}>
                <Ic size={15} strokeWidth={view === id ? 2.5 : 1.8} style={{ filter: view === id ? "drop-shadow(0 0 5px rgba(79,172,254,.7))" : "none" }} />
                <span style={{ fontSize: 13, fontWeight: view === id ? 700 : 400 }}>{l}</span>
                {id === "pending" && pendingCount > 0 && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 99, background: "rgba(239,68,68,.18)", color: "#EF4444" }}>{pendingCount}</span>}
                {view === id && <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: "linear-gradient(180deg,#4FACFE,#00F2FE)", borderRadius: "2px 0 0 2px" }} />}
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,.05)" }}>
            <button onClick={onLogout} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <LogOut size={13} />Đăng xuất
            </button>
          </div>
        </div>
      )}
      <div className="main-content" style={{ marginLeft: sideW, flex: 1, minHeight: "100vh", transition: "margin-left .3s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column" }}>
        <TopBar view={view} toggleSide={() => setCol(p => !p)} toggleMobile={() => setMobileOpen(p => !p)} user={user} onLogout={onLogout} classInfo={classInfo} />
        <div style={{ flex: 1, paddingBottom: isMobile ? 70 : 0 }}>
          <PageFn state={state} user={user} />
        </div>
      </div>
      {isMobile && (
        <div className="bottom-nav" style={{ display: "flex" }}>
        {bottomNav.map(({ id, Ic, l }) => (
          <button key={id} onClick={() => handleSetView(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "6px 4px", border: "none", background: "transparent", cursor: "pointer", color: view === id ? "#4FACFE" : "#3D5A78", fontFamily: "inherit", position: "relative", transition: "all .2s" }}>
            {view === id && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 24, height: 2, borderRadius: 2, background: "linear-gradient(90deg,#4FACFE,#00F2FE)" }} />}
            <Ic size={20} strokeWidth={view === id ? 2.5 : 1.8} style={{ filter: view === id ? "drop-shadow(0 0 6px rgba(79,172,254,.8))" : "none", transition: "all .2s" }} />
            <span style={{ fontSize: 9, fontWeight: view === id ? 700 : 400 }}>{l}</span>
            {id === "pending" && pendingCount > 0 && <div style={{ position: "absolute", top: 4, right: "calc(50% - 14px)", width: 7, height: 7, borderRadius: "50%", background: "#EF4444", border: "1.5px solid #050C1A" }} />}
          </button>
        ))}
        <button onClick={() => setMobileOpen(p => !p)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "6px 4px", border: "none", background: "transparent", cursor: "pointer", color: "#3D5A78", fontFamily: "inherit", transition: "all .2s" }}>
          <Menu size={20} strokeWidth={1.8} />
          <span style={{ fontSize: 9 }}>Thêm</span>
        </button>
      </div>
      )}
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

  useEffect(() => {
    if (!user || user.role !== "teacher") return;
    const updated = state.teachers.find(t => t.id === user.data.id);
    if (updated && JSON.stringify(updated) !== JSON.stringify(user.data)) {
      setUser(prev => ({ ...prev, data: updated }));
    }
  }, [state.teachers]);

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
        <div className="ecp" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,108,245,.2),transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", filter: "blur(60px)", animation: "breathe 3s ease-in-out infinite", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
          <div style={{ textAlign: "center", position: "relative" }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 24, animation: "float 3s ease-in-out infinite" }}>
              <img src={LOGO_LG} alt="E-Class P2K" className="logo-entrance" style={{ width: 84, height: 84, borderRadius: 22, boxShadow: "0 16px 48px rgba(29,108,245,.55),0 0 0 1px rgba(79,172,254,.2)", display: "block" }} />
              <div style={{ position: "absolute", inset: -8, borderRadius: 30, border: "1.5px solid rgba(79,172,254,.25)", animation: "glowbeat 2s ease-in-out infinite", pointerEvents: "none" }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#4FACFE", marginBottom: 6, animation: "fadeUp .5s .3s both", letterSpacing: ".02em" }}>E-Class P2K</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", animation: "fadeUp .5s .5s both" }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#4FACFE", animation: `breathe 1.2s ${i * .2}s ease-in-out infinite`, opacity: .5 }} />)}
            </div>
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
