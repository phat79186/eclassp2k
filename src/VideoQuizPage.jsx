import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Plus, Trash2, Edit2, Save, X, Check, ChevronLeft,
  ChevronRight, Upload, Video, Clock, HelpCircle,
  CheckCircle, XCircle, AlertCircle, Eye, EyeOff,
  RotateCcw, BookOpen, Award, BarChart2, Lock, Unlock,
  FileVideo, Settings, ArrowLeft
} from "lucide-react";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Utility
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function fmtTime(sec) {
  if (isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   CSS (injected as <style>)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const VQ_CSS = `
@keyframes vqFadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes vqSlideIn  { from{opacity:0;transform:scale(0.94) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes vqPulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.75;transform:scale(0.97)} }
@keyframes vqShimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes vqRing     { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.6);opacity:0} }
@keyframes vqBounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes vqSpin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

/* â”€â”€ Root â”€â”€ */
.vq-root {
  min-height:100vh;
  background:var(--bg,#050C1A);
  color:var(--text,#fff);
  font-family:'Outfit','Inter',sans-serif;
}

/* â”€â”€ Header (standalone mode) â”€â”€ */
.vq-header {
  display:flex; align-items:center; gap:12px;
  padding:14px 24px;
  background:var(--surface,rgba(10,22,40,0.98));
  border-bottom:1px solid var(--border2,rgba(255,255,255,.05));
  backdrop-filter:blur(20px);
  position:sticky; top:0; z-index:10;
}
.vq-header h1 { font-size:16px; font-weight:700; margin:0; flex:1; letter-spacing:-.01em; }
.vq-role-badge {
  padding:3px 11px; border-radius:20px; font-size:10px; font-weight:700;
  letter-spacing:.06em; text-transform:uppercase;
}
.vq-role-badge.teacher { background:rgba(167,139,250,.12); color:#A78BFA; border:1px solid rgba(167,139,250,.22); }
.vq-role-badge.student { background:rgba(79,172,254,.1); color:#4FACFE; border:1px solid rgba(79,172,254,.2); }

/* â”€â”€ Layout â”€â”€ */
.vq-layout { display:flex; height:calc(100vh - 61px); overflow:hidden; }
.vq-main   { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:16px; scrollbar-width:thin; }
.vq-sidebar{ width:320px; border-left:1px solid var(--border2,rgba(255,255,255,.05)); overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; scrollbar-width:thin; }

/* â”€â”€ Upload zone â”€â”€ */
.vq-upload-zone {
  border:1.5px dashed rgba(79,172,254,.25);
  border-radius:18px; padding:52px 24px;
  text-align:center; cursor:pointer;
  transition:all .3s cubic-bezier(.4,0,.2,1);
  background:rgba(79,172,254,.03);
  animation:vqFadeUp .4s ease;
}
.vq-upload-zone:hover,.vq-upload-zone.drag {
  border-color:rgba(79,172,254,.6);
  background:rgba(79,172,254,.07);
  transform:translateY(-2px);
  box-shadow:0 12px 32px rgba(79,172,254,.12);
}
.vq-upload-icon { font-size:44px; margin-bottom:14px; animation:vqBounce 2.5s ease-in-out infinite; display:block; }
.vq-upload-zone h3 { margin:0 0 6px; font-size:15px; font-weight:700; color:var(--text,#fff); }
.vq-upload-zone p  { margin:0; font-size:12px; color:var(--text3,rgba(255,255,255,.45)); line-height:1.6; }

/* â”€â”€ Video Container â”€â”€ */
.vq-video-wrap {
  position:relative; border-radius:14px; overflow:hidden;
  background:#000; aspect-ratio:16/9;
  box-shadow:0 4px 32px rgba(0,0,0,.5);
  animation:vqFadeUp .35s ease;
}
.vq-video-wrap video { width:100%; height:100%; display:block; object-fit:contain; }

/* â”€â”€ Controls overlay â”€â”€ */
.vq-controls {
  position:absolute; bottom:0; left:0; right:0;
  background:linear-gradient(transparent,rgba(0,0,0,.8));
  padding:28px 14px 12px;
  opacity:0; transition:opacity .22s;
}
.vq-video-wrap:hover .vq-controls { opacity:1; }

/* â”€â”€ Progress bar â”€â”€ */
.vq-progress-track {
  height:3px; border-radius:3px;
  background:rgba(255,255,255,.18);
  position:relative; cursor:pointer; margin-bottom:10px;
  transition:height .15s;
}
.vq-progress-track:hover { height:5px; }
.vq-progress-fill {
  height:100%; border-radius:3px;
  background:linear-gradient(90deg,#4FACFE,#43E97B);
  pointer-events:none;
}
.vq-progress-thumb {
  position:absolute; top:50%; transform:translate(-50%,-50%);
  width:11px; height:11px; border-radius:50%;
  background:#fff; box-shadow:0 0 0 2px rgba(79,172,254,.7);
  pointer-events:none; transition:transform .15s;
  opacity:0;
}
.vq-progress-track:hover .vq-progress-thumb { opacity:1; transform:translate(-50%,-50%) scale(1.3); }

/* â”€â”€ Quiz markers â”€â”€ */
.vq-quiz-marker {
  position:absolute; top:50%; transform:translate(-50%,-50%);
  width:9px; height:9px; border-radius:50%;
  border:1.5px solid rgba(255,255,255,.9); cursor:pointer; z-index:2;
  transition:transform .15s;
}
.vq-quiz-marker:hover { transform:translate(-50%,-50%) scale(1.6); }
.vq-quiz-marker.done    { background:#34D399; border-color:#34D399; }
.vq-quiz-marker.pending { background:#F59E0B; border-color:#F59E0B; }
.vq-quiz-marker.locked  { background:rgba(239,68,68,.8); border-color:#EF4444; }

/* â”€â”€ Control buttons â”€â”€ */
.vq-ctrl-row { display:flex; align-items:center; gap:8px; }
.vq-ctrl-btn {
  background:none; border:none; color:#fff; cursor:pointer;
  width:30px; height:30px; border-radius:8px;
  display:flex; align-items:center; justify-content:center;
  transition:background .15s;
}
.vq-ctrl-btn:hover { background:rgba(255,255,255,.14); }
.vq-time-display { font-size:11px; color:rgba(255,255,255,.75); font-variant-numeric:tabular-nums; min-width:78px; }
.vq-vol-slider { width:60px; cursor:pointer; accent-color:#4FACFE; }
.vq-ctrl-row .spacer { flex:1; }

/* â”€â”€ Locked banner â”€â”€ */
.vq-locked-banner {
  position:absolute; top:10px; right:10px;
  background:rgba(10,22,40,.85); backdrop-filter:blur(12px);
  border:1px solid rgba(239,68,68,.4);
  border-radius:8px; padding:5px 11px;
  display:flex; align-items:center; gap:6px;
  font-size:11px; font-weight:600; color:#FCA5A5;
  animation:vqPulse 2.4s ease-in-out infinite;
}

/* â”€â”€ Quiz Overlay â”€â”€ */
.vq-quiz-overlay {
  position:absolute; inset:0;
  background:rgba(5,12,26,.88); backdrop-filter:blur(18px);
  display:flex; align-items:center; justify-content:center;
  z-index:20;
  animation:vqSlideIn .32s cubic-bezier(.34,1.3,.64,1);
}
.vq-quiz-card {
  background:var(--surface,#0A1628);
  border:1px solid rgba(255,255,255,.08);
  border-radius:18px; padding:26px 28px;
  max-width:520px; width:92%;
  box-shadow:0 24px 60px rgba(0,0,0,.55);
}
.vq-quiz-header { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
.vq-quiz-badge {
  padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700;
  background:rgba(245,158,11,.15); color:#F59E0B;
  border:1px solid rgba(245,158,11,.25);
  text-transform:uppercase; letter-spacing:.06em;
}
.vq-quiz-q {
  font-size:15px; font-weight:600; line-height:1.55;
  margin:0 0 18px; color:var(--text,#fff);
}
.vq-quiz-options { display:flex; flex-direction:column; gap:8px; }
.vq-quiz-opt {
  display:flex; align-items:center; gap:12px;
  padding:11px 14px; border-radius:11px; cursor:pointer;
  border:1px solid var(--border,rgba(255,255,255,.08));
  background:var(--wa03,rgba(255,255,255,.03));
  transition:all .18s; font-size:13.5px; font-weight:500;
  user-select:none;
}
.vq-quiz-opt:hover:not(.disabled) {
  border-color:rgba(79,172,254,.4);
  background:rgba(79,172,254,.07);
  transform:translateX(2px);
}
.vq-quiz-opt.selected { border-color:#4FACFE; background:rgba(79,172,254,.1); color:#4FACFE; }
.vq-quiz-opt.correct  { border-color:#34D399; background:rgba(52,211,153,.1); color:#34D399; }
.vq-quiz-opt.wrong    { border-color:#EF4444; background:rgba(239,68,68,.08); color:#F87171; }
.vq-quiz-opt.disabled { cursor:not-allowed; }
.vq-opt-letter {
  width:26px; height:26px; border-radius:7px;
  border:1.5px solid currentColor; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:800;
}
.vq-quiz-submit {
  margin-top:16px; width:100%; padding:11px;
  border-radius:11px; border:none; cursor:pointer;
  font-size:13.5px; font-weight:700;
  background:linear-gradient(90deg,#4FACFE 0%,#00d4ff 100%);
  color:#050C1A; transition:all .2s; letter-spacing:.01em;
}
.vq-quiz-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(79,172,254,.35); }
.vq-quiz-submit:disabled { opacity:.4; cursor:not-allowed; }
.vq-quiz-feedback {
  margin-top:12px; padding:11px 14px; border-radius:11px;
  font-size:13px; font-weight:600; display:flex; align-items:center; gap:8px;
}
.vq-quiz-feedback.correct { background:rgba(52,211,153,.1); border:1px solid rgba(52,211,153,.25); color:#34D399; }
.vq-quiz-feedback.wrong   { background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); color:#F87171; }
.vq-continue-btn {
  margin-top:10px; width:100%; padding:11px;
  border-radius:11px; border:none; cursor:pointer;
  font-size:13.5px; font-weight:700; letter-spacing:.01em;
  background:linear-gradient(90deg,#34D399 0%,#10b981 100%);
  color:#050C1A; transition:all .2s;
}
.vq-continue-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(52,211,153,.3); }

/* â”€â”€ Sidebar titles â”€â”€ */
.vq-panel-title {
  font-size:10px; font-weight:800; letter-spacing:.08em;
  text-transform:uppercase; color:var(--text3,rgba(255,255,255,.45));
  margin:0 0 8px; display:flex; align-items:center; gap:5px;
}

/* â”€â”€ Quiz Items â”€â”€ */
.vq-quiz-item {
  border-radius:11px; border:1px solid var(--border2,rgba(255,255,255,.05));
  background:var(--wa02,rgba(255,255,255,.02)); padding:11px;
  transition:all .2s; animation:vqFadeUp .3s ease;
}
.vq-quiz-item:hover {
  border-color:rgba(79,172,254,.18);
  background:rgba(79,172,254,.04);
  transform:translateY(-1px);
}
.vq-quiz-item-header { display:flex; align-items:center; gap:7px; margin-bottom:5px; }
.vq-time-tag {
  background:rgba(245,158,11,.13); color:#F59E0B;
  border:1px solid rgba(245,158,11,.22); border-radius:5px;
  padding:2px 7px; font-size:10px; font-weight:700; font-variant-numeric:tabular-nums;
}
.vq-quiz-q-preview {
  font-size:12px; font-weight:500; margin:0; flex:1;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  color:var(--text2,rgba(255,255,255,.75));
}
.vq-icon-btn {
  width:26px; height:26px; border-radius:7px; border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center; transition:all .18s;
  background:var(--wa04,rgba(255,255,255,.04)); color:var(--text3,rgba(255,255,255,.45));
}
.vq-icon-btn:hover { background:var(--wa08,rgba(255,255,255,.08)); color:var(--text,#fff); }
.vq-icon-btn.danger:hover { background:rgba(239,68,68,.12); color:#F87171; }

/* â”€â”€ Form fields â”€â”€ */
.vq-form-group { margin-bottom:11px; }
.vq-form-group label { display:block; font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--text3,rgba(255,255,255,.45)); margin-bottom:5px; }
.vq-form-input,.vq-form-textarea {
  width:100%; padding:8px 11px; border-radius:9px;
  border:1px solid var(--inp-bd,rgba(255,255,255,.1));
  background:var(--inp-bg,rgba(255,255,255,.05)); color:var(--text,#fff);
  font-size:12.5px; outline:none; transition:border .2s, box-shadow .2s;
  box-sizing:border-box; font-family:inherit;
}
.vq-form-input:focus,.vq-form-textarea:focus {
  border-color:rgba(79,172,254,.45);
  box-shadow:0 0 0 3px rgba(79,172,254,.08);
}
.vq-form-textarea { resize:vertical; min-height:60px; }
.vq-option-row { display:flex; align-items:center; gap:7px; margin-bottom:7px; }
.vq-correct-toggle {
  width:26px; height:26px; border-radius:7px;
  border:1.5px solid var(--border,rgba(255,255,255,.1));
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all .18s; flex-shrink:0;
  background:transparent; color:var(--text3,rgba(255,255,255,.45));
}
.vq-correct-toggle.active { border-color:#34D399; background:rgba(52,211,153,.12); color:#34D399; }

/* â”€â”€ Buttons â”€â”€ */
.vq-add-btn {
  padding:9px 16px; border-radius:10px; border:none; cursor:pointer;
  font-size:12.5px; font-weight:700; transition:all .2s; width:100%;
  background:linear-gradient(90deg,#4FACFE,#00d4ff); color:#050C1A;
  letter-spacing:.01em;
}
.vq-add-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 22px rgba(79,172,254,.3); }
.vq-add-btn:disabled { opacity:.4; cursor:not-allowed; }
.vq-add-btn.secondary {
  background:var(--wa04,rgba(255,255,255,.04)); color:var(--text2,rgba(255,255,255,.75));
  border:1px solid var(--border,rgba(255,255,255,.08)); box-shadow:none;
}
.vq-add-btn.secondary:hover { background:var(--wa07,rgba(255,255,255,.07)); transform:none; box-shadow:none; }

/* â”€â”€ Score card â”€â”€ */
.vq-score-card {
  border-radius:13px; border:1px solid var(--border2,rgba(255,255,255,.05));
  background:var(--wa02,rgba(255,255,255,.02)); padding:14px;
}
.vq-score-num {
  font-size:30px; font-weight:800;
  background:linear-gradient(90deg,#4FACFE,#43E97B);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  line-height:1;
}
.vq-score-label { font-size:11px; color:var(--text3,rgba(255,255,255,.45)); margin-top:3px; }
.vq-progress-bar-wrap { background:var(--wa07,rgba(255,255,255,.07)); border-radius:20px; height:5px; margin-top:10px; overflow:hidden; }
.vq-progress-bar-fill { height:100%; border-radius:20px; background:linear-gradient(90deg,#4FACFE,#43E97B); transition:width .6s cubic-bezier(.4,0,.2,1); }

/* â”€â”€ Assignment cards â”€â”€ */
.vq-assign-card {
  border-radius:13px; border:1px solid var(--border2,rgba(255,255,255,.05));
  background:var(--wa02,rgba(255,255,255,.02)); padding:14px 15px;
  cursor:pointer; transition:all .22s; margin-bottom:8px;
  animation:vqFadeUp .3s ease;
}
.vq-assign-card:hover {
  border-color:rgba(79,172,254,.22);
  background:rgba(79,172,254,.04);
  transform:translateY(-2px);
  box-shadow:0 8px 24px rgba(0,0,0,.2);
}
.vq-assign-card h3 { margin:0 0 3px; font-size:13.5px; font-weight:700; color:var(--text,#fff); }
.vq-assign-card p  { margin:0; font-size:11.5px; color:var(--text3,rgba(255,255,255,.45)); }
.vq-assign-meta { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
.vq-meta-tag {
  display:flex; align-items:center; gap:4px;
  font-size:10px; color:var(--text3,rgba(255,255,255,.45));
  background:var(--wa04,rgba(255,255,255,.04));
  border:1px solid var(--border2,rgba(255,255,255,.05));
  border-radius:5px; padding:3px 7px; font-weight:600;
}

/* â”€â”€ Add-quiz form box â”€â”€ */
.vq-add-form-box {
  background:rgba(79,172,254,.04);
  border:1px solid rgba(79,172,254,.15);
  border-radius:13px; padding:15px;
  animation:vqSlideIn .25s ease;
}

/* â”€â”€ Divider â”€â”€ */
.vq-divider { border:none; border-top:1px solid var(--border2,rgba(255,255,255,.05)); margin:10px 0; }

/* â”€â”€ Empty state â”€â”€ */
.vq-empty { text-align:center; padding:36px 16px; color:var(--text3,rgba(255,255,255,.45)); }
.vq-empty svg { opacity:.25; margin-bottom:10px; }
.vq-empty p { margin:0; font-size:12.5px; line-height:1.6; }

/* â”€â”€ Complete banner â”€â”€ */
.vq-complete-banner {
  border-radius:13px; padding:16px;
  text-align:center;
  background:rgba(52,211,153,.07);
  border:1px solid rgba(52,211,153,.2);
  animation:vqSlideIn .4s ease;
}

/* â”€â”€ Responsive â”€â”€ */
@media(max-width:768px){
  .vq-layout{ flex-direction:column; height:auto; }
  .vq-sidebar{ width:100%; border-left:none; border-top:1px solid var(--border2,rgba(255,255,255,.05)); }
}
`;


/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   QuizOverlay â€” hiá»ƒn thá»‹ khi video pause á»Ÿ má»‘c quiz
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function QuizOverlay({ quiz, onSubmit, onContinue, quizState }) {
  const [selected, setSelected] = useState(null);
  const letters = ["A", "B", "C", "D", "E"];

  const handleSubmit = () => {
    if (selected === null) return;
    onSubmit(selected);
  };

  const optClass = (i) => {
    let cls = "vq-quiz-opt";
    if (quizState?.answered) {
      cls += " disabled";
      if (i === quiz.correct) cls += " correct";
      else if (i === selected && i !== quiz.correct) cls += " wrong";
    } else {
      if (i === selected) cls += " selected";
    }
    return cls;
  };

  return (
    <div className="vq-quiz-overlay">
      <div className="vq-quiz-card">
        <div className="vq-quiz-header">
          <span className="vq-quiz-badge">ðŸ“ CÃ¢u há»i</span>
          <span style={{ fontSize: 12, color: "#8b92a5", marginLeft: "auto" }}>
            Tráº£ lá»i Ä‘á»ƒ tiáº¿p tá»¥c video
          </span>
        </div>

        <p className="vq-quiz-q">{quiz.question}</p>

        <div className="vq-quiz-options">
          {quiz.options.map((opt, i) => (
            <div
              key={i}
              className={optClass(i)}
              onClick={() => !quizState?.answered && setSelected(i)}
            >
              <span className="vq-opt-letter">{letters[i]}</span>
              <span style={{ flex: 1 }}>{opt}</span>
              {quizState?.answered && i === quiz.correct && (
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
              )}
              {quizState?.answered && i === selected && i !== quiz.correct && (
                <XCircle size={16} style={{ flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        {!quizState?.answered ? (
          <button
            className="vq-quiz-submit"
            disabled={selected === null}
            onClick={handleSubmit}
          >
            XÃ¡c nháº­n Ä‘Ã¡p Ã¡n
          </button>
        ) : (
          <>
            <div className={`vq-quiz-feedback ${quizState.correct ? "correct" : "wrong"}`}>
              {quizState.correct
                ? <><CheckCircle size={16} /> ChÃ­nh xÃ¡c! Tuyá»‡t vá»i!</>
                : <><XCircle size={16} /> ChÆ°a Ä‘Ãºng. ÄÃ¡p Ã¡n Ä‘Ãºng lÃ  {letters[quiz.correct]}.</>
              }
            </div>
            {quiz.explanation && (
              <p style={{ fontSize: 12, color: "#8b92a5", margin: "8px 0 0" }}>
                ðŸ’¡ {quiz.explanation}
              </p>
            )}
            <button className="vq-continue-btn" onClick={onContinue}>
              Tiáº¿p tá»¥c video â†’
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   VideoPlayer â€” custom player vá»›i seek-lock
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function VideoPlayer({ src, quizPoints, onQuizTrigger, answeredQuizzes, role }) {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [maxReached, setMaxReached] = useState(0); // thá»i Ä‘iá»ƒm xa nháº¥t Ä‘Ã£ xem
  const maxReachedRef = useRef(0);
  const triggeredRef = useRef(new Set()); // cÃ¡c quiz Ä‘Ã£ kÃ­ch hoáº¡t
  const wrapRef = useRef(null);

  // Sáº¯p xáº¿p quiz theo thá»i gian
  const sortedQuiz = useMemo(
    () => [...quizPoints].sort((a, b) => a.time - b.time),
    [quizPoints]
  );

  // Cáº­p nháº­t maxReached khi answeredQuizzes thay Ä‘á»•i
  // â†’ cho phÃ©p há»c sinh xem tiáº¿p sau khi tráº£ lá»i quiz
  useEffect(() => {
    if (!videoRef.current) return;
    // KhÃ´ng cáº§n lÃ m gÃ¬ Ä‘áº·c biá»‡t á»Ÿ Ä‘Ã¢y; logic náº±m á»Ÿ seek handler
  }, [answeredQuizzes]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const ct = v.currentTime;
    setCurrentTime(ct);

    // Cáº­p nháº­t maxReached
    if (ct > maxReachedRef.current) {
      maxReachedRef.current = ct;
      setMaxReached(ct);
    }

    // Kiá»ƒm tra quiz trigger (chá»‰ vá»›i student)
    if (role === "student") {
      for (const qp of sortedQuiz) {
        const id = qp.id;
        if (
          !answeredQuizzes[id] &&
          !triggeredRef.current.has(id) &&
          ct >= qp.time &&
          ct < qp.time + 1.5
        ) {
          triggeredRef.current.add(id);
          v.pause();
          setPlaying(false);
          onQuizTrigger(qp);
          return;
        }
      }
    }
  }, [role, sortedQuiz, answeredQuizzes, onQuizTrigger]);

  const handleSeeking = useCallback(() => {
    if (role !== "student") return;
    const v = videoRef.current;
    if (!v) return;

    const seekTo = v.currentTime;

    // TÃ¬m quiz chÆ°a tráº£ lá»i gáº§n nháº¥t trÆ°á»›c vá»‹ trÃ­ seek
    const blockedQuiz = sortedQuiz.find(
      qp => !answeredQuizzes[qp.id] && seekTo > qp.time
    );

    if (blockedQuiz) {
      // KhÃ´ng Ä‘Æ°á»£c vÆ°á»£t qua quiz chÆ°a tráº£ lá»i
      v.currentTime = blockedQuiz.time - 0.5;
      return;
    }

    // KhÃ´ng Ä‘Æ°á»£c tua vÆ°á»£t maxReached
    if (seekTo > maxReachedRef.current + 2) {
      v.currentTime = maxReachedRef.current;
    }
  }, [role, sortedQuiz, answeredQuizzes]);

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current?.duration || 0);
  };

  const handleEnded = () => setPlaying(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  };

  const handleProgressClick = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTo = ratio * duration;
    v.currentTime = seekTo;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!document.fullscreenElement) {
      el?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // TÃ­nh % cho progress fill
  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const maxPct = duration ? (maxReached / duration) * 100 : 0;

  // CÃ¡c quiz chÆ°a tráº£ lá»i náº±m trong vÃ¹ng "xem Ä‘Æ°á»£c"
  const getMarkerStatus = (qp) => {
    if (answeredQuizzes[qp.id]) return "done";
    if (role === "student" && qp.time > maxReached + 1) return "locked";
    return "pending";
  };

  return (
    <div className="vq-video-wrap" ref={wrapRef}>
      <video
        ref={videoRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onClick={togglePlay}
        style={{ cursor: "pointer" }}
      />

      {/* Locked banner khi student Ä‘ang á»Ÿ vÃ¹ng bá»‹ cháº·n */}
      {role === "student" && sortedQuiz.some(qp => !answeredQuizzes[qp.id] && currentTime >= qp.time - 0.1 && !triggeredRef.current.has(qp.id)) && (
        <div className="vq-locked-banner">
          <Lock size={12} /> VÃ¹ng bá»‹ khoÃ¡ â€” tráº£ lá»i quiz Ä‘á»ƒ tiáº¿p tá»¥c
        </div>
      )}

      <div className="vq-controls">
        {/* Progress track */}
        <div
          className={`vq-progress-track ${role === "student" ? "student" : ""}`}
          ref={progressRef}
          onClick={handleProgressClick}
        >
          {/* VÃ¹ng Ä‘Ã£ xem tá»‘i Ä‘a (chá»‰ student) */}
          {role === "student" && (
            <div
              style={{
                position: "absolute", inset: 0, width: `${maxPct}%`,
                background: "rgba(255,255,255,0.12)", borderRadius: 4, pointerEvents: "none"
              }}
            />
          )}
          <div className="vq-progress-fill" style={{ width: `${progressPct}%` }} />
          <div className="vq-progress-thumb" style={{ left: `${progressPct}%` }} />

          {/* Quiz markers */}
          {sortedQuiz.map(qp => {
            if (!duration) return null;
            const pct = (qp.time / duration) * 100;
            const status = getMarkerStatus(qp);
            return (
              <div
                key={qp.id}
                className={`vq-quiz-marker ${status}`}
                style={{ left: `${pct}%` }}
                title={`Quiz lÃºc ${fmtTime(qp.time)}: ${qp.question?.slice(0, 40)}â€¦`}
              />
            );
          })}
        </div>

        {/* Controls row */}
        <div className="vq-ctrl-row">
          <button className="vq-ctrl-btn" onClick={togglePlay} title={playing ? "Dá»«ng" : "PhÃ¡t"}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className="vq-ctrl-btn" onClick={toggleMute}>
            {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <input
            type="range" min={0} max={1} step={0.05}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="vq-vol-slider"
          />
          <span className="vq-time-display">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>
          <div className="spacer" />
          <button className="vq-ctrl-btn" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   AddQuizForm â€” thÃªm / sá»­a quiz point (Teacher)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AddQuizForm({ initialData, videoDuration, currentTime, onSave, onCancel }) {
  const [timeStr, setTimeStr] = useState(
    initialData ? fmtTime(initialData.time) : fmtTime(Math.floor(currentTime || 0))
  );
  const [question, setQuestion] = useState(initialData?.question || "");
  const [options, setOptions] = useState(
    initialData?.options || ["", "", "", ""]
  );
  const [correct, setCorrect] = useState(initialData?.correct ?? 0);
  const [explanation, setExplanation] = useState(initialData?.explanation || "");

  const parseTime = (str) => {
    const parts = str.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return 0;
  };

  const handleSave = () => {
    if (!question.trim()) return alert("Vui lÃ²ng nháº­p cÃ¢u há»i!");
    const filledOpts = options.filter(o => o.trim());
    if (filledOpts.length < 2) return alert("Cáº§n Ã­t nháº¥t 2 Ä‘Ã¡p Ã¡n!");
    const timeSec = parseTime(timeStr);
    onSave({
      id: initialData?.id || Date.now(),
      time: Math.max(0, Math.min(timeSec, videoDuration || 99999)),
      question: question.trim(),
      options: options.map(o => o.trim()).filter(Boolean),
      correct,
      explanation: explanation.trim(),
    });
  };

  const updateOption = (i, val) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const addOption = () => {
    if (options.length >= 5) return;
    setOptions([...options, ""]);
  };

  const removeOption = (i) => {
    if (options.length <= 2) return;
    const next = options.filter((_, idx) => idx !== i);
    setOptions(next);
    if (correct >= next.length) setCorrect(0);
  };

  const letters = ["A", "B", "C", "D", "E"];

  return (
    <div style={{ background: "rgba(79,172,254,0.06)", border: "1px solid rgba(79,172,254,0.2)", borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <HelpCircle size={15} style={{ color: "#4FACFE" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#4FACFE" }}>
          {initialData ? "Chá»‰nh sá»­a cÃ¢u há»i" : "ThÃªm cÃ¢u há»i má»›i"}
        </span>
        {onCancel && (
          <button className="vq-icon-btn danger" style={{ marginLeft: "auto" }} onClick={onCancel}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="vq-form-group">
        <label>â± Thá»i Ä‘iá»ƒm (phÃºt:giÃ¢y)</label>
        <input
          className="vq-form-input"
          value={timeStr}
          onChange={e => setTimeStr(e.target.value)}
          placeholder="vÃ­ dá»¥: 1:30"
        />
      </div>

      <div className="vq-form-group">
        <label>â“ CÃ¢u há»i</label>
        <textarea
          className="vq-form-textarea"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Nháº­p cÃ¢u há»i tráº¯c nghiá»‡m..."
          rows={3}
        />
      </div>

      <div className="vq-form-group">
        <label>ðŸ“‹ CÃ¡c Ä‘Ã¡p Ã¡n (click âœ“ Ä‘á»ƒ Ä‘Ã¡nh dáº¥u Ä‘Ãºng)</label>
        {options.map((opt, i) => (
          <div key={i} className="vq-option-row">
            <button
              className={`vq-correct-toggle ${correct === i ? "active" : ""}`}
              onClick={() => setCorrect(i)}
              title="ÄÃ¡nh dáº¥u Ä‘Ã¡p Ã¡n Ä‘Ãºng"
            >
              {correct === i ? <Check size={13} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{letters[i]}</span>}
            </button>
            <input
              className="vq-form-input"
              style={{ flex: 1 }}
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              placeholder={`ÄÃ¡p Ã¡n ${letters[i]}â€¦`}
            />
            {options.length > 2 && (
              <button className="vq-icon-btn danger" onClick={() => removeOption(i)}>
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {options.length < 5 && (
          <button className="vq-add-btn secondary" style={{ marginTop: 6 }} onClick={addOption}>
            <Plus size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
            ThÃªm Ä‘Ã¡p Ã¡n
          </button>
        )}
      </div>

      <div className="vq-form-group">
        <label>ðŸ’¡ Giáº£i thÃ­ch (tÃ¹y chá»n)</label>
        <input
          className="vq-form-input"
          value={explanation}
          onChange={e => setExplanation(e.target.value)}
          placeholder="Giáº£i thÃ­ch sau khi tráº£ lá»i..."
        />
      </div>

      <button className="vq-add-btn" onClick={handleSave}>
        <Save size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
        {initialData ? "LÆ°u thay Ä‘á»•i" : "ThÃªm cÃ¢u há»i"}
      </button>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TeacherView â€” táº¡o / quáº£n lÃ½ bÃ i táº­p video
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function TeacherView({ user, state }) {
  const classId = state?.classes?.find(c => c.teacherId === user?.data?.id)?.id;
  const storageKey = `vq_assignments_${classId || "default"}`;

  const [assignments, setAssignments] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  });
  const [editing, setEditing] = useState(null); // null = list, object = Ä‘ang táº¡o/xem
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [quizPoints, setQuizPoints] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [answeredQuizzes] = useState({});
  const videoRef2 = useRef(null);
  const fileInputRef = useRef(null);

  const saveAssignments = (list) => {
    setAssignments(list);
    // LÆ°u vÃ o localStorage (khÃ´ng lÆ°u videoSrc blob vÃ¬ quÃ¡ lá»›n â€” trong thá»±c táº¿ sáº½ upload server)
    try {
      const toSave = list.map(a => ({ ...a, videoSrc: a.videoSrc?.startsWith("blob:") ? null : a.videoSrc }));
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch {}
  };

  const handleFileUpload = (file) => {
    if (!file || !file.type.startsWith("video/")) {
      alert("Vui lÃ²ng chá»n file video!");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      alert("File quÃ¡ lá»›n (tá»‘i Ä‘a 500MB)!");
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setTitle(file.name.replace(/\.[^/.]+$/, ""));
    setQuizPoints([]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handlePublish = () => {
    if (!videoSrc) return alert("ChÆ°a cÃ³ video!");
    if (!title.trim()) return alert("Vui lÃ²ng nháº­p tiÃªu Ä‘á» bÃ i táº­p!");

    const assignment = {
      id: editing?.id || Date.now(),
      title: title.trim(),
      desc: desc.trim(),
      videoSrc,
      quizPoints,
      createdAt: editing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      classId,
    };

    const list = editing?.id
      ? assignments.map(a => a.id === editing.id ? assignment : a)
      : [assignment, ...assignments];
    saveAssignments(list);
    setEditing(null);
    setVideoSrc(null);
    setQuizPoints([]);
    setTitle(""); setDesc("");
    setShowAddForm(false);
  };

  const handleAddQuiz = (quiz) => {
    setQuizPoints(prev => {
      const exists = prev.find(q => q.id === quiz.id);
      if (exists) return prev.map(q => q.id === quiz.id ? quiz : q);
      return [...prev, quiz].sort((a, b) => a.time - b.time);
    });
    setShowAddForm(false);
    setEditingQuiz(null);
  };

  const handleDeleteQuiz = (id) => {
    if (!confirm("XoÃ¡ cÃ¢u há»i nÃ y?")) return;
    setQuizPoints(prev => prev.filter(q => q.id !== id));
  };

  const handleDeleteAssignment = (id) => {
    if (!confirm("XoÃ¡ bÃ i táº­p nÃ y? Thao tÃ¡c khÃ´ng thá»ƒ hoÃ n tÃ¡c.")) return;
    saveAssignments(assignments.filter(a => a.id !== id));
  };

  const startNew = () => {
    setEditing({ isNew: true });
    setVideoSrc(null);
    setQuizPoints([]);
    setTitle(""); setDesc("");
    setShowAddForm(false);
    setPreviewMode(false);
  };

  const openEdit = (a) => {
    setEditing(a);
    setVideoSrc(a.videoSrc);
    setQuizPoints(a.quizPoints || []);
    setTitle(a.title);
    setDesc(a.desc || "");
    setShowAddForm(false);
    setPreviewMode(false);
  };

  // â€” List view â€”
  if (!editing) {
    return (
      <div className="vq-main">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>ðŸ“¹ BÃ i táº­p Video</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8b92a5" }}>Táº¡o vÃ  quáº£n lÃ½ bÃ i táº­p video cÃ³ cÃ¢u há»i tráº¯c nghiá»‡m theo thá»i gian</p>
          </div>
          <button className="vq-add-btn" style={{ width: "auto", padding: "10px 20px", marginLeft: "auto" }} onClick={startNew}>
            <Plus size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Táº¡o bÃ i má»›i
          </button>
        </div>

        <hr className="vq-divider" />

        {assignments.length === 0 ? (
          <div className="vq-empty">
            <FileVideo size={48} />
            <p>ChÆ°a cÃ³ bÃ i táº­p nÃ o. Nháº¥n <strong>Táº¡o bÃ i má»›i</strong> Ä‘á»ƒ báº¯t Ä‘áº§u!</p>
          </div>
        ) : (
          assignments.map(a => (
            <div key={a.id} className="vq-assign-card" onClick={() => openEdit(a)}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(79,172,254,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Video size={18} style={{ color: "#4FACFE" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{a.title}</h3>
                  {a.desc && <p>{a.desc}</p>}
                  <div className="vq-assign-meta">
                    <span className="vq-meta-tag"><HelpCircle size={11} />{a.quizPoints?.length || 0} cÃ¢u há»i</span>
                    <span className="vq-meta-tag"><Clock size={11} />{new Date(a.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
                <button
                  className="vq-icon-btn danger"
                  onClick={e => { e.stopPropagation(); handleDeleteAssignment(a.id); }}
                  title="XoÃ¡ bÃ i táº­p"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // â€” Editor view â€”
  return (
    <div className="vq-layout" style={{ height: "auto", minHeight: "calc(100vh - 61px)" }}>
      <div className="vq-main">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="vq-icon-btn" onClick={() => { setEditing(null); setVideoSrc(null); }} title="Quay láº¡i">
            <ArrowLeft size={16} />
          </button>
          <input
            className="vq-form-input"
            style={{ flex: 1, fontSize: 15, fontWeight: 700, background: "transparent" }}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="TiÃªu Ä‘á» bÃ i táº­p..."
          />
          {videoSrc && (
            <button
              className="vq-add-btn"
              style={{ width: "auto", padding: "9px 16px" }}
              onClick={() => setPreviewMode(m => !m)}
            >
              {previewMode ? <><EyeOff size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />ThoÃ¡t preview</> : <><Eye size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />Preview há»c sinh</>}
            </button>
          )}
          <button
            className="vq-add-btn"
            style={{ width: "auto", padding: "9px 16px", background: videoSrc ? undefined : "rgba(255,255,255,0.1)" }}
            onClick={handlePublish}
            disabled={!videoSrc}
          >
            <Save size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {editing?.isNew ? "ÄÄƒng bÃ i" : "LÆ°u thay Ä‘á»•i"}
          </button>
        </div>

        {/* Upload zone hoáº·c video player */}
        {!videoSrc ? (
          <div
            className="vq-upload-zone"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file" accept="video/*" style={{ display: "none" }}
              ref={fileInputRef}
              onChange={e => handleFileUpload(e.target.files[0])}
            />
            <div className="vq-upload-icon">ðŸŽ¬</div>
            <h3>KÃ©o tháº£ video vÃ o Ä‘Ã¢y</h3>
            <p>hoáº·c click Ä‘á»ƒ chá»n file â€” MP4, MOV, AVI, WebM (tá»‘i Ä‘a 500MB)</p>
          </div>
        ) : (
          <>
            {previewMode ? (
              <div>
                <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#F59E0B", display: "flex", alignItems: "center", gap: 8 }}>
                  <Eye size={14} /> Cháº¿ Ä‘á»™ xem trÆ°á»›c â€” mÃ´ phá»ng nhÆ° há»c sinh Ä‘ang xem
                </div>
                <StudentVideoViewer
                  assignment={{ title, quizPoints, videoSrc }}
                  previewMode
                />
              </div>
            ) : (
              <VideoPlayer
                src={videoSrc}
                quizPoints={quizPoints}
                onQuizTrigger={() => {}}
                answeredQuizzes={{}}
                role="teacher"
              />
            )}

            {!previewMode && (
              <div>
                <input
                  className="vq-form-input"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="MÃ´ táº£ bÃ i táº­p (tuá»³ chá»n)..."
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar â€” quiz manager */}
      {!previewMode && (
        <div className="vq-sidebar">
          <div className="vq-panel-title">
            <HelpCircle size={13} />
            CÃ¢u há»i tráº¯c nghiá»‡m ({quizPoints.length})
          </div>

          {videoSrc && !showAddForm && !editingQuiz && (
            <button className="vq-add-btn" onClick={() => setShowAddForm(true)}>
              <Plus size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
              ThÃªm cÃ¢u há»i táº¡i má»‘c thá»i gian
            </button>
          )}

          {showAddForm && (
            <AddQuizForm
              videoDuration={videoDuration}
              currentTime={currentVideoTime}
              onSave={handleAddQuiz}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {editingQuiz && (
            <AddQuizForm
              initialData={editingQuiz}
              videoDuration={videoDuration}
              currentTime={currentVideoTime}
              onSave={handleAddQuiz}
              onCancel={() => setEditingQuiz(null)}
            />
          )}

          <hr className="vq-divider" />

          {quizPoints.length === 0 ? (
            <div className="vq-empty">
              <HelpCircle size={32} />
              <p>ChÆ°a cÃ³ cÃ¢u há»i.<br />ThÃªm cÃ¢u há»i táº¡i cÃ¡c má»‘c thá»i gian trong video.</p>
            </div>
          ) : (
            quizPoints.map((qp, i) => (
              <div key={qp.id} className="vq-quiz-item">
                <div className="vq-quiz-item-header">
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#8b92a5" }}>#{i + 1}</span>
                  <span className="vq-time-tag">â± {fmtTime(qp.time)}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    <button className="vq-icon-btn" onClick={() => { setEditingQuiz(qp); setShowAddForm(false); }} title="Chá»‰nh sá»­a">
                      <Edit2 size={12} />
                    </button>
                    <button className="vq-icon-btn danger" onClick={() => handleDeleteQuiz(qp.id)} title="XoÃ¡">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="vq-quiz-q-preview">{qp.question}</p>
                <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                  {qp.options.map((opt, j) => (
                    <span key={j} style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 6,
                      background: j === qp.correct ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)",
                      color: j === qp.correct ? "#34D399" : "#8b92a5",
                      border: `1px solid ${j === qp.correct ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.1)"}`,
                    }}>
                      {["A","B","C","D","E"][j]}. {opt.length > 20 ? opt.slice(0,20)+"â€¦" : opt}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   StudentVideoViewer â€” xem 1 bÃ i táº­p cá»¥ thá»ƒ
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StudentVideoViewer({ assignment, onBack, previewMode }) {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answeredQuizzes, setAnsweredQuizzes] = useState({});
  const [showOverlay, setShowOverlay] = useState(false);
  const videoRef = useRef(null);

  const handleQuizTrigger = useCallback((qp) => {
    setActiveQuiz(qp);
    setShowOverlay(true);
  }, []);

  const handleQuizSubmit = (selectedIndex) => {
    const isCorrect = selectedIndex === activeQuiz.correct;
    setAnsweredQuizzes(prev => ({
      ...prev,
      [activeQuiz.id]: { answered: true, correct: isCorrect, selected: selectedIndex }
    }));
  };

  const handleContinue = () => {
    setShowOverlay(false);
    setActiveQuiz(null);
    // Tua video tiáº¿p 0.5s sau quiz point Ä‘á»ƒ khÃ´ng trigger láº¡i
    if (videoRef.current) {
      videoRef.current.currentTime = (activeQuiz?.time || 0) + 1.5;
      videoRef.current.play();
    }
  };

  const totalQuiz = assignment.quizPoints?.length || 0;
  const doneQuiz = Object.keys(answeredQuizzes).length;
  const correctCount = Object.values(answeredQuizzes).filter(a => a.correct).length;
  const pct = totalQuiz ? Math.round((doneQuiz / totalQuiz) * 100) : 0;

  return (
    <div className="vq-layout" style={{ height: "auto", minHeight: previewMode ? "auto" : "calc(100vh - 61px)" }}>
      <div className="vq-main">
        {!previewMode && onBack && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="vq-icon-btn" onClick={onBack}>
              <ArrowLeft size={16} />
            </button>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{assignment.title}</h2>
          </div>
        )}

        <div style={{ position: "relative" }}>
          <VideoPlayer
            src={assignment.videoSrc}
            quizPoints={assignment.quizPoints || []}
            onQuizTrigger={handleQuizTrigger}
            answeredQuizzes={answeredQuizzes}
            role="student"
            videoRef={videoRef}
          />
          {showOverlay && activeQuiz && (
            <QuizOverlay
              quiz={activeQuiz}
              quizState={answeredQuizzes[activeQuiz.id]}
              onSubmit={handleQuizSubmit}
              onContinue={handleContinue}
            />
          )}
        </div>

        {!previewMode && assignment.desc && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, fontSize: 13, color: "#8b92a5" }}>
            {assignment.desc}
          </div>
        )}
      </div>

      {/* Sidebar â€” tiáº¿n trÃ¬nh há»c sinh */}
      <div className="vq-sidebar">
        <div className="vq-panel-title"><Award size={13} /> Tiáº¿n Ä‘á»™</div>
        <div className="vq-score-card">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div>
              <div className="vq-score-num">{doneQuiz}/{totalQuiz}</div>
              <div className="vq-score-label">cÃ¢u Ä‘Ã£ tráº£ lá»i</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#34D399" }}>{correctCount}</div>
              <div style={{ fontSize: 12, color: "#8b92a5" }}>Ä‘Ãºng</div>
            </div>
          </div>
          <div className="vq-progress-bar-wrap">
            <div className="vq-progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: 11, color: "#8b92a5", marginTop: 6 }}>{pct}% hoÃ n thÃ nh</div>
        </div>

        <hr className="vq-divider" />

        <div className="vq-panel-title"><HelpCircle size={13} /> CÃ¢u há»i</div>
        {(assignment.quizPoints || []).length === 0 ? (
          <div className="vq-empty"><p>BÃ i nÃ y khÃ´ng cÃ³ cÃ¢u há»i</p></div>
        ) : (
          (assignment.quizPoints || []).map((qp, i) => {
            const ans = answeredQuizzes[qp.id];
            return (
              <div key={qp.id} className="vq-quiz-item">
                <div className="vq-quiz-item-header">
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#8b92a5" }}>#{i + 1}</span>
                  <span className="vq-time-tag">â± {fmtTime(qp.time)}</span>
                  <div style={{ marginLeft: "auto" }}>
                    {ans ? (
                      ans.correct
                        ? <CheckCircle size={15} style={{ color: "#34D399" }} />
                        : <XCircle size={15} style={{ color: "#EF4444" }} />
                    ) : (
                      <Lock size={13} style={{ color: "#F59E0B" }} />
                    )}
                  </div>
                </div>
                <p className="vq-quiz-q-preview" style={{ color: ans ? (ans.correct ? "#34D399" : "#EF4444") : "#8b92a5" }}>
                  {qp.question}
                </p>
              </div>
            );
          })
        )}

        {totalQuiz > 0 && doneQuiz === totalQuiz && (
          <div style={{
            background: "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.1))",
            border: "1px solid rgba(52,211,153,0.3)",
            borderRadius: 14, padding: 16, textAlign: "center",
            animation: "vqFadeIn 0.5s ease"
          }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>ðŸŽ‰</div>
            <div style={{ fontWeight: 700, color: "#34D399", marginBottom: 4 }}>HoÃ n thÃ nh!</div>
            <div style={{ fontSize: 12, color: "#8b92a5" }}>Báº¡n tráº£ lá»i Ä‘Ãºng {correctCount}/{totalQuiz} cÃ¢u</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   StudentView â€” danh sÃ¡ch bÃ i táº­p
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StudentView({ user, state }) {
  const classId = user?.classId;
  // Láº¥y táº¥t cáº£ bÃ i táº­p cá»§a lá»›p
  const storageKey = `vq_assignments_${classId || "default"}`;
  const [assignments] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  });
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <StudentVideoViewer
        assignment={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="vq-main">
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>ðŸ“¹ BÃ i táº­p Video</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8b92a5" }}>Xem video vÃ  tráº£ lá»i cÃ¢u há»i â€” khÃ´ng Ä‘Æ°á»£c tua qua pháº§n chÆ°a há»c</p>
      </div>
      <hr className="vq-divider" />
      {assignments.length === 0 ? (
        <div className="vq-empty">
          <FileVideo size={48} />
          <p>GiÃ¡o viÃªn chÆ°a Ä‘Äƒng bÃ i táº­p nÃ o.</p>
        </div>
      ) : (
        assignments.map(a => {
          const total = a.quizPoints?.length || 0;
          return (
            <div key={a.id} className="vq-assign-card" onClick={() => setSelected(a)}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(79,172,254,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Play size={18} style={{ color: "#4FACFE" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{a.title}</h3>
                  {a.desc && <p>{a.desc}</p>}
                  <div className="vq-assign-meta">
                    <span className="vq-meta-tag"><HelpCircle size={11} />{total} cÃ¢u há»i</span>
                    <span className="vq-meta-tag"><Clock size={11} />{new Date(a.createdAt).toLocaleDateString("vi-VN")}</span>
                    {total > 0 && <span className="vq-meta-tag"><Lock size={11} />Báº¯t buá»™c tráº£ lá»i</span>}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "#8b92a5", flexShrink: 0, marginTop: 4 }} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   VideoQuizPage â€” entry point, export
   embedded=true â†’ dÃ¹ng bÃªn trong TaskPage (khÃ´ng cÃ³ header riÃªng)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function VideoQuizPage({ user, state, embedded = true }) {
  const isTeacher = user?.role === "teacher";

  if (embedded) {
    return (
      <div style={{ color: "var(--text, #e8eaf0)", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
        <style>{VQ_CSS}</style>
        {isTeacher
          ? <TeacherView user={user} state={state} />
          : <StudentView user={user} state={state} />
        }
      </div>
    );
  }

  return (
    <div className="vq-root">
      <style>{VQ_CSS}</style>
      <div className="vq-header">
        <Video size={18} style={{ color: "#4FACFE" }} />
        <h1>BÃ i táº­p Video cÃ³ Tráº¯c nghiá»‡m</h1>
        <span className={`vq-role-badge ${isTeacher ? "teacher" : "student"}`}>
          {isTeacher ? "GiÃ¡o viÃªn" : "Há»c sinh"}
        </span>
      </div>
      {isTeacher
        ? <TeacherView user={user} state={state} />
        : <StudentView user={user} state={state} />
      }
    </div>
  );
}
