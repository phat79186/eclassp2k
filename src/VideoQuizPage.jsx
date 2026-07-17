import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Plus, Trash2, Edit2, Save, X, Check, ChevronLeft,
  ChevronRight, Upload, Video, Clock, HelpCircle,
  CheckCircle, XCircle, AlertCircle, Eye, EyeOff,
  RotateCcw, BookOpen, Award, BarChart2, Lock, Unlock,
  FileVideo, Settings, ArrowLeft
} from "lucide-react";

/* ─────────────────────────────────────────────
   Utility
───────────────────────────────────────────── */
function fmtTime(sec) {
  if (isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────
   CSS (injected as <style>)
───────────────────────────────────────────── */
const VQ_CSS = `
@keyframes vqFadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes vqSlideIn  { from{opacity:0;transform:scale(0.94) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes vqPulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.75;transform:scale(0.97)} }
@keyframes vqShimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes vqRing     { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.6);opacity:0} }
@keyframes vqBounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes vqSpin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

/* ── Root ── */
.vq-root {
  min-height:100vh;
  background:var(--bg,#050C1A);
  color:var(--text,#fff);
  font-family:'Outfit','Inter',sans-serif;
}

/* ── Header (standalone mode) ── */
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

/* ── Layout ── */
.vq-layout { display:flex; height:calc(100vh - 61px); overflow:hidden; }
.vq-main   { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:16px; scrollbar-width:thin; }
.vq-sidebar{ width:320px; border-left:1px solid var(--border2,rgba(255,255,255,.05)); overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; scrollbar-width:thin; }

/* ── Upload zone ── */
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

/* ── Video Container ── */
.vq-video-wrap {
  position:relative; border-radius:14px; overflow:hidden;
  background:#000; aspect-ratio:16/9;
  box-shadow:0 4px 32px rgba(0,0,0,.5);
  animation:vqFadeUp .35s ease;
}
.vq-video-wrap video { width:100%; height:100%; display:block; object-fit:contain; }

/* ── Controls overlay ── */
.vq-controls {
  position:absolute; bottom:0; left:0; right:0;
  background:linear-gradient(transparent,rgba(0,0,0,.8));
  padding:28px 14px 12px;
  opacity:0; transition:opacity .22s;
}
.vq-video-wrap:hover .vq-controls { opacity:1; }

/* ── Progress bar ── */
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

/* ── Quiz markers ── */
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

/* ── Control buttons ── */
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

/* ── Locked banner ── */
.vq-locked-banner {
  position:absolute; top:10px; right:10px;
  background:rgba(10,22,40,.85); backdrop-filter:blur(12px);
  border:1px solid rgba(239,68,68,.4);
  border-radius:8px; padding:5px 11px;
  display:flex; align-items:center; gap:6px;
  font-size:11px; font-weight:600; color:#FCA5A5;
  animation:vqPulse 2.4s ease-in-out infinite;
}

/* ── Quiz Overlay ── */
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

/* ── Sidebar titles ── */
.vq-panel-title {
  font-size:10px; font-weight:800; letter-spacing:.08em;
  text-transform:uppercase; color:var(--text3,rgba(255,255,255,.45));
  margin:0 0 8px; display:flex; align-items:center; gap:5px;
}

/* ── Quiz Items ── */
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

/* ── Form fields ── */
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

/* ── Buttons ── */
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

/* ── Score card ── */
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

/* ── Assignment cards ── */
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

/* ── Add-quiz form box ── */
.vq-add-form-box {
  background:rgba(79,172,254,.04);
  border:1px solid rgba(79,172,254,.15);
  border-radius:13px; padding:15px;
  animation:vqSlideIn .25s ease;
}

/* ── Divider ── */
.vq-divider { border:none; border-top:1px solid var(--border2,rgba(255,255,255,.05)); margin:10px 0; }

/* ── Empty state ── */
.vq-empty { text-align:center; padding:36px 16px; color:var(--text3,rgba(255,255,255,.45)); }
.vq-empty svg { opacity:.25; margin-bottom:10px; }
.vq-empty p { margin:0; font-size:12.5px; line-height:1.6; }

/* ── Complete banner ── */
.vq-complete-banner {
  border-radius:13px; padding:16px;
  text-align:center;
  background:rgba(52,211,153,.07);
  border:1px solid rgba(52,211,153,.2);
  animation:vqSlideIn .4s ease;
}

/* ── Responsive ── */
@media(max-width:768px){
  .vq-layout{ flex-direction:column; height:auto; }
  .vq-sidebar{ width:100%; border-left:none; border-top:1px solid var(--border2,rgba(255,255,255,.05)); }
}
`;

/* ─────────────────────────────────────────────
   QuizOverlay — hiển thị khi video pause ở mốc quiz
───────────────────────────────────────────── */
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
          <span className="vq-quiz-badge">Câu hỏi</span>
          <span style={{ fontSize: 12, color: "var(--text3,rgba(255,255,255,.45))", marginLeft: "auto" }}>
            {fmtTime(quiz.time)}
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
              <span>{opt}</span>
              {quizState?.answered && i === quiz.correct && (
                <CheckCircle size={15} style={{ marginLeft: "auto", color: "#34D399" }} />
              )}
              {quizState?.answered && i === selected && i !== quiz.correct && (
                <XCircle size={15} style={{ marginLeft: "auto", color: "#F87171" }} />
              )}
            </div>
          ))}
        </div>

        {!quizState?.answered && (
          <button
            className="vq-quiz-submit"
            onClick={handleSubmit}
            disabled={selected === null}
          >
            Xác nhận
          </button>
        )}

        {quizState?.answered && (
          <>
            <div className={`vq-quiz-feedback ${selected === quiz.correct ? "correct" : "wrong"}`}>
              {selected === quiz.correct
                ? <><CheckCircle size={16} /> Chính xác! +{quiz.points || 1} điểm</>
                : <><XCircle size={16} /> Sai rồi! Đáp án đúng: {letters[quiz.correct]}</>
              }
            </div>
            <button className="vq-continue-btn" onClick={onContinue}>
              Tiếp tục xem video →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VideoPlayer — custom player với seek-lock
───────────────────────────────────────────── */
function VideoPlayer({ src, quizPoints, onQuizTrigger, studentProgress }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizStates, setQuizStates] = useState({});
  const [maxReached, setMaxReached] = useState(0);
  const wrapRef = useRef(null);

  // Tiến trình cao nhất đã đạt được (không được tua qua)
  const maxAllowed = useMemo(() => {
    if (!quizPoints || quizPoints.length === 0) return duration;
    const pending = quizPoints.find(qp => !quizStates[qp.id]?.answered);
    return pending ? pending.time : duration;
  }, [quizPoints, quizStates, duration]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => {
      setCurrent(vid.currentTime);
      setMaxReached(p => Math.max(p, vid.currentTime));

      // Kiểm tra quiz trigger
      if (quizPoints) {
        for (const qp of quizPoints) {
          if (
            vid.currentTime >= qp.time &&
            vid.currentTime < qp.time + 0.5 &&
            !quizStates[qp.id]?.answered &&
            playing
          ) {
            vid.pause();
            setPlaying(false);
            setActiveQuiz(qp);
            return;
          }
        }
      }
    };
    const onDur = () => setDuration(vid.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    vid.addEventListener("timeupdate", onTime);
    vid.addEventListener("durationchange", onDur);
    vid.addEventListener("play", onPlay);
    vid.addEventListener("pause", onPause);
    return () => {
      vid.removeEventListener("timeupdate", onTime);
      vid.removeEventListener("durationchange", onDur);
      vid.removeEventListener("play", onPlay);
      vid.removeEventListener("pause", onPause);
    };
  }, [quizPoints, quizStates, playing]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (playing) vid.pause();
    else vid.play();
  };

  const handleSeek = (e) => {
    const vid = videoRef.current;
    if (!vid || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pct * duration;
    // Chặn tua quá điểm câu hỏi chưa trả lời
    const allowed = Math.min(targetTime, maxAllowed);
    vid.currentTime = allowed;
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const newMuted = !muted;
    setMuted(newMuted);
    vid.muted = newMuted;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const handleQuizSubmit = (selected) => {
    if (!activeQuiz) return;
    setQuizStates(p => ({
      ...p,
      [activeQuiz.id]: { answered: true, selected, correct: selected === activeQuiz.correct }
    }));
    if (onQuizTrigger) onQuizTrigger(activeQuiz.id, selected, selected === activeQuiz.correct);
  };

  const handleContinue = () => {
    setActiveQuiz(null);
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = activeQuiz.time + 0.6;
      vid.play();
    }
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;
  const maxPct = duration ? (maxAllowed / duration) * 100 : 100;

  return (
    <div className="vq-video-wrap" ref={wrapRef}>
      <video ref={videoRef} src={src} />

      {/* Seek lock overlay stripe */}
      {maxAllowed < duration && (
        <div style={{
          position: "absolute", top: 0, left: `${maxPct}%`, right: 0, bottom: 0,
          background: "rgba(239,68,68,0.06)", pointerEvents: "none",
          borderLeft: "2px solid rgba(239,68,68,0.4)"
        }} />
      )}

      {/* Quiz overlay */}
      {activeQuiz && (
        <QuizOverlay
          quiz={activeQuiz}
          onSubmit={handleQuizSubmit}
          onContinue={handleContinue}
          quizState={quizStates[activeQuiz.id]}
        />
      )}

      {/* Locked banner */}
      {maxAllowed < duration && !activeQuiz && (
        <div className="vq-locked-banner">
          <Lock size={11} /> Không thể tua qua câu hỏi chưa trả lời
        </div>
      )}

      {/* Controls */}
      <div className="vq-controls">
        {/* Progress track */}
        <div className="vq-progress-track" onClick={handleSeek}>
          {/* Allowed range fill */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: `${maxPct}%`, height: "100%",
            background: "rgba(255,255,255,.12)", borderRadius: 3,
          }} />
          {/* Played fill */}
          <div className="vq-progress-fill" style={{ width: `${pct}%` }} />
          {/* Thumb */}
          <div className="vq-progress-thumb" style={{ left: `${pct}%` }} />
          {/* Quiz markers */}
          {quizPoints?.map(qp => {
            const markerPct = duration ? (qp.time / duration) * 100 : 0;
            const state = quizStates[qp.id];
            let cls = "vq-quiz-marker";
            if (state?.answered) cls += " done";
            else if (qp.time <= maxReached) cls += " pending";
            else cls += " locked";
            return (
              <div
                key={qp.id}
                className={cls}
                style={{ left: `${markerPct}%` }}
                title={qp.question}
              />
            );
          })}
        </div>

        <div className="vq-ctrl-row">
          <button className="vq-ctrl-btn" onClick={togglePlay} title={playing ? "Dừng" : "Phát"}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className="vq-ctrl-btn" onClick={toggleMute}>
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <input
            className="vq-vol-slider"
            type="range" min={0} max={1} step={0.05}
            value={muted ? 0 : volume}
            onChange={handleVolume}
          />
          <span className="vq-time-display">{fmtTime(currentTime)} / {fmtTime(duration)}</span>
          <span className="spacer" />
          <button className="vq-ctrl-btn" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   QuizPointEditor — thêm/sửa câu hỏi tại mốc thời gian
───────────────────────────────────────────── */
function QuizPointEditor({ initialTime, onSave, onCancel, existing }) {
  const [time, setTime] = useState(existing?.time ?? initialTime ?? 0);
  const [question, setQuestion] = useState(existing?.question ?? "");
  const [options, setOptions] = useState(existing?.options ?? ["", "", "", ""]);
  const [correct, setCorrect] = useState(existing?.correct ?? 0);
  const [points, setPoints] = useState(existing?.points ?? 1);

  const addOption = () => setOptions(p => [...p, ""]);
  const removeOption = (i) => {
    const next = options.filter((_, j) => j !== i);
    setOptions(next);
    if (correct >= next.length) setCorrect(next.length - 1);
  };
  const updateOption = (i, v) => setOptions(p => p.map((o, j) => j === i ? v : o));

  const handleSave = () => {
    if (!question.trim()) return alert("Vui lòng nhập câu hỏi");
    if (options.some(o => !o.trim())) return alert("Vui lòng điền đầy đủ các đáp án");
    onSave({
      id: existing?.id ?? `qp_${Date.now()}`,
      time: Number(time),
      question: question.trim(),
      options: options.map(o => o.trim()),
      correct: Number(correct),
      points: Number(points),
    });
  };

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="vq-add-form-box">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text2,rgba(255,255,255,.75))" }}>
          {existing ? "Sửa câu hỏi" : "Thêm câu hỏi"}
        </span>
        <button className="vq-icon-btn danger" onClick={onCancel}><X size={13} /></button>
      </div>

      <div className="vq-form-group">
        <label>Thời điểm (giây)</label>
        <input
          className="vq-form-input"
          type="number" min={0} step={1}
          value={time} onChange={e => setTime(e.target.value)}
        />
      </div>

      <div className="vq-form-group">
        <label>Câu hỏi</label>
        <textarea
          className="vq-form-textarea"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Nhập câu hỏi..."
          rows={2}
        />
      </div>

      <div className="vq-form-group">
        <label>Đáp án (chọn đáp án đúng)</label>
        {options.map((opt, i) => (
          <div key={i} className="vq-option-row">
            <button
              className={`vq-correct-toggle ${correct === i ? "active" : ""}`}
              onClick={() => setCorrect(i)}
              title="Chọn đáp án đúng"
            >
              {correct === i ? <Check size={13} /> : <span style={{ fontSize: 10, fontWeight: 700 }}>{letters[i]}</span>}
            </button>
            <input
              className="vq-form-input"
              style={{ marginBottom: 0, flex: 1 }}
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              placeholder={`Đáp án ${letters[i]}`}
            />
            {options.length > 2 && (
              <button className="vq-icon-btn danger" onClick={() => removeOption(i)}>
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button className="vq-add-btn secondary" style={{ marginTop: 6 }} onClick={addOption}>
            + Thêm đáp án
          </button>
        )}
      </div>

      <div className="vq-form-group">
        <label>Điểm</label>
        <input
          className="vq-form-input"
          type="number" min={0} max={10} step={0.5}
          value={points} onChange={e => setPoints(e.target.value)}
        />
      </div>

      <button className="vq-add-btn" onClick={handleSave}>
        <Save size={13} style={{ marginRight: 6 }} />
        {existing ? "Lưu thay đổi" : "Thêm câu hỏi"}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TeacherView — tạo & quản lý bài tập video
───────────────────────────────────────────── */
function TeacherView({ user, state }) {
  const classId = user?.data?.classId || state?.classes?.[0]?.id || "default";
  const STORAGE_KEY = `vq_assignments_${classId}`;

  const [assignments, setAssignments] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [editing, setEditing] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [quizPoints, setQuizPoints] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [addAtTime, setAddAtTime] = useState(0);
  const fileRef = useRef(null);

  const saveAssignments = (list) => {
    setAssignments(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleVideoUpload = (file) => {
    if (!file) return;
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
  };

  const handleSaveAssignment = () => {
    if (!title.trim()) return alert("Vui lòng nhập tiêu đề bài tập");
    if (!videoSrc) return alert("Vui lòng chọn file video");

    const assignment = {
      id: editing?.id ?? `va_${Date.now()}`,
      title: title.trim(),
      desc: desc.trim(),
      videoName: videoFile?.name || editing?.videoName || "video.mp4",
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
    if (!confirm("Xoá câu hỏi này?")) return;
    setQuizPoints(prev => prev.filter(q => q.id !== id));
  };

  const handleDeleteAssignment = (id) => {
    if (!confirm("Xoá bài tập này? Thao tác không thể hoàn tác.")) return;
    saveAssignments(assignments.filter(a => a.id !== id));
  };

  const startNew = () => {
    setEditing({ isNew: true });
    setVideoSrc(null);
    setQuizPoints([]);
    setTitle(""); setDesc("");
    setShowAddForm(false);
  };

  // Màn hình danh sách
  if (!editing) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🎬 Bài tập Video</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text3,rgba(255,255,255,.45))" }}>
              Tạo và quản lý bài tập video có câu hỏi theo thời gian
            </p>
          </div>
          <button
            className="vq-add-btn"
            style={{ width: "auto", padding: "9px 18px" }}
            onClick={startNew}
          >
            + Tạo bài tập mới
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="vq-empty">
            <FileVideo size={40} />
            <p>Chưa có bài tập nào. Nhấn <strong>Tạo bài tập mới</strong> để bắt đầu!</p>
          </div>
        ) : (
          assignments.map(a => (
            <div key={a.id} className="vq-assign-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{a.title}</h3>
                  {a.desc && <p>{a.desc}</p>}
                  <div className="vq-assign-meta">
                    <span className="vq-meta-tag"><Video size={10} /> {a.videoName}</span>
                    <span className="vq-meta-tag"><HelpCircle size={10} /> {a.quizPoints?.length || 0} câu hỏi</span>
                    <span className="vq-meta-tag"><Clock size={10} /> {new Date(a.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginLeft: 12, flexShrink: 0 }}>
                  <button className="vq-icon-btn" onClick={() => {
                    setEditing(a);
                    setTitle(a.title);
                    setDesc(a.desc || "");
                    setQuizPoints(a.quizPoints || []);
                    setVideoSrc(null);
                  }}>
                    <Edit2 size={13} />
                  </button>
                  <button className="vq-icon-btn danger" onClick={() => handleDeleteAssignment(a.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Màn hình tạo/sửa bài tập
  return (
    <div className="vq-layout">
      {/* Left: video */}
      <div className="vq-main">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <button
            className="vq-icon-btn"
            onClick={() => { setEditing(null); setVideoSrc(null); }}
            style={{ width: 32, height: 32 }}
          >
            <ArrowLeft size={15} />
          </button>
          <input
            className="vq-form-input"
            style={{ flex: 1, fontSize: 14, fontWeight: 700 }}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Tiêu đề bài tập..."
          />
        </div>
        <input
          className="vq-form-input"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Mô tả (tuỳ chọn)..."
        />

        {videoSrc ? (
          <VideoPlayer
            src={videoSrc}
            quizPoints={quizPoints}
            onQuizTrigger={() => {}}
          />
        ) : (
          <div
            className="vq-upload-zone"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag"); }}
            onDragLeave={e => e.currentTarget.classList.remove("drag")}
            onDrop={e => {
              e.preventDefault();
              e.currentTarget.classList.remove("drag");
              const f = e.dataTransfer.files[0];
              if (f?.type.startsWith("video/")) handleVideoUpload(f);
            }}
          >
            <span className="vq-upload-icon">🎬</span>
            <h3>Tải lên video bài giảng</h3>
            <p>Kéo thả hoặc nhấp để chọn file video<br />MP4, WebM, MOV · Tối đa 500MB</p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          style={{ display: "none" }}
          onChange={e => handleVideoUpload(e.target.files[0])}
        />

        <button
          className="vq-add-btn"
          onClick={handleSaveAssignment}
          disabled={!title.trim() || !videoSrc}
          style={{ marginTop: 4 }}
        >
          <Save size={14} style={{ marginRight: 6 }} />
          Lưu bài tập
        </button>
      </div>

      {/* Right: quiz points */}
      <div className="vq-sidebar">
        <div className="vq-panel-title">
          <HelpCircle size={11} /> Câu hỏi ({quizPoints.length})
        </div>

        {quizPoints.map(qp => (
          <div key={qp.id} className="vq-quiz-item">
            <div className="vq-quiz-item-header">
              <span className="vq-time-tag">{fmtTime(qp.time)}</span>
              <p className="vq-quiz-q-preview">{qp.question}</p>
              <button className="vq-icon-btn" onClick={() => { setEditingQuiz(qp); setShowAddForm(true); }}>
                <Edit2 size={11} />
              </button>
              <button className="vq-icon-btn danger" onClick={() => handleDeleteQuiz(qp.id)}>
                <Trash2 size={11} />
              </button>
            </div>
            <div style={{ fontSize: 10, color: "var(--text3,rgba(255,255,255,.45))" }}>
              {qp.options.length} đáp án · {qp.points || 1} điểm
            </div>
          </div>
        ))}

        <hr className="vq-divider" />

        {showAddForm ? (
          <QuizPointEditor
            initialTime={addAtTime}
            existing={editingQuiz}
            onSave={handleAddQuiz}
            onCancel={() => { setShowAddForm(false); setEditingQuiz(null); }}
          />
        ) : (
          <button
            className="vq-add-btn secondary"
            onClick={() => { setShowAddForm(true); setEditingQuiz(null); setAddAtTime(0); }}
            disabled={!videoSrc}
          >
            <Plus size={13} style={{ marginRight: 6 }} /> Thêm câu hỏi
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   StudentView — làm bài tập video
───────────────────────────────────────────── */
function StudentView({ user, state }) {
  const classId = user?.data?.classId || "default";
  const STORAGE_KEY = `vq_assignments_${classId}`;
  const PROGRESS_KEY = `vq_progress_${user?.data?.id || "anon"}`;

  const [assignments] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; }
  });
  const [selected, setSelected] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const fileRef = useRef(null);

  const saveProgress = (p) => {
    setProgress(p);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  };

  const handleQuizAnswer = (assignId, quizId, isCorrect) => {
    const next = {
      ...progress,
      [assignId]: {
        ...(progress[assignId] || {}),
        [quizId]: { answered: true, correct: isCorrect }
      }
    };
    saveProgress(next);
  };

  const getScore = (a) => {
    const prog = progress[a.id] || {};
    let correct = 0, total = 0;
    (a.quizPoints || []).forEach(qp => {
      total += qp.points || 1;
      if (prog[qp.id]?.correct) correct += qp.points || 1;
    });
    return { correct, total };
  };

  if (!selected) {
    return (
      <div style={{ padding: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>🎬 Bài tập Video</h2>
        <p style={{ margin: "0 0 18px", fontSize: 12, color: "var(--text3,rgba(255,255,255,.45))" }}>
          Xem video và trả lời câu hỏi xuất hiện theo thời gian
        </p>

        {assignments.length === 0 ? (
          <div className="vq-empty">
            <FileVideo size={40} />
            <p>Chưa có bài tập video nào từ giáo viên.</p>
          </div>
        ) : (
          assignments.map(a => {
            const { correct, total } = getScore(a);
            const prog = progress[a.id] || {};
            const done = (a.quizPoints || []).every(qp => prog[qp.id]?.answered);
            return (
              <div key={a.id} className="vq-assign-card" onClick={() => setSelected(a)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3>{a.title}</h3>
                    {a.desc && <p>{a.desc}</p>}
                    <div className="vq-assign-meta">
                      <span className="vq-meta-tag"><HelpCircle size={10} /> {a.quizPoints?.length || 0} câu hỏi</span>
                      {done && total > 0 && (
                        <span className="vq-meta-tag" style={{ color: "#34D399", borderColor: "rgba(52,211,153,.2)" }}>
                          <CheckCircle size={10} /> {correct}/{total} điểm
                        </span>
                      )}
                    </div>
                  </div>
                  {done ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#34D399", background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.2)", borderRadius: 6, padding: "3px 9px" }}>Hoàn thành</span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 6, padding: "3px 9px" }}>Chưa làm</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // Màn hình làm bài
  const { correct, total } = getScore(selected);
  const prog = progress[selected.id] || {};
  const allDone = (selected.quizPoints || []).every(qp => prog[qp.id]?.answered);

  return (
    <div className="vq-layout">
      <div className="vq-main">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="vq-icon-btn" onClick={() => { setSelected(null); setVideoSrc(null); }} style={{ width: 32, height: 32 }}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{selected.title}</div>
            {selected.desc && <div style={{ fontSize: 12, color: "var(--text3,rgba(255,255,255,.45))" }}>{selected.desc}</div>}
          </div>
        </div>

        {videoSrc ? (
          <VideoPlayer
            src={videoSrc}
            quizPoints={selected.quizPoints}
            onQuizTrigger={(quizId, _, isCorrect) => handleQuizAnswer(selected.id, quizId, isCorrect)}
            studentProgress={prog}
          />
        ) : (
          <div
            className="vq-upload-zone"
            onClick={() => fileRef.current?.click()}
          >
            <span className="vq-upload-icon">📂</span>
            <h3>Tải lên file video bài tập</h3>
            <p>Giáo viên đã giao bài: <strong>{selected.videoName}</strong><br />Nhấp để chọn file video từ máy tính</p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          style={{ display: "none" }}
          onChange={e => {
            const f = e.target.files[0];
            if (f) setVideoSrc(URL.createObjectURL(f));
          }}
        />

        {allDone && total > 0 && (
          <div className="vq-complete-banner">
            <Award size={28} style={{ color: "#F59E0B", marginBottom: 8 }} />
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Hoàn thành bài tập!</div>
            <div style={{ fontSize: 13, color: "var(--text2,rgba(255,255,255,.75))" }}>
              Điểm của bạn: <strong style={{ color: "#4FACFE" }}>{correct}/{total}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: progress */}
      <div className="vq-sidebar">
        {total > 0 && (
          <div className="vq-score-card">
            <div className="vq-score-num">{correct}<span style={{ fontSize: 16, opacity: .6 }}>/{total}</span></div>
            <div className="vq-score-label">điểm đã đạt được</div>
            <div className="vq-progress-bar-wrap">
              <div className="vq-progress-bar-fill" style={{ width: `${total ? (correct / total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        <div className="vq-panel-title">
          <HelpCircle size={11} /> Câu hỏi ({selected.quizPoints?.length || 0})
        </div>

        {(selected.quizPoints || []).map((qp, i) => {
          const state = prog[qp.id];
          return (
            <div key={qp.id} className="vq-quiz-item" style={{ cursor: "default" }}>
              <div className="vq-quiz-item-header">
                <span className="vq-time-tag">{fmtTime(qp.time)}</span>
                <span style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: state?.answered
                    ? (state.correct ? "rgba(52,211,153,.15)" : "rgba(239,68,68,.12)")
                    : "rgba(255,255,255,.05)",
                  border: `1px solid ${state?.answered ? (state.correct ? "rgba(52,211,153,.3)" : "rgba(239,68,68,.25)") : "rgba(255,255,255,.08)"}`,
                }}>
                  {state?.answered
                    ? (state.correct ? <Check size={11} color="#34D399" /> : <X size={11} color="#F87171" />)
                    : <span style={{ fontSize: 9, color: "var(--text3)" }}>{i + 1}</span>}
                </span>
                <p className="vq-quiz-q-preview">{qp.question}</p>
              </div>
              {state?.answered && (
                <div style={{ fontSize: 10, color: state.correct ? "#34D399" : "#F87171", fontWeight: 600 }}>
                  {state.correct ? `+${qp.points || 1} điểm` : "Không có điểm"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VideoQuizPage — entry point, export
   embedded=true → dùng bên trong TaskPage (không có header riêng)
───────────────────────────────────────────── */
export default function VideoQuizPage({ user, state, embedded = true }) {
  const isTeacher = user?.role === "teacher";

  if (embedded) {
    return (
      <div style={{ color: "var(--text, #e8eaf0)", fontFamily: "'Outfit','Inter','Segoe UI',sans-serif" }}>
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
        <h1>Bài tập Video có Trắc nghiệm</h1>
        <span className={`vq-role-badge ${isTeacher ? "teacher" : "student"}`}>
          {isTeacher ? "Giáo viên" : "Học sinh"}
        </span>
      </div>
      {isTeacher
        ? <TeacherView user={user} state={state} />
        : <StudentView user={user} state={state} />
      }
    </div>
  );
}
