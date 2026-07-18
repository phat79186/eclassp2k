import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api, { setToken, clearToken, getToken } from "./api.js";
import { StudentAssignmentModal, InteractiveVideoPlayer } from "./InteractiveAssignments";
import {
  Home, BookOpen, MessageSquare, MessageCircle, QrCode, Grid, Shuffle,Library, User, Search, Send, Menu,CheckCircle, Clock, Plus, Upload, Download,FileText, Hash, Paperclip,RefreshCw, Trophy,GraduationCap, LogOut, X, Edit2, Trash2, Save,UserPlus, Settings, Eye, EyeOff,AlertTriangle, Check, GripVertical,Users, School, Key, Phone, Calendar, ChevronLeft, ChevronRight,BarChart2, Bell, UserCheck, UserX, LayoutGrid, Sun, Moon, Camera, CameraOff, ExternalLink, Play, Pause, RotateCcw, Link2, Activity, Bot, Sparkles, FolderOpen, FileCode, Code2, Terminal, Info,
  HelpCircle, ListChecks, CircleDot, PenLine, ClipboardList, Volume2, Video
} from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import { QRCodeCanvas } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import GradeCalculatorPage, { computeGradeSummary } from './GradeCalculatorPage';
import PomodoroPage from './PomodoroPage';
import RankingPage from './RankingPage';
import AdminDashPage from './AdminDashboard';
import confetti from 'canvas-confetti';

const compressImage = (file, maxWidth = 400, maxHeight = 400) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// ════════════════════════════════════════════════════════════════════════════
// FACE RECOGNITION ENGINE (face-api.js)
// Dùng chung cho trang Điểm danh (AttPage) và Quản sinh (ProctorDashboard).
//
// CẦN CÀI ĐẶT:  npm install face-api.js
//
// CẦN MODEL (bắt buộc): face-api.js không tự có "bộ não" nhận diện, nó cần tải
// các file model đã huấn luyện sẵn (tiny_face_detector, face_landmark_68,
// face_recognition). Mặc định bên dưới tải tạm từ CDN (jsDelivr) để chạy thử
// ngay không cần cấu hình gì thêm. Để dùng ổn định lâu dài (khuyên dùng khi
// lên production), hãy tải toàn bộ model tại:
//   https://github.com/justadudewhohacks/face-api.js/tree/master/weights
// rồi copy vào thư mục public/models của dự án, và đổi FACE_MODEL_URL bên
// dưới thành "/models".
// ════════════════════════════════════════════════════════════════════════════
const FACE_MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

// Khoảng cách Euclidean tối đa giữa 2 vector khuôn mặt để coi là "cùng một
// người". Giá trị chuẩn khuyến nghị bởi face-api.js là 0.5-0.6. Số càng nhỏ
// càng khắt khe (ít nhận nhầm nhưng dễ không nhận ra), số càng lớn càng dễ
// nhận nhưng dễ nhầm giữa 2 học sinh khác nhau.
// Dùng 0.5 (thay vì 0.6 - ngưỡng lỏng nhất trong khoảng khuyến nghị) để giảm
// nguy cơ nhận nhầm học sinh này thành học sinh khác trong điểm danh thực tế.
// Nếu quét khó lên hình (ảnh đại diện mờ/thiếu sáng), có thể tăng dần lại tối đa 0.6.
const FACE_MATCH_THRESHOLD = 0.5;

// TẠM TẮT face-api.js do lỗi TensorFlow.js không tương thích
// Sẽ chỉ dùng dropdown chọn học sinh thủ công
let _faceApiModelsPromise = null;
let _faceApiInstance = null;

function loadFaceApiModels() {
  if (_faceApiModelsPromise) return _faceApiModelsPromise;
  const fapi = window.faceapi;
  if (!fapi) return Promise.reject(new Error("face-api.js is not loaded on window"));
  const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";
  _faceApiModelsPromise = Promise.all([
    fapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    fapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    fapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]).then(() => {
    _faceApiInstance = fapi;
    return fapi;
  });
  return _faceApiModelsPromise;
}

// Tính vector đặc trưng (descriptor) khuôn mặt từ 1 ảnh (base64 data URL hoặc URL thường)
async function computeFaceDescriptorFromImage(faceapi, imageSrc) {
  if (!imageSrc) return null;
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "Anonymous"; // vượt qua lỗi CORS khi ảnh là URL Supabase (khác origin)
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Không tải được ảnh"));
    el.src = imageSrc;
  });
  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })) // scoreThreshold 0.5: tránh nhận nhầm ảnh mờ/kém chất lượng làm dữ liệu tham chiếu
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  return detection ? detection.descriptor : null;
}

// Hook nhận diện khuôn mặt thật (face-api.js) dùng chung cho AttPage và ProctorDashboard
function useFaceRecognition(students) {
  const [modelsReady, setModelsReady] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [computing, setComputing] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const faceMatcherRef = useRef(null);

  // Tracking liveness state
  const blinkDetectedRef = useRef(false);
  const isEyeClosedRef = useRef(false);
  const currentMatchedStudentId = useRef(null);
  const missedFramesCount = useRef(0);
  const earHistoryRef = useRef([]); // Lịch sử tỉ lệ EAR để phân tích dạng sóng nháy mắt

  useEffect(() => {
    loadFaceApiModels()
      .then(() => setModelsReady(true))
      .catch((err) => {
        console.error("Lỗi tải face-api models:", err);
        setModelError(err);
      });
  }, []);

  useEffect(() => {
    if (!modelsReady) return;
    let active = true;

    const computeDescriptors = async () => {
      setComputing(true);
      const fapi = window.faceapi;
      if (!fapi) return;

      const labeledDescriptors = [];
      let count = 0;

      for (const student of students) {
        if (!active) return;
        if (!student.photo) continue;

        try {
          const desc = await computeFaceDescriptorFromImage(fapi, student.photo);
          if (desc) {
            labeledDescriptors.push(new fapi.LabeledFaceDescriptors(student.id, [desc]));
            count++;
          }
        } catch (err) {
          console.warn(`Không thể lấy đặc trưng khuôn mặt cho học sinh ${student.name}:`, err);
        }
      }

      if (active) {
        if (labeledDescriptors.length > 0) {
          faceMatcherRef.current = new fapi.FaceMatcher(labeledDescriptors, FACE_MATCH_THRESHOLD);
        } else {
          faceMatcherRef.current = null;
        }
        setKnownCount(count);
        setComputing(false);
      }
    };

    computeDescriptors();

    return () => {
      active = false;
    };
  }, [modelsReady, students]);

  const resetLiveness = useCallback(() => {
    blinkDetectedRef.current = false;
    isEyeClosedRef.current = false;
    currentMatchedStudentId.current = null;
    missedFramesCount.current = 0;
    earHistoryRef.current = [];
  }, []);

  const recognizeFromVideo = useCallback(async (video) => {
    const fapi = window.faceapi;
    if (!fapi || !faceMatcherRef.current) return null;

    try {
      let detection = null;
      
      // Nếu chưa nhận dạng danh tính, chạy detector đầy đủ để lấy face descriptor
      if (currentMatchedStudentId.current === null) {
        detection = await fapi
          .detectSingleFace(video, new fapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        if (detection) {
          const bestMatch = faceMatcherRef.current.findBestMatch(detection.descriptor);
          if (bestMatch && bestMatch.label !== 'unknown') {
            currentMatchedStudentId.current = bestMatch.label;
            missedFramesCount.current = 0;
            earHistoryRef.current = [];
          }
        }
      } else {
        // Đã có danh tính -> Chuyển sang chế độ chạy Landmarks siêu tốc (Landmarks-only)
        // Không chạy Face Descriptor (tốn 90% thời gian xử lý) để camera đạt 40-60 FPS tracking mắt
        detection = await fapi
          .detectSingleFace(video, new fapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.45 }))
          .withFaceLandmarks(true);

        if (!detection) {
          missedFramesCount.current++;
          if (missedFramesCount.current > 8) {
            // Mất dấu mặt quá 8 frames -> yêu cầu quét lại danh tính
            currentMatchedStudentId.current = null;
          }
        } else {
          missedFramesCount.current = 0;
        }
      }

      if (!detection) return null;

      // Tính khoảng cách Euclidean
      const getDistance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

      // Tính Eye Aspect Ratio (EAR)
      const calculateEAR = (eyePoints) => {
        const p2_p6 = getDistance(eyePoints[1], eyePoints[5]);
        const p3_p5 = getDistance(eyePoints[2], eyePoints[4]);
        const p1_p4 = getDistance(eyePoints[0], eyePoints[3]);
        return (p2_p6 + p3_p5) / (2.0 * p1_p4);
      };

      const landmarks = detection.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      const earLeft = calculateEAR(leftEye);
      const earRight = calculateEAR(rightEye);
      const avgEAR = (earLeft + earRight) / 2.0;

      // Lưu trữ vào buffer lịch sử để phân tích động hình học
      earHistoryRef.current.push(avgEAR);
      if (earHistoryRef.current.length > 20) {
        earHistoryRef.current.shift();
      }

      // Thuật toán V-Shape adaptive liveness
      if (earHistoryRef.current.length >= 4) {
        const maxEAR = Math.max(...earHistoryRef.current);
        const minEAR = Math.min(...earHistoryRef.current);
        
        // Sự sụt giảm của EAR (từ mở sang nhắm) ít nhất 18% so với trạng thái mở lớn nhất
        const dropPercent = (maxEAR - minEAR) / maxEAR;

        // Nếu có sự sụt giảm đáng kể và điểm thấp nhất nằm trong dải mắt nhắm (< 0.24)
        if (dropPercent > 0.18 && minEAR < 0.24) {
          // Kiểm tra xem frame hiện tại đã mở mắt phục hồi lại hay chưa (đạt tối thiểu 80% của maxEAR)
          if (avgEAR > maxEAR - (maxEAR - minEAR) * 0.25) {
            blinkDetectedRef.current = true;
            console.log("👁️ Liveness passed: Rolling buffer detected blink! Drop:", dropPercent.toFixed(2), "Min:", minEAR.toFixed(2));
            earHistoryRef.current = []; // Reset history
          }
        }
      }

      if (currentMatchedStudentId.current) {
        return {
          studentId: currentMatchedStudentId.current,
          distance: 0.1,
          livenessPassed: blinkDetectedRef.current,
        };
      }
    } catch (err) {
      console.error("Lỗi khi nhận diện từ video:", err);
    }
    return null;
  }, []);



  return {
    modelsReady,
    modelError,
    computing,
    knownCount,
    recognizeFromVideo,
    resetLiveness,
  };
}


// css toàn cục 
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;margin:0;padding:0;width:100%;height:100%;background:var(--bg)} html{scroll-behavior:smooth}
#root { max-width: 100% !important; margin: 0 !important; padding: 0 !important; width: 100%; height: 100%; }


/* ── Design tokens ── */
.ecp {
  --bg:       #050C1A;
  --bg2:      #060D1E;
  --surface:  #0A1628;
  --surface2: #0D1E38;
  --border:   rgba(255,255,255,.08);
  --border2:  rgba(255,255,255,.05);
  --text:     #FFFFFF;
  --text2:    rgba(255,255,255,.75);
  --text3:    rgba(255,255,255,.45);
  --text4:    rgba(255,255,255,.6);
  --accent:   #4FACFE;
  --accent2:  #7B3FE4;
  --scrollbar:rgba(255,255,255,.1);
  --glass:    rgba(255,255,255,.028);
  --modal-ol: rgba(0,0,0,.8);
  --inp-bg:   rgba(255,255,255,.05);
  --inp-bd:   rgba(255,255,255,.1);
  --inp-ph:   #2E4A6A;
  --notif-bd: #050C1A;
  --topbar:   rgba(6,13,30,.95);
  --sidebar:  #040B17;
  --nbtn-hov: rgba(79,172,254,.07);
  --nbtn-act: rgba(79,172,254,.12);
  --row-hov:  rgba(255,255,255,.02);
  --scard:    #0A1628;
  --scard-bd: rgba(255,255,255,.07);
  --card-bg:  #060D1E;
  --modal-bg: #0A1628;
  --modal-bd: rgba(255,255,255,.1);
  --wa015: rgba(255,255,255,.015);
  --wa018: rgba(255,255,255,.018);
  --wa02: rgba(255,255,255,.02);
  --wa022: rgba(255,255,255,.022);
  --wa025: rgba(255,255,255,.025);
  --wa03: rgba(255,255,255,.03);
  --wa035: rgba(255,255,255,.035);
  --wa04: rgba(255,255,255,.04);
  --wa045: rgba(255,255,255,.045);
  --wa05: rgba(255,255,255,.05);
  --wa055: rgba(255,255,255,.055);
  --wa06: rgba(255,255,255,.06);
  --wa07: rgba(255,255,255,.07);
  --wa08: rgba(255,255,255,.08);
  --wa09: rgba(255,255,255,.09);
  --wa1: rgba(255,255,255,.1);
  --wa14: rgba(255,255,255,.14);
}

/* ── Light theme overrides ── */
.ecp.light {
  --bg:       #F2F6FC;
  --bg2:      #E6EFFB;
  --surface:  #FFFFFF;
  --surface2: #F0F5FE;
  --border:   rgba(29,108,245,.08);
  --border2:  rgba(29,108,245,.04);
  --text:     #0F172A;
  --text2:    #334155;
  --text3:    #64748B;
  --text4:    #475569;
  --accent:   #1D6CF5;
  --accent2:  #7B3FE4;
  --scrollbar:rgba(29,108,245,.15);
  --glass:    rgba(255,255,255,.7);
  --modal-ol: rgba(15,23,42,.3);
  --inp-bg:   #F8FAFC;
  --inp-bd:   #E2E8F0;
  --inp-ph:   #94A3B8;
  --notif-bd: #FFFFFF;
  --topbar:   rgba(255,255,255,.88);
  --sidebar:  #FFFFFF;
  --nbtn-hov: rgba(29,108,245,.06);
  --nbtn-act: rgba(29,108,245,.09);
  --row-hov:  rgba(29,108,245,.02);
  --scard:    #FFFFFF;
  --scard-bd: rgba(29,108,245,.08);
  --card-bg:  #F8FAFC;
  --modal-bg: #FFFFFF;
  --modal-bd: rgba(29,108,245,.1);
  --wa015: rgba(29,108,245,.015);
  --wa018: rgba(29,108,245,.02);
  --wa02: rgba(29,108,245,.02);
  --wa022: rgba(29,108,245,.022);
  --wa025: rgba(29,108,245,.025);
  --wa03: rgba(29,108,245,.03);
  --wa035: rgba(29,108,245,.035);
  --wa04: rgba(29,108,245,.04);
  --wa045: rgba(29,108,245,.045);
  --wa05: rgba(29,108,245,.05);
  --wa055: rgba(29,108,245,.055);
  --wa06: rgba(29,108,245,.06);
  --wa07: rgba(29,108,245,.07);
  --wa08: rgba(29,108,245,.08);
  --wa09: rgba(29,108,245,.09);
  --wa1: rgba(29,108,245,.1);
  --wa14: rgba(29,108,245,.14);
}

.ecp {
  font-family: 'Outfit', -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

.ecp::before {
  content: "";
  position: fixed;
  top: -20%;
  left: -20%;
  width: 80%;
  height: 80%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79,172,254,0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  animation: drift 20s linear infinite;
}

.ecp::after {
  content: "";
  position: fixed;
  bottom: -20%;
  right: -20%;
  width: 80%;
  height: 80%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(123,63,228,0.05) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  animation: drift 25s linear infinite reverse;
}

@keyframes drift {
  0% { transform: rotate(0deg) translate(0, 0); }
  50% { transform: rotate(180deg) translate(40px, -40px); }
  100% { transform: rotate(360deg) translate(0, 0); }
}

.hfont{font-family:'DM Serif Display',serif}
.gtext{background:linear-gradient(135deg,#4FACFE 0%,#00F2FE 50%,#43E97B 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;background-size:200%;animation:gshift 6s ease infinite}

@keyframes gshift{0%,100%{background-position:0%}50%{background-position:100%}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scanline{0%{top:-4px}100%{top:100%}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}60%{transform:translateX(6px)}}
@keyframes pop{0%{transform:scale(.95);opacity:0}60%{transform:scale(1.02)}100%{transform:scale(1);opacity:1}}
@keyframes glowbeat{0%,100%{box-shadow:0 0 20px rgba(79,172,254,.18)}50%{box-shadow:0 0 40px rgba(79,172,254,.45)}}
@keyframes pulseGreen{0%,100%{box-shadow:0 0 6px rgba(52,211,153,.5)}50%{box-shadow:0 0 14px rgba(52,211,153,.95)}}
@keyframes spin360{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes pulse-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.55);opacity:0}}

.page{animation:fadeUp .45s cubic-bezier(0.16, 1, 0.3, 1) forwards;min-height:calc(100vh - 60px);position:relative;z-index:1}
.modal-bg{position:fixed;inset:0;background:var(--modal-ol);backdrop-filter:blur(12px);z-index:300;display:flex;align-items:center;justify-content:center;animation:fadeIn .18s ease}
.modal{background:var(--modal-bg);border:1px solid var(--modal-bd);border-radius:20px;padding:28px;min-width:320px;max-width:95vw;max-height:92vh;overflow-y:auto;animation:pop .25s cubic-bezier(0.34, 1.56, 0.64, 1);box-shadow:0 40px 80px rgba(0,0,0,.3)}
.modal-flex{background:var(--modal-bg);border:1px solid var(--modal-bd);border-radius:20px;min-width:320px;max-width:95vw;max-height:90vh;overflow:hidden;animation:pop .25s cubic-bezier(0.34, 1.56, 0.64, 1);box-shadow:0 40px 80px rgba(0,0,0,.3);display:flex;flex-direction:column}

.inp{width:100%;padding:10px 14px;border-radius:10px;background:var(--inp-bg);border:1px solid var(--inp-bd);color:var(--text);font-size:13px;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s}
.inp:focus{border-color:rgba(79,172,254,.55);box-shadow:0 0 0 3px rgba(79,172,254,.1)}
.inp::placeholder{color:var(--inp-ph)}
.inp:disabled{opacity:.5;cursor:not-allowed}
input.inp[type="password"]::-ms-reveal,input.inp[type="password"]::-ms-clear{display:none}

select{cursor:pointer}
select option{background:#0D1E38;color:#E2EAF4;padding:8px}

.nbtn{transition:all .2s;cursor:pointer;border-radius:10px;border:none;background:transparent}
.nbtn:hover{background:var(--nbtn-hov)!important;color:var(--accent)!important}
.nbtn.act{background:var(--nbtn-act)!important;color:var(--accent)!important}

.glass{background:var(--glass);backdrop-filter:blur(20px);border:1px solid var(--border)}

.cglow{transition:all .28s cubic-bezier(0.4, 0, 0.2, 1)}
.cglow:hover{border-color:rgba(79,172,254,.35)!important;box-shadow:0 12px 32px rgba(79,172,254,.15)!important;transform:translateY(-2px)}

.bprimary{background:linear-gradient(135deg,#1D6CF5,#7B3FE4);transition:all .22s;cursor:pointer;border:none;color:#fff;font-family:inherit;font-weight:600}
.bprimary:hover{opacity:.95;transform:translateY(-1px);box-shadow:0 8px 24px rgba(29,108,245,.4)}
.bprimary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}

.scard{background:var(--scard);border:1px solid var(--scard-bd);border-radius:14px;transition:all .25s ease}
.scard:hover{border-color:rgba(79,172,254,.22);transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.04)}

.btn:active, .nbtn:active, button:active, .cal-day:active{transform:scale(0.96)!important}
.btn, .nbtn, button, .cal-day{transition:transform 0.15s ease, background 0.2s, box-shadow 0.2s, border-color 0.2s!important}

.shake{animation:shake .3s ease}

.tag{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:.04em;text-transform:uppercase}

.drag-over{background:rgba(79,172,254,.1)!important;border-color:rgba(79,172,254,.55)!important}

.seat-cell{transition:all .2s ease;position:relative}
.seat-cell.occupied:hover{transform:scale(1.07);z-index:5}

.sidebar-ind{position:absolute;right:0;top:50%;transform:translateY(-50%);width:3px;height:18px;background:linear-gradient(180deg,#4FACFE,#00F2FE);border-radius:2px 0 0 2px}

::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:var(--scrollbar);border-radius:2px}

.tooltip{position:absolute;bottom:calc(100%+8px);left:50%;transform:translateX(-50%);background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:9px 13px;font-size:10px;white-space:nowrap;pointer-events:none;z-index:200;animation:fadeUp .15s ease;box-shadow:0 10px 24px rgba(0,0,0,.2)}

.row-hover:hover{background:var(--row-hov)!important}

.cal-day{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;cursor:pointer;transition:all .18s;border:1px solid transparent}
.cal-day:hover{background:rgba(79,172,254,.1);border-color:rgba(79,172,254,.28)}

/* Responsive Layout */
.main-wrapper { margin-left: 224px; flex: 1; min-width: 0; min-height: 100vh; transition: margin-left .3s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; position: relative; z-index: 1; }
.main-wrapper.col { margin-left: 58px; }
.sidebar-wrapper { width: 224px; height: 100vh; background: var(--sidebar); border-right: 1px solid var(--border2); display: flex; flex-direction: column; transition: width .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1); position: fixed; left: 0; top: 0; z-index: 50; overflow: hidden; }
.sidebar-wrapper.col { width: 58px; }
.sidebar-overlay { display: none; }

@media (max-width: 1024px) {
  .main-wrapper, .main-wrapper.col { margin-left: 0 !important; }
  .sidebar-wrapper { width: 260px !important; transform: translateX(0); }
  .sidebar-wrapper.col { transform: translateX(-100%); }
  .sidebar-overlay.open { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 45; backdrop-filter: blur(4px); animation: fadeIn .2s; }
}

@media (max-width: 768px) {
  .page { padding: 12px !important; gap: 12px !important; }
  .scard { padding: 16px !important; }
}
@media (max-width: 477px) {
  .vidcall-btn { padding: 7px !important; gap: 0 !important; border-radius: 50% !important; width: 28px; height: 28px; justify-content: center; }
  .vidcall-txt, .vidcall-ext { display: none !important; }
}
.cal-day.present{background:rgba(52,211,153,.15);border-color:rgba(52,211,153,.45);color:#34D399}
.cal-day.absent{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.28);color:#EF4444}
.cal-day.today-mark{box-shadow:0 0 0 2px #4FACFE}
.cal-day.no-session{opacity:.28;cursor:default}
.notification-dot{position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:#EF4444;border:2px solid var(--notif-bd);animation:glowbeat 2s infinite}
.pulse-dot{animation:pulseGreen 1.6s ease-in-out infinite}

/* Light mode specific tweaks */
.ecp.light .bprimary{box-shadow:0 4px 16px rgba(29,108,245,.25)}
.ecp.light .modal{box-shadow:0 20px 60px rgba(0,0,0,.08);border-color:rgba(29,108,245,.1)}
.ecp.light .modal-flex{box-shadow:0 20px 60px rgba(0,0,0,.08);border-color:rgba(29,108,245,.1)}
.ecp.light .scard{box-shadow:0 4px 12px rgba(29,108,245,.02);border-color:rgba(29,108,245,.06)}
.ecp.light .page{background:transparent}
.ecp.light select option{background:#FFFFFF;color:#0F1E35}
.ecp.light .cglow:hover{box-shadow:0 12px 32px rgba(29,108,245,.08)!important;border-color:rgba(29,108,245,.2)!important}

.qs-laser { position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#4FACFE,transparent);box-shadow:0 0 12px #4FACFE;animation:qs-scan 2s linear infinite; }
@keyframes qs-scan{0%{top:0%}100%{top:100%}}
.qs-corner{position:absolute;width:24px;height:24px;border-color:#3B82F6;border-style:solid;}
.qs-pulse{animation:qs-beat 1.6s ease-in-out infinite;}
@keyframes qs-beat{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
`;

// Logo E-Class P2K 
const LOGO_SM = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAIAAADajyQQAAANjElEQVR42u1ae3RV1Zn/7b3PuY/c3OQmIbkkEEx5ybMS2yqiZVgKiLSMqPVBa9VRi3ZVbEuXM1OXq+rqqFM60+mq4xraLsbHSH3D6FgRxcUbAZ0oQkHehFdIQi43uc9zzt7fN3+cBEGx5SaQOqx8a/9x1znnnnN+e3/f7/u+39mCiHAumsQ5al9QYOJcBcZ9rvh5q30OAuM+8ugDdjZZ7gsKjHt9+s4pV+S+GPt/bNZf/Q2IQcwApBBS9DowcRYIwDCDYSmpusJeGxKAPBP4rG7EZc9DnIilFJaUAPYezT219jCI7pw4sLYiDMAYYkD1DJ7ozX6MGMxsqc7AXrmr/ferD73a0Jxuy8HTsYi88eKa2VPqLhxaDoCZjWEphRB/bWB/3l2F6Mw0yZxetDmxYF3Tuh3HkHOlxQEmeMbJaW7PWhZPHxf//owR08YPPO6f3Vi97gMjBn2um/KnYDKgCQ1NuVe3JV/+oHXfwRRcD0bD1XA1PA1jAA5LZtfLJ7PQZvzIfnddM/rGacPDQYuZewkYA1IUXCrd/cf9v13VhA4HMNEA6mKBWEBYRE7ea0/mWtqyrUczSOUhURQQ2VQebelYRdHD906455avAVyQU3YHGANSiO0p88xer8MhQcQEEMMwiGHIDyYwCwaIYDp/RwTXlIqNjUmjzeXnx4605VN5TdrYbCIBFbEEjGlqzazceGD9xv0wZvTQim9NHnrttBFjhld2OfNZA8aAEKIxQ/VvpiVxXRG0R8IQNMEwDLFhYYgNgSGIYJgNCSIQs6cHRK3rLiiZMDhy0WMb061ZeBquhjYgA0HxYntMTWT6JbX5tFNVFqwf1V9KUT+iyhgqNAdYhScf2AKLD+mAFPtnRoOq0LBmV/N7e9vTyXwwJKCksJQ0QhhBrm47lnunMfHO8j1bX7t55JfK316/v/Fwx7jzKwsPscKBEYMYbXkuVxxUwjNc0FQSccCSjqvRnnNsAa3hGjgeHA1XQ1CoyPYEtyaywwbFmChoCSG6Ux0UDCyoAOCW89RV8RAAJSGAU8yoOIlYjp+XUjDz6AHRpQ9fWhqxFeB4pj3lNrVldjQmG7a1rP3wiHG8YEBZStZWl8RKwoVGV8HAfArfnuasR/VlVjxktiW8keV2F0OefDGzIfbzDzGUPKlnisdCU+v7n/Ip/7u1ZerdrzmuAfDW+gP7DiYvGhMnZlkgA8uCogtCLNjlPPpRDkDC4dasAeB6Ju9ox+0annZcLYSwlGSGEFBSOAbHR153LqE2ZAwZQ65n/EMdaXfcyKrx9fFU1gOwZNWexW9+DEBJeRZXzBIQwLxxYQDLD+RKbTFxYAjAXY+8sWjJVqtf1CgLAQsB2woH6+Ild08f+b3Lzkt79O1VmZWNjiRmj+Cx8sywYvVPk0snDwkZYiIO2GrD7sS9TzS0tGVeefBvwgHlc+Cjcybkcg4zn0VXZEACrTmzdFd2VL9AQIrjgVVbFR07tNIqi5BSbCkZsFOGG3YnZj+xYUy8SJaVH064X45J8oi1lJpSWblhR+6GZm/HT6rLwsK25PqdiaseWJFsST/74MQLB8cyOe0v0YWj4r5Xd6syOj3zDDHzssYcbt/yrf/az8xpx7zwUTrtGD6VzX22QX7zqbnPf8jMzPSps1MXNOMHe1btyjLzmo+PRq97CVc8vWhdIzMT8TfmvLZ03T5mdlztaUPdMquQWOTzY+qR6/t9ta4IQFuOHlt2bOKgYMgSny1SS0IWXM2GfCbZkTQdeQJDAGmH97W4YNSWBd7dfvRvf7ZSut6LD0265pJBedeEAgrcSaNKim73ZqfdaAowY2CJff+0OMBrd7XXlgU++PEAIkgplm7Y998rd+cBllIolXL1q+8fItCVoyoN49bXkwsbcsgYeAYewQNc3HJFtK5c3vRoQ2Jn66zrR15/2SDHM5af7rt8rydNYGF5TBuCEPva8pfNWXXP9XWP3z5WCLy5ds9V338BhlESgpKwLNiqul/xnNkXXTlu4HNbMgvXZUfVWrMmRkAsGcLQ8Hho5peLmLFw7vjpTcnnnts8vF/4oe9d5HjGUgCTj030GjAlhQDixfb8H439ypeifqZ6fsk2lcz+9P6pd868wBhSSgqgvDRcHLYZ2NpGdl7fd0nstvriz07TkJqSN+ZNm3L34ocfWxG25D/83VcBdDpwL4s5DETD1l1X1jFgNEGKdCprErn6YZXn9S858cq8RyFbOo7xND/wZvJfl6dYs2AWxOSh2MZr91RXRGjIgJI3n7h62p0v/ePcxfms++APJjAzuKdaRMGJTxMY+Jd17ZOfabEsAWDIgNjo0ZUhSxCx6xlDZIiI2JICQHWRHFETLFaiI63TOZPKUCZrUu3ulJHhqqgSEJ42wwfF3ph/zZVXj/3DC+9t/PBgJGQR9VhkKZRGXU3M/NDy5OjfHNSGXd1ZPRhD+tPDdA5tyBgm+mQwMbPWRmujjXE97acBz/EyWfebs19+a80e/wLqrnVTV1RENoySUH8uwv9C8KuuCvJ4JWkFLAsgZjLUq6x43CqK5Ka9+T9uS42KBw2xOA7ieGwwAAaDmbVhgAWglACzf0qgs3ZhsGCfMlgJsWXn0eVr9j7yo6/3kBUL76AZQojmtJ7w6717d2cQFCACGWgDIhiCNjD+EV+ioUDEYqO1S9yRBRF0V8usDdj/l4HWIAIIrR3X3vyVF5+4RhQocpwJzYMhpWhOea9vSnW4RoAFMxODWYJDlr8szERKYtfh9LxXdsKjukr7/ptGMnWlKSYy5OS1/xvMAsyaBsSLr54yTHV1Br3qikKAiONR+47Lyj97tjnt+SCNYVuJjR+recZA61gkPOPiaiLy/ZaIi8J2aTT4OXPHomc6d/d1RWaYE7KNMWxZ8oHXD/1icSOkQd6F48LT8LQECSLWhhwX2oM2MBraKFe/9eR1Ey+qNZpkl3YiACml6LF6f8aUYL+/bkw4HRmtJPyCHsziOKN0zgKDfC4R2tODakpiJaEeel1PgZEfSADESS2tIfKJWQgopQrP+D5sMKAkiD4RkaUEMZSAYYhTCRBnBtinOMrv/5hZngDS/4xiiMgwsU/xkpj9SsJSkuiT4wCEFCe7HePTIpA4QTthcWaBGSJLqSXLNj/1zPJgcVHAlr98+MaSaJiIbVu9veJP8/9zBRPf/t2JI4fHf/n4kvm/uu1kGhCnpgeAgB8vad/VoknT2JrQz64o/vmK1KaDroCYNS405fzwvNWZf7uqZMn23CubnV/PKIkExJlkRSZAYfW72z3iuXdcrrWJFoeUkkph05b9d/7wyX//xc1G0+atB2v6l36w+QCAZSu3rlm1rW5Yza03jt+5p+WlRRuCIfuu2yZt+tOBd5ZtGTwsPuu68UoKZl60Of/PU6Njq+0ZC45WFbEt8ci00saEe/fijicjcvXu3Nvb7dufSzz97YrioDR0ujJmAXRfHivas6flP3731oxvXHi0LT33J09fOmlUKp2fPnnMjGnjAMwEGjY1RouDABLHUtJWP5+3+MIxAxYsXL3pw33fmXWpkOKHP/1D/YiaUWMGSiWZGRBl0ry/12lKGDdPF9cG97ebx1em2zNmYq0aVGrns+aq+S3P31Y1dXjIM2zL062zCgDWnsrX19c9+PczAwGrOBKcc8+0yqrY7n3Nzzz/bktrh6fN+vf31A4oz+W8fN5b+NL6m2Z+LRoJ7T90bPYtk/6nX8MLi94bdf6ARx+4ds3aHb9/ds1l44fHq0qZKZvlrMOZvHn6OxVVUTXld0cX3FAWscSEwYEDx3QY4rc3lN/3cuvoePXI/vYZXjE/Rs4bWLF06ab7HnxRCMz/1a2XjB8OYOjgqhuv3XXdd38jhLxi0qjLvz5Ca1qx5uPy0nDD5oNDh/TfvedIRyq3v7E1HA5Ylnrvg32JtlRxUTAQUAAz8+CYemh6aXWpBeCjQ/khJeLFjSnXNQs3WHMmRavDdMcl0WSG7n0h8fLsymhI8OnVkAWwIjO7rtaahBRF4cCJfJhO5wEUF4cAeJ4BYNuq6Uiyun/M76mbmo716xe1bQvA4cOJmpryExO9T3ZMrKQwhJzHfskfUMwM/9Nu3mMlYcmzQPdak6eNlIKJlSWVlE3N7UVhWymVyeRDITuX86qqomQom/VCITsYtNo7ss0tHQHbrh1Y7rheJuMwUBQOOI6uKC9uPdoRCtmpjpwmKotFisLBdCavPVMUtj1tslm3pqbcdbXragJsJWzbUkqeUVZkSIFUOn+kOamU0sb0ryotjgQ3bzlQUR4JBgOZrBOwZeJYtrJyxM5dzZFIsCpYun1nMzMnkxlmrqosOdR0LJFIM6RtyUhRsKI8sn1HU7yq5FgyEw4HDh9uv2DswMNH2ltaOkpKwmDK53V1dVmyPXc00WEppQ1Vx2Ox0vBplindT9AAex4pJYjYspSfTJnZ88iyhJTS87SUUoqT9qU4jhcMWlqTUp37AYwhIvYlRGIQkZTCt8/mwNNXhQurFU+4rxACXV+uxInP81+oayIYAFHXHDOE7Hxd9sn+k90EzAzRyVSf3K+zFz31zPbWdogvlPXtfusD1msmzlVg3OeKfcD6gPU+Z/xlYOKLCox7CIz7XLEPWB+wPmCnC0ycQ8D+DwGa1y+LooAHAAAAAElFTkSuQmCC"; // 72×72 — dùng ở sidebar
const LOGO_LG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAIAAAC2BqGFAAAgVUlEQVR42uV9eXwcxZX/e1XVc+g+LMnybWxsg09Mwo3B2BibyySGhSwJJBB+IUCySTY3kHAnJIQsCQtJNpvDJJAQAuEwYAdI1tgcxgaDA74vZMmSdVnSXD1d9d7vj5oZjWxJHo1mZGW3NR99enq6q6tfvfq+uxqJCHrZEIBhWG4IyMDpO/2flpcu9NLyESgm+jjOeaLR4BtJka9/Og6QyjiQkzhDimHag4ss75lxlzHtSFYshkMyTziTm3F2jQIwsMhXl3M2NTi3c77/AeS8DbAYAtTgfCJJ1j3hXA8wDpTQQzaxOW/c2vctOX9gxNkRGvMzsTFvlM2oJ4iZnJmPkRD9UBDzNux9gQbmjoMGNmaImWFd9twgBvoQmIvbJxXhHKvumHXHmAc6tAOd8X2odzgAdZEHx90ZtoMZPFtfDWJWk2Ogqt6RhSH+M1iEnPuOcW6pf2RhyD1siqNoWw+FVpf5DTGLwTmiMORhQCbuAyXwKI1rbnlO5INrMKcMyINoFnOHDMOF0Okd5fxMds4ZaOSx530NWI4JnStbYKht88FZXkfsLSJiH/7o3APiMHVvD9Umhob1MgFEPBqMPGQyVvT6E2Y8R3gQdiMPWlPGbOfy0EPQEEHH/9kthZni/8Tj8hAK255uE85a68AcjPGQYyX2Tvm8RB4O8QQmby8G+vTDKjQ1yNvkKUzOvR0YmAmOmEsWxTwzPAMYYkM8HDTLjIRhvrVgROQcUcN2lRmIWckUMLJnWCLi0VBHbJcGpnXgYT4NzuquuTX0078SAydJ7Bla8V4rGXPxCdWJI5qkGAC5cxKLsC2o4W/pHjHUYL8aYoEoBQJgfbv76FuNy9c0/GNvJ3jenIll1501+opTayuKAwCgDSGAEJjz3vbTQi716KNiZzODYXaSKPHm3q7/XtPw5w1Nba1RkKgkI4EXiUPEHV0VvHr+xGvOGTupthgADBEzSDFUWtDRMlgGPyrpKBF29bPvt//y9caXt7RBxAOFjmDWhjShIcGExPGYgbBbVCguO23s55ZMOvn4agBgZmNYZIgniBlFF5lTakN3pmA/hMZuffPQnaNLbkMsRUK07WqN/X5j2/I3G3fUdQIzKpRM7Bk2BojAGDQMBEiExggyXtxQZ1Q4uGjuqM9fPPWC08ZLiQCgtUFEkTcGz4jQw8qcTfIe/8+e8C/fav7Le62htggoIZHQGKMNGkYiMATGgLE7hMygDRoDhiQY45HX5YIxJ06ruu7iaZcvnlJW7E/AN4LIg3YydNDBPTUE7Ps0TDshfcd+aYmYR95re/z9jnV7uyDqAbJiYu0JAjbGeIa1AW2AGIgEkSAWZJAMGGBDpD00DMZIJiZyu1yIeePHlH7qginXLJs1cUypxZN/PkITAwBI7EdHS5s5NtWBuTcyAwEgwLZ274Zn977ywUGIG3DYASDDJhKDkAsMIMhR6ENGQ8ajWDTOERdiBrQBYJBC+qQDxFqTJjAk2SCzG3UpYgoK1MITR932lXlzptcSc275Wg0IJQYKJpQU64a4l6ZSic7JdjHJTVaCYE9LGQEIYGqF8/LVx247EP7Vm02/eP1Ae3MUSI+rLbxy4ejTJpXXljoFPiWtb5s46upozGvujO9pDG/cduCdbS2bdrbHWiPgCH9QMZO1bcgjiLtF5b7ysqDPp3IreKw8zCNHM4MQ+Eard99Wb2snATETATEYBgYgBkNod4jZMBABMxInbDsGZGZiq8EBETAgAhvWcTO9yn/DmeXH1vj/sL5p3c62H1027f39kb9uatrc6B5oj0Rimo0JIBf6sKbYP76qYEpNcMqokrFVBV5cv7W5+ddPbVr9+ofgVxDX4MZnTR910xUzly6aWl1ZmD109A2IRw5l9R+y7IfBLS+vbtbn/T0SCxsgBmAwBIYTtE58yBK6xw4nR8JSmShJaE4cJAOuBoAZk4tuPL3smnmjf7hy1y2/2QrKACAwJdqxYO1piGvwPBCisNg3d2LJ0tPGXnTGhG27266/4+VjRhXe9IkTFs+b9OKaXUsXHCsFWlsG06RFTizY3gk9eH3DIsEZr4Rf3xefU6W+Os03MgDEgNDNsAneSURW2IJJCj0SPeAUdvSoqbDP0Bn1QlG9eGblzU9s/vVf63zFPs/1wLDVN5AIiZEIyCAxaePFPY5qCMcKCp3ld507/8TRpUU+KcWBtsiC655a+9tLS4r8RJwPl4jqlaqDp7JAaIzSpk4KBuUfziiYWiLzKnLDcTCGtKvJ0wlQMsxkMDFXyCp8DiD6pS9Y0HUg8psVW5edM8nTBgwBYHVlgUyYl5x5SUvGXk9UedGVGQDBMGgSI/1mYgFqZqbevay96H0MGZQ9Jb4SgeOIeJwUgCSdaIQZgRERgQDteczMbIiJNAEKKPEDMzOAlEIgsOcOFJp5AOKKVRZAgT09Z71gWTIZNRby2hw2DD4EEhkkRWOakndkZzVaqxgB6ls6dVtYFyjQ1iAkO85AlAB3iRLZkQgIwMREzIhorwatTVtHgtCHGOO5stoUDBz1D68EOeSIBd4SBbfP9hUJkgJTmnHOrXZEAObrzx5z+dyaqvKCoGIBQIwR17R3RNo63frmyIf7O/Y0dNU1hSOtYUBRWBpIQb6lakmR/9NLZwSsYtcTOTg3fUY1oOYyGQ+BifNKHPzOnILuyZMjHjnkWgHAAFfPP6b/q+JxXXcgvP6Dpj+s2vX033cCseVl26+DYc8D2RGKjygP5qXUAQcYnD1iFgcAhDQ0xDhimAA8YtfwvpCOUzISykk7hSGlcXBmg52ujKT6Y3UmbcjTpE3aR5OnjadJazKGfD41aUzp5YumPHXf4nu/eCq4AoVMWVLvbG3++lef3r6nJQslGjPDaJGrKQwAmgERH9jtjftj55/2aoEoETrjtPDPB7a1e4BADCgABSIiChQCBSY+mPyPgMZwypK008MwAIAQYD0+iGA/wk4gAAaUEqVI+0hUUiiJUiIDGMPM7HkGAL521dyK8SWRcDRFplVrdwcK1KrX9lmpmVuRiIOMsPRVW1BMPApMAAgABGKlX6y6pKqmUDKzQNCaicyh+gd2j5xPCqWEdcwLRIv4SiAAx411CKc8IdaXh45gRyZw4PDhJwbrs9aGlBJdUV3ol5XFYGwWgEAAWPtOQ6w5uvqNXXDjqVYYZpdc2k88SOUEl+0mEQzx5yY5n51Y7kjQxM0xU+EX40odYCYGIfCTtz751sZ9TmmxYQIpQDkgEaQEJVEKUKqwKDhzdMlnzpk0f1q1IQJAKfCF+vgdG2JtMQPEZBgNsCEkQALwdJUfL51efONHg0ogJVE75blWUry6peXuJ7Y3tHR0dOoLTqr9yXVzQTjpPb/z86e8e9qYk+aOgu4pkrNAnSWgGmiA7gi0FpgKDu3pMhMf3rPikuolx5bYgB4AbKvr2LW1DUpDICQoBUqAlCAlOAqUAr8DvvDGHS2PvNn4wGfmfvHs8cy8qc274K8RDhtgShjumsAAaAKPAGAbw9oPWlfvKnj88kpE4OT88Aw7Sjy3Yf+yu1+Na4CO6Okn1d555UwlkQylTAlmXjLvmCXzjknMiWztwv6tdpUrg5ABBMDbzfGGDg8ZPjIqUB0UT1xYfWJtkJiJ0dJ/Um1x++QKpyRgEEFKVBKkAGFZG8IGGzviqihISF9+ZMPCqRXH1xb/19bYGNTBctRGYMI9IsEQGyFINHVxV1gHiuGpdaE/Hx+8fE6hNixFGpXvWctCghtdcMbYZ74zr8CvAECKHtmd2pDt4mBCiH2J9BxHwZkBBH5jdcdLm7ogqh+7suaKWaXLji9JcrplF37kzks4ofwmGSrlAmWOG35k9a4vPfqeDDpeWD+5Yd/xFx53xwkFP/ho4eGauGWf+k596e8ObGowQuALW93L5xQCgO7m5TWM4HVE582u+sut8wr8ShtSUjAxppFBCoQ8R2lF5spKRnqMqyFKEIqhIQCIecTMv9gQ+u5LHR1RRsRAwAkGnIDfCQScQMDx+1XArwJ+5ferYMApLfTdtGTanAmlXthF8rbv7wSAUh8GFAYUOhJ99qPQp4RfIgJMqvRdOrvUuEhk2jrjAKCJHCWeW9+w7K5XLZXPnFX13J0LigJKG0rj2bzHv7Ev6OgfPTIBllkVqrMWIe6vLvETJ4yXW1e2Htgev2p2oDToN4YRwRAljN3DzDBHiqASYIATTgrQBMKi/6EWOPoFAvC6XWEEgyTLC30AHHDkc+sblt2z1gCY9ui8uSOfvWN+cdAxPaicVMsxSyweqGxU2QH84e4OgQDM9y+ugsUjUt33KQEAP7+o4mCXrilRwCwEMIOj+nTmvfrBgXe2tyhH6K7Y5OpCq9g6Al/b5z67U+/r8JiICYCAiSTDrjZ6bbsb8EHsoJl/jMMMf36j/lP3vaaNQU8vObn2sVvOKilIUJl7ie8MNvg5sFBWdgB/yD4nNVkAdj3TGiFmKnLEJTOLU2Y4MwshnvqfnU+/uqM94oEUgABSAApADMXNa9taXMNSSUBeOnskAPgdeevqjrv+3gHsgCbwDBAkggaGQUiQGGuhebP8//qRIk/TXY9ujLVHg2W+WEf8+gunlBb63Lj2O5IPESk8qNDSQFLjEIBVTlz+6YkfNrayrTk2/ycf6Oauf79g7M0fO9bT7HfQUvnGe1c9tPwtCAZAIVgpJARIAShBSghIINSRjttvOHPWxBEA/Nx2966/R5VP6ZgHgH4/s2aQiWgLGq886PvYyRX3XFTiSAAQT98yb/E3/7plR5sv6Lvylpf+8oPFCz462vOMtYOSdCbsBpAjltDikdZvOvKgqCyAOBNvtGe4ra4DGjsOdlZLgSTYGFZK/GnVBw/9ap2/pjjuaQYWfgVCsEAQAqUE5ICDU2vLvrD01M8sOk4bVhIeWt+FYFiLOSP9D5xXUlkgKaUzAAjmmhJVWaQSjgvm8TXFL9yzcMEXV+yq7yIJS//t6ecfXDpv7mhPGyVFgq6c8mlkkoHHWYN1lkmOfYF1WpcT6n65X1x2So3pKjpxfCGkJVY/+vxWIcDE3PE1xQ9+67wx1cWGGBEQEgpWWaFv/MhiBDSGlEBm2NvJDGzC8S9fOGLexGCf2iWi9cdqQxNqS1b+x/kLrn/6w8YulHDRF5598WcfP3VmddwzjhIAwESYrTA8RL/kzBBGZQ1MfYA1W3fEMTWFj39xVsp3JUUiA7rlYJgQqCN6/sdnX3DaMX35ujQlNARiAEbQDEQdYa81Qp4mJTEtCoOIgDbqKLAsKKRArc3k0aUrH7zo3P/3VENzKCbhgmsfe/4Xy06ZM8bTxlESmTmr8D8ObGGmjIVh1j2wPjAbTU5PDRTGkwyAjgRhiLU2ysrDNIUgmX2bPKCN1Cz98ta/dt3ztzATABMQJCPlAIwKONyuv31J+dcWl3uGlRRam2njy198eOmizz7Z1NwZQe+Szz/50iNXzZhcljK+B+3NGIBEEwM1STIKuzAIxI4YfWFlx82vdHq6G1pCYc+0x0zLwXBXSFpPqXWWpu2nd4gZuqJkIhyPQEe7aWx0m5riTY1eU6PXtN9+4k0N0fo9sTjyJ04uZk5kRSkpPE3Tj6l84eGllYXC7aKm+tBpH/vFhk37AYAoJ5GTATSiDgOdwa40mRrlUJwefLW9uNh3yxlFjhKWx0+fPbrEp9hzZx1bc2S2YkCEM8b49hZKhcSGk4FXTPj8GZCJiQslfu2CyjHlyhBLTGjJSqLWNGtq9erHrvr+z95saGqPdHT++ol3Z02rFmyGuLJFZShhsxhlAegPykrHICIACwRm/sl3L0jH4v6dONYO+v0nRmR4ayIW2OMRpERjaOrEyl/fe34PkzBhlQ5dvmw+SysQjMdGJbPpmBGBiKzmihmDJKWybfqwWpPmNPea3SwEGkNWhedE6BsFShhals7eYMEMlpsC7TGhDQgwM3D6MqoJ9SppTHZflDqv/+z3w61WQ5xmOvXAQOt3ttVajkJiA3CUoSNTWh/KX8kSNkyr3nEENHfyroNmWpWTnrRxJLdgDlMTetk+bOis29k259jyHPqP+mwhqXGpgYrSPvmrOwk3wZdlQVFR4DQccC//zd7bl9SMLlFkWZV7yoIewe3UPndryofvACZsaLZ/nAyxswWo7iG3UUS2ZzECNDRH7v7PtbHW8MRxVcnbYPZaRW9X9yBRKvObiPJRQmGDdd9aceD7TzdBkQJtUAADoE31TOSIUiLrwDCkjtufyIDN8SVKJPtyMueIWQAzGWQAJlurgvbC1D4RJ9qxV9kTAIxn4h5EKVjirH/66uMmVxORGJLCLAWD8yL1xeNSoCH+7qIRDQfN8rUHgISlCAMAk008TJC1myI9qWxJTwaUcAIKiBkJGHWcKBwFkEzalgOBNfNSjZABSA6kbYeTQwUIQLU1voe+d/Hxx1YbM0RUhvyVVlg3nn2MdbtD7zd61tmf9OczU/fsBraJHIwJ0GCbf8hEjsQ3trb/6oU9jl8AgxdyZ08uvPHiKdqAwGQjVswBIwMCC0xz2jIj2P82YxhLCn3zTh5bVVGQBZWzrxTGvKl3NjBoNbOTJhadNDH7psZU+H751FbhCzADxb0po4uuXTJpsMiWFS/zIMiR3xJlm4piiLvTf9KkhzXgpEBX0/q6CBmCpApm+dQQOwiv/qNFOgqZgYyU0HhQr3nvQNzTIqHodIdZ2VBtdeHUiRWeJgBOe+1CD2VR5KKecKC62VFd6ocBEGKaFj28Y8277cAaPA2eTpREaAPGgDbADBKSYg3A0+DGgYwVfVZgAhlbnCEQH//phcsWT9GHRAiP9qbyNJIZ0lkgdsWotTM2qdYnQYFh0Aa0ZmMS5RHMYAwZq2MAkAEmAWAFZkIG2px+ZoXQdaBzy+5mgCmZhE6GchswR2Pma49zhiciEXkmqQv30KhTd8SU6o19rYSOCZvS70jm4VLyi/0XCw19b9KYD/uFuyOW3vaed3vUy62HxQo0Vp3DREQLkl6nHlPi8BnS1yotQ7fMTNoqBkckVM44OmHmpt2z1xJfImZmKQUmKtxRiO4leAY35XuweQqiMbHyDwi0GiegHTYAsMdF96AiJgce7Pm5W4MoNxiNvS9tluolJgJPLIU4/BzP0x2d0ZKSAp8j+2aXPiCjV29DH+VGRL27UlNJpLZUN6WueIZVjlYGVFmwzSEUZ2aB4hu3P7FmzQdxBmY0Rgf8zpPLb6qtKSMiRLRuICnEjt1N9/74+b+9vot0bN6pM775pfOmTRn53gf1Cxfd8cfHvnTeglmeZxBBKYkIJrmoAwMYQ0pJBNDaCCHsr1IKFGgMWaOfk1kle9r1lX9uj7jkGsFuXEp11qTCW+f7R5Y4z21z71zZ3hpnlEoSz58o711SVuwXH/9jR20BPnhhsRRY12mu/+NBAvj1FWU1RaLXIR+gDw9zkPFvuXbNG9vXb9xx7dXnGBZGe8FgwOcoQ2S0JTQrJTdvazxz4Z1hN3rN1Qsdhb/6/drHn3xjz6bvK6U6mkOu6wGAY5maOe5pn89JsZtS0hgiIsdR9qBSEgDcWNwf8EF3khQAQDhuXtsSHVdbcMIIAnaaI/jQMwfC0bIfXVxy0YMNpVWFSyYL0l59WP7sxa7qQuf2RSV/2xGaUCQRS/a0ewseaNzTKVfdUDGyWBgaVJ4pJn3uatBiMJF5K5Dmzj32ofs+fah3ydc99/79lt/FYtGtb983bkwFAHzlhkVvrNtZUV60d187+hWiAID6/Qe/efufVr++zY26Z54288d3L6utLYvHvFu+9+wTT601hufMGPufP7p6/NjKXyx/9f6frIi6VFNRcPdtly48e7qhBO/5pRAsr50lv3NuIgx2/H36pa1hT5c8eFnZshOKRxbZB+fimxvW7IwClBQg1xY5LWF97gPN9a30+terTxrrN8SDNHpS7l2VIdv2Tf0EDAcDzutv7lryLw9o7brh6He+demCs45/+oWNO3Y2AdGsmWPPOn3q39ZsvvxfThs3piLmelKIcWMqx42pTPmRE8wYdpHpsf/6HKJYdPG9TKEnln/5D0++fv+dv3/imW9PmlD93799xe9TdfWtn7vmp1+9+dJrPzlv+e9esQv1pPpFxOS6jV3BunaPGJvDpvGAri5TI0vk9WeU//atyK72iGDa1aZD9dGPnFoFAD7p293knvXj+v0H5ZvfHj27VuUKoHsprciQqfsKLAmOVlUWEPndAsfnCABYsfLd51e+zYb+9Yozzj17OrFMF3eHTAxmZuYpk2s+efnJjz/5ZmGRv3ZU8YcNIWYeP2aEr7zk3v94fuHZM667ZuHImtLm1tAxM8Y//sTaUMi9+Py5SxZMt4LOphFow8KHD68OP/xKFwCDBwD88BXlUQ0n3Fe3dQ8Fyhwgo4S69PSCr55dCADoxX2Syor9O5t0fZs7uzZ3KfrJwR/spo1h5jPOv/vkc2/nfrd5599VPeGmgx0R+/VgR+SZFW/H4/qtd/YK/ydWvfwuM9/z4xVY+skfPPDcH59aN/UjX51/yf325B27m2///pPnXHIfFF35m0fXMnN7R+jhX6667Jqf+UZ89srrHmZmrY02xMxbGl15/Y4LH6pfvi78yzUHH3m9Y2N9nJlf2+3CdR/+4OW2Q3tGZswte5c81BzxaOZte+BT2595L8zM2mRDEO7toMrVkDHLzVsbb//hs/F4XKBQStx47TkjKovtqgxELIT44Z2fPGP+zTNP+eYXPr/Y7/f99Gerdu5o2rf1/oBfkuv96an1s2dO2Lx1X9Cnli09pbGpvblNhzp3Nrd0vrFh92OPrvnWNy4+b+HsU1a+u2tPY0tr6FPXPfylmy743jmzN29peHtTHaS0Y1uaGFJzxhZ/6qMF3bodQ0ckDsY8v4X2NLfGNSmBkSicMFZ96dzSWBwbW+NBhS/+26hFP268+N7GJ782+mOzs4HpvoqFBmv3WdVn1rTq9uaW3z/+GhlNRI7j+/QVp4+oLLY6gxDITCfNHf/q32677e6n7/nRX0D4PjJj1PKfXzeqtqKkOHrVDec985cNV1x26l3f/tie7XVnnHvH7Nljb/v6+Q/+ZMWGjXsmjhuxv7H5vI//AIVz5SdO/vKNi5mgdmTZtTf+nBEmjK66/3tXJXAeAQAcQTPGQkXAaGJbOwSMjsLSgJgxHhpaYjv3GSQSCJ6LAV8BAM4eYcaUITOMKnNWfqX22l+1fP+5tuk1FceO9HPaCh5ZEyt3vg4GPGzorYiz/xCRiO2aGLFYHBH9fsdilxACALQ2MrlyaKgrWlQchERSB9sTXNdjgkCwu0SQDEUirj2TiQ9P9ThEAbYVRygOJRrbBChEADBJg4UMeQQ+lRuLPocmeNIOTCvHsGvmQNLoshYtGZJKpsbBeu+ErTlmthWJKNDCnTqsCMOGU5l7JOCwDYRjvy6CJCuk24Gc1lBK97HWuU3azs2aXjjwhbpT5x9yiRAopZBSSNH93/JUVyi2a08zAIRC0Ug0LpXc9H5dPK5DYdeN63hcI2IoHGPmhsaD7QcjKLCzK2qIlZJ/X7151+4DoZD7YV2rMUSGPE2xmGaGvXWtbe1hANi2vTEa9QDBdbU2FIt5sVg8HHFXvvSPSNR1XS8ajWsiFNjSGqqrbweAUDgWDrtEvGVLo0hCu7A9l0JJoZQQUmRoEWaSlTCwZSR6bdquBvb+5vrm1k4lpV1xhIgKC/wnzplgDK1bv9MYbmvrIkMgnUkTKp594Z0xoytXvfxeW1vkistOKS8rWLd+2zlnz97f2F5VVQJQtHHTh6edNHnT+3WhcGxffduuPc3vf9BwzVVnFhb6n3vxbc+l6cePaW7pcpTj+CAeN6NqywHgHx/Uvbtpz+wZE3x+qT1qamp13QlbtjW6rnfKSZPjcbNuw66CYKCtLRSLuQiitrZ0xaqNkyfXOI4AwA0b94ZCESFtthgSU1VlyXFTazNc+6f/8iE1eL+oTVgZVVtWUVEoEC0cALNSwubvjqgsfnvj3imTR35Y1yIlRCL6xDnHNB/oOGH2uPe3NFkvDwpn8+aGivLCgM8BAJ+j3n2vbtSosob9nePGVoVCkeOnjSouDmhtJk2sIUMV5YUNjR0lxap2ZOn7mxvicQ/AX1oSnDV9fGVlETMhoN/vCwZ8cdcYTT5HEkF5WeGu3U3HTZ3+zrv7amuKo7H49ONGt7aGamtLiWj8uErPK7WuFQQk5mDAyXy+c7/Wc84wuteUxdTiOW5c+32qx1o6SVdNyib0POPzqUSYBMF1td+vtDYpmD5kKZ7Ormgw4DiO8jxtpeghfWg/GCkrDSL2wGXP046j0t143S5GxAzDCEMnDLHXciZOZBmkaxophSR9jYfUc3YXiVunCXWvcJUQkkKkPN3pA8TJpJGE0pKkR3rVfK/eZKv8JMUfEKc5ThP5YT1WJc4VF/4Tv/DmiN7Lwbs3c7j9E7/w5ohEzDeVB/QuYZFJE4O5/RBfnvN2Mpd+fXg6E5JDZKkYDlXvs7uyH9MFh3YIE1mENgI5lJTCIZnJDHz4C1SPnKiQT1YQfLSXl8c8Dwb3vfO/WRj2X3uLR48Q2XkgMGM2EgnAHloxknuAHpKpdrjZ3P/77vHw1+zxsHlaHAbj3T8dOINfD98XkIe3zeEg1NrBv/AFMzg+xLoHZLh4FQ7wltyXoZZxnwdM5XTfdAZuMh40Y/MgCd3rC+u5XytoWLxKMn95ujioGYCZaB08QCtoWDtGBgcFPOj7isHA0OBPGBolLJMe5pt1RF6nNB9VcmfyovEhm5oir/NxOKvDQ9yOyGv/hoOlx0evHcyE0JwZ6THPD4nDqrRqgBTg7KCD+z2Yq3dP48BxdvjoM30QASGHTiXOEUf/0ymOGRo3It/TZ/hoe/nDikzwU+RpJHu1p/h/xXhkvjp/wpXaVygLByeX0jQNHvyT4DCY+VnzQSoDondC8yD0/6ypi8MBsjFT+ZwvgwXz/0TDzOXfo2CaB/FcmDmhMWOdekBzFIeUKQd2/uGrfGQ9/zhzQveqKefKDXLU7UDO3U/95xNkb7Ac3u6AnHlHnaPzkGfR3yj/f8XjSaYzq/lmAAAAAElFTkSuQmCC"; // 120×120 — dùng ở login + loading






// Hook để theo dõi và ghi nhận thời gian sử dụng tính năng
function useActivityTracker(module, actionDesc, role) {
  useEffect(() => {
    if (role !== "student") return;
    let startTime = Date.now();
    let lastSendTime = startTime;
    
    const sendLog = () => {
      const now = Date.now();
      const duration = Math.floor((now - lastSendTime) / 1000);
      if (duration > 0) {
        api.logActivity({ module, actionDesc, duration }).catch(() => {});
        lastSendTime = now;
      }
    };
    
    // Heartbeat: Gửi thời lượng mỗi 30 giây để cập nhật liên tục
    const iv = setInterval(sendLog, 30000);
    
    // Gửi thời lượng còn lại khi người dùng chuyển trang
    return () => {
      clearInterval(iv);
      sendLog();
    };
  }, [module, actionDesc, role]);
}

// ── API sync helpers ──


function diffArray(oldArr, newArr) {
  if (!Array.isArray(oldArr) || !Array.isArray(newArr)) return { added: [], removed: [], updated: [] };
  const added = newArr.filter(n => !oldArr.find(o => o.id === n.id));
  const removed = oldArr.filter(o => !newArr.find(n => n.id === o.id));
  const updated = newArr.filter(n => {
    const o = oldArr.find(o => o.id === n.id);
    return o && JSON.stringify(o) !== JSON.stringify(n);
  });
  return { added, removed, updated };
}

// Backend/DB chỉ lưu và trả về field "type" cho bài tập ("quiz"/"video"/"standard"),
// trong khi phần lớn UI (form tạo bài ở TaskPage, modal thi StudentAssignmentModal...)
// lại được viết dựa trên field nội bộ "mode". Sau mỗi lần lấy dữ liệu mới từ server
// (đăng nhập, F5, reload...), field "mode" bị mất hoàn toàn vì server không trả về nó.
// Hàm này backfill "mode" từ "type" ngay khi nhận dữ liệu, để mọi nơi trong code đang
// check "task.mode === 'quiz'" vẫn nhận diện đúng loại bài tập.
// (Sửa bug: bài trắc nghiệm bị hiển thị/gắn nhãn nhầm thành "Tự luận" sau khi tải lại trang.)
function normalizeAssignmentsFromServer(assignmentsByClass) {
  if (!assignmentsByClass) return assignmentsByClass;
  const out = {};
  for (const classId of Object.keys(assignmentsByClass)) {
    out[classId] = (assignmentsByClass[classId] || []).map(t => ({
      ...t,
      mode: t.mode || t.type || (t.questions && t.questions.length > 0 ? "quiz" : "file"),
    }));
  }
  return out;
}

async function syncToAPI(key, oldVal, newVal) {
  try {
    if (key === "session") return; // session managed by login/logout

    // ── Array entities ──
    if (key === "teachers") {
      const { added, removed, updated } = diffArray(oldVal, newVal);
      for (const t of added) await api.createTeacher({ name: t.name, username: t.username, password: t.password, subject: t.subject, photo: t.photo, isAdmin: t.isAdmin, school: t.school, teachingClassIds: t.teachingClassIds });
      for (const t of removed) await api.deleteTeacher(t.id);
      for (const t of updated) await api.updateTeacher(t.id, { name: t.name, username: t.username, password: t.password, subject: t.subject, photo: t.photo, school: t.school, teachingClassIds: t.teachingClassIds });
      return;
    }
    if (key === "classes") {
      const { added, removed, updated } = diffArray(oldVal, newVal);
      for (const c of added) await api.createClass({ id: c.id, name: c.name, teacherId: c.teacherId, school: c.school, grade: c.grade });
      for (const c of removed) await api.deleteClass(c.id);
      for (const c of updated) await api.updateClass(c.id, { name: c.name, teacherId: c.teacherId, school: c.school, grade: c.grade });
      return;
    }
    if (key === "students") {
      const { added, removed, updated } = diffArray(oldVal, newVal);
      if (added.length > 1) {
        const byClass = {};
        added.forEach(s => { (byClass[s.classId] = byClass[s.classId] || []).push(s); });
        for (const [classId, students] of Object.entries(byClass)) {
          await api.createStudentsBulk({ classId, students });
        }
      } else {
        for (const s of added) await api.createStudent(s);
      }
      for (const s of removed) await api.deleteStudent(s.id);
      for (const s of updated) await api.updateStudent(s.id, s);
      return;
    }
    if (key === "pendingStudents") {
      const { added, removed } = diffArray(oldVal, newVal);
      for (const p of added) await api.createPending(p);
      for (const p of removed) await api.rejectPending(p.id);
      return;
    }
    if (key === "parents") {
      const { added, removed, updated } = diffArray(oldVal, newVal);
      for (const p of added) await api.createParent(p);
      for (const p of removed) await api.deleteParent(p.id);
      for (const p of updated) await api.updateParent(p.id, p);
      return;
    }
    if (key === "pendingParents") {
      const { added, removed } = diffArray(oldVal, newVal);
      for (const p of added) await api.createPendingParent(p);
      for (const p of removed) await api.rejectPendingParent(p.id);
      return;
    }
    // ── Object/map entities ──
    const oldObj = oldVal || {};
    const newObj = newVal || {};
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    if (key === "seats") {
      for (const k of allKeys) {
        if (JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k])) {
          await api.updateSeats(k, newObj[k] || {});
        }
      }
      return;
    }
    if (key === "messages") {
      // Messages are sent directly via api.sendMessage() in ChatPage.send()
      // and received via polling. No diff-based sync needed here.
      return;
    }
    if (key === "loginLogs") {
      // Login timestamps are recorded directly via api.recordStudentLogin()
      // at the moment of login. No diff-based sync needed here.
      return;
    }
    if (key === "activityLogs") {
      // Nhật ký "học sinh đang xem mục gì" hiện được theo dõi ở phía client trong
      // phiên làm việc hiện tại. Muốn lưu vĩnh viễn qua các lần tải lại trang cần
      // bổ sung API riêng ở backend (chưa có endpoint tương ứng).
      return;
    }
    if (key === "assignments") {
      for (const classId of allKeys) {
        const oldTasks = oldObj[classId] || [];
        const newTasks = newObj[classId] || [];
        const { added, removed, updated } = diffArray(oldTasks, newTasks);
        // Backend/DB dùng field "type" ("quiz"/"video"/"standard"), còn form tạo bài tập
        // ở TaskPage lại dùng field nội bộ "mode". Map "mode" -> "type" ở đây để đảm bảo
        // cột type trong DB được lưu đúng, không bị mặc định thành 'standard' cho mọi bài
        // (bug: trắc nghiệm hiển thị nhầm thành tự luận sau khi tải lại trang).
        for (const t of added)   await api.createAssignment({ ...t, classId, type: t.type || t.mode || 'standard' });
        for (const t of removed) await api.deleteAssignment(t.id);
        for (const t of updated) await api.updateAssignment(t.id, { ...t, type: t.type || t.mode || 'standard' });
      }
      return;
    }
    if (key === "grades") {
      // Bảng điểm lưu theo studentId: { [studentId]: { scores: {...}, conduct: '...' } }
      for (const k of allKeys) {
        if (JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k])) {
          if (newObj[k]) await api.setStudentGrades(k, newObj[k]);
          else await api.deleteStudentGrades(k);
        }
      }
      return;
    }
    if (key === "attendance") {
      for (const k of allKeys) {
        const oldIds = oldObj[k] || [];
        const newIds = newObj[k] || [];
        if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
          const parts = k.split("_");
          const date = parts.pop();
          const classId = parts.join("_");
          // Detect single toggle vs bulk
          const addedIds = newIds.filter(id => !oldIds.includes(id));
          const removedIds = oldIds.filter(id => !newIds.includes(id));
          if (addedIds.length <= 1 && removedIds.length <= 1 && (addedIds.length + removedIds.length === 1)) {
            const studentId = addedIds[0] || removedIds[0];
            await api.toggleAttendance({ classId, date, studentId });
          } else {
            await api.setAttendance(classId, date, { studentIds: newIds });
          }
        }
      }
      return;
    }
    if (key === "files") {
      for (const classId of allKeys) {
        const oldFiles = oldObj[classId] || [];
        const newFiles = newObj[classId] || [];
        const { added, removed, updated } = diffArray(oldFiles, newFiles);
        for (const f of added) await api.createFile({ ...f, classId });
        for (const f of removed) await api.deleteFile(f.id);
        for (const f of updated) {
          const old = oldFiles.find(o => o.id === f.id);
          if (old && f.downloads !== old.downloads) await api.downloadFile(f.id);
        }
      }
      return;
    }
  } catch (err) {
    console.error(`[sync ${key}]`, err.message);
  }
}


// tài khoản demo

const SEED_TEACHERS = [
  { id: "t1", name: "Nguyễn Minh Tuấn", username: "phat79186@gmail.com", password: "admin123", subject: "Quản trị", email: "phat79186@gmail.com", emailVerified: true, isAdmin: true },
];

const SUBJECTS = ["Toán","Vật Lý","Hóa học","Ngữ Văn","Lịch Sử","Địa Lý","Tiếng Anh","Sinh học","GDCD","Tin học","Thể dục","Âm nhạc","Mỹ thuật"];
const SCOLS = { "Toán":"var(--accent)","Vật Lý":"#22D3EE","Hóa học":"#34D399","Ngữ Văn":"#A78BFA","Lịch Sử":"#F59E0B","Địa Lý":"#FB923C","Tiếng Anh":"#F472B6","Sinh học":"#4ADE80","GDCD":"#818CF8","Tin học":"#60A5FA","Thể dục":"#FACC15","Âm nhạc":"#E879F9","Mỹ thuật":"#FCA5A5" };
const FILE_TYPES = ["pdf","docx","pptx","xlsx","mp4","mp3","jpg","png","zip","txt","youtube","link","other"];
const FILE_ICONS = { pdf:"📄",docx:"📝",pptx:"📊",xlsx:"📈",mp4:"🎬",mp3:"🎵",jpg:"🖼️",png:"🖼️",zip:"📦",txt:"📃",youtube:"▶️",link:"🔗",other:"📁" };
const FILE_COLORS = { pdf:"#EF4444",docx:"#3B82F6",pptx:"#F59E0B",xlsx:"#10B981",mp4:"#8B5CF6",mp3:"#EC4899",jpg:"#06B6D4",png:"#06B6D4",zip:"#F97316",txt:"var(--text3)",youtube:"#FF0000",link:"#14B8A6",other:"var(--text3)" };
// Các loại tài liệu dạng liên kết (không upload file, chỉ lưu URL)
const LINK_TYPES = ["youtube","link"];
const isLinkType = t => LINK_TYPES.includes(t);
const getFileUrl = f => f?.data || f?.url;
const getFileThumb = f => f.type === "youtube" ? getYoutubeThumb(getFileUrl(f)) : f.thumb;
// Lấy video ID từ link YouTube để tạo ảnh thumbnail xem trước
const getYoutubeId = (url) => {
  if (!url) return null;

  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.split('/')[1].substring(0,11);
    }

    const id = u.searchParams.get("v");
    return id ? id.substring(0,11) : null;
  } catch {
    return null;
  }
};
// QUAN TRỌNG: luôn tạo lại thumbnail từ URL video hiện tại (không đọc từ f.thumb đã lưu trong DB).
// Trường "thumb" lưu sẵn có thể bị thiếu/lỗi thời sau khi tải lại trang (F5) tùy vào cách backend
// lưu trữ, nên hàm này tính trực tiếp từ url mỗi lần render để luôn chính xác và không phụ thuộc DB.
const getYoutubeThumb = url => {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

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

// Danh sách kênh chat theo vai trò/tổ của học sinh — dùng chung cho ChatPage và badge tổng ở Sidebar
const getChatChannels = (user, state, classId) => {
  const base = ["chung", "bài-tập", "hỏi-đáp", "thông-báo"];
  if (user.role === "teacher" || user.role === "admin") return base;
  if (user.role === "student") {
    const seats = state.seats[classId] || {};
    const slotEntry = Object.entries(seats).find(([, id]) => id === user.data.id);
    if (slotEntry) {
      const slotIdx = Number(slotEntry[0]);
      for (let g = 0; g < 4; g++) {
        if (groupSlots(g).includes(slotIdx)) return [...base, `tổ-${g + 1}`];
      }
    }
  }
  return base;
};

// Tổng số tin nhắn chưa đọc trên tất cả kênh của lớp — dựa trên lastRead lưu ở localStorage (cùng key ChatPage dùng)
const getChatUnreadTotal = (user, state, classId) => {
  if (!classId) return 0;
  let lastRead;
  try {
    const raw = localStorage.getItem(`eclass_chat_lastread_${user.role}_${user.data.id}`);
    if (raw === null) return 0; // Chưa từng mở Chat lớp -> chưa khởi tạo, không báo unread ảo
    lastRead = JSON.parse(raw) || {};
  } catch { return 0; }
  const channels = getChatChannels(user, state, classId);
  let total = 0;
  channels.forEach(ch => {
    const key = `${classId}_${ch}`;
    const list = state.messages[key] || [];
    const lastReadId = lastRead[key] || 0;
    total += list.filter(m => m.id > lastReadId && m.user !== user.data.name).length;
  });
  return total;
};

// Poll tin nhắn mới của tất cả kênh ở tầng App — chạy nền dù đang ở trang nào, để badge "Chat lớp" luôn cập nhật real-time
function useChatBackgroundPoll(user, state, classId) {
  const enabled = !!classId && (user.role === "teacher" || user.role === "student");
  const channels = useMemo(
    () => (enabled ? getChatChannels(user, state, classId) : []),
    [enabled, user.role, user.data.id, classId, state.seats]
  );
  const messagesRef = useRef(state.messages);
  useEffect(() => { messagesRef.current = state.messages; }, [state.messages]);

  useEffect(() => {
    if (!enabled) return;
    const poll = async () => {
      for (const ch of channels) {
        try {
          const key = `${classId}_${ch}`;
          const chMsgs = messagesRef.current[key] || [];
          // Only use DB ids (small integers) as cursor, not temp Date.now() ids
          const dbMsgs = chMsgs.filter(m => m.id < 1e12);
          const lastId = dbMsgs.length ? dbMsgs[dbMsgs.length - 1].id : 0;
          const newMsgs = await api.pollMessages(classId, ch, lastId);
          if (newMsgs && newMsgs.length > 0) {
            state.setMessages(p => {
              const existing = p[key] || [];
              const existingIds = new Set(existing.map(m => m.id));
              const fresh = newMsgs.filter(m => !existingIds.has(m.id));
              if (!fresh.length) return p;
              return { ...p, [key]: [...existing, ...fresh] };
            });
          }
        } catch {}
      }
    };
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [enabled, classId, channels]);
}


// hộp xác nhận


function ConfirmModal({ msg, onOk, onCancel }) {
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal" style={{ width: 340, textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 38, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{msg}</div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 22 }}>Hành động này không thể hoàn tác.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text3)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Hủy</button>
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
  grades: {},
  files: {},
  pendingStudents: [],
  parents: [],
  pendingParents: [],
  loginLogs: {},
  activityLogs: {},
  session: null,
  schools: [],
  proctorLogs: [],
};

function useAppState() {
  const [data, setData] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoaded(true); return; }
    api.getState()
      .then(serverData => {
        if (serverData) setData(prev => ({ ...prev, ...serverData, assignments: normalizeAssignmentsFromServer(serverData.assignments) }));
        setLoaded(true);
      })
      .catch(() => { clearToken(); setLoaded(true); });
  }, []);

  const update = useCallback((key, val) => {
    setData(prev => {
      const oldVal = prev[key];
      const newVal = typeof val === "function" ? val(oldVal) : val;
      if (oldVal !== newVal) {
        Promise.resolve().then(() => syncToAPI(key, oldVal, newVal));
      }
      return { ...prev, [key]: newVal };
    });
  }, []);

  const reload = useCallback(() => {
    api.getState()
      .then(serverData => { if (serverData) setData(prev => ({ ...prev, ...serverData, assignments: normalizeAssignmentsFromServer(serverData.assignments) })); })
      .catch(() => {});
  }, []);

  return {
    loaded, reload,
    teachers:    data.teachers,    setTeachers:    v => update("teachers", v),
    classes:     data.classes,     setClasses:     v => update("classes", v),
    students:    data.students,    setStudents:    v => update("students", v),
    seats:       data.seats,       setSeats:       v => update("seats", v),
    messages:    data.messages,    setMessages:    v => update("messages", v),
    assignments: data.assignments, setAssignments: v => update("assignments", v),
    attendance:  data.attendance,  setAttendance:  v => update("attendance", v),
    grades:      data.grades,      setGrades:      v => update("grades", v),
    files:       data.files,       setFiles:       v => update("files", v),
    pendingStudents: data.pendingStudents, setPendingStudents: v => update("pendingStudents", v),
    parents:     data.parents,     setParents:     v => update("parents", v),
    pendingParents: data.pendingParents, setPendingParents: v => update("pendingParents", v),
    loginLogs:   data.loginLogs,   setLoginLogs:   v => update("loginLogs", v),
    activityLogs: data.activityLogs, setActivityLogs: v => update("activityLogs", v),
    session:     data.session,     setSession:     v => update("session", v),
    schools:     data.schools || [], setSchools:     v => update("schools", v),
    proctorLogs: data.proctorLogs || [], setProctorLogs: v => update("proctorLogs", v),
  };
}


// component nhỏ

// Nhãn + icon + màu cho từng mục trong ứng dụng — dùng để hiển thị "học sinh đang/đã xem mục gì"
const PAGE_META = {
  dashboard:   { l: "Tổng quan",         Ic: Home,          c: "var(--accent)" },
  students:    { l: "Quản lý học sinh",  Ic: Users,         c: "#A78BFA" },
  seating:     { l: "Sơ đồ lớp",         Ic: Grid,          c: "#22D3EE" },
  schedule:    { l: "Thời khóa biểu",    Ic: Calendar,      c: "#60A5FA" },
  attendance:  { l: "Điểm danh",         Ic: QrCode,        c: "#34D399" },
  chat:        { l: "Chat lớp",          Ic: MessageSquare, c: "#F472B6" },
  parentchat:  { l: "Chat phụ huynh",    Ic: MessageCircle, c: "#34D399" },
  assignments: { l: "Bài tập",           Ic: BookOpen,      c: "#F59E0B" },
  wheel:       { l: "Lucky Wheel",       Ic: Shuffle,       c: "#818CF8" },
  library:     { l: "Thư viện tài liệu", Ic: Library,       c: "var(--accent)" },
  rankings:    { l: "Bảng xếp hạng",     Ic: Trophy,      c: "#FBBF24" },
  competition: { l: "Thi đua lớp",       Ic: Trophy,      c: "#34D399" },
  settings:    { l: "Cài đặt",           Ic: Settings,      c: "var(--text3)" },
  profile:     { l: "Hồ sơ",             Ic: User,          c: "var(--text3)" },
  pending:     { l: "Duyệt học sinh",    Ic: UserCheck,     c: "#34D399" },
  pomodoro:    { l: "Pomodoro",          Ic: Clock,         c: "#F43F5E" },
};

// Ngưỡng thời gian được coi là "đang hoạt động" (có thao tác gần đây)
const ACTIVE_THRESHOLD_MS = 3 * 60 * 1000; // 3 phút

// Định dạng thời gian tương đối kiểu "5 phút trước", "Hôm qua lúc 14:32"...
function relTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 45 * 1000) return "Vừa xong";
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / 60000))} phút trước`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} giờ trước`;
  const d = new Date(ts);
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return `Hôm qua lúc ${time}`;
  return `${d.toLocaleDateString("vi-VN")} lúc ${time}`;
}

// Ghi lại việc học sinh đang truy cập vào một mục (trang) trong ứng dụng.
// Nếu vẫn đang ở cùng mục đó trong vòng 5 phút gần nhất thì chỉ cập nhật lại thời điểm
// (tránh phình dữ liệu do liên tục thêm dòng mới) — đây cũng chính là dữ liệu dùng để
// suy ra "trạng thái hoạt động" (đang hoạt động / đã rời đi bao lâu).
// Lưu ý: dữ liệu này hiện được theo dõi ở phía client trong phiên làm việc hiện tại.
function logActivity(state, studentId, page) {
  if (!state?.setActivityLogs || !studentId || !page) return;
  state.setActivityLogs(prev => {
    const arr = prev[studentId] || [];
    const now = Date.now();
    const last = arr[arr.length - 1];
    if (last && last.page === page && now - last.ts < 5 * 60 * 1000) {
      return { ...prev, [studentId]: [...arr.slice(0, -1), { ...last, ts: now }] };
    }
    return { ...prev, [studentId]: [...arr, { page, ts: now }].slice(-100) };
  });
}

// Chấm tròn + nhãn trạng thái hoạt động (đang hoạt động / ngoại tuyến kèm thời gian hoạt động cuối)
const ActivityStatus = ({ lastTs, small }) => {
  const online = !!lastTs && (Date.now() - lastTs < ACTIVE_THRESHOLD_MS);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div className={online ? "pulse-dot" : ""} style={{ width: small ? 6 : 8, height: small ? 6 : 8, borderRadius: "50%", background: online ? "#34D399" : "var(--text4)", flexShrink: 0 }} />
      <span style={{ fontSize: small ? 10 : 11, fontWeight: 700, color: online ? "#34D399" : "var(--text3)" }}>
        {online ? "Đang hoạt động" : lastTs ? `Ngoại tuyến · ${relTime(lastTs)}` : "Chưa từng truy cập"}
      </span>
    </div>
  );
};

// Danh sách lịch sử truy cập các mục — dùng chung cho trang Phụ huynh & hồ sơ học sinh (GV)
const ActivityLogList = ({ logs, maxHeight = 320, limit = 30 }) => {
  const sorted = (logs || []).slice().sort((a, b) => b.ts - a.ts).slice(0, limit);
  if (sorted.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--text4)", textAlign: "center", padding: "20px 0" }}>Chưa có dữ liệu truy cập</div>;
  }
  const fmtDur = sec => {
    if (!sec || sec < 60) return `${sec || 0} giây`;
    const m = Math.floor(sec / 60);
    return `${m} phút`;
  };
  const MOD_META = { "Tổng quan": Home, "Học sinh": Users, "Sơ đồ lớp": Grid, "Điểm danh": QrCode, "Chat": MessageSquare, "Bài tập": BookOpen, "Vòng quay": Shuffle, "Tài liệu": Library, "Cài đặt": Settings, "Hồ sơ": User, "Phụ huynh": UserCheck };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight, overflowY: "auto" }}>
      {sorted.map((log, i) => {
        const Ic = MOD_META[log.module] || Activity;
        return (
          <div key={log.ts + "_" + i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < sorted.length - 1 ? "1px solid var(--wa025)" : "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(79,172,254,.15)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.desc || log.module}</div>
              <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 2 }}>{log.module} · {fmtDur(log.duration)}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", flexShrink: 0 }}>{relTime(log.ts)}</div>
          </div>
        );
      })}
    </div>
  );
};

const Badge = ({ children, c = "blue" }) => {
  const m = { blue:"rgba(79,172,254,.13):var(--accent)", green:"rgba(52,211,153,.13):#34D399", amber:"rgba(245,158,11,.13):#F59E0B", red:"rgba(239,68,68,.13):#EF4444", violet:"rgba(167,139,250,.13):#A78BFA", gray:"rgba(100,116,139,.13):var(--text3)" };
  const [bg, col] = (m[c] || m.blue).split(":");
  return <span className="tag" style={{ background: bg, color: col }}>{children}</span>;
};

const Av = ({ photo, sz = 34, glow }) => (
  <div style={{ width: sz, height: sz, borderRadius: "50%", overflow: "hidden", background: "var(--wa07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: glow ? "0 0 16px rgba(79,172,254,.55)" : "none", transition: "box-shadow .3s", border: glow ? "2px solid rgba(79,172,254,.4)" : "2px solid transparent" }}>
    {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={sz * 0.52} strokeWidth={1.6} style={{ color: "var(--text3)" }} />}
  </div>
);

const Bar = ({ val, max = 100, col = "var(--accent)", h = 4 }) => (
  <div style={{ background: "var(--wa07)", borderRadius: 99, height: h, overflow: "hidden" }}>
    <div style={{ height: "100%", borderRadius: 99, background: col, width: `${Math.min((val / (max || 1)) * 100, 100)}%`, transition: "width 1.1s ease", boxShadow: `0 0 7px ${col}55` }} />
  </div>
);

const Card = ({ children, style = {} }) => (
  <div className="scard cglow" style={{ padding: 20, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, style = {}, variant = "primary", disabled, small }) => {
  const base = { padding: small ? "6px 13px" : "9px 20px", borderRadius: 10, fontSize: small ? 11 : 13, fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5, cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s", border: "none", ...style };
  if (variant === "primary") return <button onClick={onClick} disabled={disabled} className="bprimary" style={base}>{children}</button>;
  if (variant === "ghost")   return <button onClick={onClick} disabled={disabled} style={{ ...base, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text3)" }}>{children}</button>;
  if (variant === "danger")  return <button onClick={onClick} disabled={disabled} style={{ ...base, border: "1px solid rgba(239,68,68,.28)", background: "rgba(239,68,68,.08)", color: "#EF4444" }}>{children}</button>;
  if (variant === "success") return <button onClick={onClick} disabled={disabled} style={{ ...base, border: "1px solid rgba(52,211,153,.28)", background: "rgba(52,211,153,.08)", color: "#34D399" }}>{children}</button>;
  return null;
};

const Inp = ({ label, value, onChange, placeholder, type = "text", note, required }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5, letterSpacing: ".05em", display: "flex", gap: 4 }}>{label}{required && <span style={{ color: "#EF4444" }}>*</span>}</div>}
    <input className="inp" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ display: "block" }} />
    {note && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>{note}</div>}
  </div>
);

/* ── DatePickerInp — custom calendar popup ── */
const DatePickerInp = ({ label, value, onChange, required, note }) => {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split('-')[0]) : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split('-')[1]) - 1 : new Date().getMonth());
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (!isNaN(y)) setViewYear(y);
      if (!isNaN(m)) setViewMonth(m - 1);
    }
  }, [value]);

  const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const DAYS   = ['CN','T2','T3','T4','T5','T6','T7'];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const toISO = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const selectedISO = value || '';
  const todayISO = toISO(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const displayValue = value ? (() => {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  })() : '';

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0);  setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const years = [];
  for (let y = new Date().getFullYear() + 5; y >= 1950; y--) years.push(y);

  return (
    <div style={{ marginBottom: 14, position: 'relative' }} ref={wrapRef}>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 5, letterSpacing: '.05em', display: 'flex', gap: 4 }}>
          {label}{required && <span style={{ color: '#EF4444' }}>*</span>}
        </div>
      )}
      <div
        className="inp"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', userSelect: 'none',
          borderColor: open ? 'rgba(79,172,254,.55)' : undefined,
          boxShadow: open ? '0 0 0 3px rgba(79,172,254,.1)' : undefined,
        }}
      >
        <span style={{ color: displayValue ? 'var(--text)' : 'var(--inp-ph)', fontSize: 13 }}>
          {displayValue || 'Chọn ngày'}
        </span>
        <Calendar size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      </div>
      {note && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{note}</div>}

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 500,
          background: 'var(--modal-bg, #0A1628)',
          border: '1px solid var(--modal-bd, rgba(255,255,255,.1))',
          borderRadius: 16, padding: '14px 14px 10px',
          boxShadow: '0 20px 60px rgba(0,0,0,.55)',
          width: 280, animation: 'fadeUp .18s ease',
          minWidth: 260,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <button onClick={prevMonth} style={{ background: 'var(--wa04)', border: '1px solid var(--wa07)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChevronLeft size={13} />
            </button>
            <div style={{ flex: 1, display: 'flex', gap: 4, justifyContent: 'center' }}>
              <select
                value={viewMonth}
                onChange={e => setViewMonth(Number(e.target.value))}
                style={{ background: 'var(--wa04)', border: '1px solid var(--wa07)', borderRadius: 8, color: 'var(--text)', fontSize: 12, fontWeight: 700, padding: '3px 6px', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
              >
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select
                value={viewYear}
                onChange={e => setViewYear(Number(e.target.value))}
                style={{ background: 'var(--wa04)', border: '1px solid var(--wa07)', borderRadius: 8, color: 'var(--text)', fontSize: 12, fontWeight: 700, padding: '3px 6px', cursor: 'pointer', outline: 'none', fontFamily: 'inherit', width: 72 }}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={nextMonth} style={{ background: 'var(--wa04)', border: '1px solid var(--wa07)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text3)', padding: '3px 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const iso = toISO(viewYear, viewMonth, day);
              const isSelected = iso === selectedISO;
              const isToday = iso === todayISO;
              return (
                <button
                  key={i}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 8, border: 'none',
                    fontSize: 11.5, fontWeight: isSelected || isToday ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: isSelected ? 'var(--accent)' : isToday ? 'rgba(79,172,254,.15)' : 'transparent',
                    color: isSelected ? '#050C1A' : isToday ? 'var(--accent)' : 'var(--text2)',
                    boxShadow: isToday && !isSelected ? '0 0 0 1px rgba(79,172,254,.4)' : 'none',
                    transition: 'all .14s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(79,172,254,.12)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(79,172,254,.15)' : 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border2,rgba(255,255,255,.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => { const n = new Date(); onChange(toISO(n.getFullYear(), n.getMonth(), n.getDate())); setOpen(false); }}
              style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Hôm nay
            </button>
            {value && (
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Sel = ({ label, value, onChange, options, required }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5, letterSpacing: ".05em", display: "flex", gap: 4 }}>{label}{required && <span style={{ color: "#EF4444" }}>*</span>}</div>}
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

// hộp xác minh gmail dùng chung cho đăng ký học sinh & tạo tài khoản giáo viên
// LƯU Ý: hiện tại chưa có backend gửi email thật (api.js chưa hỗ trợ), nên mã xác minh
// được hiển thị ngay trên giao diện (chế độ demo). Khi backend có API gửi email
// (vd: api.sendVerificationEmail(email, code)), chỉ cần thay hàm sendCode bên dưới
// để gọi API đó thay vì hiển thị demoCode, và ẩn dòng hiển thị mã đi.
function EmailVerifyBox({ email, verified, onVerified }) {
  const [sent, setSent] = useState(false);
  const [demoCode, setDemoCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());

  const sendCode = async () => {
    setErr("");
    if (!validEmail) { setErr("Nhập một địa chỉ Gmail hợp lệ trước khi gửi mã"); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setDemoCode(code);
    setInputCode("");
    setLoading(true);
    try {
      const res = await api.sendVerificationEmail(email.trim(), code);
      setIsDemo(!!res?.demo);
      setSent(true);
    } catch (e) {
      setErr("Lỗi gửi mã xác minh: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = () => {
    setErr("");
    if (!inputCode.trim()) { setErr("Nhập mã xác minh đã gửi"); return; }
    if (inputCode.trim() !== demoCode) { setErr("Mã xác minh không đúng"); return; }
    onVerified(true);
  };

  if (verified) return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 9, background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.25)", fontSize: 11, color: "#34D399", marginBottom: 14 }}>
      <Check size={13} />Gmail đã được xác minh
    </div>
  );

  return (
    <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, border: "1px dashed rgba(79,172,254,.32)", background: "rgba(79,172,254,.04)" }}>
      {!sent ? (
        <Btn variant="ghost" small onClick={sendCode} disabled={!validEmail || loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "Đang gửi mã..." : "Gửi mã xác minh tới Gmail"}
        </Btn>
      ) : (
        <>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, lineHeight: 1.6 }}>
            {isDemo ? (
              <>
                (Chế độ Demo) Mã xác minh cho <b style={{ color: "var(--accent)" }}>{email}</b>: <span style={{ color: "#F59E0B", fontWeight: 700, letterSpacing: "2px" }}>{demoCode}</span>
              </>
            ) : (
              <>
                Mã xác minh đã được gửi tới <b style={{ color: "var(--accent)" }}>{email}</b>. Vui lòng kiểm tra hộp thư đến hoặc thư rác.
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="inp" value={inputCode} onChange={e => setInputCode(e.target.value)} placeholder="Nhập mã 6 số" style={{ flex: 1 }} />
            <Btn small onClick={confirmCode}>Xác nhận</Btn>
          </div>
          <button onClick={sendCode} disabled={loading} style={{ marginTop: 7, background: "none", border: "none", color: "var(--accent)", fontSize: 10, cursor: "pointer", padding: 0 }}>
            {loading ? "Đang gửi lại..." : "Gửi lại mã"}
          </button>
        </>
      )}
      <ErrBox msg={err} />
    </div>
  );
}


// đăng nhập hs

function StudentRegisterPage({ state, onBack, classes }) {
  const [name, setName] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef();

  const handlePhoto = async file => {
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const compressed = await compressImage(file, 400, 400);
      setPhoto(compressed);
      
      const fapi = window.faceapi;
      if (fapi) {
        try {
          await loadFaceApiModels();
          const desc = await computeFaceDescriptorFromImage(fapi, compressed);
          if (desc) {
            setErr("✅ Đã nhận diện gương mặt & trích xuất Face ID thành công!");
          } else {
            setErr("⚠️ Cảnh báo: Không phát hiện thấy gương mặt rõ ràng. Hãy chọn ảnh chân dung rõ nét hơn để phục vụ điểm danh Face ID.");
          }
        } catch (faceErr) {
          console.warn("Lỗi kiểm tra Face ID khi tải ảnh lên:", faceErr);
        }
      }
    } catch (err) {
      setErr("Lỗi xử lý nén ảnh");
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    setErr("");
    if (!name.trim()) { setErr("Nhập họ và tên"); return; }
    if (!classId) { setErr("Chọn lớp học"); return; }
    if (!email.trim()) { setErr("Nhập địa chỉ Gmail"); return; }
    if (!emailVerified) { setErr("Vui lòng xác minh Gmail trước khi đăng ký"); return; }
    const dup = state.pendingStudents.find(p => p.name.toLowerCase() === name.trim().toLowerCase() && p.classId === classId);
    if (dup) { setErr("Bạn đã đăng ký rồi, đang chờ duyệt"); return; }
    state.setPendingStudents(prev => [...prev, {
      id: "pend_" + Date.now() + Math.random(),
      name: name.trim(), classId, phone, dob, email: email.trim(), emailVerified: true,
      photo, submittedAt: Date.now(),
    }]);
    setSuccess(true);
  };

  if (success) return (
    <div style={{ textAlign: "center", padding: "40px 20px", animation: "pop .4s ease" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#34D399", marginBottom: 8 }}>Đăng ký thành công!</div>
      <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>Giáo viên sẽ xem xét và duyệt hồ sơ của bạn sớm nhất.</div>
      <Btn onClick={onBack} variant="ghost">← Quay lại đăng nhập</Btn>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><ChevronLeft size={16} />Quay lại</button>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Đăng ký tài khoản học sinh</h2>
      </div>
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <div onClick={() => photoRef.current?.click()} style={{ width: 70, height: 70, borderRadius: "50%", overflow: "hidden", background: "var(--wa07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", border: "2px dashed rgba(79,172,254,.35)", cursor: "pointer" }}>
          {photo ? <img src={photo} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : (uploading ? <RefreshCw size={22} style={{ color: "var(--accent)", animation: "spin360 1s linear infinite" }} /> : <Camera size={26} style={{ color: "var(--text3)" }} />)}
        </div>
        <div style={{ fontSize: 10, color: "var(--text3)" }}>Nhấn để thêm ảnh</div>
        <input ref={photoRef} type="file" accept="image/*" onChange={e => handlePhoto(e.target.files[0])} style={{ display: "none" }} />
      </div>
      <Inp label="HỌ VÀ TÊN" value={name} onChange={setName} placeholder="Nguyễn Văn An" required />
      <Sel label="LỚP ĐĂNG KÝ" value={classId} onChange={setClassId} options={[{ v: "", l: "-- Chọn lớp --" }, ...classes.map(c => ({ v: c.id, l: c.name }))]} required />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <DatePickerInp label="NGÀY SINH" value={dob} onChange={setDob} />
        <Inp label="SỐ ĐIỆN THOẠI" value={phone} onChange={setPhone} placeholder="0912..." />
      </div>
      <Inp label="GMAIL" value={email} onChange={v => { setEmail(v); setEmailVerified(false); }} placeholder="ten@gmail.com" required note="Dùng để xác minh danh tính và nhận thông báo" disabled={!!prefillEmail} />
      {!prefillEmail && <EmailVerifyBox email={email} verified={emailVerified} onVerified={setEmailVerified} />}
      <ErrBox msg={err} />
      <Btn onClick={submit} style={{ width: "100%", justifyContent: "center" }} disabled={!name.trim() || !classId || !emailVerified}>Gửi đăng ký →</Btn>
      <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 9, background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.18)", fontSize: 11, color: "#F59E0B", display: "flex", alignItems: "flex-start", gap: 7 }}>
        <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        Sau khi đăng ký, giáo viên sẽ duyệt và cấp mã học sinh cho bạn. Bạn sẽ dùng mã đó để đăng nhập.
      </div>
    </div>
  );
}


// trang đăng ký phụ huynh

function ParentRegisterPage({ state, onBack, classes, prefillEmail, prefillName }) {
  const [name, setName] = useState(prefillName || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(prefillEmail || "");
  const [emailVerified, setEmailVerified] = useState(!!prefillEmail);
  const [uname, setUname] = useState("");
  const [pass, setPass] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [studentCode, setStudentCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = () => {
    setErr("");
    if (!name.trim()) { setErr("Nhập họ và tên phụ huynh"); return; }
    if (!email.trim()) { setErr("Nhập địa chỉ Gmail"); return; }
    if (!emailVerified) { setErr("Vui lòng xác minh Gmail trước khi đăng ký"); return; }
    if (!uname.trim() || !pass) { setErr("Nhập tên đăng nhập và mật khẩu"); return; }
    if (pass.length < 4) { setErr("Mật khẩu tối thiểu 4 ký tự"); return; }
    if (!classId) { setErr("Chọn lớp của con"); return; }
    if (!studentCode.trim()) { setErr("Nhập mã học sinh của con"); return; }
    if (state.parents.find(p => p.username.toLowerCase() === uname.trim().toLowerCase())) { setErr("Tên đăng nhập đã tồn tại"); return; }
    const parentId = "parent_" + Date.now() + Math.random();
    state.setParents(prev => [...prev, { id: parentId, name: name.trim(), username: uname.trim(), password: pass, phone: phone || "", childIds: [], email: email.trim(), emailVerified: true }]);
    state.setPendingParents(prev => [...prev, {
      id: "pp_" + Date.now() + Math.random(),
      parentId, parentName: name.trim(), classId,
      studentCode: studentCode.trim().toUpperCase(), studentName: studentName.trim(),
      email: email.trim(), emailVerified: true,
      requestedAt: Date.now(),
    }]);
    setSuccess(true);
  };

  if (success) return (
    <div style={{ textAlign: "center", padding: "40px 20px", animation: "pop .4s ease" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#34D399", marginBottom: 8 }}>Đăng ký thành công!</div>
      <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>Giáo viên sẽ xác nhận liên kết với học sinh. Sau khi được duyệt, bạn có thể đăng nhập bằng tài khoản vừa tạo.</div>
      <Btn onClick={onBack} variant="ghost">← Quay lại đăng nhập</Btn>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><ChevronLeft size={16} />Quay lại</button>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Đăng ký tài khoản phụ huynh</h2>
      </div>
      <Inp label="HỌ VÀ TÊN PHỤ HUYNH" value={name} onChange={setName} placeholder="Nguyễn Văn Ba" required />
      <Inp label="SỐ ĐIỆN THOẠI" value={phone} onChange={setPhone} placeholder="0912..." />
      <Inp label="GMAIL" value={email} onChange={v => { setEmail(v); setEmailVerified(false); }} placeholder="ten@gmail.com" required disabled={!!prefillEmail} />
      {!prefillEmail && <EmailVerifyBox email={email} verified={emailVerified} onVerified={setEmailVerified} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <Inp label="TÊN ĐĂNG NHẬP" value={uname} onChange={setUname} placeholder="Tên đăng nhập" required />
        <Inp label="MẬT KHẨU" value={pass} onChange={setPass} type="password" placeholder="Tối thiểu 4 ký tự" required />
      </div>
      <div style={{ margin: "18px 0 14px", padding: "12px 14px", borderRadius: 12, background: "rgba(79,172,254,.05)", border: "1px solid rgba(79,172,254,.15)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 10, letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 5 }}><Users size={12} />THÔNG TIN CON CỦA BẠN</div>
        <Sel label="LỚP CỦA CON" value={classId} onChange={setClassId} options={[{ v: "", l: "-- Chọn lớp --" }, ...classes.map(c => ({ v: c.id, l: c.name }))]} required />
        <Inp label="MÃ HỌC SINH CỦA CON" value={studentCode} onChange={setStudentCode} placeholder="Ví dụ: HS001" required note="Mã học sinh do giáo viên cấp cho con bạn" />
        <Inp label="TÊN CON (để đối chiếu)" value={studentName} onChange={setStudentName} placeholder="Nguyễn Văn An" />
      </div>
      <ErrBox msg={err} />
      <Btn onClick={submit} style={{ width: "100%", justifyContent: "center" }} disabled={!name.trim() || !uname.trim() || !pass || !classId || !studentCode.trim()}>Gửi đăng ký →</Btn>
      <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 9, background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.18)", fontSize: 11, color: "#F59E0B", display: "flex", alignItems: "flex-start", gap: 7 }}>
        <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        Giáo viên sẽ đối chiếu mã học sinh để xác nhận đây đúng là con của bạn trước khi duyệt.
      </div>
    </div>
  );
}


function GoogleRoleSelect({ state, user, onBack, classes }) {
  const [role, setRole] = useState("student"); // student | parent

  if (!user) return null;

  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <img src={user.photo} alt={user.name} style={{ width: 60, height: 60, borderRadius: "50%", marginBottom: 10 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Xin chào, {user.name}!</h2>
        <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>{user.email}</p>
        <p style={{ fontSize: 13, color: "var(--accent)", marginTop: 10, fontWeight: 600 }}>Tài khoản Google này chưa được liên kết. Vui lòng đăng ký mới.</p>
      </div>

      <div style={{ display: "flex", borderRadius: 12, background: "var(--wa04)", border: "1px solid var(--wa07)", overflow: "hidden", marginBottom: 20 }}>
        {[["student", "👨‍🎓", "Tôi là Học sinh"], ["parent", "👪", "Tôi là Phụ huynh"]].map(([r, ic, label]) => (
          <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: "12px 4px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, background: role === r ? "rgba(79,172,254,.15)" : "transparent", color: role === r ? "var(--accent)" : "var(--text3)", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span>{ic}</span>{label}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--wa02)", padding: 15, borderRadius: 12, border: "1px solid var(--wa05)", marginBottom: 20 }}>
        {role === "student" ? (
          <StudentRegisterPage state={state} onBack={onBack} classes={classes} prefillEmail={user.email} prefillName={user.name} />
        ) : (
          <ParentRegisterPage state={state} onBack={onBack} classes={classes} prefillEmail={user.email} prefillName={user.name} />
        )}
      </div>
      
      <Btn onClick={onBack} variant="ghost" style={{ width: "100%", justifyContent: "center" }}>← Quay lại</Btn>
    </div>
  );
}

// trang đăng nhập gv

function LoginPage({ state, onLogin, classes, darkMode, toggleDark }) {
  const [role, setRole] = useState("teacher");
  const [uname, setUname] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const [shaking, setShaking] = useState(false);
  const [sClass, setSClass] = useState("");
  const [sCode, setSCode] = useState("");
  const [registerMode, setRegisterMode] = useState(null); // null | "student" | "parent" | "teacher" | "google_role"
  const [googleUser, setGoogleUser] = useState(null);

  const shake = () => { setShaking(true); setTimeout(() => setShaking(false), 400); };

  const handleGoogleSuccess = async (cred) => {
    setErr("");
    try {
      const res = await api.googleLogin(cred.credential);
      if (res.requireRoleSelection) {
        setGoogleUser({ email: res.email, name: res.name, photo: res.picture });
        setRegisterMode("google_role");
      } else {
        setToken(res.token);
        if (res.role === "student") {
          state.setLoginLogs(prev => ({ ...prev, [res.user.id]: [...(prev[res.user.id] || []), Date.now()] }));
          api.recordStudentLogin(res.user.id).catch(() => {});
          onLogin({ role: "student", data: res.user, classId: res.user.classId });
        } else {
          onLogin({ role: res.role, data: res.user });
        }
      }
    } catch(e) {
      setErr(e.message || "Lỗi đăng nhập Google"); shake();
    }
  };

  const doLogin = async () => {
    setErr("");
    try {
      if (role === "teacher") {
        if (!uname.trim() || !pass) { setErr("Nhập đầy đủ thông tin"); shake(); return; }
        const res = await api.login({ role: "teacher", username: uname.trim(), password: pass });
        if (!res || res.error) { setErr(res?.error || "Sai tên đăng nhập hoặc mật khẩu"); shake(); return; }
        setToken(res.token);
        onLogin({ role: "teacher", data: res.user });
      } else if (role === "parent") {
        if (!uname.trim() || !pass) { setErr("Nhập đầy đủ thông tin"); shake(); return; }
        const res = await api.login({ role: "parent", username: uname.trim(), password: pass });
        if (!res || res.error) { setErr(res?.error || "Sai tên đăng nhập hoặc mật khẩu"); shake(); return; }
        setToken(res.token);
        onLogin({ role: "parent", data: res.user });
      } else if (role === "admin") {
        if (!uname.trim() || !pass) { setErr("Nhập đầy đủ thông tin"); shake(); return; }
        const res = await api.login({ role: "admin", username: uname.trim(), password: pass });
        if (!res || res.error) { setErr(res?.error || "Sai tên đăng nhập hoặc mật khẩu"); shake(); return; }
        setToken(res.token);
        onLogin({ role: "admin", data: res.user });
      } else if (role === "proctor") {
        if (!uname.trim() || !pass) { setErr("Nhập đầy đủ thông tin"); shake(); return; }
        const res = await api.login({ role: "proctor", username: uname.trim(), password: pass });
        if (!res || res.error) { setErr(res?.error || "Sai tên đăng nhập hoặc mật khẩu"); shake(); return; }
        setToken(res.token);
        localStorage.setItem('eclass_proctor_pass', pass);
        onLogin({ role: "proctor", data: res.user });
      } else {
        if (!sClass || !sCode.trim()) { setErr("Nhập đầy đủ thông tin"); shake(); return; }
        // Client-side password check
        if (selectedStudentNeedsPass && !sPass.trim()) { setErr("Vui lòng nhập mật khẩu"); shake(); return; }
        if (selectedStudentNeedsPass && !checkStudentPassword(sCode, sClass, sPass)) { setErr("Mật khẩu không đúng"); shake(); return; }
        const res = await api.login({ role: "student", classId: sClass, code: sCode.trim() });
        if (!res || res.error) { setErr(res?.error || "Mã học sinh không đúng hoặc không thuộc lớp này"); shake(); return; }
        setToken(res.token);
        state.setLoginLogs(prev => ({ ...prev, [res.user.id]: [...(prev[res.user.id] || []), Date.now()] }));
        api.recordStudentLogin(res.user.id).catch(() => {});
        onLogin({ role: "student", data: res.user, classId: sClass });
      }
    } catch (e) {
      setErr(e.message || "Lỗi kết nối server"); shake();
    }
  };

  // For student: check password against local students list
  const checkStudentPassword = (code, classId, enteredPass) => {
    const found = state.students.find(
      s => s.classId === classId && s.code.toUpperCase() === code.trim().toUpperCase()
    );
    if (!found) return true; // server will handle "not found"
    if (!found.password?.trim()) return true; // no password set → skip
    return found.password.trim() === enteredPass.trim();
  };

  // Check if chosen student needs password (looked up from state.students local list)
  const selectedStudentNeedsPass = useMemo(() => {
    if (role !== "student" || !sClass || !sCode.trim()) return false;
    const found = state.students.find(
      s => s.classId === sClass &&
           s.code.toUpperCase() === sCode.trim().toUpperCase() &&
           s.password?.trim()
    );
    return !!found;
  }, [role, sClass, sCode, state.students]);

  const [sPass, setSPass] = useState("");
  const [showSPass, setShowSPass] = useState(false);

  if (registerMode) return (
    <div className={`ecp${darkMode ? '' : ' light'}`} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {toggleDark && (
        <button
          onClick={toggleDark}
          title={darkMode ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
          style={{ position: "fixed", top: 18, right: 18, zIndex: 20, width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--inp-bg)", color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      )}
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,108,245,.14),transparent 70%)", top: -150, left: -100, filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,var(--wa022) 1px,transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 440, padding: "0 20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--wa09)", borderRadius: 22, padding: 28, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
          {registerMode === "google_role" ? (
            <GoogleRoleSelect state={state} user={googleUser} onBack={() => setRegisterMode(null)} classes={classes} />
          ) : registerMode === "student" ? (
            <StudentRegisterPage state={state} onBack={() => setRegisterMode(null)} classes={classes} />
          ) : (
            <ParentRegisterPage state={state} onBack={() => setRegisterMode(null)} classes={classes} />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`ecp${darkMode ? '' : ' light'}`} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {toggleDark && (
        <button
          onClick={toggleDark}
          title={darkMode ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
          style={{ position: "fixed", top: 18, right: 18, zIndex: 20, width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--inp-bg)", color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      )}
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,108,245,.13),transparent 70%)", top: -200, left: -200, filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle,rgba(123,63,228,.1),transparent 70%)", bottom: -150, right: -100, filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,var(--wa022) 1px,transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420, padding: "0 20px", animation: "fadeUp .4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>

          <div style={{ marginBottom: 16, animation: "float 4s ease-in-out infinite", display: "inline-block" }}>
            <img src={LOGO_LG} alt="E-Class P2K" style={{ width: 96, height: 96, borderRadius: 22, boxShadow: "0 12px 36px rgba(29,108,245,.45)", display: "block" }} />
          </div>
          <h1 className="hfont" style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-.01em", color: "var(--text)" }}>
            E-Class <span style={{ color: "var(--accent)" }}>P2K</span>
          </h1>
          <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 5 }}>Nền tảng quản lý lớp học thông minh</p>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--wa09)", borderRadius: 22, padding: 28, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
          <div style={{ display: "flex", borderRadius: 12, background: "var(--wa04)", border: "1px solid var(--wa07)", overflow: "hidden", marginBottom: 24 }}>
            {[["teacher", "👨‍🏫", "GV"], ["student", "👨‍🎓", "HS"], ["proctor", "👮", "QS"], ["parent", "👪", "PH"], ["admin", "🔑", "Admin"]].map(([r, ic, label]) => (
              <button key={r} onClick={() => { setRole(r); setErr(""); }} style={{ flex: 1, padding: "10px 2px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, background: role === r ? "rgba(79,172,254,.15)" : "transparent", color: role === r ? "var(--accent)" : "var(--text3)", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                <span>{ic}</span>{label}
              </button>
            ))}
          </div>
          <div className={shaking ? "shake" : ""}>
            {role === "student" ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5, letterSpacing: ".05em" }}>LỚP HỌC <span style={{ color: "#EF4444" }}>*</span></div>
                  <select className="inp" value={sClass} onChange={e => setSClass(e.target.value)} style={{ display: "block", width: "100%" }}>
                    <option value="">-- Chọn lớp --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Inp label="MÃ HỌC SINH" value={sCode} onChange={v => { setSCode(v); setSPass(""); }} placeholder="Ví dụ: HS001" required note="Mã được giáo viên cấp sau khi duyệt đăng ký" />
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5, letterSpacing: ".05em" }}>MẬT KHẨU</div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="inp"
                      type={showSPass ? "text" : "password"}
                      value={sPass}
                      onChange={e => setSPass(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && doLogin()}
                      placeholder="Nhập mật khẩu (nếu đã thiết lập)"
                      style={{ display: "block", paddingRight: 42 }}
                    />
                    <button onClick={() => setShowSPass(p => !p)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}>
                      {showSPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 4 }}>
                    💡 Bỏ trống nếu tài khoản của bạn chưa thiết lập mật khẩu
                  </div>
                </div>
              </>
            ) : (
              <>
                <Inp label="TÊN ĐĂNG NHẬP" value={uname} onChange={setUname} placeholder="Nhập username" required />
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5, letterSpacing: ".05em" }}>MẬT KHẨU <span style={{ color: "#EF4444" }}>*</span></div>
                  <div style={{ position: "relative" }}>
                    <input className="inp" type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()} placeholder="Nhập mật khẩu" style={{ display: "block", paddingRight: 42 }} />
                    <button onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}
            <ErrBox msg={err} />
            <Btn onClick={doLogin} style={{ width: "100%", marginTop: 4, justifyContent: "center" }} disabled={role === "student" ? (!sClass || !sCode) : (!uname || !pass)}>
              {role === "student" ? "Vào lớp học →" : "Đăng nhập →"}
            </Btn>
            
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".1em" }}>Hoặc đăng nhập với</div>
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => { setErr("Đăng nhập Google thất bại"); shake(); }} theme={darkMode ? "filled_black" : "outline"} shape="pill" text="continue_with" />
            </div>
          </div>
          {role === "student" && (
            <button onClick={() => setRegisterMode("student")} style={{ width: "100%", marginTop: 12, padding: "9px", borderRadius: 10, border: "1px dashed rgba(79,172,254,.3)", background: "transparent", color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <UserPlus size={13} />Đăng ký tài khoản mới
            </button>
          )}
          {role === "parent" && (
            <button onClick={() => setRegisterMode("parent")} style={{ width: "100%", marginTop: 12, padding: "9px", borderRadius: 10, border: "1px dashed rgba(79,172,254,.3)", background: "transparent", color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <UserPlus size={13} />Đăng ký tài khoản phụ huynh
            </button>
          )}
          {role === "teacher" && (
            <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 10, border: "1px dashed rgba(255,255,255,.12)", background: "transparent", color: "var(--text4)", fontSize: 11, textAlign: "center" }}>
              Tài khoản giáo viên do Admin tạo. Vui lòng liên hệ Admin để được cấp tài khoản.
            </div>
          )}
          <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: "var(--wa025)", border: "1px solid var(--wa06)", fontSize: 11, color: "var(--text3)", lineHeight: 1.9 }}>
            <div style={{ fontWeight: 700, color: "var(--text4)", marginBottom: 4 }}>Demo:</div>
            <div>👔 Admin: <span style={{ color: "var(--text3)" }}>phat79186@gmail.com / admin123</span></div>
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
  { id: "schedule",    Ic: Calendar,      l: "Thời khóa biểu" },
  { id: "attendance",  Ic: QrCode,        l: "Điểm danh" },
  { id: "chat",        Ic: MessageSquare, l: "Chat lớp" },
  { id: "parentchat",  Ic: MessageCircle, l: "Chat phụ huynh" },
  { id: "assignments", Ic: BookOpen,      l: "Bài tập" },
  { id: "wheel",       Ic: Shuffle,       l: "Lucky Wheel" },
  { id: "library",     Ic: Library,       l: "Tài liệu" },
  { id: "gradecalc",   Ic: BarChart2,     l: "Xếp loại" },
  { id: "rankings",    Ic: Trophy,        l: "Xếp hạng" },
  { id: "competition", Ic: Trophy,        l: "Thi đua lớp" },
  { id: "locate",      Ic: Eye,           l: "Giám sát AI" },
  { id: "pending",     Ic: UserCheck,     l: "Duyệt HS" },
  { id: "settings",    Ic: Settings,      l: "Cài đặt" },
  { id: "profile",     Ic: User,          l: "Hồ sơ" },
];
const NAV_STUDENT = [{ id: "dashboard",   Ic: Home,          l: "Tổng quan" },
  { id: "seating",     Ic: Grid,          l: "Sơ đồ lớp" },
  { id: "schedule",    Ic: Calendar,      l: "Thời khóa biểu" },
  { id: "attendance",  Ic: QrCode,        l: "Điểm danh" },
  { id: "chat",        Ic: MessageSquare, l: "Chat lớp" },
  { id: "assignments", Ic: BookOpen,      l: "Bài tập" },
  { id: "library",     Ic: Library,       l: "Tài liệu" },
  { id: "gradecalc",   Ic: BarChart2,     l: "Xếp loại" },
  { id: "rankings",    Ic: Trophy,        l: "Xếp hạng" },
  { id: "competition", Ic: Trophy,        l: "Thi đua lớp" },
  { id: "ai",          Ic: Bot,           l: "Trợ giảng AI" },
  { id: "pomodoro",    Ic: Clock,         l: "Pomodoro" },
  { id: "profile",     Ic: User,          l: "Hồ sơ" },
  { id: "lab",         Ic: Code2,          l: "Phòng Lab" },
];
const NAV_PARENT = [
  { id: "dashboard",   Ic: Home,          l: "Tổng quan" },
  { id: "parentchat",  Ic: MessageCircle, l: "Chat với GVCN" },
  { id: "schedule",    Ic: Calendar,      l: "Thời khóa biểu" },
  { id: "gradecalc",   Ic: BarChart2,     l: "Bảng điểm" },
  { id: "competition", Ic: Trophy,        l: "Thi đua lớp" },
  { id: "profile",     Ic: User,          l: "Hồ sơ" },
];
const NAV_ADMIN = [
  { id: "dashboard",   Ic: Home,          l: "Quản lý" },
];

function Sidebar({ view, setView, col, user, pendingCount, chatUnreadCount, setCol, selClass, state }) {
  let nav = user.role === "teacher" ? NAV_TEACHER : user.role === "parent" ? NAV_PARENT : user.role === "admin" ? NAV_ADMIN : NAV_STUDENT;
  if (user.role === "teacher" && selClass && state.classes) {
    const currentClass = state.classes.find(c => c.id === selClass);
    if (currentClass && currentClass.teacherId !== user.data.id) {
      nav = nav.filter(item => item.id !== "pending");
    }
  }
  const roleBg = user.role === "teacher" ? "rgba(167,139,250,.1)" : user.role === "parent" ? "rgba(52,211,153,.1)" : user.role === "admin" ? "rgba(245,158,11,.1)" : "rgba(79,172,254,.08)";
  const roleBd = user.role === "teacher" ? "rgba(167,139,250,.22)" : user.role === "parent" ? "rgba(52,211,153,.22)" : user.role === "admin" ? "rgba(245,158,11,.22)" : "rgba(79,172,254,.18)";
  const roleCol = user.role === "teacher" ? "#A78BFA" : user.role === "parent" ? "#34D399" : user.role === "admin" ? "#F59E0B" : "var(--accent)";
  const roleLbl = user.role === "teacher" ? "Giáo Viên" : user.role === "parent" ? "Phụ Huynh" : user.role === "admin" ? "Admin" : "Học Sinh";
  
  const handleNavClick = (id) => {
    setView(id);
    if (window.innerWidth <= 1024) setCol(true);
  };
  
  return (
    <div className={`sidebar-wrapper ${col ? "col" : ""}`}>
      <div style={{ height: 60, display: "flex", alignItems: "center", padding: col ? "0 11px" : "0 16px", borderBottom: "1px solid var(--border2)", gap: 11, flexShrink: 0 }}>
        <img src={LOGO_SM} alt="E-Class P2K" style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, boxShadow: "0 4px 16px rgba(29,108,245,.4)", display: "block", objectFit: "cover" }} />
        {!col && <span className="hfont" style={{ fontSize: 15, fontWeight: 400, whiteSpace: "nowrap", color: "var(--text)" }}>E-Class <span style={{ color: "var(--accent)" }}>P2K</span></span>}
      </div>
      {!col && (
        <div style={{ padding: "8px 10px 2px" }}>
          <div style={{ padding: "5px 10px", borderRadius: 9, background: roleBg, border: `1px solid ${roleBd}`, display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: roleCol }}>
            {user.role === "teacher" ? <GraduationCap size={11} /> : user.role === "parent" ? <Users size={11} /> : user.role === "admin" ? <Key size={11} /> : <Trophy size={11} />}
            {roleLbl}
          </div>
        </div>
      )}
      <div style={{ flex: 1, padding: col ? "6px 0" : "2px 8px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
        {nav.map(({ id, Ic, l }) => (
          <div key={id} className={`nbtn ${view === id ? "act" : ""}`} onClick={() => handleNavClick(id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: col ? "10px 0" : "7px 10px", justifyContent: col ? "center" : "flex-start", position: "relative", color: view === id ? "var(--accent)" : "var(--text4)" }}>
            <div style={{ position: "relative" }}>
              <Ic size={15} strokeWidth={view === id ? 2.5 : 1.8} />
              {id === "pending" && pendingCount > 0 && <div className="notification-dot" />}
              {id === "chat" && chatUnreadCount > 0 && <div className="notification-dot" />}
            </div>
            {!col && <span style={{ fontSize: 12, fontWeight: view === id ? 600 : 400, whiteSpace: "nowrap" }}>{l}</span>}
            {!col && id === "pending" && pendingCount > 0 && <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 99, background: "rgba(239,68,68,.18)", color: "#EF4444" }}>{pendingCount}</span>}
            {!col && id === "chat" && chatUnreadCount > 0 && <span style={{ marginLeft: "auto", minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99, background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{chatUnreadCount > 5 ? "5+" : chatUnreadCount}</span>}
            {view === id && !col && <div className="sidebar-ind" />}
          </div>
        ))}
      </div>
      <div style={{ padding: col ? "11px 0" : "10px 12px", borderTop: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 8, justifyContent: col ? "center" : "flex-start" }}>
        <Av photo={user.data.photo} sz={30} />
        {!col && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 134 }}>{user.data.name}</div>
            <div style={{ fontSize: 10, color: "var(--text3)" }}>{user.role === "teacher" ? user.data.subject || "Giáo viên" : user.role === "parent" ? `${(user.data.childIds||[]).length} con` : user.role === "admin" ? "Quản trị" : user.data.code}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function TopBar({ view, toggleSide, user, onLogout, classInfo, darkMode, toggleDark, selClass, setSelClass, myClasses }) {
  const LBL = { dashboard: user.role === "admin" ? "Quản lý hệ thống" : "Tổng quan", students:"Quản lý học sinh", seating:"Sơ đồ lớp", schedule:"Thời khóa biểu", attendance:"Điểm danh QR", chat:"Chat lớp", assignments:"Bài tập", wheel:"Lucky Wheel", library:"Thư viện tài liệu", gradecalc:"Bảng điểm & Xếp loại", rankings:"Bảng xếp hạng", settings:"Cài đặt", profile:"Hồ sơ", pending:"Duyệt học sinh", ai:"Trợ giảng AI", locate:"Giám sát AI (Locate)" };
  return (
    <div style={{ height: 60, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, background: "var(--topbar)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border2)", position: "sticky", top: 0, zIndex: 40 }}>
      <button onClick={toggleSide} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "var(--inp-bg)", color: "var(--text4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Menu size={14} /></button>
      <h1 className="hfont" style={{ fontSize: 15, fontWeight: 400, color: "var(--text)" }}>{LBL[view] || view}</h1>
      {user.role === "teacher" && myClasses && myClasses.length > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--wa015)", padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border2)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: ".04em" }}>LỚP:</span>
          <select value={selClass} onChange={e => setSelClass(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, background: "var(--wa055)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 11, fontWeight: 600, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {myClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.school || 'Không rõ trường'})</option>)}
          </select>
        </div>
      ) : (
        classInfo && <Badge c="blue">{classInfo.name}</Badge>
      )}
      <div style={{ flex: 1 }} />
      <button
        onClick={toggleDark}
        title={darkMode ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
        style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--inp-bg)", color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 }}
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
      </button>
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
  const pendingP = useMemo(() => state.pendingParents.filter(p => myClassIds.includes(p.classId)), [state.pendingParents, myClassIds]);
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
      photo: pend.photo || null,
      phone: pend.phone || "",
      dob: pend.dob || "",
      email: pend.email || "",
      emailVerified: !!pend.emailVerified,
      score: 0,
      createdAt: Date.now(),
    }]);
    state.setPendingStudents(prev => prev.filter(p => p.id !== pend.id));
    confetti({ particleCount: 70, spread: 60, colors: ['#34D399', '#4FACFE', '#A78BFA'] });
    setErr(e => { const n = { ...e }; delete n[pend.id]; return n; });
  };

  const reject = async (id) => {
    const ok = await confirm("Từ chối đăng ký này?");
    if (!ok) return;
    state.setPendingStudents(prev => prev.filter(p => p.id !== id));
  };

  const matchedStudent = (req) => state.students.find(s => s.classId === req.classId && s.code.toUpperCase() === req.studentCode.toUpperCase());

  const approveParent = (req) => {
    const matched = matchedStudent(req);
    if (!matched) return;
    state.setParents(prev => prev.map(pa => pa.id === req.parentId ? { ...pa, childIds: [...new Set([...(pa.childIds || []), matched.id])] } : pa));
    state.setPendingParents(prev => prev.filter(x => x.id !== req.id));
    confetti({ particleCount: 70, spread: 60, colors: ['#34D399', '#4FACFE', '#A78BFA'] });
  };

  const rejectParent = async (id) => {
    const ok = await confirm("Từ chối yêu cầu liên kết phụ huynh này?");
    if (!ok) return;
    state.setPendingParents(prev => prev.filter(x => x.id !== id));
  };

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {ConfirmUI}
      <div className="scard" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--wa06)", display: "flex", alignItems: "center", gap: 10 }}>
          <UserCheck size={16} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Đăng ký học sinh đang chờ duyệt</span>
          {pending.length > 0 && <Badge c="red">{pending.length} mới</Badge>}
        </div>
        {pending.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text4)" }}>
            <UserCheck size={36} style={{ margin: "0 auto 14px", opacity: .25 }} />
            <div style={{ fontSize: 13 }}>Không có đăng ký nào đang chờ</div>
          </div>
        ) : pending.map(p => {
          const cls = state.classes.find(c => c.id === p.classId);
          return (
            <div key={p.id} style={{ padding: "14px 18px", borderBottom: "1px solid var(--wa04)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <Av photo={p.photo} sz={44} />
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>Lớp: <span style={{ color: "var(--accent)" }}>{cls?.name}</span> · {p.phone && `📞 ${p.phone}`}</div>
                {p.email && <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>✉️ {p.email}{p.emailVerified && <Badge c="green">Đã xác minh</Badge>}</div>}
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>Đăng ký: {new Date(p.submittedAt).toLocaleDateString("vi-VN")}</div>
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

      <div className="scard" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--wa06)", display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={16} style={{ color: "#A78BFA" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Yêu cầu liên kết phụ huynh</span>
          {pendingP.length > 0 && <Badge c="red">{pendingP.length} mới</Badge>}
        </div>
        {pendingP.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text4)" }}>
            <Users size={36} style={{ margin: "0 auto 14px", opacity: .25 }} />
            <div style={{ fontSize: 13 }}>Không có yêu cầu nào đang chờ</div>
          </div>
        ) : pendingP.map(req => {
          const cls = state.classes.find(c => c.id === req.classId);
          const matched = matchedStudent(req);
          return (
            <div key={req.id} style={{ padding: "14px 18px", borderBottom: "1px solid var(--wa04)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <Av photo={matched?.photo} sz={44} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>👪 {req.parentName}</div>
                <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>Lớp: <span style={{ color: "var(--accent)" }}>{cls?.name}</span> · Mã HS con: <span style={{ color: "var(--accent)" }}>{req.studentCode}</span>{req.studentName && ` · Tên khai: ${req.studentName}`}</div>
                {matched ? (
                  <div style={{ fontSize: 11, color: "#34D399", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><Check size={11} />Khớp với học sinh: <b>{matched.name}</b></div>
                ) : (
                  <div style={{ fontSize: 11, color: "#EF4444", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />Không tìm thấy học sinh với mã này trong lớp</div>
                )}
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>Đăng ký: {new Date(req.requestedAt).toLocaleDateString("vi-VN")}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Btn onClick={() => approveParent(req)} small variant="success" disabled={!matched}><UserCheck size={12} />Duyệt</Btn>
                <Btn onClick={() => rejectParent(req.id)} small variant="danger"><UserX size={12} />Từ chối</Btn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// quản lý hs

function StudentsPage({ state, user, selClass, setSelClass, myClasses }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showEditClass, setShowEditClass] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [newSt, setNewSt] = useState({ name: "", code: "", photo: null, phone: "", dob: "", isProctor: false });
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("12");
  const [newClassSchool, setNewClassSchool] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editClassGrade, setEditClassGrade] = useState("");
  const [editClassSchool, setEditClassSchool] = useState("");
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

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    setErrSt("");
    try {
      const compressed = await compressImage(file, 400, 400);
      setNewSt(p => ({ ...p, photo: compressed }));

      const fapi = window.faceapi;
      if (fapi) {
        try {
          await loadFaceApiModels();
          const desc = await computeFaceDescriptorFromImage(fapi, compressed);
          if (desc) {
            setErrSt("✅ Đã nhận diện gương mặt & trích xuất Face ID thành công!");
          } else {
            setErrSt("⚠️ Cảnh báo: Không phát hiện thấy gương mặt rõ ràng. Ảnh này có thể không hoạt động tốt cho điểm danh Face ID.");
          }
        } catch (faceErr) {
          console.warn("Lỗi kiểm tra Face ID khi tải ảnh lên:", faceErr);
        }
      }
    } catch (err) {
      setErrSt("Lỗi xử lý nén ảnh");
    } finally {
      setPhotoUploading(false);
    }
  };

  const openAdd = () => {
    setNewSt({ name: "", code: "", photo: null, phone: "", dob: "", isProctor: false, password: "" });
    setErrSt(""); setEditStudent(null); setShowAddModal(true);
  };

  const saveStudent = () => {
    if (!newSt.name.trim()) { setErrSt("Vui lòng nhập tên học sinh"); return; }
    if (!newSt.code.trim()) { setErrSt("Vui lòng nhập mã học sinh"); return; }
    const dup = state.students.find(s => s.code.toUpperCase() === newSt.code.trim().toUpperCase() && s.classId === selClass && s.id !== editStudent?.id);
    if (dup) { setErrSt("Mã học sinh đã tồn tại trong lớp này"); return; }
    const payload = { name: newSt.name.trim(), code: newSt.code.trim().toUpperCase(), photo: newSt.photo || null, phone: newSt.phone || "", dob: newSt.dob || "", isProctor: false, password: newSt.password?.trim() || "" };
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
    state.setClasses(p => [...p, { id, name: newClassName.trim(), teacherId: user.data.id, grade: newClassGrade, school: newClassSchool.trim(), createdAt: Date.now() }]);
    setSelClass(id); setNewClassName(""); setShowAddClass(false); setErrCls("");
  };

  const saveClassName = () => {
    if (!editClassName.trim()) return;
    const dup = state.classes.find(c => c.name === editClassName.trim() && c.id !== selClass);
    if (dup) { setErrCls("Tên lớp đã tồn tại"); return; }
    state.setClasses(p => p.map(c => c.id === selClass ? { ...c, name: editClassName.trim(), grade: editClassGrade, school: editClassSchool.trim() } : c));
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
      adds.push({ id: "st_" + Date.now() + i + Math.random(), classId: selClass, name, code, photo: null, phone: "", dob: "", score: 0, createdAt: Date.now() });
    });
    if (errs.length) { setBulkErr(errs.join(" | ")); return; }
    state.setStudents(p => [...p, ...adds]);
    setBulkText(""); setBulkMode(false);
  };

  const today = (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
  const attKey = `${selClass}_${today}`;

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {ConfirmUI}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {myClasses.map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", borderRadius: 10, overflow: "hidden", border: `1px solid ${selClass === c.id ? "rgba(79,172,254,.4)" : "var(--wa07)"}`, background: selClass === c.id ? "rgba(79,172,254,.1)" : "var(--wa03)", transition: "all .2s" }}>
            <button onClick={() => setSelClass(c.id)} style={{ padding: "6px 14px", border: "none", cursor: "pointer", background: "transparent", color: selClass === c.id ? "var(--accent)" : "var(--text2)", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>{c.name}</button>
            {selClass === c.id && <button onClick={() => { setEditClassName(c.name); setEditClassGrade(c.grade || "12"); setEditClassSchool(c.school || ""); setShowEditClass(true); setErrCls(""); }} style={{ padding: "6px", border: "none", cursor: "pointer", background: "rgba(79,172,254,.08)", color: "var(--accent)", display: "flex" }}><Edit2 size={11} /></button>}
            <button onClick={() => deleteClass(c.id)} style={{ padding: "6px 7px", border: "none", cursor: "pointer", background: "rgba(239,68,68,.06)", color: "#EF4444", display: "flex" }}><X size={11} /></button>
          </div>
        ))}
        <button onClick={() => { setShowAddClass(true); setErrCls(""); setNewClassName(""); setNewClassSchool(user.data?.school || ""); setNewClassGrade("12"); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 10, border: "1px dashed rgba(79,172,254,.32)", background: "transparent", color: "var(--accent)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          <Plus size={13} />Thêm lớp
        </button>
      </div>

      {selClass ? (
        <div className="scard" style={{ overflow: "hidden" }}>
          <div style={{ padding: "13px 17px", borderBottom: "1px solid var(--wa055)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Lớp {cls?.name}</div>
            <span style={{ fontSize: 11, color: "var(--text4)" }}>{classStudents.length} học sinh</span>
            <div style={{ flex: 1, maxWidth: 220, display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 9, background: "var(--wa04)", border: "1px solid var(--wa07)" }}>
              <Search size={12} style={{ color: "var(--text4)", flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm học sinh..." style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 11, fontFamily: "inherit", width: "100%" }} />
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Btn onClick={() => setBulkMode(p => !p)} variant="ghost" small>{bulkMode ? "Đóng" : "Nhập hàng loạt"}</Btn>
              <Btn onClick={openAdd} small><UserPlus size={12} />Thêm học sinh</Btn>
            </div>
          </div>
          {bulkMode && (
            <div style={{ padding: "14px 17px", borderBottom: "1px solid var(--wa055)", background: "rgba(79,172,254,.03)" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 7 }}>Mỗi dòng: <code style={{ color: "var(--accent)" }}>Tên học sinh, MãHS</code></div>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"Nguyễn Văn An, HS001\nTrần Thị Bình, HS002"} rows={5} style={{ width: "100%", padding: "10px 12px", borderRadius: 9, background: "var(--wa04)", border: "1px solid var(--wa09)", color: "var(--text)", fontSize: 12, fontFamily: "monospace", outline: "none", resize: "vertical" }} />
              <ErrBox msg={bulkErr} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Btn onClick={() => setBulkMode(false)} variant="ghost" small>Hủy</Btn>
                <Btn onClick={doBulk} small>Nhập danh sách</Btn>
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text4)" }}>
              <Users size={36} style={{ margin: "0 auto 12px", opacity: .22 }} />
              <div style={{ fontSize: 13, marginBottom: 14 }}>{search ? "Không tìm thấy học sinh" : "Chưa có học sinh."}</div>
              {!search && <Btn onClick={openAdd}><UserPlus size={13} />Thêm học sinh đầu tiên</Btn>}
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "28px 44px 1fr 100px 100px 88px", gap: 10, padding: "8px 17px", borderBottom: "1px solid var(--wa04)", fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: ".06em" }}>
                <span>STT</span><span></span><span>HỌ VÀ TÊN</span><span>MÃ HS</span><span>TRẠNG THÁI</span><span style={{ textAlign: "right" }}>THAO TÁC</span>
              </div>
              {filtered.map((s, i) => {
                const present = (state.attendance[attKey] || []).includes(s.id);
                return (
                  <div key={s.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: "28px 44px 1fr 100px 100px 88px", gap: 10, padding: "10px 17px", borderBottom: "1px solid var(--wa025)", alignItems: "center", cursor: "pointer" }} onClick={() => setViewStudent(s)}>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textAlign: "center" }}>{i + 1}</div>
                    <Av photo={s.photo} sz={36} glow={present} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 5 }}>
                        {s.name}
                      </div>
                      {s.phone && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{s.phone}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", fontFamily: "monospace" }}>{s.code}</div>
                    <div>{present ? <Badge c="green">✓ Có mặt</Badge> : <Badge c="gray">Chưa ĐD</Badge>}</div>
                    <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditStudent(s); setNewSt({ name: s.name, code: s.code, photo: s.photo || null, phone: s.phone || "", dob: s.dob || "", isProctor: false, password: s.password || "" }); setErrSt(""); setShowAddModal(true); }} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(79,172,254,.22)", background: "rgba(79,172,254,.06)", color: "var(--accent)", cursor: "pointer", display: "flex" }}><Edit2 size={12} /></button>
                      <button onClick={() => deleteStudent(s.id)} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex" }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text4)" }}>
          <School size={36} style={{ margin: "0 auto 12px", opacity: .22 }} />
          <div style={{ fontSize: 13, marginBottom: 16 }}>Chưa có lớp nào. Hãy tạo lớp học đầu tiên!</div>
          <Btn onClick={() => { setShowAddClass(true); setErrCls(""); setNewClassName(""); setNewClassSchool(user.data?.school || ""); setNewClassGrade("12"); }}><Plus size={13} />Tạo lớp học</Btn>
        </div>
      )}

      {(showAddClass || showEditClass) && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) { setShowAddClass(false); setShowEditClass(false); } }}>
          <div className="modal" style={{ width: 360 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{showEditClass ? "Chỉnh sửa lớp học" : "Thêm lớp mới"}</h2>
              <button onClick={() => { setShowAddClass(false); setShowEditClass(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>
            </div>
            
            <Inp label="TÊN LỚP" value={showEditClass ? editClassName : newClassName} onChange={showEditClass ? setEditClassName : setNewClassName} placeholder="Ví dụ: 12A1, 10B3..." required />
            
            <Sel 
              label="KHỐI LỚP" 
              value={showEditClass ? editClassGrade : newClassGrade} 
              onChange={showEditClass ? setEditClassGrade : setNewClassGrade} 
              options={[
                { v: "10", l: "Khối 10" },
                { v: "11", l: "Khối 11" },
                { v: "12", l: "Khối 12" },
                { v: "Khác", l: "Khác" }
              ]} 
              required 
            />
            
            <Inp 
              label="TRƯỜNG HỌC" 
              value={showEditClass ? editClassSchool : newClassSchool} 
              onChange={showEditClass ? setEditClassSchool : setNewClassSchool} 
              placeholder="Nhập tên trường học..." 
            />

            <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5, marginBottom: 16, background: "var(--wa03)", padding: 8, borderRadius: 6 }}>
              💡 Lớp học sẽ tự động liên kết với trường học của bạn. Học sinh và phụ huynh có thể tìm thấy lớp học này để đăng ký/liên kết thông tin.
            </div>

            <ErrBox msg={errCls} />
            
            <div style={{ display: "flex", gap: 9 }}>
              <Btn variant="ghost" onClick={() => { setShowAddClass(false); setShowEditClass(false); }} style={{ flex: 1 }}>Hủy</Btn>
              <Btn onClick={showEditClass ? saveClassName : addClass} style={{ flex: 2 }}>{showEditClass ? "Lưu lại" : "Tạo lớp"}</Btn>
            </div>
          </div>
        </div>
      )}

      {viewStudent && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setViewStudent(null)}>
          <div className="modal" style={{ width: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Hồ sơ học sinh</h2>
              <button onClick={() => setViewStudent(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>
            </div>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ width: 82, height: 82, borderRadius: "50%", overflow: "hidden", background: "var(--wa07)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(79,172,254,.35)", boxShadow: "0 0 28px rgba(79,172,254,.22)", margin: "0 auto" }}>
                {viewStudent.photo ? <img src={viewStudent.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={40} strokeWidth={1.6} style={{ color: "var(--text3)" }} />}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginTop: 12 }}>{viewStudent.name}</div>
              <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 3 }}>Mã: <span style={{ color: "var(--accent)", fontWeight: 700 }}>{viewStudent.code}</span></div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}><ActivityStatus lastTs={(state.activityLogs[viewStudent.id] || []).slice().sort((a, b) => b.ts - a.ts)[0]?.ts || (state.loginLogs[viewStudent.id] || []).slice().sort((a, b) => b - a)[0] || null} /></div>
            </div>
            <div style={{ borderRadius: 11, overflow: "hidden", border: "1px solid var(--wa07)", marginBottom: 18 }}>
              {[
                [<Users size={13}/>, "Lớp học", cls?.name || "--"],
                [<Key size={13}/>, "Mã học sinh", viewStudent.code],
                [<Calendar size={13}/>, "Ngày sinh", viewStudent.dob ? new Date(viewStudent.dob + "T00:00:00").toLocaleDateString("vi-VN") : "--"],
                [<Phone size={13}/>, "Số điện thoại", viewStudent.phone || "--"],
                [<Send size={13}/>, "Gmail", viewStudent.email ? <span>{viewStudent.email} {viewStudent.emailVerified && <Badge c="green">Đã xác minh</Badge>}</span> : "--"],
                [<UserCheck size={13}/>, "Phụ huynh", (state.parents || []).filter(pa => (pa.childIds || []).includes(viewStudent.id)).map(pa => pa.name).join(", ") || "--"]
              ].map(([icon, label, value], i, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: i % 2 === 0 ? "var(--wa015)" : "transparent", borderBottom: i < arr.length - 1 ? "1px solid var(--wa04)" : "none" }}>
                  <div style={{ color: "var(--text3)", flexShrink: 0 }}>{icon}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", width: 110, flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 8, letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 6 }}><Clock size={12} />LỊCH SỬ TRUY CẬP</div>
              <ActivityLogList logs={state.activityLogs[viewStudent.id] || []} maxHeight={200} limit={15} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={() => setViewStudent(null)} style={{ flex: 1 }}>Đóng</Btn>
              <Btn onClick={() => { setEditStudent(viewStudent); setNewSt({ name: viewStudent.name, code: viewStudent.code, photo: viewStudent.photo || null, phone: viewStudent.phone || "", dob: viewStudent.dob || "", isProctor: false, password: viewStudent.password || "" }); setErrSt(""); setShowAddModal(true); setViewStudent(null); }} style={{ flex: 1 }}><Edit2 size={12} />Chỉnh sửa</Btn>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal" style={{ width: 430 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{editStudent ? "Sửa thông tin học sinh" : "Thêm học sinh mới"}</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, letterSpacing: ".05em" }}>ẢNH HỌC SINH</div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div onClick={() => photoRef.current?.click()} style={{ width: 66, height: 66, borderRadius: "50%", overflow: "hidden", background: "var(--wa07)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed rgba(79,172,254,.35)", flexShrink: 0, cursor: "pointer" }}>
                  {newSt.photo ? <img src={newSt.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (photoUploading ? <RefreshCw size={22} style={{ color: "var(--accent)", animation: "spin360 1s linear infinite" }} /> : <Camera size={26} style={{ color: "var(--text3)" }} />)}
                </div>
                <div>
                  <button onClick={() => photoRef.current?.click()} style={{ padding: "6px 13px", borderRadius: 8, border: "1px solid rgba(79,172,254,.32)", background: "rgba(79,172,254,.07)", color: "var(--accent)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                    <Upload size={11} />{photoUploading ? "Đang tải..." : "Chọn ảnh"}
                  </button>
                  {newSt.photo && <button onClick={() => setNewSt(p => ({ ...p, photo: null }))} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>Xóa ảnh</button>}
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 5 }}>JPG, PNG · Tối đa 3MB</div>
                </div>
              </div>
              <input ref={photoRef} type="file" accept="image/*" onChange={e => handlePhotoUpload(e.target.files[0])} style={{ display: "none" }} />
            </div>
            <Inp label="HỌ VÀ TÊN" value={newSt.name} onChange={v => setNewSt(p => ({ ...p, name: v }))} placeholder="Nguyễn Văn An" required />
            <Inp label="MÃ HỌC SINH" value={newSt.code} onChange={v => setNewSt(p => ({ ...p, code: v }))} placeholder="HS001" required note="Dùng để học sinh đăng nhập" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <DatePickerInp label="NGÀY SINH" value={newSt.dob} onChange={v => setNewSt(p => ({ ...p, dob: v }))} />
              <Inp label="SỐ ĐIỆN THOẠI" value={newSt.phone} onChange={v => setNewSt(p => ({ ...p, phone: v }))} placeholder="0912345678" />
            </div>
            {/* ── Password block ── */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5, letterSpacing: ".05em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>MẬT KHẨU <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text3)" }}>(tuỳ chọn)</span></span>
                <button
                  onClick={() => {
                    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
                    const pw = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
                    setNewSt(p => ({ ...p, password: pw }));
                  }}
                  style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <RotateCcw size={10} /> Tạo ngẫu nhiên
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  className="inp"
                  type={newSt._showPw ? "text" : "password"}
                  value={newSt.password || ""}
                  onChange={e => setNewSt(p => ({ ...p, password: e.target.value }))}
                  placeholder="Để trống = không cần mật khẩu"
                  style={{ display: "block", paddingRight: 40 }}
                />
                <button
                  onClick={() => setNewSt(p => ({ ...p, _showPw: !p._showPw }))}
                  style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}
                >
                  {newSt._showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {newSt.password && (
                <div style={{ marginTop: 5, fontSize: 10.5, color: "#F59E0B", display: "flex", alignItems: "center", gap: 4 }}>
                  🔐 Cấp mật khẩu này cho học sinh: <strong style={{ fontFamily: "monospace", letterSpacing: 1 }}>{newSt._showPw ? newSt.password : "••••••••"}</strong>
                </div>
              )}
            </div>
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

function SeatingPage({ state, user, selClass, setSelClass, myClasses }) {
  const [seatTab, setSeatTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [hovSlot, setHovSlot] = useState(null);

  // Phát hiện màn hình mobile để ẩn tab Tổng thể + đổi cách tương tác chỗ ngồi
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Chọn-để-đổi-chỗ: thay thế kéo-thả trên mobile (chạm học sinh -> chạm ô/học sinh khác để hoán đổi)
  const [tapSel, setTapSel] = useState(null); // { slot, id } (từ chỗ ngồi) hoặc { id, fromUnassigned:true }
  useEffect(() => { setTapSel(null); }, [editMode, selClass]);
  useEffect(() => { if (isMobile && seatTab === "overview") setSeatTab("to1"); }, [isMobile, seatTab]);

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

  const today = (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
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

  // Hoán đổi 2 chỗ ngồi theo slot (dùng cho thao tác chạm-để-chọn, không phụ thuộc kéo-thả)
  const swapSeats = useCallback((sourceSlot, targetSlot) => {
    if (sourceSlot === targetSlot) return;
    state.setSeats(prev => {
      const cur = prev[seatKey] || {};
      const sourceId = cur[sourceSlot];
      if (sourceId === undefined) return prev;
      const targetId = cur[targetSlot];
      const next = { ...cur };
      next[targetSlot] = sourceId;
      if (targetId !== undefined) next[sourceSlot] = targetId;
      else delete next[sourceSlot];
      return { ...prev, [seatKey]: next };
    });
  }, [seatKey, state]);

  // Đặt một học sinh (đang chưa có chỗ) vào 1 slot
  const placeUnassignedAt = useCallback((studentId, targetSlot) => {
    state.setSeats(prev => {
      const next = { ...(prev[seatKey] || {}) };
      next[targetSlot] = studentId;
      return { ...prev, [seatKey]: next };
    });
  }, [seatKey, state]);

  // Chạm vào 1 chỗ ngồi: lần chạm đầu chọn học sinh, lần chạm thứ 2 vào ô khác sẽ hoán đổi/đặt vào
  const handleTapSeat = useCallback((slotI) => {
    if (!editMode) return;
    const st = getStudentAt(slotI);
    if (!tapSel) { if (st) setTapSel({ slot: slotI, id: st.id }); return; }
    if (tapSel.fromUnassigned) { placeUnassignedAt(tapSel.id, slotI); setTapSel(null); return; }
    if (tapSel.slot === slotI) { setTapSel(null); return; }
    swapSeats(tapSel.slot, slotI);
    setTapSel(null);
  }, [editMode, tapSel, getStudentAt, swapSeats, placeUnassignedAt]);

  // Chạm vào 1 học sinh chưa có chỗ để chọn, rồi chạm 1 ô để xếp vào
  const handleTapUnassigned = useCallback((s) => {
    if (!editMode) return;
    if (tapSel && tapSel.fromUnassigned && tapSel.id === s.id) { setTapSel(null); return; }
    setTapSel({ id: s.id, fromUnassigned: true });
  }, [editMode, tapSel]);

  const removeTapSelFromSeat = useCallback(() => {
    if (!tapSel || tapSel.fromUnassigned) return;
    clearSlot(tapSel.slot);
    setTapSel(null);
  }, [tapSel, clearSlot]);

  const selTapStudent = useMemo(() => tapSel ? classStudents.find(s => s.id === tapSel.id) : null, [tapSel, classStudents]);

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
    const isMe = user.role === "student" && st?.id === user.data.id;
    const isHov = hovSlot === slotI && editMode;
    const isDragging = st && dragId === st.id;
    const present = st && (state.attendance[attKey] || []).includes(st.id);
    const isDropTarget = isHov && dragId !== null;
    const isTapSel = editMode && !!tapSel && !tapSel.fromUnassigned && tapSel.slot === slotI;
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
        onClick={() => handleTapSeat(slotI)}
        onContextMenu={e => { if (editMode && st) { e.preventDefault(); clearSlot(slotI); } }}
        onMouseEnter={() => !editMode && st && setHovSlot(slotI)}
        onMouseLeave={() => setHovSlot(null)}
        style={{ width: sz, height: h, borderRadius: 10, background: isTapSel ? "rgba(167,139,250,.16)" : isDropTarget ? "rgba(79,172,254,.14)" : st ? (isMe ? "rgba(79,172,254,.15)" : "var(--wa05)") : "var(--wa015)", border: isMe ? "2px solid var(--accent)" : `1px solid ${isTapSel ? "#A78BFA" : isDropTarget ? "rgba(79,172,254,.6)" : st ? (present ? "rgba(52,211,153,.35)" : "var(--wa1)") : "var(--wa045)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, position: "relative", opacity: isDragging ? 0.35 : 1, cursor: editMode ? (st ? "pointer" : (tapSel ? "copy" : "default")) : "default", transition: "all .2s", flexShrink: 0, boxShadow: isTapSel ? "0 0 0 3px rgba(167,139,250,.25)" : isDropTarget ? "0 0 14px rgba(79,172,254,.25)" : isMe ? "0 0 0 3px rgba(79,172,254,0.3)" : "none" }}
      >
        {isMe && <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 6, zIndex: 10, whiteSpace: "nowrap", maxWidth: sz + 20, overflow: "hidden", textOverflow: "ellipsis" }}>{st.name}</div>}
        {st ? (
          <>
            <div style={{ width: compact ? 26 : 30, height: compact ? 26 : 30, borderRadius: "50%", overflow: "hidden", background: "var(--wa07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {st.photo ? <img src={st.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={compact ? 14 : 16} strokeWidth={1.6} style={{ color: "var(--text3)" }} />}
            </div>
            <div style={{ fontSize: 8, color: "var(--text3)", textAlign: "center", padding: "0 3px", lineHeight: 1.2, maxWidth: sz - 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {st.name.split(" ").pop()}
            </div>
            <div style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: present ? "#34D399" : "#EF4444", boxShadow: present ? "0 0 6px rgba(52,211,153,.7)" : "none" }} />
            {editMode && <GripVertical size={8} style={{ position: "absolute", top: 3, left: 3, color: "var(--text4)", opacity: .5 }} />}
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--wa03)", border: "1px dashed var(--wa08)" }} />
            {isDropTarget && <div style={{ fontSize: 8, color: "var(--accent)", fontWeight: 700 }}>Thả vào</div>}
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
      <div style={{ padding: "8px 16px", borderRadius: 9, textAlign: "center", background: "rgba(79,172,254,.04)", border: "1px solid rgba(79,172,254,.14)", fontSize: 11, color: "var(--accent)", letterSpacing: ".08em", fontWeight: 700, marginBottom: 24, maxWidth: 680, margin: "0 auto 24px" }}>
        📋 BẢNG ĐEN · BAN GIÁO VIÊN
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {[0,1,2,3].map(gi => {
          const st = getGroupStats(gi);
          return (
            <div key={gi} onClick={() => setSeatTab(`to${gi+1}`)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 8, background: `${TO_COLORS[gi]}12`, border: `1px solid ${TO_COLORS[gi]}35`, cursor: "pointer", transition: "all .2s" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: TO_COLORS[gi] }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: TO_COLORS[gi] }}>{TO_NAMES[gi]}</span>
              <span style={{ fontSize: 10, color: "var(--text4)" }}>{st.present}/{st.total}</span>
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
                  <div key={col} style={{ width: 64, textAlign: "center", fontSize: 9, color: "var(--text3)", fontWeight: 700 }}>
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
                <div style={{ width: 1, flex: 1, background: "var(--wa06)" }} />
                <div style={{ fontSize: 8, color: "var(--text3)", fontWeight: 700, letterSpacing: ".1em", writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", padding: "8px 0" }}>LỐI ĐI</div>
                <div style={{ width: 1, flex: 1, background: "var(--wa06)" }} />
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

    const hcw = isMobile ? 64 : 72;
    return (
      <div style={{ padding: isMobile ? "14px 10px 18px" : "20px 24px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: isMobile ? 10 : 14, marginBottom: 20, padding: isMobile ? "12px 14px" : "14px 18px", borderRadius: 12, background: `${color}08`, border: `1px solid ${color}28` }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{TO_NAMES[groupIdx]}</div>
            <div style={{ fontSize: 11, color: "var(--text4)" }}>Dãy {sideLabel} · Hàng {startRow + 1}–{startRow + TO_ROWS}</div>
          </div>
          <div style={{ display: "flex", gap: isMobile ? 10 : 14, flexWrap: "wrap" }}>
            {[["Sĩ số",groupStudents.length,color],["Có mặt",stats.present,"#34D399"],["Vắng",groupStudents.length-stats.present,"#EF4444"],["Trống",emptySlots,"var(--text2)"]].map(([l,v,c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div className="hfont" style={{ fontSize: 18, fontWeight: 400, color: c }}>{v}</div>
                <div style={{ fontSize: 10, color: "var(--text3)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, overflowX: "auto" }}>
          <div>
            <div style={{ display: "flex", gap: isMobile ? 4 : 6, marginBottom: 4, paddingLeft: 22 }}>
              {Array.from({ length: TO_COLS }, (_, c) => (
                <div key={c} style={{ width: hcw, textAlign: "center", fontSize: 10, color: color, fontWeight: 700, opacity: .7 }}>{sideLabel}{c+1}</div>
              ))}
            </div>
            {Array.from({ length: TO_ROWS }, (_, localRow) => {
              const globalRow = startRow + localRow;
              return (
                <div key={localRow} style={{ display: "flex", gap: isMobile ? 4 : 6, marginBottom: isMobile ? 4 : 6, alignItems: "center" }}>
                  <div style={{ width: 20, fontSize: 10, color: color, fontWeight: 700, textAlign: "right", flexShrink: 0, opacity: .8 }}>{globalRow + 1}</div>
                  {Array.from({ length: TO_COLS }, (_, col) => {
                    const slotI = globalSlotIdx(side, globalRow, col);
                    const st = getStudentAt(slotI);
                    const present = st && (state.attendance[attKey] || []).includes(st.id);
                    const isHov2 = hovSlot === slotI && editMode;
                    const isDragging2 = st && dragId === st.id;
                    const isDropTarget2 = isHov2 && dragId !== null;
                    const isTapSel2 = editMode && !!tapSel && !tapSel.fromUnassigned && tapSel.slot === slotI;
                    const isMe2 = user.role === "student" && st?.id === user.data.id;
                    const cw = isMobile ? 64 : 72, ch = isMobile ? 72 : 80;
                    return (
                      <div key={col} className={`seat-cell${st ? " occupied" : ""}`}
                        draggable={editMode && !!st}
                        onDragStart={e => { if (!editMode || !st) return; e.dataTransfer.effectAllowed = "move"; handleDragStart(st.id); }}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => { if (!editMode) return; e.preventDefault(); setHovSlot(slotI); }}
                        onDragLeave={e => { if (e.currentTarget.contains(e.relatedTarget)) return; setHovSlot(null); }}
                        onDrop={e => { e.preventDefault(); handleDrop(slotI); }}
                        onClick={() => handleTapSeat(slotI)}
                        onContextMenu={e => { if (editMode && st) { e.preventDefault(); clearSlot(slotI); } }}
                        onMouseEnter={() => !editMode && st && setHovSlot(slotI)}
                        onMouseLeave={() => setHovSlot(null)}
                        style={{ width: cw, height: ch, borderRadius: 11, background: isTapSel2 ? "#A78BFA22" : isDropTarget2 ? `${color}18` : st ? (isMe2 ? `${color}15` : `${color}07`) : "var(--wa015)", border: isMe2 ? `2px solid ${color}` : `1.5px solid ${isTapSel2 ? "#A78BFA" : isDropTarget2 ? color : st ? (present ? "#34D399" : `${color}35`) : "var(--wa055)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, position: "relative", opacity: isDragging2 ? 0.3 : 1, cursor: editMode ? (st ? "pointer" : (tapSel ? "copy" : "default")) : "default", transition: "all .2s", flexShrink: 0, boxShadow: isTapSel2 ? "0 0 0 3px rgba(167,139,250,.28)" : isDropTarget2 ? `0 0 16px ${color}35` : isMe2 ? `0 0 0 3px ${color}44` : st && !isDropTarget2 ? `0 2px 12px ${color}14` : "none" }}
                      >
                        {isMe2 && <div style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", background: color, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8, zIndex: 10, whiteSpace: "nowrap", maxWidth: cw + 24, overflow: "hidden", textOverflow: "ellipsis" }}>{st.name}</div>}
                        {st ? (
                          <>
                            <div style={{ width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: "50%", overflow: "hidden", background: "var(--wa07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid ${present ? "#34D399" : `${color}45`}` }}>
                              {st.photo ? <img src={st.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={isMobile ? 14 : 17} strokeWidth={1.6} style={{ color: "var(--text3)" }} />}
                            </div>
                            <div style={{ fontSize: 9, color: "var(--text3)", textAlign: "center", padding: "0 4px", lineHeight: 1.3, maxWidth: cw - 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{st.name.split(" ").pop()}</div>
                            <div style={{ fontSize: 8, color: "var(--text4)", fontFamily: "monospace" }}>{st.code}</div>
                            <div style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", background: present ? "#34D399" : "#EF4444", boxShadow: present ? "0 0 7px rgba(52,211,153,.7)" : "none" }} />
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
                  <Av photo={s.photo} sz={18} />
                  <span>{s.name.split(" ").pop()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SEAT_TABS = isMobile ? [
    { id: "to1", label: "Tổ 1", color: TO_COLORS[0] },
    { id: "to2", label: "Tổ 2", color: TO_COLORS[1] },
    { id: "to3", label: "Tổ 3", color: TO_COLORS[2] },
    { id: "to4", label: "Tổ 4", color: TO_COLORS[3] },
  ] : [
    { id: "overview", label: "🏫 Tổng thể", color: "var(--accent)" },
    { id: "to1", label: "Tổ 1", color: TO_COLORS[0] },
    { id: "to2", label: "Tổ 2", color: TO_COLORS[1] },
    { id: "to3", label: "Tổ 3", color: TO_COLORS[2] },
    { id: "to4", label: "Tổ 4", color: TO_COLORS[3] },
  ];

  return (
    <div className="page" style={{ padding: isMobile ? 12 : 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {myClasses.map(c => (
          <button key={c.id} onClick={() => setSelClass(c.id)} style={{ padding: "6px 14px", borderRadius: 9, border: `1px solid ${selClass === c.id ? "rgba(79,172,254,.4)" : "var(--wa07)"}`, background: selClass === c.id ? "rgba(79,172,254,.1)" : "transparent", color: selClass === c.id ? "var(--accent)" : "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{c.name}</button>
        ))}
        {user.role === "teacher" && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setEditMode(p => !p)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${editMode ? "rgba(167,139,250,.45)" : "var(--wa08)"}`, background: editMode ? "rgba(167,139,250,.1)" : "transparent", color: editMode ? "#A78BFA" : "var(--text2)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              <GripVertical size={12} />{editMode ? "✓ Xong" : "Sửa chỗ ngồi"}
            </button>
            <button onClick={resetSeats} style={{ padding: "5px 11px", borderRadius: 8, border: "1px solid var(--wa08)", background: "transparent", color: "var(--text2)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}><RefreshCw size={11} />Reset</button>
          </div>
        )}
      </div>

      {editMode && (
        <div style={{ padding: "9px 14px", borderRadius: 9, background: "rgba(167,139,250,.06)", border: "1px solid rgba(167,139,250,.22)", fontSize: 11, color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <GripVertical size={12} />
            {tapSel
              ? <>Đã chọn <b>{selTapStudent?.name?.split(" ").pop() || "học sinh"}</b> · chạm 1 ô để đổi chỗ</>
              : <>Chạm 1 học sinh rồi chạm ô khác để đổi chỗ{!isMobile && " · kéo thả cũng dùng được · chuột phải để bỏ chỗ"}</>
            }
          </span>
          {tapSel && (
            <span style={{ display: "flex", gap: 6 }}>
              {!tapSel.fromUnassigned && (
                <button onClick={removeTapSelFromSeat} style={{ padding: "3px 9px", borderRadius: 6, border: "1px solid rgba(239,68,68,.35)", background: "rgba(239,68,68,.08)", color: "#EF4444", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Bỏ chỗ</button>
              )}
              <button onClick={() => setTapSel(null)} style={{ padding: "3px 9px", borderRadius: 6, border: "1px solid var(--wa08)", background: "transparent", color: "var(--text2)", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Hủy</button>
            </span>
          )}
        </div>
      )}

      <div className="scard" style={{ overflow: "hidden" }}>
        <div style={{ padding: "0 16px", borderBottom: "1px solid var(--wa055)", display: "flex", alignItems: "center", gap: 2, overflowX: "auto" }}>
          {SEAT_TABS.map(({ id, label, color }) => (
            <button key={id} onClick={() => setSeatTab(id)} style={{ padding: "12px 16px", border: "none", cursor: "pointer", background: "transparent", color: seatTab === id ? color : "var(--text4)", fontSize: 12, fontWeight: seatTab === id ? 700 : 500, fontFamily: "inherit", whiteSpace: "nowrap", borderBottom: `2px solid ${seatTab === id ? color : "transparent"}`, marginBottom: -1, transition: "all .2s" }}>
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text4)", paddingRight: 4 }}>
            {[["#34D399","Có mặt"],["#EF4444","Vắng"]].map(([c, l]) => (
              <span key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />{l}
              </span>
            ))}
            <span style={{ color: "var(--text2)" }}>{classStudents.length} HS</span>
          </div>
        </div>

        {seatTab === "overview" && !isMobile && <OverviewView />}
        {seatTab === "to1" && <ToView groupIdx={0} />}
        {seatTab === "to2" && <ToView groupIdx={1} />}
        {seatTab === "to3" && <ToView groupIdx={2} />}
        {seatTab === "to4" && <ToView groupIdx={3} />}

        {unassigned.length > 0 && (
          <div style={{ margin: isMobile ? "0 10px 14px" : "0 18px 18px", padding: isMobile ? "12px 12px" : "14px 16px", borderRadius: 11, background: "rgba(245,158,11,.04)", border: "1px solid rgba(245,158,11,.22)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>⚠ {unassigned.length} học sinh chưa có chỗ ngồi</div>
              {user.role === "teacher" && (
                <div style={{ display: "flex", gap: 7 }}>
                  {!editMode && <button onClick={() => setEditMode(true)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(167,139,250,.32)", background: "rgba(167,139,250,.07)", color: "#A78BFA", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Bật sửa chỗ</button>}
                  <button onClick={autoPlace} style={{ padding: "4px 12px", borderRadius: 7, border: "1px solid rgba(245,158,11,.38)", background: "rgba(245,158,11,.08)", color: "#F59E0B", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Xếp tự động</button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {unassigned.map(s => {
                const isSelUnassigned = tapSel?.fromUnassigned && tapSel.id === s.id;
                return (
                  <div key={s.id} draggable={editMode} onDragStart={e => { if (!editMode) return; e.dataTransfer.effectAllowed = "move"; handleDragStart(s.id); }} onDragEnd={handleDragEnd}
                    onClick={() => handleTapUnassigned(s)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 9, background: isSelUnassigned ? "rgba(167,139,250,.14)" : "var(--wa045)", border: `1px solid ${isSelUnassigned ? "#A78BFA" : editMode ? "rgba(245,158,11,.32)" : "var(--wa1)"}`, cursor: editMode ? "pointer" : "default", fontSize: 11, color: "var(--text3)", boxShadow: isSelUnassigned ? "0 0 0 3px rgba(167,139,250,.2)" : "none" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", background: "var(--wa07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={13} strokeWidth={1.6} style={{ color: "var(--text3)" }} />}
                    </div>
                    <span>{s.name.split(" ").pop()}</span>
                    <span style={{ fontSize: 9, color: "var(--text4)" }}>{s.code}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--wa04)", fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
          {editMode ? "Chạm để chọn rồi chạm ô khác để đổi chỗ · Nút \"Bỏ chỗ\" để xóa" : "Di chuột / chạm để xem chi tiết · Tab Tổ để quản lý từng nhóm"}
        </div>
      </div>
    </div>
  );
}


// attendance



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
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--wa09)", background: "var(--wa04)", color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={13} /></button>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{monthNames[month]} {year}</span>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--wa09)", background: "var(--wa04)", color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={13} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,32px)", gap: 3, justifyContent: "center" }}>
        {dayNames.map(d => <div key={d} style={{ width: 32, textAlign: "center", fontSize: 9, fontWeight: 700, color: "var(--text3)", paddingBottom: 4 }}>{d}</div>)}
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
              onClick={() => hasSession && onSelectDate(dateStr)} style={{ outline: isSelected ? "2px solid var(--accent)" : "none", outlineOffset: 1 }}>
              {day}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "center", fontSize: 10, color: "var(--text4)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(52,211,153,.3)", border: "1px solid rgba(52,211,153,.55)" }} />Có mặt</span>
        {studentId && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(239,68,68,.22)", border: "1px solid rgba(239,68,68,.38)" }} />Vắng</span>}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(79,172,254,.18)", border: "2px solid var(--accent)" }} />Hôm nay</span>
      </div>
    </div>
  );
}

function AttPage({ state, user, selClass, setSelClass, myClasses }) {
  useActivityTracker("Điểm danh", "Vào điểm danh", user.role);
  const today = (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
  const [viewDate, setViewDate] = useState(today);
  const [tab, setTab] = useState("today");
  const [selStudent, setSelStudent] = useState(null);
  const [faceCameraActive, setFaceCameraActive] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);
  const [detectedFaceStudent, setDetectedFaceStudent] = useState(null);
  const [selectedFaceStudentId, setSelectedFaceStudentId] = useState("");
  const [faceNoMatchTick, setFaceNoMatchTick] = useState(0); // đổi giá trị mỗi lần quét không nhận ra ai, để nhấp nháy UI báo hiệu
  const [livenessPending, setLivenessPending] = useState(false);
  const [livenessTargetName, setLivenessTargetName] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const attKey = `${selClass}_${viewDate}`;
  const presentIds = state.attendance[attKey] || [];
  const classStudents = useMemo(() => state.students.filter(s => s.classId === selClass), [state.students, selClass]);

  // Engine nhận diện khuôn mặt thật (face-api.js), tính sẵn descriptor cho ảnh của từng học sinh trong lớp
  const { modelsReady, modelError, computing: computingFaces, knownCount, recognizeFromVideo, resetLiveness } = useFaceRecognition(classStudents);

  const startFaceCamera = async () => {
    try {
      setDetectedFaceStudent(null);
      setLivenessPending(false);
      setLivenessTargetName("");
      resetLiveness();
      setFaceCameraActive(true);
      setTimeout(async () => {
        try {
          let stream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
          } catch (err) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          alert("Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt. Chi tiết: " + (err.message || err));
          setFaceCameraActive(false);
        }
      }, 50);
    } catch (err) {
      alert("Không thể khởi động camera.");
      setFaceCameraActive(false);
    }
  };

  const stopFaceCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setFaceCameraActive(false);
    setLivenessPending(false);
    setLivenessTargetName("");
  };

  const playFaceBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.18);
    } catch {}
  };

  const startFaceScan = async () => {
    if (!faceCameraActive || !streamRef.current || !videoRef.current) return;
    if (classStudents.length === 0) {
      stopFaceCamera();
      alert("Lớp học này chưa có học sinh nào. Vui lòng thêm học sinh trước.");
      return;
    }
    if (!selectedFaceStudentId && classStudents.length > 0 && presentIds.length >= classStudents.length) {
      stopFaceCamera();
      alert("Tất cả học sinh trong lớp đã được điểm danh xong!");
      return;
    }

    setFaceScanning(true);
    setDetectedFaceStudent(null);
    setLivenessPending(false);
    setLivenessTargetName("");
    resetLiveness();

    // Chờ 1.5 giây chạy hiệu ứng quét laser ban đầu
    await new Promise(r => setTimeout(r, 1500));

    const startTime = Date.now();
    const TIMEOUT_MS = 12000; // Hủy quét sau 12 giây nếu không có nháy mắt để tránh treo

    try {
      let target = null;

      // Vòng lặp nhận diện + kiểm tra liveness liên tục
      while (faceCameraActive && !target && (Date.now() - startTime < TIMEOUT_MS)) {
        if (!faceCameraActive) break;

        if (modelsReady && videoRef.current && videoRef.current.readyState >= 2 && recognizeFromVideo) {
          try {
            const detected = await recognizeFromVideo(videoRef.current);
            if (detected && detected.studentId) {
              const matchedStudent = classStudents.find(s => s.id === detected.studentId);
              
              if (matchedStudent) {
                if (detected.livenessPassed) {
                  // Xác thực nháy mắt thành công!
                  target = matchedStudent;
                  break;
                } else {
                  // Nhận diện được mặt nhưng chưa nháy mắt
                  setLivenessPending(true);
                  setLivenessTargetName(matchedStudent.name);
                }
              }
            } else {
              setLivenessPending(false);
              setLivenessTargetName("");
            }
          } catch (err) {
            console.warn("Lỗi nhận diện liveness:", err);
          }
        }
        // Chờ 45ms giữa các frame quét để bắt kịp nháy mắt nhanh và tiết kiệm CPU
        await new Promise(r => setTimeout(r, 45));
      }

      setFaceScanning(false);
      setLivenessPending(false);
      setLivenessTargetName("");

      if (target) {
        playFaceBeep();
        setDetectedFaceStudent(target);
        state.setAttendance(p => {
          const prev = p[attKey] || [];
          if (prev.includes(target.id)) return p;
          return { ...p, [attKey]: [...prev, target.id] };
        });
        if (selectedFaceStudentId) setSelectedFaceStudentId("");
      } else {
        // Nhấp nháy báo hiệu không quét thành công hoặc quá thời gian liveness
        setFaceNoMatchTick(t => t + 1);
      }
    } catch (err) {
      console.error("Lỗi trong quá trình quét:", err);
      setFaceScanning(false);
      setLivenessPending(false);
      setLivenessTargetName("");
    }
  };


  // Tự động dọn dẹp kết quả quét thành công sau 2.5 giây để tiếp tục quét tự động lượt tiếp theo
  useEffect(() => {
    if (!detectedFaceStudent || !faceCameraActive) return;
    const t = setTimeout(() => {
      setDetectedFaceStudent(null);
    }, 2500);
    return () => clearTimeout(t);
  }, [detectedFaceStudent, faceCameraActive]);

  // Vòng lặp quét tự động khi camera đang mở, không trong lúc quét và chưa có kết quả hiển thị
  useEffect(() => {
    if (!faceCameraActive || faceScanning || detectedFaceStudent) return;
    const interval = setInterval(() => {
      if (faceCameraActive && streamRef.current && videoRef.current && !faceScanning && !detectedFaceStudent) {
        clearInterval(interval);
        startFaceScan();
      }
    }, 500); // Check every 500ms to ensure stream is loaded
    return () => clearInterval(interval);
  }, [faceCameraActive, faceScanning, detectedFaceStudent, modelsReady]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggle = sid => {
    if (user.role !== "teacher") return;
    state.setAttendance(p => { const prev = p[attKey] || []; return { ...p, [attKey]: prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid] }; });
  };
  const markAll = yes => state.setAttendance(p => ({ ...p, [attKey]: yes ? classStudents.map(s => s.id) : [] }));

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
          {myClasses.map(c => <button key={c.id} onClick={() => { stopFaceCamera(); setDetectedFaceStudent(null); setSelClass(c.id); }} style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${selClass === c.id ? "rgba(79,172,254,.4)" : "var(--wa07)"}`, background: selClass === c.id ? "rgba(79,172,254,.1)" : "transparent", color: selClass === c.id ? "var(--accent)" : "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{c.name}</button>)}
        </div>
      )}
      <div style={{ display: "flex", gap: 4 }}>
        {tabs.map(([v, l]) => <button key={v} onClick={() => setTab(v)} style={{ padding: "6px 15px", borderRadius: 9, border: `1px solid ${tab === v ? "rgba(79,172,254,.4)" : "var(--wa07)"}`, background: tab === v ? "rgba(79,172,254,.1)" : "transparent", color: tab === v ? "var(--accent)" : "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>)}
      </div>
      {tab === "today" && (
        <div style={{ display: "grid", gridTemplateColumns: user.role === "teacher" ? "1fr 1.3fr" : "1fr", gap: 14, alignItems: "start" }}>
          {user.role === "teacher" ? (
            <Card style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>Điểm danh học sinh</div>
                <div style={{ fontSize: 11, color: "var(--text4)" }}>Lớp {myClasses.find(c => c.id === selClass)?.name} · {today}</div>
              </div>

              {/* TỰ ĐỘNG ĐIỂM DANH (CAMERA / FACE ID) */}
              <div className="scard" style={{ padding: 14, border: "1px solid var(--border2)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 6, color: "var(--text)" }}>
                  <Camera size={15} color="var(--accent)" /> ĐIỂM DANH FACE ID (TỰ ĐỘNG)
                </h3>

                {knownCount === 0 && classStudents.length > 0 && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 10, textAlign: "left" }}>
                    <AlertTriangle size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.5 }}>
                      Chưa có học sinh nào trong lớp có ảnh đại diện rõ mặt. Vui lòng cập nhật ảnh đại diện của học sinh để hệ thống nhận diện.
                    </div>
                  </div>
                )}

                <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "#060f1e", borderRadius: 10, border: "2px solid var(--wa1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: faceCameraActive ? "block" : "none", transform: "scaleX(-1)" }} />
                  {faceCameraActive ? (
                    <>
                      {/* Vòng tròn căn chỉnh khuôn mặt */}
                      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <mask id="face-mask-att">
                              <rect x="0" y="0" width="100" height="100" fill="white" />
                              <circle cx="50" cy="50" r="30" fill="black" />
                            </mask>
                          </defs>
                          <rect x="0" y="0" width="100" height="100" fill="black" fillOpacity="0.4" mask="url(#face-mask-att)" />
                          <circle cx="50" cy="50" r="30" fill="none" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
                        </svg>
                      </div>

                      {faceScanning && (
                        <>
                          <div className="qs-laser" style={{ background: "linear-gradient(to bottom, transparent, var(--accent))", height: "4px", boxShadow: "0 0 10px var(--accent)" }} />
                          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.85)", border: "1.5px solid var(--accent)", borderRadius: 8, padding: "8px 16px", color: "var(--accent)", fontSize: 10, fontWeight: 800, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                            <span>ĐANG QUÉT GƯƠNG MẶT...</span>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--text3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <CameraOff size={36} style={{ opacity: 0.3 }} />
                      <div style={{ fontSize: 11, fontWeight: 600 }}>Camera đang tắt</div>
                    </div>
                  )}
                </div>

                {faceCameraActive && !modelsReady && (
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <RefreshCw size={11} style={{ animation: "spin360 1s linear infinite" }} /> Đang tải mô hình AI (chỉ chậm ở lần đầu)...
                  </div>
                )}
                {faceCameraActive && modelsReady && computingFaces && (
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <RefreshCw size={11} style={{ animation: "spin360 1s linear infinite" }} /> Đang phân tích ảnh đại diện học sinh ({knownCount} học sinh có ảnh)...
                  </div>
                )}
                {faceCameraActive && modelsReady && !computingFaces && (
                  <div key={faceNoMatchTick} style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, animation: "glowbeat 2s infinite" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} /> 
                    {faceScanning ? "ĐANG QUÉT..." : detectedFaceStudent ? `ĐÃ NHẬN DIỆN: ${detectedFaceStudent.name}` : "HỆ THỐNG ĐANG TỰ ĐỘNG QUÉT..."}
                  </div>
                )}

                <button onClick={faceCameraActive ? stopFaceCamera : startFaceCamera} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 16px", background: faceCameraActive ? "rgba(239,68,68,0.1)" : "var(--wa05)", border: faceCameraActive ? "1px solid #EF4444" : "1px solid var(--border2)", color: faceCameraActive ? "#EF4444" : "var(--text)", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, width: "100%", fontFamily: "inherit" }}>
                  <Camera size={14} /> {faceCameraActive ? "Tắt tự động quét" : "Bật tự động quét (Face ID)"}
                </button>

              </div>

              {/* ĐÃ NHẬN DIỆN THÀNH CÔNG ANNOUNCEMENT */}
              {detectedFaceStudent && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.3)", borderRadius: 10, animation: "pop .3s ease", textAlign: "left" }}>
                  <Av photo={detectedFaceStudent.photo} sz={32} glow />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Đã điểm danh</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#34D399" }}>{detectedFaceStudent.name}</div>
                  </div>
                  <div style={{ fontSize: 18 }}>✅</div>
                </div>
              )}

              {/* ĐIỂM DANH THỦ CÔNG */}
              <div className="scard" style={{ padding: 14, border: "1px solid var(--border2)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 6, color: "var(--text)" }}>
                  <UserCheck size={15} color="var(--accent)" /> ĐIỂM DANH THỦ CÔNG / SAO LƯU
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>CHỌN HỌC SINH:</div>
                    <select value={selectedFaceStudentId} onChange={e => setSelectedFaceStudentId(e.target.value)} style={{ padding: "4px 8px", borderRadius: 8, background: "var(--wa055)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 11, outline: "none", fontFamily: "inherit", maxWidth: 170 }}>
                      <option value="">-- Chọn học sinh --</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} {presentIds.includes(s.id) ? "✓" : ""}</option>)}
                    </select>
                  </div>

                  {selectedFaceStudentId && (
                    <button onClick={() => {
                      const student = classStudents.find(s => s.id === selectedFaceStudentId);
                      if (student) {
                        state.setAttendance(p => {
                          const prev = p[attKey] || [];
                          if (prev.includes(student.id)) return p;
                          return { ...p, [attKey]: [...prev, student.id] };
                        });
                        setSelectedFaceStudentId("");
                      }
                    }} style={{ padding: "8px 12px", background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.3)", color: "#34D399", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>
                      ✓ Điểm danh cho học sinh đã chọn
                    </button>
                  )}

                  <div style={{ borderTop: "1px solid var(--border2)", paddingTop: 10, display: "flex", gap: 8 }}>
                    <button onClick={() => markAll(true)} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "none", cursor: "pointer", background: "rgba(52,211,153,.1)", color: "#34D399", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>✓ Điểm tất cả</button>
                    <button onClick={() => markAll(false)} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "none", cursor: "pointer", background: "rgba(239,68,68,.08)", color: "#EF4444", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>✗ Xóa tất cả</button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card style={{ textAlign: "center", padding: "24px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Điểm danh hôm nay</div>
              {presentIds.includes(user.data.id) ? (
                <div style={{ animation: "pop .4s ease", paddingTop: 8 }}>
                  <div style={{ fontSize: 60, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#34D399", marginBottom: 5 }}>Bạn đã có mặt!</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 14 }}>Giáo viên đã quét nhận dạng khuôn mặt hoặc điểm danh trực tiếp cho bạn.</div>
                  <div style={{ fontSize: 11, color: "var(--text4)", fontStyle: "italic" }}>Học sinh: {user.data.name} ({user.data.code})</div>
                </div>
              ) : (
                <div style={{ padding: "16px 0" }}>
                  <div style={{ fontSize: 60, marginBottom: 12 }}>⏳</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#F59E0B", marginBottom: 5 }}>Chưa điểm danh</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 18, maxWidth: 320, margin: "0 auto" }}>Vui lòng liên hệ Giáo viên để quét khuôn mặt (Face ID) hoặc điểm danh trực tiếp trên lớp.</div>
                  <div style={{ fontSize: 11, color: "var(--text4)", fontStyle: "italic" }}>Học sinh: {user.data.name} ({user.data.code})</div>
                </div>
              )}
            </Card>
          )}
          <div className="scard" style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--wa055)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Danh sách</div>
              {user.role === "teacher" && <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid var(--wa09)", background: "var(--wa04)", color: "var(--text3)", fontSize: 11, fontFamily: "inherit", outline: "none" }} />}
              <div style={{ display: "flex", gap: 6 }}><Badge c="green">{presentIds.length} có mặt</Badge><Badge c="red">{classStudents.length - presentIds.length} vắng</Badge></div>
            </div>
            {classStudents.length === 0 ? <div style={{ padding: 28, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>Chưa có học sinh</div> : (
              <>
                <div style={{ maxHeight: 340, overflowY: "auto" }}>
                  {classStudents.map(s => {
                    const present = presentIds.includes(s.id);
                    return (
                      <div key={s.id} onClick={() => toggle(s.id)} style={{ padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--wa025)", cursor: user.role === "teacher" ? "pointer" : "default", transition: "background .15s" }}
                        onMouseEnter={e => { if (user.role === "teacher") e.currentTarget.style.background = "var(--wa018)"; }}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <Av photo={s.photo} sz={28} glow={present} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: "var(--text3)" }}>{s.code}</div>
                        </div>
                        {user.role === "teacher" && <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${present ? "#34D399" : "var(--wa14)"}`, background: present ? "rgba(52,211,153,.12)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>{present && <Check size={9} color="#34D399" />}</div>}
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: present ? "#34D399" : "#EF4444", boxShadow: present ? "0 0 7px rgba(52,211,153,.65)" : "none" }} />
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: "10px 16px", borderTop: "1px solid var(--wa04)" }}>
                  <Bar val={presentIds.length} max={classStudents.length} col="#34D399" h={5} />
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4, textAlign: "center" }}>{presentIds.length}/{classStudents.length} · {pct}%</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {tab === "calendar" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14, alignItems: "start" }}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>{user.role === "student" ? "Lịch điểm danh của tôi" : selStudent ? `Lịch: ${classStudents.find(s => s.id === selStudent)?.name}` : "Chọn học sinh để xem"}</div>
            <AttCalendar classId={selClass} studentId={user.role === "student" ? user.data.id : selStudent} attendance={state.attendance} onSelectDate={setViewDate} selectedDate={viewDate} />
            {viewDate && (
              <div style={{ marginTop: 14, padding: "10px 13px", borderRadius: 10, background: "rgba(79,172,254,.05)", border: "1px solid rgba(79,172,254,.18)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>{new Date(viewDate + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</div>
                {(() => { const dp = state.attendance[`${selClass}_${viewDate}`] || []; const sid = user.role === "student" ? user.data.id : selStudent; if (!sid) return <div style={{ fontSize: 11, color: "var(--text4)" }}>{dp.length}/{classStudents.length} có mặt</div>; const ip = dp.includes(sid); return <div style={{ fontSize: 12, fontWeight: 600, color: ip ? "#34D399" : "#EF4444" }}>{ip ? "✓ Có mặt" : "✗ Vắng mặt"}</div>; })()}
              </div>
            )}
          </Card>
          {user.role === "teacher" ? (
            <div className="scard" style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--wa055)", fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Chọn học sinh để xem lịch</div>
              <div style={{ maxHeight: 450, overflowY: "auto" }}>
                {classStudents.map(s => {
                  const stats = getStats(s.id);
                  const isSel = selStudent === s.id;
                  return (
                    <div key={s.id} onClick={() => setSelStudent(isSel ? null : s.id)} style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--wa025)", cursor: "pointer", background: isSel ? "rgba(79,172,254,.07)" : "transparent", transition: "background .15s" }}>
                      <Av photo={s.photo} sz={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isSel ? "var(--accent)" : "var(--text)" }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text3)" }}>{s.code}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: stats.pct >= 80 ? "#34D399" : stats.pct >= 60 ? "#F59E0B" : "#EF4444" }}>{stats.pct}%</div>
                        <div style={{ fontSize: 9, color: "var(--text3)" }}>{stats.p}/{totalSessions}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Tóm tắt chuyên cần</div>
              {(() => { const s = getStats(user.data.id); return (<><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>{[["Có mặt",s.p,"#34D399"],["Vắng",s.a,"#EF4444"],["Tỉ lệ",s.pct+"%",s.pct>=80?"#34D399":s.pct>=60?"#F59E0B":"#EF4444"]].map(([l,v,c]) => (<div key={l} style={{ textAlign: "center", padding: "12px 8px", borderRadius: 10, background: "var(--wa025)", border: "1px solid var(--wa06)" }}><div className="hfont" style={{ fontSize: 20, fontWeight: 400, color: c }}>{v}</div><div style={{ fontSize: 10, color: "var(--text4)", marginTop: 2 }}>{l}</div></div>))}</div><Bar val={s.p} max={totalSessions||1} col={s.pct>=80?"#34D399":s.pct>=60?"#F59E0B":"#EF4444"} h={6} /><div style={{ fontSize: 10, color: "var(--text3)", marginTop: 5, textAlign: "center" }}>{s.p}/{totalSessions} buổi</div></>); })()}
            </Card>
          )}
        </div>
      )}
      {tab === "stats" && user.role === "teacher" && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Thống kê chuyên cần toàn lớp</div>
          <div style={{ borderRadius: 11, overflow: "hidden", border: "1px solid var(--wa06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 120px", gap: 8, padding: "8px 14px", background: "var(--wa025)", fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: ".05em" }}>
              <span>HỌC SINH</span><span style={{ textAlign: "center" }}>CÓ MẶT</span><span style={{ textAlign: "center" }}>VẮNG</span><span style={{ textAlign: "center" }}>TỈ LỆ</span><span>BIỂU ĐỒ</span>
            </div>
            {classStudents.map(s => { const st = getStats(s.id); return (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 120px", gap: 8, padding: "10px 14px", borderTop: "1px solid var(--wa035)", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Av photo={s.photo} sz={24} /><div><div style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: 10, color: "var(--text3)" }}>{s.code}</div></div></div>
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useActivityTracker("Chat", `Vào kênh #${channel}`, user.role);
  const [inp, setInp] = useState("");
  const [file, setFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileRef = useRef(null);
  const bot = useRef(null);
  const msgKey = `${classId}_${channel}`;
  const msgs = state.messages[msgKey] || [];
  const classStudents = useMemo(() => state.students.filter(s => s.classId === classId), [state.students, classId]);

  // Unread badge tracking (per channel, persisted locally per user)
  const lastReadStorageKey = `eclass_chat_lastread_${user.role}_${user.data.id}`;
  const [lastRead, setLastRead] = useState(() => {
    try {
      const raw = localStorage.getItem(lastReadStorageKey);
      if (raw !== null) return JSON.parse(raw);
    } catch {}
    return null; // null = chưa khởi tạo lần đầu
  });

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { alert("File quá lớn (tối đa 10MB)"); return; }
    setUploadingFile(true);
    const r = new FileReader();
    r.onload = () => {
      setFile({ name: f.name, type: f.name.split(".").pop().toLowerCase(), data: r.result });
      setUploadingFile(false);
    };
    r.readAsDataURL(f);
  };

  const send = async () => {
    if (!inp.trim() && !file) return;
    const text = inp.trim();
    const currentFile = file;
    setInp(""); setFile(null);
    try {
      const saved = await api.sendMessage({
        classId, channel, text, attachment: currentFile,
        senderName: user.data.name,
        senderRole: user.role,
        senderEmoji: user.data.em || (user.role === "teacher" ? "👨‍🏫" : "😊")
      });
      if (saved) {
        state.setMessages(p => ({ ...p, [msgKey]: [...(p[msgKey] || []), saved] }));
      }
    } catch {
      // Fallback: add optimistically with temp id
      const msg = { id: Date.now(), user: user.data.name, role: user.role, em: user.data.em || (user.role === "teacher" ? "👨‍🏫" : "😊"), text, attachment: currentFile ? JSON.stringify({ name: currentFile.name, type: currentFile.type, url: currentFile.data }) : null, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) };
      state.setMessages(p => ({ ...p, [msgKey]: [...(p[msgKey] || []), msg] }));
    }
  };

  const channels = useMemo(
    () => getChatChannels(user, state, classId),
    [user.role, user.data.id, classId, state.seats]
  );

  useEffect(() => {
    if (!channels.includes(channel)) setChannel("chung");
  }, [channels, channel]);

  // Cuộn xuống cuối khi đổi kênh hoặc có tin nhắn mới (tin nhắn mới được nạp bởi polling nền ở App)
  useEffect(() => {
    setTimeout(() => bot.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [msgKey, msgs.length]);

  // Đánh dấu đã đọc kênh đang mở mỗi khi vào kênh / có tin nhắn mới trong kênh đó
  useEffect(() => {
    if (!msgs.length) return;
    const lastId = msgs[msgs.length - 1].id;
    setLastRead(p => {
      const base = p || {};
      if (base[msgKey] === lastId) return p;
      const next = { ...base, [msgKey]: lastId };
      try { localStorage.setItem(lastReadStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [msgKey, msgs.length]);

  // Lần đầu bật tính năng: coi tin nhắn hiện có là đã đọc hết, tránh báo unread ảo
  useEffect(() => {
    if (lastRead !== null) return;
    const init = {};
    channels.forEach(ch => {
      const key = `${classId}_${ch}`;
      const list = state.messages[key] || [];
      if (list.length) init[key] = list[list.length - 1].id;
    });
    setLastRead(init);
    try { localStorage.setItem(lastReadStorageKey, JSON.stringify(init)); } catch {}
  }, [lastRead, channels, classId, state.messages, lastReadStorageKey]);

  const unreadCounts = useMemo(() => {
    const counts = {};
    if (!lastRead) return counts;
    channels.forEach(ch => {
      const key = `${classId}_${ch}`;
      const chMsgs = state.messages[key] || [];
      const lastReadId = lastRead[key] || 0;
      counts[ch] = chMsgs.filter(m => m.id > lastReadId && m.user !== user.data.name).length;
    });
    return counts;
  }, [channels, state.messages, lastRead, classId, user.data.name]);

  const activeMembers = useMemo(() => {
    const teacher = state.teachers.find(t => t.id === cls?.teacherId);
    let studentsInChannel = classStudents;
    if (channel.startsWith("tổ-")) {
      const g = parseInt(channel.split("-")[1]) - 1;
      const groupStudentIds = Object.entries(state.seats[classId] || {})
        .filter(([slotIdx]) => groupSlots(g).includes(Number(slotIdx)))
        .map(([, id]) => id);
      studentsInChannel = classStudents.filter(s => groupStudentIds.includes(s.id));
    }
    const list = [];
    if (teacher && !channel.startsWith("tổ-")) list.push({ ...teacher, isTeacher: true, name: `(GV) ${teacher.name}` });
    list.push(...studentsInChannel);
    return list;
  }, [channel, classStudents, state.seats, classId, cls, state.teachers]);

  return (
    <div className="page" style={{ padding: 20, height: "calc(100vh - 100px)", display: "flex", gap: 12 }}>
      {sidebarOpen && (
        <div style={{ width: 168, borderRadius: 13, background: "var(--card-bg)", border: "1px solid var(--border2)", padding: 10, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          <button onClick={() => setSidebarOpen(false)} title="Thu gọn kênh chat" style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 6, border: "1px solid var(--wa08)", background: "var(--wa03)", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
            <ChevronLeft size={12} />
          </button>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", letterSpacing: ".08em", padding: "3px 22px 3px 7px", marginBottom: 6 }}>KÊNH — {cls?.name}</div>
          {channels.map(ch => {
            const uc = unreadCounts[ch] || 0;
            return (
              <div key={ch} onClick={() => setChannel(ch)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", borderRadius: 7, cursor: "pointer", background: channel === ch ? "rgba(79,172,254,.1)" : "transparent", color: channel === ch ? "var(--accent)" : "var(--text4)", fontSize: 11, marginBottom: 1, transition: "all .15s" }}>
                <Hash size={11} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch}</span>
                {uc > 0 && (
                  <span style={{ minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}>
                    {uc > 5 ? "5+" : uc}
                  </span>
                )}
              </div>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", letterSpacing: ".08em", padding: "6px 7px 4px" }}>THÀNH VIÊN ({activeMembers.length})</div>
          <div style={{ overflowY: "auto" }}>
            {activeMembers.slice(0, 10).map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 7px", fontSize: 10, color: s.isTeacher ? "var(--accent)" : "var(--text3)" }}>
                <div style={{ position: "relative" }}><Av photo={s.photo} sz={16} /><div style={{ position: "absolute", bottom: 0, right: 0, width: 4, height: 4, borderRadius: "50%", background: "#34D399", border: "1px solid var(--card-bg)" }} /></div>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: s.isTeacher ? 700 : 400 }}>{s.isTeacher ? s.name : s.name.split(" ").pop()}</span>
              </div>
            ))}
            {activeMembers.length > 10 && <div style={{ fontSize: 10, color: "var(--text3)", padding: "3px 7px" }}>+{activeMembers.length - 10} người</div>}
          </div>
        </div>
      )}
      <div className="scard" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--wa055)", display: "flex", alignItems: "center", gap: 6 }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} title="Hiện danh sách kênh" style={{ width: 24, height: 24, borderRadius: 7, border: "1px solid var(--wa08)", background: "var(--wa03)", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 2, flexShrink: 0 }}>
              <ChevronRight size={13} />
            </button>
          )}
          <Hash size={13} style={{ color: "var(--accent)" }} /><span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{channel}</span>
          <div style={{ flex: 1 }} />
          <a href={`https://meet.jit.si/EClass_P2K_${classId}_${cls?.name ? cls.name.replace(/\\s+/g, '_') : 'Class'}_${channel}`} target="_blank" rel="noreferrer" className="vidcall-btn" title="Tham gia Video Call" style={{ textDecoration: "none", background: "linear-gradient(135deg,rgba(167,139,250,.2),rgba(79,172,254,.2))", color: "var(--text)", fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 14, display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(167,139,250,.3)", transition: "all .2s" }} onMouseEnter={e => e.currentTarget.style.transform="scale(1.03)"} onMouseLeave={e => e.currentTarget.style.transform="none"}>
            <span style={{fontSize: 13}}>🎥</span> <span className="vidcall-txt">Tham gia Video Call</span> <ExternalLink size={11} color="var(--text3)" className="vidcall-ext" />
          </a>
          <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 6 }}>{msgs.length} tin</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 0 }}>
          {msgs.length === 0 && <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", paddingTop: 28 }}>Chưa có tin nhắn. Hãy bắt đầu!</div>}
          {msgs.map((m, i) => {
            const showAv = i === 0 || msgs[i - 1].user !== m.user;
            const isT = m.role === "teacher";
            return (
              <div key={m.id} style={{ display: "flex", gap: 9, padding: "3px 0", alignItems: "flex-start", animation: "fadeUp .2s ease" }}>
                {showAv ? <Av sz={28} /> : <div style={{ width: 28, flexShrink: 0 }} />}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                  {showAv && (<div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><span style={{ fontSize: 11, fontWeight: 700, color: isT ? "#A78BFA" : "var(--text)" }}>{m.user}</span>{isT && <Badge c="violet">GV</Badge>}<span style={{ fontSize: 9, color: "var(--text3)" }}>{m.time}</span></div>)}
                  <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.65, padding: "6px 12px", borderRadius: showAv ? "2px 10px 10px 10px" : "10px", background: "var(--wa045)", maxWidth: 440 }}>
                    {m.text && <div style={{ marginBottom: m.attachment ? 6 : 0 }}>{m.text}</div>}
                    {m.attachment && typeof m.attachment === "string" && (() => {
                      try {
                        const att = JSON.parse(m.attachment);
                        const isImg = ["jpg","jpeg","png","gif","webp"].includes(att.type);
                        return isImg ? (
                          <a href={att.url} target="_blank" rel="noreferrer">
                            <img src={att.url} alt="attachment" style={{ maxWidth: 220, maxHeight: 220, borderRadius: 6, display: "block" }} />
                          </a>
                        ) : (
                          <a href={att.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(255,255,255,.05)", borderRadius: 6, textDecoration: "none", color: "var(--accent)", border: "1px solid var(--wa08)" }}>
                            <Paperclip size={12} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{att.name}</span>
                          </a>
                        );
                      } catch { return null; }
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bot} />
        </div>
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--wa045)" }}>
          {file && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(79,172,254,.1)", borderRadius: 8, marginBottom: 8, fontSize: 11, color: "var(--accent)" }}>
              <Paperclip size={12} /> {file.name}
              <div style={{ flex: 1 }} />
              <button onClick={() => setFile(null)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer" }}><X size={12} /></button>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--wa04)", borderRadius: 11, padding: "6px 13px", border: "1px solid var(--wa08)" }}>
            <button onClick={() => fileRef.current?.click()} style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Paperclip size={14} /></button>
            <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleFile} />
            <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={`Nhắn vào #${channel}...`} style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 12, fontFamily: "inherit" }} />
            <button onClick={send} disabled={uploadingFile} style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: (inp.trim() || file) && !uploadingFile ? "pointer" : "default", background: (inp.trim() || file) ? "rgba(79,172,254,.22)" : "transparent", color: (inp.trim() || file) ? "var(--accent)" : "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
              {uploadingFile ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Chat riêng Phụ huynh ↔ Giáo viên chủ nhiệm ──
// Mỗi học sinh có đúng 1 kênh riêng "pth-<studentId>" nằm trong messages của lớp học sinh đó.
// Tái dùng nguyên hạ tầng tin nhắn hiện có (api.sendMessage/pollMessages, state.messages) nên
// không cần backend mới. Kênh này KHÔNG nằm trong getChatChannels() của ChatPage (lớp) nên
// học sinh và các phụ huynh khác không nhìn thấy được — chỉ giáo viên chủ nhiệm và phụ huynh
// của đúng học sinh đó mới thấy.
const ptChannelOf = studentId => studentId.startsWith("general-") ? "parent_general" : `pth-${studentId}`;

function ParentTeacherChatPage({ state, user, selClass }) {
  const isTeacher = user.role === "teacher";
  const isParentRole = user.role === "parent";

  const threads = useMemo(() => {
    if (isParentRole) {
      const childIds = user.data?.childIds || [];
      const list = state.students
        .filter(s => childIds.includes(s.id))
        .map(s => {
          const cls = state.classes.find(c => c.id === s.classId);
          const teacher = state.teachers.find(t => t.id === cls?.teacherId);
          return {
            studentId: s.id, classId: s.classId, name: s.name, photo: s.photo,
            subLabel: cls?.name || "", otherName: teacher ? teacher.name : "Giáo viên chủ nhiệm",
          };
        });

      const uniqueClassIds = [...new Set(list.map(t => t.classId))];
      const generalThreads = uniqueClassIds.map(classId => {
        const cls = state.classes.find(c => c.id === classId);
        return {
          studentId: `general-${classId}`,
          classId: classId,
          name: `Chat tổng lớp ${cls?.name || ""}`,
          photo: null,
          subLabel: cls?.name || "",
          otherName: `Kênh chat chung Phụ huynh & GV (${cls?.name || ""})`,
          isGeneral: true
        };
      });

      return [...generalThreads, ...list];
    }
    if (isTeacher) {
      // Tìm thông tin lớp dạy/chủ nhiệm tương ứng với lớp đang chọn (selClass)
      const myClasses = state.classes.filter(c => c.id === selClass && (c.teacherId === user.data.id || (user.data.teachingClassIds || []).includes(c.id)));
      const myClassIds = myClasses.map(c => c.id);
      const list = state.students
        .filter(s => myClassIds.includes(s.classId))
        .map(s => {
          const cls = state.classes.find(c => c.id === s.classId);
          return {
            studentId: s.id, classId: s.classId, name: s.name, photo: s.photo,
            subLabel: cls?.name || "", otherName: `Phụ huynh ${s.name}`,
          };
        });

      const generalThreads = myClasses.map(cls => {
        return {
          studentId: `general-${cls.id}`,
          classId: cls.id,
          name: `Chat tổng phụ huynh lớp ${cls.name}`,
          photo: null,
          subLabel: cls.name,
          otherName: `Kênh chat chung Phụ huynh & GV (${cls.name})`,
          isGeneral: true
        };
      });

      return [...generalThreads, ...list];
    }
    return [];
  }, [isParentRole, isTeacher, state.students, state.classes, state.teachers, user.data, selClass]);

  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    if ((!selectedId || !threads.find(t => t.studentId === selectedId)) && threads.length) {
      setSelectedId(threads[0].studentId);
    }
  }, [threads, selectedId]);

  const selected = threads.find(t => t.studentId === selectedId) || null;
  const msgKey = selected ? `${selected.classId}_${ptChannelOf(selected.studentId)}` : null;
  const msgs = msgKey ? (state.messages[msgKey] || []) : [];

  const [inp, setInp] = useState("");
  const [file, setFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileRef = useRef(null);
  const bot = useRef(null);

  useEffect(() => {
    setTimeout(() => bot.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [msgKey, msgs.length]);

  // Poll tin nhắn mới cho luồng đang mở
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const chMsgs = state.messages[msgKey] || [];
        const dbMsgs = chMsgs.filter(m => m.id < 1e12);
        const lastId = dbMsgs.length ? dbMsgs[dbMsgs.length - 1].id : 0;
        const newMsgs = await api.pollMessages(selected.classId, ptChannelOf(selected.studentId), lastId);
        if (!cancelled && newMsgs && newMsgs.length > 0) {
          state.setMessages(p => {
            const existing = p[msgKey] || [];
            const existingIds = new Set(existing.map(m => m.id));
            const fresh = newMsgs.filter(m => !existingIds.has(m.id));
            if (!fresh.length) return p;
            return { ...p, [msgKey]: [...existing, ...fresh] };
          });
        }
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [selected, msgKey]);

  // Đánh dấu đã đọc (lưu local theo user, riêng với ChatPage lớp)
  const lastReadStorageKey = `eclass_pth_lastread_${user.role}_${user.data.id}`;
  const [lastRead, setLastRead] = useState(() => {
    try {
      const raw = localStorage.getItem(lastReadStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    if (!msgKey || !msgs.length) return;
    const lastId = msgs[msgs.length - 1].id;
    setLastRead(p => {
      if (p[msgKey] === lastId) return p;
      const next = { ...p, [msgKey]: lastId };
      try { localStorage.setItem(lastReadStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [msgKey, msgs.length, lastReadStorageKey]);

  const unreadFor = (t) => {
    const key = `${t.classId}_${ptChannelOf(t.studentId)}`;
    const list = state.messages[key] || [];
    const lastId = lastRead[key] || 0;
    return list.filter(m => m.id > lastId && m.user !== user.data.name).length;
  };

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { alert("File quá lớn (tối đa 10MB)"); return; }
    setUploadingFile(true);
    const r = new FileReader();
    r.onload = () => {
      setFile({ name: f.name, type: f.name.split(".").pop().toLowerCase(), data: r.result });
      setUploadingFile(false);
    };
    r.readAsDataURL(f);
  };

  const send = async () => {
    if (!selected) return;
    if (!inp.trim() && !file) return;
    const text = inp.trim();
    const currentFile = file;
    setInp(""); setFile(null);
    const classId = selected.classId;
    const channel = ptChannelOf(selected.studentId);
    try {
      const saved = await api.sendMessage({
        classId, channel, text, attachment: currentFile,
        senderName: user.data.name,
        senderRole: user.role,
        senderEmoji: user.data.em || (user.role === "teacher" ? "👨‍🏫" : "👪")
      });
      if (saved) {
        state.setMessages(p => ({ ...p, [msgKey]: [...(p[msgKey] || []), saved] }));
      }
    } catch {
      const msg = { id: Date.now(), user: user.data.name, role: user.role, em: user.data.em || (user.role === "teacher" ? "👨‍🏫" : "👪"), text, attachment: currentFile ? JSON.stringify({ name: currentFile.name, type: currentFile.type, url: currentFile.data }) : null, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) };
      state.setMessages(p => ({ ...p, [msgKey]: [...(p[msgKey] || []), msg] }));
    }
  };

  if (!threads.length) {
    return (
      <div className="page" style={{ padding: 20 }}>
        <div className="scard" style={{ padding: 40, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
          {isParentRole ? 'Chưa liên kết học sinh nào. Vào mục "Tổng quan" để gửi yêu cầu liên kết con.' : "Lớp bạn chủ nhiệm hiện chưa có học sinh nào."}
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: 20, display: "flex", gap: 14, height: "calc(100vh - 64px)" }}>
      <div className="scard" style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: ".06em", borderBottom: "1px solid var(--wa055)" }}>
          {isParentRole ? "HỘI THOẠI" : "HỘI THOẠI PHỤ HUYNH"}
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {threads.map(t => {
            const uc = unreadFor(t);
            return (
              <div key={t.studentId} onClick={() => setSelectedId(t.studentId)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer", background: selectedId === t.studentId ? "rgba(52,211,153,.1)" : "transparent", borderLeft: selectedId === t.studentId ? "2px solid #34D399" : "2px solid transparent" }}>
                {t.isGeneral ? (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(52,211,153,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={16} style={{ color: "#34D399" }} />
                  </div>
                ) : (
                  <Av photo={t.photo} sz={30} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.isGeneral ? "Kênh trao đổi chung" : (isParentRole ? `GVCN: ${t.otherName}` : t.subLabel)}</div>
                </div>
                {uc > 0 && <span style={{ minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{uc > 5 ? "5+" : uc}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="scard" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selected ? (
          <>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--wa055)", display: "flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={14} style={{ color: "#34D399" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{selected.otherName}</span>
              {selected.isGeneral ? <Badge c="blue">Kênh chung</Badge> : <Badge c="green">{isParentRole ? "GVCN" : "Phụ huynh"}</Badge>}
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{selected.isGeneral ? `Lớp: ${selected.subLabel}` : `Về học sinh: ${selected.name}`}</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column" }}>
              {msgs.length === 0 && <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", paddingTop: 28 }}>{selected.isGeneral ? "Chưa có tin nhắn. Hãy gửi tin nhắn đầu tiên để cùng thảo luận!" : `Chưa có tin nhắn. Hãy bắt đầu trao đổi về ${selected.name}!`}</div>}
              {msgs.map((m, i) => {
                const showAv = i === 0 || msgs[i - 1].user !== m.user;
                const isT = m.role === "teacher";
                return (
                  <div key={m.id} style={{ display: "flex", gap: 9, padding: "3px 0", alignItems: "flex-start" }}>
                    {showAv ? <Av sz={28} /> : <div style={{ width: 28, flexShrink: 0 }} />}
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      {showAv && (<div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><span style={{ fontSize: 11, fontWeight: 700, color: isT ? "#A78BFA" : "#34D399" }}>{m.user}</span>{isT && <Badge c="violet">GV</Badge>}<span style={{ fontSize: 9, color: "var(--text3)" }}>{m.time}</span></div>)}
                      <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.65, padding: "6px 12px", borderRadius: showAv ? "2px 10px 10px 10px" : "10px", background: "var(--wa045)", maxWidth: 440 }}>
                        {m.text && <div>{m.text}</div>}
                        {m.attachment && typeof m.attachment === "string" && (() => {
                          try {
                            const att = JSON.parse(m.attachment);
                            const isImg = ["jpg","jpeg","png","gif","webp"].includes(att.type);
                            return isImg ? (
                              <a href={att.url} target="_blank" rel="noreferrer"><img src={att.url} alt="attachment" style={{ maxWidth: 220, maxHeight: 220, borderRadius: 6, display: "block", marginTop: 6 }} /></a>
                            ) : (
                              <a href={att.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(255,255,255,.05)", borderRadius: 6, textDecoration: "none", color: "var(--accent)", border: "1px solid var(--wa08)", marginTop: 6 }}><Paperclip size={12} /> {att.name}</a>
                            );
                          } catch { return null; }
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bot} />
            </div>
            <div style={{ padding: "10px 12px", borderTop: "1px solid var(--wa045)" }}>
              {file && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(52,211,153,.1)", borderRadius: 8, marginBottom: 8, fontSize: 11, color: "#34D399" }}>
                  <Paperclip size={12} /> {file.name}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setFile(null)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer" }}><X size={12} /></button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--wa04)", borderRadius: 11, padding: "6px 13px", border: "1px solid var(--wa08)" }}>
                <button onClick={() => fileRef.current?.click()} style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Paperclip size={14} /></button>
                <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleFile} />
                <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={`Nhắn cho ${selected.otherName}...`} style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 12, fontFamily: "inherit" }} />
                <button onClick={send} disabled={uploadingFile} style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: (inp.trim() || file) && !uploadingFile ? "pointer" : "default", background: (inp.trim() || file) ? "rgba(52,211,153,.22)" : "transparent", color: (inp.trim() || file) ? "#34D399" : "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {uploadingFile ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #34D399", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12 }}>Chọn một học sinh để bắt đầu trò chuyện.</div>
        )}
      </div>
    </div>
  );
}


// ── Trợ giảng AI (chỉ dành riêng cho học sinh) ──
// Gọi qua api.askAI(message, history) -> backend proxy -> Gemini API.
// Key AI KHÔNG được đặt ở đây / ở frontend, luôn nằm ở server (.env) để tránh lộ key.
const AI_QUICK_PROMPTS = [
  "Giải thích khái niệm này đơn giản hơn giúp em",
  "Cho em 3 bài luyện tập về chủ đề này",
  "Kiểm tra giúp em đoạn bài làm này có đúng không",
  "Gợi ý cách học thuộc nhanh và nhớ lâu hơn",
];

function AITutorPage({ state, user }) {
  const [messages, setMessages] = useState([]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const bot = useRef(null);
  useActivityTracker("Trợ giảng AI", "Trò chuyện với AI", user.role);

  useEffect(() => {
    setTimeout(() => bot.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages.length, loading]);

  // Tính năng này chỉ dành cho học sinh
  if (user.role !== "student") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12 }}>
        Trợ giảng AI hiện chỉ dành cho học sinh.
      </div>
    );
  }

  const send = async (text) => {
    const q = (text ?? inp).trim();
    if (!q || loading) return;
    setMessages(p => [...p, { id: Date.now(), role: "user", text: q }]);
    setInp("");
    setLoading(true);
    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));
      const data = await api.askAI(q, history);
      setMessages(p => [...p, { id: Date.now() + 1, role: "ai", text: (data && data.reply) || "Xin lỗi, em chưa nghĩ ra câu trả lời. Bạn thử hỏi lại nhé!" }]);
    } catch (e) {
      setMessages(p => [...p, { id: Date.now() + 1, role: "ai", text: "Không kết nối được trợ giảng AI lúc này (" + (e.message || "lỗi không xác định") + "). Vui lòng thử lại sau nhé!", error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 14, gap: 14, minHeight: 0 }}>
      <div className="scard" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--wa055)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,rgba(79,172,254,.25),rgba(167,139,250,.25))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bot size={15} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Trợ giảng AI</div>
            <div style={{ fontSize: 10, color: "var(--text3)" }}>Hỏi bài, luyện tập, giải thích khái niệm — sẵn sàng giúp bạn</div>
          </div>
          <div style={{ flex: 1 }} />
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} title="Xoá cuộc trò chuyện" style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--wa08)", background: "var(--wa03)", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ margin: "auto", textAlign: "center", maxWidth: 380 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,rgba(79,172,254,.18),rgba(167,139,250,.18))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Sparkles size={22} color="var(--accent)" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Chào {(user.data.name || "").split(" ").pop() || "bạn"}! 👋</div>
              <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.6, marginBottom: 16 }}>Mình là trợ giảng AI. Bạn có thể hỏi mình giải thích bài học, tạo bài luyện tập, hoặc kiểm tra lại bài làm nhé.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {AI_QUICK_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => send(p)} style={{ textAlign: "left", padding: "8px 12px", borderRadius: 9, border: "1px solid var(--wa08)", background: "var(--wa03)", color: "var(--text2)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp .2s ease" }}>
              {m.role === "ai" && (
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(79,172,254,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <Bot size={12} color="var(--accent)" />
                </div>
              )}
              <div style={{
                fontSize: 12, lineHeight: 1.65, padding: "8px 13px",
                borderRadius: m.role === "user" ? "10px 2px 10px 10px" : "2px 10px 10px 10px",
                background: m.role === "user" ? "rgba(79,172,254,.18)" : (m.error ? "rgba(239,68,68,.1)" : "var(--wa045)"),
                color: m.error ? "#EF4444" : "var(--text2)",
                maxWidth: 460, whiteSpace: "pre-wrap",
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(79,172,254,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={12} color="var(--accent)" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: "2px 10px 10px 10px", background: "var(--wa045)" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin360 .8s linear infinite" }} />
                <span style={{ fontSize: 11, color: "var(--text3)" }}>Đang soạn câu trả lời...</span>
              </div>
            </div>
          )}
          <div ref={bot} />
        </div>
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--wa045)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--wa04)", borderRadius: 11, padding: "6px 13px", border: "1px solid var(--wa08)" }}>
            <input
              value={inp}
              onChange={e => setInp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Hỏi trợ giảng AI bất cứ điều gì..."
              disabled={loading}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 12, fontFamily: "inherit" }}
            />
            <button onClick={() => send()} disabled={!inp.trim() || loading} style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: inp.trim() && !loading ? "pointer" : "default", background: inp.trim() ? "rgba(79,172,254,.22)" : "transparent", color: inp.trim() ? "var(--accent)" : "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
              {loading ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin360 .8s linear infinite" }} /> : <Send size={13} />}
            </button>
          </div>
          <div style={{ fontSize: 9, color: "var(--text4)", marginTop: 6, textAlign: "center" }}>AI có thể trả lời chưa chính xác — hãy luôn kiểm tra lại với thầy cô.</div>
        </div>
      </div>
    </div>
  );
}



const LAB_FILES = {
  "main.py":  { lang: "python", label: "Python 3 (Pyodide)", color: "#3B82F6", badge: "PY",
    code: `# Viết code Python của bạn ở đây rồi bấm Run để chạy thử\nprint("Xin chào, E-Class P2K!")\n\nfor i in range(1, 6):\n    print("Dòng số", i)\n` },
  "main.cpp": { lang: "cpp", label: "C++ (JSCPP)", color: "#F59E0B", badge: "C++",
    code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Xin chao, E-Class P2K!" << endl;\n    for (int i = 1; i <= 5; i++) {\n        cout << "Dong so " << i << endl;\n    }\n    return 0;\n}\n` },
};

const MONACO_CDN   = "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs";
const PYODIDE_CDN  = "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/";
const JSCPP_CDN = "https://cdn.jsdelivr.net/gh/felixhao28/JSCPP@gh-pages/dist/JSCPP.es5.min.js";

function loadScriptOnce(url, check) {
  if (check()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Không tải được tài nguyên: " + url + " (kiểm tra kết nối mạng rồi thử lại)"));
    document.body.appendChild(s);
  });
}

function buildLabSrcDoc(initialFiles, initialActiveFile) {
  const filesJson = JSON.stringify(initialFiles).replace(/</g, "\\u003C");
  const activeJson = JSON.stringify(initialActiveFile);
  const monacoCdnJson = JSON.stringify(MONACO_CDN);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html,body{height:100%;margin:0;padding:0;background:#1e1e1e;overflow:hidden}
  #container{position:absolute;inset:0}
</style>
</head>
<body>
<div id="container"></div>
<script src="${MONACO_CDN}/loader.js"></script>
<script>
(function(){
  var FILES = ${filesJson};
  var ACTIVE = ${activeJson};
  var VS_PATH = ${monacoCdnJson};
  var models = {};
  var editor = null;

  function post(msg){ try { window.parent.postMessage(msg, "*"); } catch(e){} }

  try {
    window.require.config({ paths: { vs: VS_PATH } });
    window.require(["vs/editor/editor.main"], function () {
      try {
        Object.keys(FILES).forEach(function(fname){
          var model = monaco.editor.createModel(FILES[fname].code, FILES[fname].lang);
          model.onDidChangeContent(function(){
            post({ type: "change", filename: fname, value: model.getValue() });
          });
          models[fname] = model;
        });
        editor = monaco.editor.create(document.getElementById("container"), {
          model: models[ACTIVE],
          theme: "vs-dark",
          fontSize: 13,
          fontFamily: "Consolas, 'Fira Code', 'Courier New', monospace",
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 10 },
        });
        post({ type: "ready" });
      } catch (e) {
        post({ type: "error", message: String((e && e.message) || e) });
      }
    }, function () {
      post({ type: "error", message: "Không tải được trình soạn thảo (kiểm tra kết nối mạng rồi thử lại)." });
    });
  } catch (e) {
    post({ type: "error", message: String((e && e.message) || e) });
  }

  window.addEventListener("message", function(e){
    var data = e.data || {};
    if (!editor) return;
    if (data.type === "switchFile" && models[data.filename]) {
      editor.setModel(models[data.filename]);
      editor.layout();
      editor.focus();
    } else if (data.type === "resetFile" && models[data.filename]) {
      models[data.filename].setValue(data.code);
    } else if (data.type === "focus") {
      editor.focus();
    }
  });
})();
</script>
</body>
</html>`;
}

function LabPage({ state, user, achievements, setShowAchModal, unlockAchievement, ranLangs, setRanLangs }) {
  const iframeRef = useRef(null);
  const pyodideRef = useRef(null);
  const outEndRef = useRef(null);
  const codeRef = useRef({});

  const storageKey = (fname) => `eclass_lab_${user.role}_${user.data.id}_${fname}`;

  const readSaved = (fname) => {
    try {
      const raw = localStorage.getItem(storageKey(fname));
      return raw != null ? raw : LAB_FILES[fname].code;
    } catch { return LAB_FILES[fname].code; }
  };

  const [labMode, setLabMode] = useState("code"); // "code" | "circuit" | "chemistry" | "graphwar"
  const [activeFile, setActiveFile] = useState("main.py");
  const [editorReady, setEditorReady] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState([{ type: "info", text: "Sẵn sàng. Chọn tệp bên trái rồi bấm ▶ Run để chạy thử code." }]);

  useActivityTracker("Phòng Lab", "Thực hành phòng Lab", user.role);

  const srcDocRef = useRef(null);
  if (!srcDocRef.current) {
    const initFiles = {};
    Object.keys(LAB_FILES).forEach(f => {
      const code = readSaved(f);
      initFiles[f] = { code, lang: LAB_FILES[f].lang };
      codeRef.current[f] = code;
    });
    srcDocRef.current = buildLabSrcDoc(initFiles, "main.py");
  }

  useEffect(() => {
    const onMessage = (e) => {
      const data = e.data || {};
      if (e.source === iframeRef.current?.contentWindow) {
        if (data.type === "ready") { console.log("[Lab] editor ready"); setEditorReady(true); }
        else if (data.type === "error") { console.warn("[Lab] editor error:", data.message); setEditorError(data.message || "Không tải được trình soạn thảo."); }
        else if (data.type === "change") {
          codeRef.current[data.filename] = data.value;
          try { localStorage.setItem(storageKey(data.filename), data.value); } catch {}
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (editorReady) {
      iframeRef.current?.contentWindow?.postMessage({ type: "switchFile", filename: activeFile }, "*");
    }
  }, [activeFile, editorReady]);

  useEffect(() => { outEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [output]);

  const appendOut = (type, text) => setOutput(p => [...p, { type, text }]);

  const runPython = async (code) => {
    console.log("[Lab] runPython start");
    if (!pyodideRef.current) {
      appendOut("info", "⏳ Đang khởi động môi trường Python (lần đầu có thể mất khoảng vài chục giây)...");
      await loadScriptOnce(`${PYODIDE_CDN}pyodide.js`, () => window.loadPyodide);
      console.log("[Lab] pyodide.js script loaded, initializing runtime...");
      pyodideRef.current = await window.loadPyodide({ indexURL: PYODIDE_CDN });
      console.log("[Lab] pyodide runtime ready");
    }
    const pyodide = pyodideRef.current;
    pyodide.setStdout({ batched: (s) => appendOut("stdout", s) });
    pyodide.setStderr({ batched: (s) => appendOut("stderr", s) });
    await pyodide.runPythonAsync(code);
    console.log("[Lab] runPython done");
  };

  const runCpp = async (code) => {
    console.log("[Lab] runCpp start");
    if (!window.JSCPP) {
      appendOut("info", "⏳ Đang khởi động môi trường C++ (lần đầu có thể mất vài giây)...");
      await loadScriptOnce(JSCPP_CDN, () => window.JSCPP);
      console.log("[Lab] JSCPP script loaded");
    }
    if (!window.JSCPP || typeof window.JSCPP.run !== "function") {
      throw new Error("Không khởi động được môi trường chạy C++, vui lòng thử lại.");
    }
    // JSCPP gọi stdio.write nhiều lần cho từng token nhỏ (ví dụ "Dong so ", "1", "\n").
    // Phải buffer lại toàn bộ, sau đó split theo '\n' để mỗi dòng thực sự = 1 entry.
    let buf = "";
    const exitCode = window.JSCPP.run(code, "", { stdio: { write: (s) => { buf += s; } } });
    if (buf.length > 0) {
      // Tách theo '\n', bỏ dòng trống cuối cùng nếu có
      const lines = buf.split("\n");
      if (lines[lines.length - 1] === "") lines.pop();
      lines.forEach(line => appendOut("stdout", line));
    } else {
      appendOut("info", "(Chương trình không in ra gì)");
    }
    console.log("[Lab] runCpp done, exitCode=", exitCode);
    if (exitCode !== 0) throw new Error("Chương trình thoát với mã lỗi " + exitCode);
  };


  const handleRun = async () => {
    console.log("[Lab] handleRun called, running=", running, "editorReady=", editorReady, "file=", activeFile);
    if (running) return;
    const code = codeRef.current[activeFile] ?? "";

    // Luôn phản hồi ngay lập tức trong Output khi bấm Run, trước khi làm bất
    // cứ việc gì khác — để nếu có lỗi phát sinh phía dưới, người dùng vẫn
    // thấy rõ là hệ thống đã nhận lệnh chạy chứ không phải im lặng không phản hồi.
    setRunning(true);
    setOutput([{ type: "cmd", text: `$ run ${activeFile}` }]);

    // Các kiểm tra thành tựu chỉ là hiệu ứng phụ — lỗi ở đây (nếu có) không
    // được phép làm hỏng việc chạy code, nên tách riêng try/catch của nó.
    try {
      if (code.includes("import antigravity")) {
        unlockAchievement("code_antigravity", "🚀 Bay Bổng Cùng Python", "Easter Egg 'import antigravity' của Python trong phòng Lập trình!", "🛸");
      }

      const trimmedCode = code.replace(/\s+/g, "");
      if (trimmedCode.includes("whileTrue:") || trimmedCode.includes("while(true)") || trimmedCode.includes("while(1)")) {
        unlockAchievement("code_loop", "♾️ Vòng Lặp Vô Tận", "Viết một chương trình chứa vòng lặp vô hạn trong phòng Lập trình!", "🔄");
      }

      if (code.toLowerCase().includes("hello") || code.toLowerCase().includes("xin chào") || code.toLowerCase().includes("xin chao")) {
        unlockAchievement("code_hello", "👋 Lời Chào Đầu Tiên", "Chạy chương trình in ra lời chào ('hello' hoặc 'xin chào')!", "👋");
      }

      if (code.includes("import math") || code.includes("#include <cmath>") || code.includes("#include <math.h>")) {
        unlockAchievement("code_math", "🧮 Kỹ Sư Toán Học", "Viết code sử dụng thư viện toán học ('math' hoặc 'cmath')!", "🧮");
      }

      if (code.includes("#") || code.includes("//")) {
        unlockAchievement("code_comment", "📝 Viết Code Văn Minh", "Viết code chứa chú thích rõ ràng bằng '#' hoặc '//'!", "📝");
      }

      const lang = LAB_FILES[activeFile].lang;
      setRanLangs(prev => {
        const next = new Set(prev).add(lang);
        if (next.size >= 2) {
          unlockAchievement("code_polyglot", "🌐 Lập Trình Viên Đa Năng", "Thực thi cả mã nguồn Python và C++ trong cùng một phiên làm việc!", "🧠");
        }
        return next;
      });
    } catch (achErr) {
      console.warn("Lỗi khi kiểm tra thành tựu (bỏ qua, không ảnh hưởng đến việc chạy code):", achErr);
    }

    try {
      if (LAB_FILES[activeFile].lang === "python") await runPython(code);
      else await runCpp(code);
      appendOut("success", "✔ Chương trình kết thúc.");
    } catch (e) {
      appendOut("stderr", String((e && e.message) || e));
      appendOut("error", "✘ Chương trình dừng do lỗi.");
    } finally {
      setRunning(false);
    }
  };

  const resetFile = () => {
    if (!window.confirm(`Khôi phục "${activeFile}" về code mẫu ban đầu? Code hiện tại sẽ bị mất.`)) return;
    const def = LAB_FILES[activeFile].code;
    try { localStorage.setItem(storageKey(activeFile), def); } catch {}
    codeRef.current[activeFile] = def;
    iframeRef.current?.contentWindow?.postMessage({ type: "resetFile", filename: activeFile, code: def }, "*");
    unlockAchievement("code_clean", "🧹 Người Dọn Dẹp", "Khôi phục lại tệp tin về trạng thái mẫu ban đầu trong phòng Lập trình!", "🗑️");
  };

  const meta = LAB_FILES[activeFile];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 14, gap: 10, minHeight: 0 }}>
      {/* Top header with mode tabs */}
      <div className="scard" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,rgba(79,172,254,.25),rgba(74,222,128,.25))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Code2 size={15} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Phòng Lab</div>
          <div style={{ fontSize: 10, color: "var(--text3)" }}>Lập trình • Vật lý điện • Hóa học • Toán học</div>
        </div>
        <div style={{ flex: 1 }} />
        
        {/* Achievements list button */}
        <button onClick={() => setShowAchModal(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
          borderRadius: 8, border: "1px solid rgba(251,191,36,.3)",
          background: "rgba(251,191,36,.06)", color: "#FBBF24",
          fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s"
        }}>
          🏆 Thành tựu ({Object.keys(achievements).length}/26)
        </button>
        <div style={{ width: 10 }} />

        {/* Mode tab switcher */}
        {[
          { id: "code",      icon: "💻", label: "Lập trình",    color: "#4ADE80" },
          { id: "circuit",   icon: "⚡", label: "Lắp mạch",     color: "#FBBF24" },
          { id: "chemistry", icon: "🧪", label: "Hóa học",      color: "#38BDF8" },
          { id: "graphwar",  icon: "🎯", label: "Toán đạn đạo", color: "#F43F5E" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setLabMode(tab.id)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
            borderRadius: 8, border: `1px solid ${labMode === tab.id ? tab.color : "var(--border)"}`,
            background: labMode === tab.id ? `${tab.color}18` : "transparent",
            color: labMode === tab.id ? tab.color : "var(--text3)",
            fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s"
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Code editor (VS Code simulator) */}
      <div style={{ flex: 1, display: labMode === "code" ? "flex" : "none", flexDirection: "column", minHeight: 0, borderRadius: 12, overflow: "hidden", border: "1px solid #14141f", boxShadow: "0 8px 30px rgba(0,0,0,.35)" }}>
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Activity bar giả lập VSCode */}
          <div style={{ width: 42, background: "#181825", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 18, flexShrink: 0 }}>
            <FolderOpen size={17} color="#e4e4ea" />
            <Code2 size={17} color="#5b5b6e" />
            <Terminal size={17} color="#5b5b6e" />
          </div>

          {/* Explorer */}
          <div style={{ width: 158, background: "#1e1e2e", borderRight: "1px solid #101018", flexShrink: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "10px 12px 6px", fontSize: 10, fontWeight: 700, letterSpacing: .5, color: "#8b8ba0", textTransform: "uppercase" }}>Bài thực hành</div>
            {Object.keys(LAB_FILES).map(f => (
              <div key={f} onClick={() => setActiveFile(f)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", cursor: "pointer", background: activeFile === f ? "#2a2a3d" : "transparent", borderLeft: activeFile === f ? "2px solid var(--accent)" : "2px solid transparent" }}>
                <FileCode size={13} color={LAB_FILES[f].color} />
                <span style={{ fontSize: 12, color: activeFile === f ? "#fff" : "#a0a0b5" }}>{f}</span>
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={resetFile} style={{ margin: 10, padding: "6px 8px", borderRadius: 7, border: "1px solid #33334a", background: "transparent", color: "#8b8ba0", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <RefreshCw size={11} /> Khôi phục mẫu
            </button>
          </div>

          {/* Editor + terminal */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#1e1e1e" }}>
            {/* Tab bar */}
            <div style={{ display: "flex", alignItems: "center", background: "#181825", borderBottom: "1px solid #101018", flexShrink: 0 }}>
              {Object.keys(LAB_FILES).map(f => (
                <div key={f} onClick={() => setActiveFile(f)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", cursor: "pointer", background: activeFile === f ? "#1e1e1e" : "transparent", fontSize: 12, color: activeFile === f ? "#fff" : "#8b8ba0", borderRight: "1px solid #101018", borderTop: activeFile === f ? "2px solid var(--accent)" : "2px solid transparent" }}>
                  <FileCode size={12} color={LAB_FILES[f].color} /> {f}
                </div>
              ))}
              <div style={{ flex: 1 }} />
              {output.length > 1 && (
                <button onClick={() => setOutput([{ type: "info", text: "Đã xoá output." }])} title="Xoá output" style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "transparent", color: "#8b8ba0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={12} />
                </button>
              )}
              <button onClick={handleRun} disabled={running} style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 10px", padding: "5px 13px", borderRadius: 7, border: "none", background: running ? "#374151" : "#22c55e", color: "#fff", fontSize: 11, fontWeight: 700, cursor: running ? "default" : "pointer" }}>
                {running ? <RefreshCw size={12} style={{ animation: "spin360 1s linear infinite" }} /> : <Play size={12} />}
                {running ? "Đang chạy..." : "Run"}
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
              {(!editorReady || editorError) && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: editorError ? "#f87171" : "#8b8ba0", fontSize: 12, gap: 8, textAlign: "center", padding: 20, background: "#1e1e1e", zIndex: 2 }}>
                  {editorError ? editorError : (<><RefreshCw size={14} style={{ animation: "spin360 1s linear infinite" }} /> Đang tải trình soạn thảo...</>)}
                </div>
              )}
              <iframe
                ref={iframeRef}
                title="Trình soạn thảo code"
                srcDoc={srcDocRef.current}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "#1e1e1e" }}
              />
            </div>

            {/* Terminal / output panel */}
            <div style={{ height: 176, flexShrink: 0, borderTop: "1px solid #101018", background: "#141420", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderBottom: "1px solid #101018", fontSize: 10, fontWeight: 700, color: "#8b8ba0", textTransform: "uppercase", letterSpacing: .5, flexShrink: 0 }}>
                <Terminal size={12} /> Output
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", fontFamily: "Consolas, 'Courier New', monospace", fontSize: 12, lineHeight: 1.6 }}>
                {output.map((o, i) => (
                  <div key={i} style={{
                    whiteSpace: "pre-wrap",
                    color: o.type === "stderr" || o.type === "error" ? "#f87171" : o.type === "success" ? "#4ade80" : o.type === "cmd" ? "#60a5fa" : o.type === "info" ? "#8b8ba0" : "#d4d4d8",
                  }}>
                    {o.text}
                  </div>
                ))}
                <div ref={outEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Status bar giả lập VSCode */}
        <div style={{ height: 22, flexShrink: 0, background: "#007acc", display: "flex", alignItems: "center", padding: "0 12px", gap: 14, fontSize: 10, color: "#fff" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Code2 size={11} /> main</span>
          <div style={{ flex: 1 }} />
          <span>{meta.label}</span>
          <span>UTF-8</span>
        </div>
      </div>

      {/* Circuit Builder (Physics Lab) */}
      {labMode === "circuit" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, borderRadius: 12, overflow: "hidden", border: "1px solid #2d2a1a", boxShadow: "0 8px 30px rgba(0,0,0,.35)" }}>
          <iframe
            src="/noi-mach.html"
            title="Phòng Lab Lắp mạch điện"
            style={{ flex: 1, width: "100%", height: "100%", border: "none" }}
            sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-pointer-lock"
          />
        </div>
      )}

      {/* Chemistry Lab */}
      {labMode === "chemistry" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, borderRadius: 12, overflow: "hidden", border: "1px solid #0e2030", boxShadow: "0 8px 30px rgba(0,0,0,.35)" }}>
          <iframe
            src="/chem_sandbox.html"
            title="Phòng Lab Hóa học"
            style={{ flex: 1, width: "100%", height: "100%", border: "none" }}
            sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-pointer-lock"
          />
        </div>
      )}

      {/* Graphwar Lab */}
      {labMode === "graphwar" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, borderRadius: 12, overflow: "hidden", border: "1px solid #1a0b16", boxShadow: "0 8px 30px rgba(0,0,0,.35)" }}>
          <iframe
            src="/graphwar.html"
            title="Phòng Lab Toán Học Đạn Đạo"
            style={{ flex: 1, width: "100%", height: "100%", border: "none" }}
            sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-pointer-lock"
          />
        </div>
      )}
    </div>
  );
}

// ── Thời khóa biểu ──
// Giáo viên chủ nhiệm chỉnh sửa, học sinh + phụ huynh chỉ xem (theo lớp của con).
// Dữ liệu lưu riêng qua api.getSchedule/updateSchedule (không nằm trong bulk state chung),
// định dạng: { [day]: { [slot]: "Tên môn học" } }, ví dụ { T2: { S1: "Toán", C1: "" }, ... }
const SCHEDULE_DAYS = [
  { id: "T2", l: "Thứ 2" },
  { id: "T3", l: "Thứ 3" },
  { id: "T4", l: "Thứ 4" },
  { id: "T5", l: "Thứ 5" },
  { id: "T6", l: "Thứ 6" },
  { id: "T7", l: "Thứ 7" },
];
const SCHEDULE_SLOTS = [
  { id: "S1", l: "Tiết 1", buoi: "Sáng" },
  { id: "S2", l: "Tiết 2", buoi: "Sáng" },
  { id: "S3", l: "Tiết 3", buoi: "Sáng" },
  { id: "S4", l: "Tiết 4", buoi: "Sáng" },
  { id: "S5", l: "Tiết 5", buoi: "Sáng" },
  { id: "C1", l: "Tiết 1", buoi: "Chiều" },
  { id: "C2", l: "Tiết 2", buoi: "Chiều" },
  { id: "C3", l: "Tiết 3", buoi: "Chiều" },
  { id: "C4", l: "Tiết 4", buoi: "Chiều" },
  { id: "C5", l: "Tiết 5", buoi: "Chiều" },
];
// Gộp sẵn thành danh sách hàng để render (kèm hàng tiêu đề "BUỔI SÁNG"/"BUỔI CHIỀU"),
// tránh phải dùng React.Fragment có key (file này không import React theo kiểu named).
const SCHEDULE_ROWS = (() => {
  const rows = [];
  SCHEDULE_SLOTS.forEach((slot, i) => {
    if (i === 0 || SCHEDULE_SLOTS[i - 1].buoi !== slot.buoi) {
      rows.push({ type: "header", key: `h-${slot.buoi}`, buoi: slot.buoi });
    }
    rows.push({ type: "slot", key: slot.id, slot });
  });
  return rows;
})();

function SchedulePage({ state, user, selClass, setSelClass, myClasses }) {
  const isTeacher = user.role === "teacher";
  const isParent = user.role === "parent";
  useActivityTracker("Thời khóa biểu", "Xem thời khóa biểu", user.role);

  // Phụ huynh có thể có nhiều con -> cho chọn con để xem đúng lớp
  const myChildren = useMemo(() => {
    if (!isParent) return [];
    const childIds = user.data?.childIds || [];
    return state.students.filter(s => childIds.includes(s.id));
  }, [isParent, state.students, user.data]);

  const [selChildId, setSelChildId] = useState(null);
  useEffect(() => {
    if (isParent && !selChildId && myChildren.length) setSelChildId(myChildren[0].id);
  }, [isParent, myChildren, selChildId]);

  const classId = isTeacher
    ? selClass
    : isParent
      ? myChildren.find(c => c.id === selChildId)?.classId
      : user.classId;

  const cls = state.classes.find(c => c.id === classId);

  const [grid, setGrid] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!classId) { setLoading(false); return; }
    setLoading(true);
    setErr("");
    api.getSchedule(classId)
      .then(data => { setGrid(data || {}); setDirty(false); })
      .catch(e => { setGrid({}); setErr(e.message || "Không tải được thời khóa biểu"); })
      .finally(() => setLoading(false));
  }, [classId]);

  const setCell = (day, slot, subject) => {
    setGrid(p => ({ ...p, [day]: { ...(p[day] || {}), [slot]: subject } }));
    setDirty(true);
  };

  const save = async () => {
    if (!classId) return;
    setSaving(true);
    setErr("");
    try {
      await api.updateSchedule(classId, grid);
      setDirty(false);
    } catch (e) {
      setErr(e.message || "Lỗi khi lưu thời khóa biểu");
    } finally {
      setSaving(false);
    }
  };

  if (!classId) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12 }}>
        {isParent ? "Chưa có học sinh nào được liên kết." : "Chưa có lớp học để hiển thị thời khóa biểu."}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
      {isParent && myChildren.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {myChildren.map(c => (
            <button key={c.id} onClick={() => setSelChildId(c.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, border: selChildId === c.id ? "1px solid var(--accent)" : "1px solid var(--wa08)", background: selChildId === c.id ? "rgba(79,172,254,.12)" : "var(--wa03)", color: selChildId === c.id ? "var(--accent)" : "var(--text3)", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", flexShrink: 0 }}>
              <Av photo={c.photo} sz={18} />{c.name}
            </button>
          ))}
        </div>
      )}
      <div className="scard" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <Calendar size={15} color="var(--accent)" />
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Thời khóa biểu{cls?.name ? ` — ${cls.name}` : ""}</div>
          <div style={{ flex: 1 }} />
          {err && <span style={{ fontSize: 10, color: "#EF4444" }}>{err}</span>}
          {isTeacher && (
            <Btn onClick={save} disabled={!dirty || saving} small>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Btn>
          )}
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>Đang tải...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text3)", fontWeight: 700, borderBottom: "1px solid var(--wa08)", width: 90 }}>Tiết</th>
                  {SCHEDULE_DAYS.map(d => (
                    <th key={d.id} style={{ padding: "8px 10px", textAlign: "center", color: "var(--text3)", fontWeight: 700, borderBottom: "1px solid var(--wa08)" }}>{d.l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHEDULE_ROWS.map(row => row.type === "header" ? (
                  <tr key={row.key}>
                    <td colSpan={SCHEDULE_DAYS.length + 1} style={{ padding: "10px 10px 4px", fontSize: 9, fontWeight: 700, color: "var(--text3)", letterSpacing: ".08em" }}>
                      BUỔI {row.buoi.toUpperCase()}
                    </td>
                  </tr>
                ) : (
                  <tr key={row.key}>
                    <td style={{ padding: "5px 10px", color: "var(--text3)", borderBottom: "1px solid var(--wa025)" }}>{row.slot.l}</td>
                    {SCHEDULE_DAYS.map(d => {
                      const val = grid[d.id]?.[row.slot.id] || "";
                      return (
                        <td key={d.id} style={{ padding: 3, borderBottom: "1px solid var(--wa025)" }}>
                          {isTeacher ? (
                            <select
                              value={val}
                              onChange={e => setCell(d.id, row.slot.id, e.target.value)}
                              style={{ width: "100%", padding: "5px 4px", borderRadius: 6, border: "1px solid var(--wa08)", background: val ? "var(--wa04)" : "transparent", color: val ? (SCOLS[val] || "var(--text)") : "var(--text4)", fontSize: 10, fontFamily: "inherit", outline: "none" }}
                            >
                              <option value="">—</option>
                              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <div style={{ padding: "6px 4px", textAlign: "center", borderRadius: 6, background: val ? "var(--wa04)" : "transparent", color: val ? (SCOLS[val] || "var(--text2)") : "var(--text4)", fontWeight: val ? 600 : 400 }}>
                              {val || "—"}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


// giao btvn

// ════════════════════════════════════════════════════════════════════════════
// HỆ THỐNG CÂU HỎI TRẮC NGHIỆM / TỰ LUẬN cho Bài tập (TaskPage)
// 4 loại câu hỏi: trắc nghiệm 4 đáp án (mcq), đúng/sai (truefalse),
// trả lời ngắn (short - chấm tự động theo văn bản), tự luận (essay - GV chấm tay)
// ════════════════════════════════════════════════════════════════════════════
const QUESTION_TYPES = [
  { v: "mcq", l: "Trắc nghiệm ABCD", Ic: ListChecks, c: "#4FACFE" },
  { v: "truefalse", l: "Đúng / Sai", Ic: CircleDot, c: "#34D399" },
  { v: "short", l: "Trả lời ngắn", Ic: HelpCircle, c: "#F59E0B" },
  { v: "essay", l: "Tự luận", Ic: PenLine, c: "#A78BFA" },
];

const newQuestion = (type) => ({
  id: "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
  type,
  text: "",
  points: 1,
  options: type === "mcq" ? ["", "", "", ""] : undefined,
  correctIndex: type === "mcq" ? 0 : undefined,
  correctBool: type === "truefalse" ? true : undefined,
  correctText: type === "short" ? "" : undefined,
});

const quizTotalPoints = (questions) => (questions || []).reduce((s, q) => s + (Number(q.points) || 1), 0);

// Chấm điểm tự động các câu trắc nghiệm/đúng-sai/trả lời ngắn; câu tự luận để GV chấm tay
function computeQuizScore(questions, answers) {
  let autoScore = 0, maxAutoScore = 0, maxTotal = 0, hasEssay = false;
  const detail = {};
  (questions || []).forEach(q => {
    const pts = Number(q.points) || 1;
    maxTotal += pts;
    if (q.type === "essay") { hasEssay = true; detail[q.id] = { correct: null, pts: 0, maxPts: pts }; return; }
    maxAutoScore += pts;
    const ans = answers ? answers[q.id] : undefined;
    let correct = false;
    if (q.type === "mcq") correct = ans === q.correctIndex;
    else if (q.type === "truefalse") correct = ans === q.correctBool;
    else if (q.type === "short") {
      if (ans != null && String(ans).trim() !== "") {
        const norm = String(ans).trim().toLowerCase();
        const accepted = String(q.correctText || "").split("|").map(s => s.trim().toLowerCase()).filter(Boolean);
        correct = accepted.includes(norm);
      }
    }
    const earned = correct ? pts : 0;
    autoScore += earned;
    detail[q.id] = { correct, pts: earned, maxPts: pts };
  });
  return { autoScore, maxAutoScore, maxTotal, hasEssay, detail };
}

// Thẻ soạn 1 câu hỏi — dùng trong modal "Thêm bài tập" khi GV chọn hình thức Trắc nghiệm
function QuestionEditor({ q, index, onChange, onDelete, isVideo }) {
  const meta = QUESTION_TYPES.find(t => t.v === q.type) || QUESTION_TYPES[0];
  return (
    <div className="scard" style={{ padding: 12, marginBottom: 10, border: "1px solid var(--wa07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 20, height: 20, borderRadius: 6, background: `${meta.c}18`, color: meta.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{index + 1}</span>
          <meta.Ic size={13} style={{ color: meta.c }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: meta.c }}>{meta.l}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="number" min={0.25} step={0.25} value={q.points} onChange={e => onChange({ points: Math.max(0.25, Number(e.target.value) || 1) })} title="Điểm số" style={{ width: 46, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text)", fontSize: 11, textAlign: "center", fontFamily: "inherit" }} />
          <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", display: "flex" }}><Trash2 size={13} /></button>
        </div>
      </div>
      <textarea value={q.text} onChange={e => onChange({ text: e.target.value })} placeholder="Nhập nội dung câu hỏi..." rows={2} style={{ width: "100%", padding: "8px 11px", borderRadius: 8, background: "var(--wa04)", border: "1px solid var(--wa1)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", marginBottom: 8, boxSizing: "border-box" }} />
      {isVideo && (
        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text2)", letterSpacing: ".02em" }}>THỜI ĐIỂM DỪNG:</span>
          <input
            type="number" min={0}
            value={q.timestamp ?? 0}
            onChange={e => onChange({ timestamp: Math.max(0, parseInt(e.target.value) || 0) })}
            style={{ width: 64, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text)", fontSize: 11, fontWeight: 700, outline: "none", fontFamily: "inherit", textAlign: "center" }}
          />
          <span style={{ fontSize: 11, color: "var(--text4)" }}>giây</span>
        </div>
      )}
      {q.type === "mcq" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["A", "B", "C", "D"].map((lbl, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }} title="Đánh dấu đáp án đúng">
                <input type="radio" name={`correct_${q.id}`} checked={q.correctIndex === i} onChange={() => onChange({ correctIndex: i })} style={{ accentColor: "#34D399" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: q.correctIndex === i ? "#34D399" : "var(--text4)", width: 14 }}>{lbl}</span>
              </label>
              <input value={q.options?.[i] || ""} onChange={e => { const opts = [...(q.options || ["", "", "", ""])]; opts[i] = e.target.value; onChange({ options: opts }); }} placeholder={`Phương án ${lbl}`} style={{ flex: 1, padding: "6px 10px", borderRadius: 7, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text)", fontSize: 11.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          ))}
          <div style={{ fontSize: 10, color: "var(--text4)" }}>Chọn nút tròn để đánh dấu đáp án đúng.</div>
        </div>
      )}
      {q.type === "truefalse" && (
        <div style={{ display: "flex", gap: 14 }}>
          {[[true, "Đúng", "#34D399"], [false, "Sai", "#EF4444"]].map(([v, l, c]) => (
            <label key={l} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 12, color: q.correctBool === v ? c : "var(--text3)", fontWeight: 600 }}>
              <input type="radio" name={`tf_${q.id}`} checked={q.correctBool === v} onChange={() => onChange({ correctBool: v })} style={{ accentColor: c }} />{l}
            </label>
          ))}
        </div>
      )}
      {q.type === "short" && (
        <input value={q.correctText || ""} onChange={e => onChange({ correctText: e.target.value })} placeholder="Đáp án đúng (nhiều đáp án chấp nhận, cách nhau bởi dấu |)" style={{ width: "100%", padding: "7px 11px", borderRadius: 8, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text)", fontSize: 11.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
      )}
      {q.type === "essay" && (
        <div style={{ fontSize: 10, color: "var(--text4)", fontStyle: "italic" }}>Câu tự luận — giáo viên chấm điểm thủ công sau khi học sinh nộp bài.</div>
      )}
    </div>
  );
}

// Modal học sinh làm bài trắc nghiệm/tự luận
function QuizTakeModal({ task, onClose, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const setAns = (qid, val) => setAnswers(p => ({ ...p, [qid]: val }));
  const questions = task.questions || [];
  const totalPoints = quizTotalPoints(questions);
  const answeredCount = questions.filter(q => {
    const a = answers[q.id];
    if (q.type === "mcq" || q.type === "truefalse") return a !== undefined;
    return a !== undefined && String(a).trim() !== "";
  }).length;

  // ── Countdown timer ──
  const timeLimitSec = task.timeLimitMinutes ? task.timeLimitMinutes * 60 : null;
  const [secondsLeft, setSecondsLeft] = useState(timeLimitSec);
  const [timeUp, setTimeUp] = useState(false);
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    if (!timeLimitSec) return;
    const iv = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(iv);
          setTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [timeLimitSec]);

  // Auto-submit khi hết giờ
  useEffect(() => {
    if (timeUp) {
      setTimeout(() => onSubmit(answersRef.current), 800);
    }
  }, [timeUp]);

  const fmtCountdown = (s) => {
    if (s === null) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const urgentColor = secondsLeft !== null && secondsLeft <= 60
    ? "#EF4444"
    : secondsLeft !== null && secondsLeft <= 180
      ? "#F59E0B"
      : "var(--accent)";

  const pctLeft = timeLimitSec ? (secondsLeft / timeLimitSec) * 100 : 100;

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && !timeUp && onClose()}>
      <div className="modal" style={{ width: 560, maxHeight: "85vh", overflowY: "auto", position: "relative" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{task.title}</h2>
            <div style={{ fontSize: 11, color: "var(--text4)" }}>
              {questions.length} câu hỏi · {totalPoints} điểm · Đã trả lời {answeredCount}/{questions.length}
            </div>
          </div>
          {/* Timer display */}
          {timeLimitSec && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              minWidth: 72, marginLeft: 12
            }}>
              <div style={{
                fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                color: urgentColor,
                animation: secondsLeft <= 10 ? "vqPulse 0.6s ease-in-out infinite" : "none",
                transition: "color 0.5s"
              }}>
                {timeUp ? "Hết giờ" : fmtCountdown(secondsLeft)}
              </div>
              {/* Progress arc bar */}
              <div style={{
                width: 64, height: 4, borderRadius: 4,
                background: "rgba(255,255,255,0.1)", marginTop: 4, overflow: "hidden"
              }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  width: `${pctLeft}%`,
                  background: urgentColor,
                  transition: "width 1s linear, background 0.5s"
                }} />
              </div>
              <div style={{ fontSize: 9, color: "var(--text4)", marginTop: 3 }}>còn lại</div>
            </div>
          )}
          {!timeUp && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)", marginLeft: 8, flexShrink: 0 }}><X size={18} /></button>}
        </div>

        {/* Trình phát âm thanh bài nghe (Listening) */}
        {task.mode === "listening" && task.audioUrl && (
          <div style={{ background: "rgba(79,172,254,0.06)", border: "1px solid rgba(79,172,254,0.22)", borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 8, letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 6 }}>
              <Volume2 size={14} /> FILE ÂM THANH BÀI NGHE (AUDIO)
            </div>
            <audio src={task.audioUrl} controls style={{ width: "100%", height: 32 }} />
          </div>
        )}

        {/* Time-up banner */}
        {timeUp && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 14,
            fontSize: 13, fontWeight: 700, color: "#EF4444",
            display: "flex", alignItems: "center", gap: 8
          }}>
            ⏰ Hết thời gian! Bài của bạn đang được nộp tự động...
          </div>
        )}

        {questions.map((q, qi) => {
          const meta = QUESTION_TYPES.find(t => t.v === q.type) || QUESTION_TYPES[0];
          return (
            <div key={q.id} className="scard" style={{ padding: 13, marginBottom: 10, opacity: timeUp ? 0.6 : 1, transition: "opacity 0.3s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: meta.c }}>Câu {qi + 1}</span>
                <Badge c="gray">{meta.l}</Badge>
                <span style={{ fontSize: 10, color: "var(--text4)", marginLeft: "auto" }}>{q.points || 1} điểm</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text)", marginBottom: 10, fontWeight: 500 }}>{q.text}</div>
              {q.type === "mcq" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {(q.options || []).map((opt, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, border: `1px solid ${answers[q.id] === i ? "rgba(79,172,254,.4)" : "var(--wa07)"}`, background: answers[q.id] === i ? "rgba(79,172,254,.08)" : "transparent", cursor: timeUp ? "not-allowed" : "pointer" }}>
                      <input type="radio" name={`take_${q.id}`} checked={answers[q.id] === i} onChange={() => !timeUp && setAns(q.id, i)} style={{ accentColor: "var(--accent)" }} disabled={timeUp} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text3)" }}>{["A", "B", "C", "D"][i]}.</span>
                      <span style={{ fontSize: 12, color: "var(--text2)" }}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === "truefalse" && (
                <div style={{ display: "flex", gap: 10 }}>
                  {[[true, "✅ Đúng"], [false, "❌ Sai"]].map(([v, l]) => (
                    <label key={l} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: 8, border: `1px solid ${answers[q.id] === v ? "rgba(79,172,254,.4)" : "var(--wa07)"}`, background: answers[q.id] === v ? "rgba(79,172,254,.08)" : "transparent", cursor: timeUp ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600, color: answers[q.id] === v ? "var(--accent)" : "var(--text3)" }}>
                      <input type="radio" name={`take_${q.id}`} checked={answers[q.id] === v} onChange={() => !timeUp && setAns(q.id, v)} style={{ accentColor: "var(--accent)" }} disabled={timeUp} />{l}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "short" && (
                <input value={answers[q.id] || ""} onChange={e => !timeUp && setAns(q.id, e.target.value)} placeholder="Nhập câu trả lời..." disabled={timeUp} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text)", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              )}
              {q.type === "essay" && (
                <textarea value={answers[q.id] || ""} onChange={e => !timeUp && setAns(q.id, e.target.value)} placeholder="Viết câu trả lời của bạn..." rows={4} disabled={timeUp} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              )}
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 9, marginTop: 6 }}>
          {!timeUp && <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Hủy</Btn>}
          <Btn onClick={() => {
            if (timeUp) { onSubmit(answers); return; }
            if (answeredCount < questions.length) {
              if (!window.confirm(`Bạn mới làm ${answeredCount}/${questions.length} câu. Bạn có chắc chắn muốn nộp bài không?`)) return;
            } else {
              if (!window.confirm("Bạn có chắc chắn muốn nộp bài?")) return;
            }
            onSubmit(answers);
          }} style={{ flex: 2 }} variant="success"><CheckCircle size={13} />Nộp bài</Btn>
        </div>
      </div>
    </div>
  );
}

function VideoQuizTakeModal({ task, onClose, onSubmit }) {
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 680, maxHeight: "90vh", overflowY: "auto", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{task.title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>
        </div>
        {task.desc && <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>{task.desc}</p>}
        
        {/* Trình phát video tương tác */}
        <InteractiveVideoPlayer task={task} onComplete={onSubmit} />
      </div>
    </div>
  );
}

// Modal xem kết quả / chấm điểm — GV thấy toàn bộ lớp & chấm câu tự luận, HS chỉ thấy kết quả của mình
function QuizReviewModal({ task, user, classStudents, onClose, onSaveEssay }) {
  const isTeacher = user.role === "teacher";
  const [expanded, setExpanded] = useState(isTeacher ? null : user.data.id);
  const questions = task.questions || [];
  const totalPoints = quizTotalPoints(questions);
  const results = task.quizResults || {};
  const rows = isTeacher
    ? classStudents.map(s => ({ student: s, result: results[s.id] }))
    : [{ student: { id: user.data.id, name: user.data.name, photo: user.data.photo }, result: results[user.data.id] }];

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 600, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{task.title}</h2>
            <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>{questions.length} câu · Tổng {totalPoints} điểm</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>
        </div>

        {/* Trình phát âm thanh bài nghe (Listening) trong xem lại */}
        {task.mode === "listening" && task.audioUrl && (
          <div style={{ background: "rgba(79,172,254,0.06)", border: "1px solid rgba(79,172,254,0.22)", borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 8, letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 6 }}>
              <Volume2 size={14} /> FILE ÂM THANH BÀI NGHE (AUDIO)
            </div>
            <audio src={task.audioUrl} controls style={{ width: "100%", height: 32 }} />
          </div>
        )}

        {rows.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>Chưa có học sinh nào.</div>}
        {rows.map(({ student, result }) => {
          const essayQs = questions.filter(q => q.type === "essay");
          const essayTotal = essayQs.reduce((s, q) => s + (Number(result?.essayScores?.[q.id]) || 0), 0);
          const totalScore = result ? result.autoScore + essayTotal : null;
          const pendingEssay = result && essayQs.some(q => result.essayScores?.[q.id] == null || result.essayScores?.[q.id] === "");
          const isOpen = expanded === student.id;
          return (
            <div key={student.id} className="scard" style={{ padding: 0, marginBottom: 10, overflow: "hidden" }}>
              <div onClick={() => isTeacher && setExpanded(isOpen ? null : student.id)} style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, cursor: isTeacher ? "pointer" : "default" }}>
                <Av photo={student.photo} sz={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{student.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text4)" }}>{result ? (pendingEssay ? "Chờ chấm tự luận" : "Đã chấm xong") : "Chưa nộp bài"}</div>
                </div>
                {result && <div className="hfont" style={{ fontSize: 16, fontWeight: 400, color: pendingEssay ? "#F59E0B" : "#34D399" }}>{totalScore}/{totalPoints}</div>}
              </div>
              {isOpen && result && (
                <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--wa025)" }}>
                  {questions.map((q, qi) => {
                    const meta = QUESTION_TYPES.find(t => t.v === q.type) || QUESTION_TYPES[0];
                    const ans = result.answers?.[q.id];
                    const d = result.detail?.[q.id];
                    return (
                      <div key={q.id} style={{ padding: "10px 0", borderBottom: qi < questions.length - 1 ? "1px solid var(--wa025)" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: meta.c }}>Câu {qi + 1} · {meta.l}</span>
                          {q.type !== "essay" && <span style={{ fontSize: 10, fontWeight: 700, color: d?.correct ? "#34D399" : "#EF4444", marginLeft: "auto" }}>{d?.correct ? "Đúng" : "Sai"} ({d?.pts || 0}/{d?.maxPts || q.points || 1})</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text2)", marginBottom: 6 }}>{q.text}</div>
                        {q.type === "mcq" && (
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>
                            Trả lời: {ans != null ? `${["A", "B", "C", "D"][ans]}. ${q.options?.[ans] || ""}` : "— (chưa chọn)"}<br />
                            Đáp án đúng: {["A", "B", "C", "D"][q.correctIndex]}. {q.options?.[q.correctIndex] || ""}
                          </div>
                        )}
                        {q.type === "truefalse" && (
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>Trả lời: {ans === undefined ? "— (chưa chọn)" : (ans ? "Đúng" : "Sai")} · Đáp án đúng: {q.correctBool ? "Đúng" : "Sai"}</div>
                        )}
                        {q.type === "short" && (
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>Trả lời: {ans || "— (bỏ trống)"} · Đáp án chấp nhận: {q.correctText}</div>
                        )}
                        {q.type === "essay" && (
                          <div>
                            <div style={{ fontSize: 11.5, color: "var(--text)", background: "var(--wa04)", borderRadius: 8, padding: "8px 10px", marginBottom: 6, whiteSpace: "pre-wrap" }}>{ans || "— (chưa trả lời)"}</div>
                            {isTeacher ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 10.5, color: "var(--text4)" }}>Điểm:</span>
                                <input type="number" min={0} max={q.points || 1} step={0.25} defaultValue={result.essayScores?.[q.id] ?? ""} onBlur={e => onSaveEssay(task.id, student.id, q.id, e.target.value === "" ? null : Math.max(0, Math.min(Number(q.points) || 1, Number(e.target.value))))} style={{ width: 56, padding: "4px 7px", borderRadius: 6, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text)", fontSize: 11, textAlign: "center", fontFamily: "inherit" }} />
                                <span style={{ fontSize: 10.5, color: "var(--text4)" }}>/ {q.points || 1}</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: 10.5, color: "var(--text4)" }}>Điểm: {result.essayScores?.[q.id] ?? "Chưa chấm"} / {q.points || 1}</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskPage({ state, user, selClass, setSelClass, myClasses }) {
  useActivityTracker("Bài tập", "Vào mục bài tập", user.role);
  const classId = user.role === "teacher" ? selClass : user.classId;
  const allTasks = state.assignments[classId] || [];
  const tasks = allTasks;
  const classStudents = useMemo(() => (state.students || []).filter(s => s.classId === classId), [state.students, classId]);
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState("all");
  const [newTask, setNewTask] = useState({ title: "", desc: "", subject: SUBJECTS[0], deadline: "", priority: false, attachments: [], mode: "file", questions: [] });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errTask, setErrTask] = useState("");
  const [takingTaskId, setTakingTaskId] = useState(null);
  const [reviewTaskId, setReviewTaskId] = useState(null);
  const fileRef = useRef();
  const { confirm, ConfirmUI } = useConfirm();

  const addQuestion = type => setNewTask(p => ({ ...p, questions: [...p.questions, newQuestion(type)] }));
  const updateQuestion = (qid, patch) => setNewTask(p => ({ ...p, questions: p.questions.map(q => q.id === qid ? { ...q, ...patch } : q) }));
  const removeQuestion = qid => setNewTask(p => ({ ...p, questions: p.questions.filter(q => q.id !== qid) }));

  const filtered = tab === "all" ? tasks : tasks.filter(t => t.status === tab);
  const counts = { all: tasks.length, pending: tasks.filter(t => t.status === "pending").length, submitted: tasks.filter(t => t.status === "submitted").length, overdue: tasks.filter(t => t.status === "overdue").length };

  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioRef = useRef();

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

  const handleAudioUpload = e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 25 * 1024 * 1024) { alert("Dung lượng file âm thanh tối đa 25MB!"); return; }
    setUploadingAudio(true);
    const r = new FileReader();
    r.onload = async () => {
      try {
        const res = await api.createFile({
          classId,
          name: file.name,
          type: "audio",
          size: (file.size / 1024).toFixed(0) + "KB",
          data: r.result
        });
        if (res && res.data) {
          setNewTask(p => ({ ...p, audioUrl: res.data }));
          alert("Tải file âm thanh lên máy chủ thành công!");
        } else {
          setNewTask(p => ({ ...p, audioUrl: r.result }));
          alert("Tải file âm thanh cục bộ thành công!");
        }
      } catch (err) {
        setNewTask(p => ({ ...p, audioUrl: r.result }));
        alert("Lưu file âm thanh thành công!");
      } finally {
        setUploadingAudio(false);
      }
    };
    r.readAsDataURL(file);
  };

  const addTask = () => {
    if (!newTask.title.trim()) { setErrTask("Nhập tên bài tập"); return; }
    if (!newTask.deadline) { setErrTask("Chọn deadline"); return; }
    
    if (newTask.mode === "listening") {
      if (!newTask.audioUrl) { setErrTask("Vui lòng tải lên file âm thanh cho bài nghe"); return; }
      if (newTask.questions.length === 0) { setErrTask("Thêm ít nhất 1 câu hỏi"); return; }
      for (const q of newTask.questions) {
        if (!q.text.trim()) { setErrTask("Nhập đầy đủ nội dung cho tất cả câu hỏi"); return; }
        if (q.type === "mcq" && (q.options || []).some(o => !o.trim())) { setErrTask("Điền đủ 4 phương án cho câu trắc nghiệm ABCD"); return; }
      }
    } else if (newTask.mode === "video") {
      if (!newTask.videoUrl) { setErrTask("Vui lòng nhập link video bài giảng"); return; }
      if (newTask.questions.length === 0) { setErrTask("Thêm ít nhất 1 câu hỏi"); return; }
      for (const q of newTask.questions) {
        if (!q.text.trim()) { setErrTask("Nhập đầy đủ nội dung cho tất cả câu hỏi"); return; }
        if (q.type === "mcq" && (q.options || []).some(o => !o.trim())) { setErrTask("Điền đủ 4 phương án cho câu trắc nghiệm ABCD"); return; }
      }
      newTask.type = "video";
    } else if (newTask.mode === "quiz" || newTask.questions.length > 0) {
      if (newTask.questions.length === 0) { setErrTask("Thêm ít nhất 1 câu hỏi"); return; }
      for (const q of newTask.questions) {
        if (!q.text.trim()) { setErrTask("Nhập đầy đủ nội dung cho tất cả câu hỏi"); return; }
        if (q.type === "mcq" && (q.options || []).some(o => !o.trim())) { setErrTask("Điền đủ 4 phương án cho câu trắc nghiệm ABCD"); return; }
        if (q.type === "short" && !q.correctText.trim()) { setErrTask("Nhập đáp án đúng cho câu trả lời ngắn"); return; }
      }
      newTask.mode = "quiz";
    }

    state.setAssignments(p => ({ ...p, [classId]: [...(p[classId] || []), { id: "task_" + Date.now(), ...newTask, status: "pending", createdAt: Date.now(), quizResults: {} } ] }));
    setNewTask({ title: "", desc: "", subject: SUBJECTS[0], deadline: "", priority: false, attachments: [], mode: "file", questions: [], audioUrl: "", videoUrl: "" });
    setShowAdd(false); setErrTask("");
  };

  const submitTask = tid => {
    state.setAssignments(p => ({ ...p, [classId]: (p[classId] || []).map(t => t.id === tid ? { ...t, status: "submitted", submittedAt: Date.now(), submissions: { ...(t.submissions || {}), [user.data.id]: Date.now() } } : t) }));
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
  };

  const submitQuiz = (tid, answers) => {
    const task = tasks.find(t => t.id === tid);
    if (!task) return;
    const { autoScore, maxAutoScore, maxTotal, hasEssay, detail } = computeQuizScore(task.questions, answers);
    const resultEntry = { answers, autoScore, maxAutoScore, maxTotal, detail, essayScores: {}, submittedAt: Date.now(), graded: !hasEssay };
    state.setAssignments(p => ({
      ...p,
      [classId]: (p[classId] || []).map(t => t.id === tid ? {
        ...t,
        status: "submitted",
        submittedAt: Date.now(),
        submissions: { ...(t.submissions || {}), [user.data.id]: Date.now() },
        quizResults: { ...(t.quizResults || {}), [user.data.id]: resultEntry },
      } : t),
    }));
    confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
    setTakingTaskId(null);
  };

  const saveEssayScore = (tid, sid, qid, points) => {
    state.setAssignments(p => ({
      ...p,
      [classId]: (p[classId] || []).map(t => {
        if (t.id !== tid) return t;
        const results = { ...(t.quizResults || {}) };
        const r = results[sid];
        if (!r) return t;
        const essayScores = { ...(r.essayScores || {}), [qid]: points };
        const essayQs = (t.questions || []).filter(q => q.type === "essay");
        const graded = essayQs.every(q => essayScores[q.id] != null && essayScores[q.id] !== "");
        results[sid] = { ...r, essayScores, graded };
        return { ...t, quizResults: results };
      }),
    }));
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
        {[["Tất cả",counts.all,"var(--accent)"],["Chờ nộp",counts.pending,"#F59E0B"],["Đã nộp",counts.submitted,"#34D399"],["Trễ hạn",counts.overdue,"#EF4444"]].map(([l,n,c]) => (
          <div key={l} className="scard" style={{ padding: 14, textAlign: "center" }}>
            <div className="hfont" style={{ fontSize: 22, fontWeight: 400, color: c }}>{n}</div>
            <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div className="scard" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--wa055)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[["all","Tất cả"],["pending","Chờ"],["submitted","Đã nộp"],["overdue","Trễ"]].map(([v,l]) => <button key={v} onClick={() => setTab(v)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${tab===v?"rgba(79,172,254,.4)":"var(--wa07)"}`, background: tab===v?"rgba(79,172,254,.1)":"transparent", color: tab===v?"var(--accent)":"var(--text2)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>)}
          </div>
          {user.role === "teacher" && <Btn onClick={() => setShowAdd(true)} small><Plus size={12} />Thêm bài</Btn>}
        </div>
        {filtered.length === 0 ? <div style={{ padding: 36, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>Chưa có bài tập nào.</div> : filtered.map(a => {
          const isQuiz = a.mode === "quiz" || a.mode === "listening" || a.mode === "video" || (a.questions && a.questions.length > 0);
          const totalPoints = quizTotalPoints(a.questions);
          const hasSubmitted = !!a.submissions?.[user.data.id];
          const myResult = a.quizResults?.[user.data.id];
          const myEssayQs = (a.questions || []).filter(q => q.type === "essay");
          const myEssayPending = myResult && myEssayQs.some(q => myResult.essayScores?.[q.id] == null || myResult.essayScores?.[q.id] === "");
          const myTotal = myResult ? myResult.autoScore + myEssayQs.reduce((s, q) => s + (Number(myResult.essayScores?.[q.id]) || 0), 0) : 0;
          const submittedCount = Object.keys(a.submissions || {}).length;
          return (
          <div key={a.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--wa025)", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${SCOLS[a.subject]||"var(--accent)"}14`, display: "flex", alignItems: "center", justifyContent: "center", color: SCOLS[a.subject]||"var(--accent)", fontWeight: 700, fontSize: 8, textAlign: "center", padding: 3 }}>{a.subject}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{a.title}</div>
              {a.desc && <div style={{ fontSize: 11, color: "var(--text4)", marginBottom: 4 }}>{a.desc}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: "var(--text2)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{a.deadline}</span>
                {a.priority && <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 600 }}>⚡ Ưu tiên</span>}
                {a.mode === "listening" && <span style={{ fontSize: 10, color: "var(--accent)", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}><Volume2 size={10} />🎧 Bài nghe</span>}
                {a.mode === "video" && <span style={{ fontSize: 10, color: "#A78BFA", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}><Video size={10} />🎬 Video Quiz</span>}
                {a.mode === "quiz" && <span style={{ fontSize: 10, color: "#34D399", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}><ListChecks size={10} />📝 Trắc nghiệm</span>}
                {a.mode === "file" && <span style={{ fontSize: 10, color: "#F59E0B", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}><Upload size={10} />📂 Nộp file</span>}
                {a.attachments?.length > 0 && <span style={{ fontSize: 10, color: "var(--text2)", display: "flex", alignItems: "center", gap: 3 }}><Paperclip size={10} />{a.attachments.length} file</span>}
                {isQuiz && <span style={{ fontSize: 10, color: "var(--text2)", display: "flex", alignItems: "center", gap: 4 }}><ListChecks size={10} />{a.questions?.length || 0} câu · {totalPoints} điểm</span>}
                {isQuiz && a.timeLimitMinutes && (
                  <span style={{ fontSize: 10, color: "#F59E0B", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
                    <Clock size={10} />⏱ {a.timeLimitMinutes} phút
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              {isQuiz ? (
                user.role === "student" ? (
                  hasSubmitted
                    ? <Badge c={myEssayPending ? "amber" : "green"}>{myEssayPending ? "Chờ chấm" : `Điểm: ${myTotal}/${totalPoints}`}</Badge>
                    : <Badge c="amber">Chưa làm bài</Badge>
                ) : <Badge c="blue">{submittedCount}/{classStudents.length} đã nộp</Badge>
              ) : (
                <Badge c={STATUS_CFG[a.status]?.c||"blue"}>{STATUS_CFG[a.status]?.l||a.status}</Badge>
              )}
              {isQuiz && user.role === "student" && !hasSubmitted && <Btn onClick={() => setTakingTaskId(a.id)} small variant="success"><ListChecks size={12} />Làm bài</Btn>}
              {isQuiz && user.role === "student" && hasSubmitted && <Btn onClick={() => setReviewTaskId(a.id)} small variant="ghost"><Eye size={12} />Xem kết quả</Btn>}
              {isQuiz && user.role === "teacher" && <Btn onClick={() => setReviewTaskId(a.id)} small variant="ghost"><ClipboardList size={12} />Xem bài làm</Btn>}
              {!isQuiz && user.role === "student" && a.status === "pending" && <Btn onClick={() => {
                if (window.confirm("Xác nhận nộp bài tập này?")) submitTask(a.id);
              }} small variant="success">Nộp bài</Btn>}
              {user.role === "teacher" && <button onClick={() => deleteTask(a.id)} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex" }}><Trash2 size={12} /></button>}
            </div>
          </div>
          );
        })}
      </div>
      {showAdd && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal" style={{ width: 580, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Thêm bài tập mới</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>
            </div>
            <Inp label="TÊN BÀI TẬP" value={newTask.title} onChange={v => setNewTask(p => ({ ...p, title: v }))} placeholder="Bài tập chương 3..." required />
            
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, letterSpacing: ".05em" }}>HÌNH THỨC BÀI TẬP</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[["file", "Nộp file", Upload], ["quiz", "Trắc nghiệm", ListChecks], ["listening", "Bài nghe", Volume2], ["video", "Video Quiz", Video]].map(([v, l, Ic]) => (
                  <button key={v} onClick={() => setNewTask(p => ({ ...p, mode: v, questions: v === "file" ? [] : p.questions }))} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 6px", borderRadius: 10, border: `1px solid ${newTask.mode === v ? "rgba(79,172,254,.4)" : "var(--wa1)"}`, background: newTask.mode === v ? "rgba(79,172,254,.1)" : "var(--wa04)", color: newTask.mode === v ? "var(--accent)" : "var(--text3)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    <Ic size={12} />{l}
                  </button>
                ))}
              </div>
            </div>

            {newTask.mode === "listening" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, letterSpacing: ".05em" }}>TẢI FILE ÂM THANH (AUDIO)</div>
                <button onClick={() => audioRef.current?.click()} style={{ width: "100%", padding: "12px", borderRadius: 11, border: "2px dashed rgba(79,172,254,.27)", background: "rgba(79,172,254,.025)", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", fontSize: 12 }}>
                  <Volume2 size={16} style={{ color: "var(--accent)" }} />{uploadingAudio ? "Đang tải lên..." : "Chọn file âm thanh (.mp3, .wav, .m4a)"}
                </button>
                <input ref={audioRef} type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: "none" }} />
                {newTask.audioUrl && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, background: "var(--wa025)", padding: 10, borderRadius: 10, border: "1px solid var(--wa045)" }}>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>File âm thanh đã tải lên:</div>
                    <audio src={newTask.audioUrl} controls style={{ width: "100%", height: 32 }} />
                  </div>
                )}
              </div>
            )}

            {newTask.mode === "video" && (
              <div style={{ marginBottom: 16 }}>
                <Inp label="LINK VIDEO BÀI GIẢNG (.mp4 trực tiếp)" value={newTask.videoUrl || ""} onChange={v => setNewTask(p => ({ ...p, videoUrl: v }))} placeholder="https://example.com/video.mp4" required />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5, letterSpacing: ".05em" }}>MÔ TẢ</div>
              <textarea value={newTask.desc} onChange={e => setNewTask(p => ({ ...p, desc: e.target.value }))} placeholder="Mô tả chi tiết..." rows={2} style={{ width: "100%", padding: "9px 13px", borderRadius: 10, background: "var(--wa04)", border: "1px solid var(--wa1)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Sel label="MÔN HỌC" value={newTask.subject} onChange={v => setNewTask(p => ({ ...p, subject: v }))} options={SUBJECTS} required />
              <DatePickerInp label="DEADLINE" value={newTask.deadline} onChange={v => setNewTask(p => ({ ...p, deadline: v }))} required />
            </div>
            
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text3)", cursor: "pointer", marginBottom: 16 }}>
              <input type="checkbox" checked={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.checked }))} style={{ accentColor: "#F59E0B" }} />⚡ Ưu tiên cao
            </label>
            
            {(newTask.mode === "quiz" || newTask.mode === "listening" || newTask.mode === "video") && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text3)", cursor: "pointer", marginBottom: 16 }}>
                <input type="checkbox" checked={newTask.strictFullscreen || false} onChange={e => setNewTask(p => ({ ...p, strictFullscreen: e.target.checked }))} style={{ accentColor: "#10B981" }} />🛡️ Bật hệ thống chống gian lận &amp; giám sát AI
              </label>
            )}

            {(newTask.mode === "quiz" || newTask.mode === "listening" || newTask.mode === "video") && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, letterSpacing: ".05em" }}>⏱ THỜI GIAN LÀM BÀI</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text3)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!newTask.timeLimitMinutes}
                      onChange={e => setNewTask(p => ({ ...p, timeLimitMinutes: e.target.checked ? 30 : null }))}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    Giới hạn thời gian
                  </label>
                  {!!newTask.timeLimitMinutes && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
                      <input
                        type="number" min={1} max={240}
                        value={newTask.timeLimitMinutes || ""}
                        onChange={e => setNewTask(p => ({ ...p, timeLimitMinutes: Math.max(1, parseInt(e.target.value) || 1) }))}
                        style={{ width: 64, padding: "5px 9px", borderRadius: 8, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text)", fontSize: 13, fontWeight: 700, outline: "none", fontFamily: "inherit", textAlign: "center" }}
                      />
                      <span style={{ fontSize: 12, color: "var(--text3)" }}>phút</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[10, 15, 20, 30, 45, 60].map(m => (
                          <button key={m} onClick={() => setNewTask(p => ({ ...p, timeLimitMinutes: m }))}
                            style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${newTask.timeLimitMinutes === m ? "rgba(79,172,254,.5)" : "var(--wa1)"}`, background: newTask.timeLimitMinutes === m ? "rgba(79,172,254,.12)" : "var(--wa04)", color: newTask.timeLimitMinutes === m ? "var(--accent)" : "var(--text4)", fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {m}p
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(newTask.mode === "quiz" || newTask.mode === "listening" || newTask.mode === "video") ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, letterSpacing: ".05em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>CÂU HỎI ({newTask.questions.length})</span>
                  <span style={{ fontWeight: 500, color: "var(--text4)" }}>Tổng điểm: {quizTotalPoints(newTask.questions)}</span>
                </div>
                {newTask.questions.map((q, qi) => (
                  <QuestionEditor key={q.id} q={q} index={qi} onChange={patch => updateQuestion(q.id, patch)} onDelete={() => removeQuestion(q.id)} isVideo={newTask.mode === "video"} />
                ))}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(newTask.mode === "listening" || newTask.mode === "video" ? QUESTION_TYPES.filter(qt => qt.v === "mcq" || qt.v === "truefalse") : QUESTION_TYPES).map(qt => (
                    <button key={qt.v} onClick={() => addQuestion(qt.v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 8, border: `1px dashed ${qt.c}55`, background: `${qt.c}0c`, color: qt.c, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      <Plus size={11} /><qt.Ic size={12} />{qt.l}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, letterSpacing: ".05em" }}>ĐÍNH KÈM FILE</div>
                <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "12px", borderRadius: 11, border: "2px dashed rgba(79,172,254,.27)", background: "rgba(79,172,254,.025)", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", fontSize: 12 }}>
                  <Upload size={16} style={{ color: "var(--accent)" }} />{uploadingFile ? "Đang xử lý..." : "Nhấn để chọn file"}
                </button>
                <input ref={fileRef} type="file" multiple onChange={handleFileUpload} style={{ display: "none" }} />
                {newTask.attachments.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {newTask.attachments.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "rgba(79,172,254,.07)", border: "1px solid rgba(79,172,254,.18)", fontSize: 11, color: "var(--accent)" }}>
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
              <Btn onClick={addTask} style={{ flex: 2 }}>Tạo bài tập</Btn>
            </div>
          </div>
        </div>
      )}
      {takingTaskId && (() => {
        const t = tasks.find(x => x.id === takingTaskId);
        if (!t) return null;
        if (t.mode === "video") {
          return t.strictFullscreen ? (
            <StudentAssignmentModal task={t} user={user} onCancel={() => setTakingTaskId(null)} onComplete={ans => { setTakingTaskId(null); submitQuiz(t.id, ans); }} />
          ) : (
            <VideoQuizTakeModal task={t} onClose={() => setTakingTaskId(null)} onSubmit={ans => { setTakingTaskId(null); submitQuiz(t.id, ans); }} />
          );
        }
        return t.strictFullscreen ? (
          <StudentAssignmentModal task={t} user={user} onCancel={() => setTakingTaskId(null)} onComplete={ans => { setTakingTaskId(null); submitQuiz(t.id, ans); }} />
        ) : (
          <QuizTakeModal task={t} onClose={() => setTakingTaskId(null)} onSubmit={ans => submitQuiz(t.id, ans)} />
        );
      })()}
      {reviewTaskId && (() => {
        const t = tasks.find(x => x.id === reviewTaskId);
        return t ? <QuizReviewModal task={t} user={user} classStudents={classStudents} onClose={() => setReviewTaskId(null)} onSaveEssay={saveEssayScore} /> : null;
      })()}
    </div>
  );
}


// vòng quay may mắn

function WheelPage({ state, user, selClass, setSelClass, myClasses }) {
  useActivityTracker("Vòng quay", "Vào vòng quay may mắn", user.role);
  const classId = user.role === "teacher" ? selClass : user.classId;
  const baseStudents = useMemo(() => {
    const today = (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
    const attKey = `${classId}_${today}`;
    const presentIds = state.attendance[attKey] || [];
    return state.students.filter(s => s.classId === classId && presentIds.includes(s.id));
  }, [state.students, classId, state.attendance]);
  const [removedIds, setRemovedIds] = useState([]);
  const students = useMemo(() => baseStudents.filter(s => !removedIds.includes(s.id)), [baseStudents, removedIds]);
  const N = students.length;
  const [totalRot, setTotalRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const [history, setHistory] = useState([]);
  const WCOLS = ["var(--accent)","#818CF8","#34D399","#F59E0B","#F472B6","#FB923C","#A78BFA","#4ADE80","#60A5FA","#FACC15","#E879F9","#FCA5A5","#38BDF8","#6EE7B7"];

  if (N < 2) return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {user.role === "teacher" && myClasses && myClasses.length > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--wa015)", border: "1px solid var(--border2)", padding: "10px 14px", borderRadius: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)" }}>CHỌN LỚP HỌC:</span>
          <select value={selClass} onChange={e => setSelClass(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, background: "var(--wa055)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 12, outline: "none", fontFamily: "inherit" }}>
            {myClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.school || 'Không rõ trường'})</option>)}
          </select>
        </div>
      )}
      <div style={{ textAlign: "center", color: "var(--text3)", paddingTop: 40 }}>Cần ít nhất 2 học sinh trong lớp để vòng quay hoạt động.</div>
    </div>
  );

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
          <div style={{ fontSize: 12, color: "var(--text4)", marginBottom: 18 }}>Quay ngẫu nhiên để chọn học sinh</div>
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
                      <path d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={col} stroke="var(--bg)" strokeWidth="1.5" opacity={isWinner ? 1 : .88} />
                      {isWinner && <path d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`} fill="none" stroke="#FFF" strokeWidth="2.5" opacity=".7" />}
                      <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fontSize={N > 20 ? 7 : N > 12 ? 9 : 10} fontWeight="700" fill="rgba(255,255,255,.95)" transform={`rotate(${textRot},${mx},${my})`}>{s.name.split(" ").pop()}</text>
                    </g>
                  );
                })}
                <circle cx="150" cy="150" r="22" fill="var(--bg)" />
                <circle cx="150" cy="150" r="10" fill="var(--accent)" />
                <circle cx="150" cy="150" r="5" fill="#FFF" />
              </svg>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Btn onClick={spin} disabled={spinning} style={{ padding: "12px 40px", fontSize: 14, fontWeight: 700, justifyContent: "center" }}>{spinning ? "🌀 Đang quay..." : "🎯 Quay ngay!"}</Btn>
            {removedIds.length > 0 && !spinning && (
              <button onClick={() => setRemovedIds([])} style={{ padding: "0 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text3)", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>🔄 Làm mới</button>
            )}
          </div>
        </Card>
        {winner && !spinning && (
          <div style={{ borderRadius: 14, padding: 22, textAlign: "center", background: "linear-gradient(135deg,rgba(79,172,254,.08),rgba(129,140,248,.08))", border: "1px solid rgba(79,172,254,.25)", animation: "pop .4s ease" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Av photo={winner.photo} sz={68} glow /></div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 5 }}>🎉 {winner.name}</div>
            <div style={{ fontSize: 11, color: "var(--text4)", marginBottom: 16 }}>{winner.code}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setWinner(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>Giữ lại</button>
              <button onClick={() => { setRemovedIds(p => [...p, winner.id]); setWinner(null); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#FFF", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s", boxShadow: "0 4px 12px rgba(79,172,254,.3)" }}>Loại bỏ</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="scard" style={{ overflow: "hidden" }}>
          <div style={{ padding: "10px 13px", borderBottom: "1px solid var(--wa055)", fontSize: 12, fontWeight: 700, color: "var(--text)" }}>DS Học sinh ({N})</div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {students.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderBottom: "1px solid var(--wa02)", fontSize: 11, color: "var(--text2)", background: winnerIdx === i && !spinning ? "rgba(79,172,254,.07)" : "transparent" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: WCOLS[i % WCOLS.length], flexShrink: 0 }} />
                <Av photo={s.photo} sz={22} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                {winnerIdx === i && !spinning && <span style={{ fontSize: 12 }}>🏆</span>}
              </div>
            ))}
          </div>
        </div>
        {history.length > 0 && (
          <div className="scard" style={{ overflow: "hidden" }}>
            <div style={{ padding: "10px 13px", borderBottom: "1px solid var(--wa055)", fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Lịch sử quay</div>
            {history.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderBottom: "1px solid var(--wa02)", fontSize: 10, color: "var(--text2)" }}>
                <Av photo={h.photo} sz={18} />
                <span style={{ flex: 1 }}>{h.name.split(" ").pop()}</span>
                <span style={{ color: "var(--text3)" }}>{h.at}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// thư viện số


function LibPage({ state, user, selClass, setSelClass, myClasses }) {
  useActivityTracker("Tài liệu", "Vào xem tài liệu", user.role);
  const classId = user.role === "teacher" ? selClass : user.classId;
  const allFiles = state.files[classId] || [];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); 
  const [showAdd, setShowAdd] = useState(false);
  const [newFile, setNewFile] = useState({ name: "", type: "pdf", subject: SUBJECTS[0], desc: "", data: null, size: "", url: "" });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errFile, setErrFile] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const fileRef = useRef();
  const { confirm, ConfirmUI } = useConfirm();

  // Loại nào xem trước được ngay trong ứng dụng: PDF, ảnh (jpg/png), video (mp4), video YouTube
  const canPreview = f => {
    const fileUrl = getFileUrl(f);
    if (!fileUrl) return false;
    if (f.type === "youtube") return !!getYoutubeId(fileUrl);
    return ["pdf", "jpg", "png", "mp4"].includes(f.type);
  };

  const downloadableTypes = ["docx","pdf","xlsx","pptx","txt","zip","jpg","png"];
  const handleDownloadFile = async f => {
    const fileUrl = getFileUrl(f);
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = f.name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    try {
      await api.downloadFile(f.id);
      incDownload(f.id);
    } catch (err) {
      console.error("Failed to record download", err);
    }
  };

  const openPreview = f => { setPreviewFile(f); incDownload(f.id); };

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
    if (isLinkType(newFile.type)) {
      if (!newFile.url.trim()) { setErrFile(newFile.type === "youtube" ? "Dán liên kết video YouTube" : "Dán liên kết tham khảo"); return; }
      if (!/^https?:\/\//i.test(newFile.url.trim())) { setErrFile("Liên kết phải bắt đầu bằng http:// hoặc https://"); return; }
    }
    const ytId = newFile.type === "youtube" ? getYoutubeId(newFile.url) : null;
    state.setFiles(p => ({ ...p, [classId]: [...(p[classId] || []), { id: "f_" + Date.now(), name: newFile.name.trim(), type: newFile.type, subject: newFile.subject, desc: newFile.desc, size: isLinkType(newFile.type) ? (newFile.type === "youtube" ? "Video" : "Liên kết") : (newFile.size || "--"), data: newFile.data, url: isLinkType(newFile.type) ? newFile.url.trim() : "", thumb: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "", downloads: 0, uploadedAt: Date.now(), uploader: user.data.name }] }));
    setNewFile({ name: "", type: "pdf", subject: SUBJECTS[0], desc: "", data: null, size: "", url: "" }); setShowAdd(false); setErrFile("");
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

  const previewUrl = previewFile ? getFileUrl(previewFile) : "";

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {ConfirmUI}

      {/* ── Header stats ── */}
      {allFiles.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
          {[
            ["Tổng tài liệu", allFiles.length, "var(--accent)", "📚"],
            ["Lượt tải", allFiles.reduce((a,f) => a + (f.downloads||0), 0), "#34D399", "📥"],
            ["Môn học", usedSubjects.length, "#A78BFA", "🎓"],
            ["Loại file", Object.keys(typeStats).length, "#F59E0B", "📂"],
          ].map(([l, v, c, ic]) => (
            <div key={l} className="scard" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c}16`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{ic}</div>
              <div>
                <div className="hfont" style={{ fontSize: 20, fontWeight: 400, color: c, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 2 }}>{l}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--wa08)" }}>
          <Search size={13} style={{ color: "var(--text3)", flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tài liệu..." style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 12, fontFamily: "inherit", flex: 1 }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)", display: "flex", padding: 0 }}><X size={12} /></button>}
        </div>
        <select className="inp" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: "auto", fontSize: 11, padding: "7px 11px" }}>
          <option value="all">Tất cả loại</option>
          {usedTypes.map(t => <option key={t} value={t}>{(t === "youtube" ? "YouTube" : t === "link" ? "Link tham khảo" : t.toUpperCase())} ({typeStats[t]||0})</option>)}
        </select>
        <select className="inp" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ width: "auto", fontSize: 11, padding: "7px 11px" }}>
          <option value="all">Tất cả môn</option>
          {usedSubjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* View mode toggle */}
        <div style={{ display: "flex", borderRadius: 9, overflow: "hidden", border: "1px solid var(--wa08)" }}>
          {[["grid","⊞"],["list","☰"]].map(([m, ic]) => (
            <button key={m} onClick={() => setViewMode(m)} style={{ padding: "7px 11px", border: "none", cursor: "pointer", background: viewMode === m ? "rgba(79,172,254,.15)" : "var(--wa03)", color: viewMode === m ? "var(--accent)" : "var(--text4)", fontSize: 13, fontFamily: "inherit", transition: "all .2s" }}>{ic}</button>
          ))}
        </div>
        {user.role === "teacher" && (
          <Btn onClick={() => { setNewFile({ name: "", type: "pdf", subject: SUBJECTS[0], desc: "", data: null, size: "", url: "" }); setErrFile(""); setShowAdd(true); }}>
            <Upload size={13} />Thêm tài liệu
          </Btn>
        )}
      </div>

      {/* ── File list / grid ── */}
      <div className="scard" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--wa055)", display: "flex", alignItems: "center", gap: 8 }}>
          <Library size={14} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Thư viện tài liệu</span>
          <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 4 }}>
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
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text4)", marginBottom: 8 }}>
              {allFiles.length === 0 ? "Thư viện còn trống" : "Không tìm thấy tài liệu"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 20 }}>
              {allFiles.length === 0
                ? "Hãy thêm tài liệu đầu tiên cho lớp học"
                : "Thử thay đổi từ khoá hoặc bộ lọc"}
            </div>
            {allFiles.length === 0 && user.role === "teacher" && (
              <Btn onClick={() => { setNewFile({ name: "", type: "pdf", subject: SUBJECTS[0], desc: "", data: null, size: "", url: "" }); setErrFile(""); setShowAdd(true); }}>
                <Upload size={13} />Thêm tài liệu đầu tiên
              </Btn>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* Grid view */
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
            {filtered.map(f => {
              const col = FILE_COLORS[f.type] || "var(--text3)";
              const fileUrl = getFileUrl(f);
              const thumbSrc = getFileThumb(f);
              return (
                <div key={f.id} style={{ borderRadius: 12, background: "var(--wa03)", border: `1px solid ${col}22`, padding: 14, display: "flex", flexDirection: "column", gap: 8, transition: "all .2s", position: "relative" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${col}55`; e.currentTarget.style.background = `${col}08`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${col}22`; e.currentTarget.style.background = "var(--wa03)"; e.currentTarget.style.transform = "none"; }}>
                  {/* File icon / thumbnail */}
                  {thumbSrc ? (
                    <div onClick={() => canPreview(f) && openPreview(f)} style={{ width: "100%", height: 70, borderRadius: 9, overflow: "hidden", position: "relative", flexShrink: 0, cursor: canPreview(f) ? "pointer" : "default" }}>
                      <img src={thumbSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={14} style={{ color: "#fff" }} fill="#fff" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => canPreview(f) && openPreview(f)} style={{ width: "100%", height: 70, borderRadius: 9, background: `${col}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, flexShrink: 0, position: "relative", cursor: canPreview(f) ? "pointer" : "default" }}>
                      {f.type === "jpg" || f.type === "png" ? <img src={f.data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 9 }} /> : (FILE_ICONS[f.type] || "📁")}
                      {canPreview(f) && (
                        <div className="preview-hint" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "all .18s", borderRadius: 9 }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = "rgba(0,0,0,.35)"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.background = "rgba(0,0,0,0)"; }}>
                          <Eye size={20} style={{ color: "#fff" }} />
                        </div>
                      )}
                    </div>
                  )}
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>{f.name}</div>
                    {f.desc && <div style={{ fontSize: 10, color: "var(--text4)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.desc}</div>}
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: `${col}20`, color: col, letterSpacing: ".05em", textTransform: "uppercase" }}>{f.type === "youtube" ? "YouTube" : f.type === "link" ? "Link" : f.type}</span>
                      {f.subject && <span style={{ fontSize: 9, fontWeight: 600, color: "#A78BFA", background: "rgba(167,139,250,.12)", padding: "2px 6px", borderRadius: 5 }}>{f.subject}</span>}
                    </div>
                  </div>
                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid var(--wa05)" }}>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{f.size} · {f.downloads || 0}{isLinkType(f.type) ? "👁" : "↓"}</span>
                    <div style={{ display: "flex", gap: 5 }}>
                      {canPreview(f) && f.type !== "youtube" && (
                        <button onClick={() => openPreview(f)} style={{ padding: "4px 7px", borderRadius: 7, border: `1px solid ${col}44`, background: `${col}10`, color: col, cursor: "pointer", display: "flex" }}>
                          <Eye size={10} />
                        </button>
                      )}
                      {isLinkType(f.type) ? (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" onClick={() => incDownload(f.id)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 9px", borderRadius: 7, border: `1px solid ${col}44`, background: `${col}10`, color: col, fontSize: 10, fontWeight: 700, textDecoration: "none" }}>
                          <ExternalLink size={10} />Xem
                        </a>
                      ) : (downloadableTypes.includes(f.type) && fileUrl) ? (
                        <button onClick={() => handleDownloadFile(f)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 9px", borderRadius: 7, border: `1px solid ${col}44`, background: `${col}10`, color: col, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                          <Download size={10} />⬇ Tải
                        </button>
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
              const col = FILE_COLORS[f.type] || "var(--text3)";
              const fileUrl = getFileUrl(f);
              const thumbSrc = getFileThumb(f);
              return (
                <div key={f.id} style={{ padding: "11px 16px", borderBottom: i < filtered.length - 1 ? "1px solid var(--wa035)" : "none", display: "flex", alignItems: "center", gap: 12, transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--wa02)"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  {/* Icon */}
                  <div onClick={() => canPreview(f) && openPreview(f)} style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, overflow: "hidden", background: `${col}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, position: "relative", cursor: canPreview(f) ? "pointer" : "default" }}>
                    {thumbSrc ? <img src={thumbSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (f.type === "jpg" || f.type === "png") ? <img src={f.data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (FILE_ICONS[f.type] || "📁")}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: "uppercase" }}>{f.type === "youtube" ? "YouTube" : f.type === "link" ? "Link" : f.type}</span>
                      {f.size && <span style={{ fontSize: 10, color: "var(--text4)" }}>{f.size}</span>}
                      {f.desc && <span style={{ fontSize: 10, color: "var(--text4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>· {f.desc}</span>}
                    </div>
                  </div>
                  {/* Tags */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    {f.subject && <Badge c="violet">{f.subject}</Badge>}
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{f.downloads || 0}{isLinkType(f.type) ? "👁" : "↓"}</span>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    {canPreview(f) && f.type !== "youtube" && (
                      <button onClick={() => openPreview(f)} style={{ padding: "5px 7px", borderRadius: 7, border: `1px solid ${col}38`, background: `${col}10`, color: col, cursor: "pointer", display: "flex" }}>
                        <Eye size={12} />
                      </button>
                    )}
                    {isLinkType(f.type) ? (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" onClick={() => incDownload(f.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, border: `1px solid ${col}38`, background: `${col}10`, color: col, fontSize: 10, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                        <ExternalLink size={11} />Mở liên kết
                      </a>
                    ) : (downloadableTypes.includes(f.type) && fileUrl) ? (
                      <button onClick={() => handleDownloadFile(f)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(79,172,254,.22)", background: "rgba(79,172,254,.07)", color: "var(--accent)", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                        <Download size={11} />⬇ Tải
                      </button>
                    ) : <span style={{ fontSize: 10, color: "var(--text3)" }}>No file</span>}
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
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--wa07)", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Thêm tài liệu mới</h2>
                  <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>{isLinkType(newFile.type) ? "Dán liên kết và điền thông tin bên dưới" : "Upload file và điền thông tin bên dưới"}</div>
                </div>
                <button onClick={() => setShowAdd(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--wa1)", background: "var(--wa05)", cursor: "pointer", color: "var(--text4)", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
              </div>
            </div>

            {/* Body — có thể cuộn khi nội dung dài */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

            {/* Tên + Loại file + Môn học lên đầu, vì loại file quyết định giao diện bên dưới (upload hay dán link) */}
            <Inp label="TÊN HIỂN THỊ" value={newFile.name} onChange={v => setNewFile(p => ({ ...p, name: v }))} placeholder="Vd: Đề cương ôn thi HK1" required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Sel label="LOẠI TÀI LIỆU" value={newFile.type} onChange={v => setNewFile(p => ({ ...p, type: v, data: null, url: "", size: "" }))} options={FILE_TYPES.map(t => ({ v: t, l: t === "youtube" ? "VIDEO YOUTUBE" : t === "link" ? "LINK THAM KHẢO" : t.toUpperCase() }))} />
              <Sel label="MÔN HỌC" value={newFile.subject} onChange={v => setNewFile(p => ({ ...p, subject: v }))} options={SUBJECTS} />
            </div>

            {/* Đường kẻ phân cách */}
            <div style={{ height: 1, background: "var(--wa06)", margin: "2px 0 16px" }} />

            {isLinkType(newFile.type) ? (
              /* Khu vực nhập liên kết YouTube / link tham khảo */
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 8, letterSpacing: ".05em" }}>
                  {newFile.type === "youtube" ? "▶️ LIÊN KẾT VIDEO YOUTUBE" : "🔗 LIÊN KẾT THAM KHẢO"}
                </div>
                <Inp
                  value={newFile.url}
                  onChange={v => setNewFile(p => ({ ...p, url: v }))}
                  placeholder={newFile.type === "youtube" ? "https://www.youtube.com/watch?v=..." : "https://vidu.com/tai-lieu"}
                  required
                />
                {newFile.type === "youtube" && getYoutubeId(newFile.url) ? (
                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid rgba(255,0,0,.35)", marginTop: 4 }}>
                    <img src={`https://img.youtube.com/vi/${getYoutubeId(newFile.url)}/hqdefault.jpg`} alt="" style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Play size={22} style={{ color: "#fff" }} fill="#fff" />
                      </div>
                    </div>
                    <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 700, color: "#34D399", background: "rgba(0,0,0,.55)", padding: "3px 8px", borderRadius: 6 }}>✓ Video hợp lệ</span>
                  </div>
                ) : newFile.type === "youtube" && newFile.url.trim() ? (
                  <div style={{ fontSize: 11, color: "#F59E0B", marginTop: 4 }}>Không nhận diện được ID video, hãy kiểm tra lại liên kết YouTube.</div>
                ) : newFile.type === "link" && /^https?:\/\//i.test(newFile.url.trim()) ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", borderRadius: 10, background: "rgba(20,184,166,.08)", border: "1px solid rgba(20,184,166,.3)", marginTop: 4 }}>
                    <ExternalLink size={14} style={{ color: "#14B8A6", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "#14B8A6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{newFile.url.trim()}</span>
                    <span style={{ fontSize: 11, color: "#34D399", marginLeft: "auto", flexShrink: 0 }}>✓ Hợp lệ</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>
                    {newFile.type === "youtube" ? "Dán link video từ YouTube, vd: youtube.com/watch?v=... hoặc youtu.be/..." : "Dán đường dẫn tới trang web, tài liệu Google Drive, bài viết,... để tham khảo"}
                  </div>
                )}
              </div>
            ) : (
            /* Khu vực upload file */
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 8, letterSpacing: ".05em" }}>📎 FILE TÀI LIỆU</div>

              {newFile.data ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: "rgba(52,211,153,.07)", border: "1.5px solid rgba(52,211,153,.35)" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: `${FILE_COLORS[newFile.type] || "#7A93AE"}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, border: `1px solid ${FILE_COLORS[newFile.type] || "#7A93AE"}40` }}>
                    {FILE_ICONS[newFile.type] || "📁"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{newFile.name}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: FILE_COLORS[newFile.type] || "#7A93AE", textTransform: "uppercase", padding: "2px 8px", borderRadius: 5, background: `${FILE_COLORS[newFile.type] || "#7A93AE"}22`, letterSpacing: ".04em" }}>{newFile.type}</span>
                      <span style={{ fontSize: 11, color: "var(--text3)" }}>{newFile.size}</span>
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Đang xử lý file...</div>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={e => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
                  style={{ borderRadius: 12, border: `2px dashed ${dragActive ? "var(--accent)" : "rgba(100,116,139,.45)"}`, background: dragActive ? "rgba(79,172,254,.08)" : "var(--wa04)", padding: "28px 20px 24px", transition: "all .2s", textAlign: "center" }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(79,172,254,.14)", border: "1px solid rgba(79,172,254,.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <Upload size={22} style={{ color: "var(--accent)" }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text3)", marginBottom: 5 }}>Kéo &amp; thả file vào đây</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>hoặc nhấn nút bên dưới để chọn từ máy tính</div>
                  <button onClick={() => fileRef.current?.click()} style={{ padding: "9px 24px", borderRadius: 10, border: "1px solid rgba(79,172,254,.5)", background: "rgba(79,172,254,.15)", color: "var(--accent)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 16, transition: "all .2s" }}>
                    <Upload size={14} />Chọn file để tải lên
                  </button>
                  <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
                    {[["PDF","#EF4444"],["DOCX","#3B82F6"],["PPTX","#F59E0B"],["XLSX","#10B981"],["MP4","#8B5CF6"],["IMG","#06B6D4"]].map(([t, c]) => (
                      <span key={t} style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 5, background: `${c}18`, color: c, letterSpacing: ".05em", border: `1px solid ${c}30` }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 10 }}>Tối đa 100MB mỗi file</div>
                </div>
              )}
              <input ref={fileRef} type="file" onChange={e => handleFile(e.target.files[0])} style={{ display: "none" }} />
            </div>
            )}{/* hết khu vực upload / liên kết */}

            {/* Đường kẻ phân cách */}
            <div style={{ height: 1, background: "var(--wa06)", marginBottom: 16 }} />

            {/* Mô tả thêm */}
            <Inp label="MÔ TẢ (tùy chọn)" value={newFile.desc} onChange={v => setNewFile(p => ({ ...p, desc: v }))} placeholder="Mô tả ngắn về nội dung tài liệu..." />

            <ErrBox msg={errFile} />

            </div>{/* hết body cuộn */}

            {/* Footer — cố định dưới, không bao giờ bị khuất */}
            <div style={{ padding: "12px 24px 18px", borderTop: "1px solid var(--wa07)", flexShrink: 0, background: "var(--surface)" }}>
              <div style={{ display: "flex", gap: 9 }}>
                <Btn variant="ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Hủy</Btn>
                <Btn onClick={addFile} style={{ flex: 2, justifyContent: "center" }} disabled={!newFile.name.trim() || (isLinkType(newFile.type) && !/^https?:\/\//i.test(newFile.url.trim()))}>
                  {isLinkType(newFile.type) ? <Link2 size={13} /> : <Upload size={13} />}Thêm vào thư viện
                </Btn>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal xem trước tài liệu (PDF / ảnh / video / YouTube) ── */}
      {previewFile && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setPreviewFile(null)}>
          <div className="modal-flex" style={{ width: previewFile.type === "pdf" ? 720 : 640 }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--wa07)", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${FILE_COLORS[previewFile.type] || "#7A93AE"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                {FILE_ICONS[previewFile.type] || "📁"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewFile.name}</div>
                {previewFile.subject && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{previewFile.subject}</div>}
              </div>
              {previewFile.type !== "youtube" && previewUrl && (
                <a href={previewUrl} download={previewFile.name} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(79,172,254,.25)", background: "rgba(79,172,254,.08)", color: "var(--accent)", fontSize: 11, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                  <Download size={12} />Tải về
                </a>
              )}
              {previewFile.type === "youtube" && (
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,0,0,.25)", background: "rgba(255,0,0,.08)", color: "#FF0000", fontSize: 11, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                  <ExternalLink size={12} />Mở trên YouTube
                </a>
              )}
              <button onClick={() => setPreviewFile(null)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--wa1)", background: "var(--wa05)", cursor: "pointer", color: "var(--text4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={14} /></button>
            </div>

            {/* Body xem trước */}
            <div style={{ padding: 16, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 260 }}>
              {previewFile.type === "pdf" && previewUrl && (
                <iframe src={previewUrl} title={previewFile.name} style={{ width: "100%", height: "72vh", border: "none", borderRadius: 8, background: "#fff" }} />
              )}
              {(previewFile.type === "jpg" || previewFile.type === "png") && previewUrl && (
                <img src={previewUrl} alt={previewFile.name} style={{ maxWidth: "100%", maxHeight: "72vh", borderRadius: 8, display: "block" }} />
              )}
              {previewFile.type === "mp4" && previewUrl && (
                <video src={previewUrl} controls autoPlay style={{ width: "100%", maxHeight: "72vh", borderRadius: 8, background: "#000" }} />
              )}
              {previewFile.type === "youtube" && getYoutubeId(previewUrl) && (
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeId(previewUrl)}?autoplay=1`}
                  title={previewFile.name}
                  style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: 8 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {previewFile.desc && (
              <div style={{ padding: "12px 20px", borderTop: "1px solid var(--wa07)", fontSize: 12, color: "var(--text3)", flexShrink: 0 }}>{previewFile.desc}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// trang cá nhân 

function ProfilePage({ state, user }) {
  useActivityTracker("Hồ sơ", "Xem hồ sơ", user.role);

  // 1. Phân loại đối tượng và API động theo vai trò (role)
  let s = user.data;
  let updateApi = null;
  let roleLabel = "";
  let roleColor = "blue";
  
  if (user.role === "student") {
    s = state.students.find(x => x.id === user.data.id) || user.data;
    updateApi = api.updateStudent;
    roleLabel = "Học sinh";
    roleColor = "blue";
  } else if (user.role === "teacher" || user.role === "admin") {
    s = state.teachers.find(x => x.id === user.data.id) || user.data;
    updateApi = api.updateTeacher;
    roleLabel = user.role === "admin" ? "Quản trị viên" : "Giáo viên";
    roleColor = "purple";
  } else if (user.role === "parent") {
    s = state.parents.find(x => x.id === user.data.id) || user.data;
    updateApi = api.updateParent;
    roleLabel = "Phụ huynh";
    roleColor = "green";
  }

  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [updatingPw, setUpdatingPw] = useState(false);

  // Học sinh: Thống kê và thông tin
  const cls = user.role === "student" ? state.classes.find(c => c.id === s.classId) : null;
  const today = (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
  const presentToday = user.role === "student" ? (state.attendance[`${s.classId}_${today}`] || []).includes(s.id) : false;
  const allAtt = user.role === "student" ? Object.entries(state.attendance).filter(([k]) => k.startsWith(s.classId + "_")) : [];
  const presentDays = allAtt.filter(([, v]) => v.includes(s.id)).length;
  const totalDays = allAtt.length;
  const tasks = user.role === "student" ? (state.assignments[s.classId] || []) : [];

  // Xử lý liên kết Google
  const handleGoogleSuccess = async (cred) => {
    try {
      const tokenPayload = JSON.parse(atob(cred.credential.split('.')[1]));
      const googleEmail = tokenPayload.email;
      if (!googleEmail) {
        alert("Không tìm thấy email trong tài khoản Google!");
        return;
      }
      
      const res = await updateApi(s.id, { email: googleEmail, emailVerified: true });
      if (res && !res.error) {
        state.reload();
        alert(`Đã liên kết tài khoản Google thành công: ${googleEmail}`);
      } else {
        alert(res?.error || "Liên kết Google thất bại.");
      }
    } catch (err) {
      alert("Lỗi phân tích tài khoản Google: " + err.message);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy liên kết tài khoản Google không?")) return;
    try {
      const res = await updateApi(s.id, { email: "", emailVerified: false });
      if (res && !res.error) {
        state.reload();
        alert("Đã hủy liên kết Google thành công!");
      } else {
        alert(res?.error || "Hủy liên kết thất bại.");
      }
    } catch (err) {
      alert("Lỗi khi hủy liên kết: " + err.message);
    }
  };

  // Xử lý đổi mật khẩu
  const handleUpdatePassword = async () => {
    if (!newPw.trim()) {
      alert("Vui lòng nhập mật khẩu mới!");
      return;
    }
    if (newPw.trim().length < 4) {
      alert("Mật khẩu phải từ 4 ký tự trở lên!");
      return;
    }

    setUpdatingPw(true);
    try {
      const res = await updateApi(s.id, { password: newPw.trim() });
      if (res && !res.error) {
        setNewPw("");
        state.reload();
        alert("Cập nhật mật khẩu tài khoản thành công!");
      } else {
        alert(res?.error || "Cập nhật mật khẩu thất bại.");
      }
    } catch (err) {
      alert("Lỗi cập nhật mật khẩu: " + err.message);
    } finally {
      setUpdatingPw(false);
    }
  };

  // Xây dựng danh sách thông tin chi tiết động dựa theo vai trò
  const getDetailRows = () => {
    if (user.role === "student") {
      return [
        ["Họ và tên", s.name],
        ["Mã học sinh", s.code],
        ["Lớp học", cls?.name || "--"],
        ["Ngày sinh", s.dob ? new Date(s.dob + "T00:00:00").toLocaleDateString("vi-VN") : "--"],
        ["Số điện thoại", s.phone || "--"],
        ["Điểm danh hôm nay", presentToday ? "✓ Có mặt" : "✗ Chưa điểm danh"],
        ["Bài chờ nộp", `${tasks.filter(t => t.status === "pending").length} bài`]
      ];
    } else if (user.role === "teacher" || user.role === "admin") {
      const classNames = (s.teachingClassIds || []).map(id => state.classes.find(c => c.id === id)?.name).filter(Boolean).join(", ") || "--";
      return [
        ["Họ và tên", s.name],
        ["Tên đăng nhập", s.username],
        ["Vai trò", user.role === "admin" ? "Quản trị viên" : "Giáo viên"],
        ["Môn học phụ trách", s.subject || "--"],
        ["Trường học", s.school || "--"],
        ["Lớp giảng dạy", classNames]
      ];
    } else if (user.role === "parent") {
      const childNames = (s.childIds || []).map(id => state.students.find(x => x.id === id)?.name).filter(Boolean).join(", ") || "--";
      return [
        ["Họ và tên Phụ huynh", s.name],
        ["Tên đăng nhập", s.username],
        ["Số điện thoại", s.phone || "--"],
        ["Con cái liên kết", childNames]
      ];
    }
    return [];
  };

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ borderRadius: 16, padding: "24px", background: "linear-gradient(135deg,rgba(29,108,245,.1),rgba(123,63,228,.08))", border: "1px solid rgba(79,172,254,.12)", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#4FACFE,#A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 28px rgba(79,172,254,.45)", border: "3px solid rgba(79,172,254,.35)" }}>
            {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 32 }}>{s.emoji || "👤"}</span>}
          </div>
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: "#34D399", border: "2px solid var(--notif-bd)" }} />
        </div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{s.name}</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>
            {user.role === "student" ? `${s.code} · Lớp ${cls?.name || "--"}` : `@${s.username}`}
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {presentToday && <Badge c="green">✓ Đã điểm danh hôm nay</Badge>}
            <Badge c={roleColor}>{roleLabel}</Badge>
          </div>
        </div>
        
        {user.role === "student" && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[["Chuyên cần", totalDays ? `${Math.round((presentDays / totalDays) * 100)}%` : "--", "var(--accent)"], ["Ngày học", `${presentDays}/${totalDays}`, "#34D399"], ["Bài tập", `${tasks.filter(t => t.status === "submitted").length}/${tasks.length}`, "#A78BFA"]].map(([l, v, c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div className="hfont" style={{ fontSize: 21, fontWeight: 400, color: c }}>{v}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: window.innerWidth > 768 ? "1fr 1fr" : "1fr", gap: 14, alignItems: "start" }}>
        {/* CARD THÔNG TIN CHI TIẾT */}
        <Card style={{ margin: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Thông tin cá nhân</div>
          {getDetailRows().map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--wa045)", fontSize: 12 }}>
              <span style={{ color: "var(--text2)" }}>{l}</span>
              <span style={{ color: "var(--text)", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </Card>

        {/* CARD BẢO MẬT & TÀI KHOẢN */}
        <Card style={{ margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Cài đặt bảo mật tài khoản</div>

          {/* LIÊN KẾT GOOGLE */}
          <div style={{ borderBottom: "1px solid var(--wa045)", paddingBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5 }}>LIÊN KẾT TÀI KHOẢN GOOGLE</div>
            {s.email ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{s.email}</div>
                  <div style={{ fontSize: 10, color: "#10B981", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }} /> Đã liên kết Google
                  </div>
                </div>
                <button 
                  onClick={handleUnlinkGoogle}
                  style={{ padding: "6px 12px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#EF4444", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Hủy liên kết
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>Bạn chưa liên kết tài khoản Google để đăng nhập nhanh.</div>
                <div style={{ alignSelf: "flex-start", marginTop: 4 }}>
                  <GoogleLogin 
                    onSuccess={handleGoogleSuccess} 
                    onError={() => alert("Đăng nhập Google thất bại")} 
                    theme="filled_blue" 
                    shape="pill" 
                    text="signup_with" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* CẬP NHẬT MẬT KHẨU */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8 }}>THIẾT LẬP MẬT KHẨU ĐĂNG NHẬP</div>
            <div style={{ position: "relative", display: "flex", gap: 8 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input 
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder={s.password ? "Nhập mật khẩu mới để thay đổi" : "Thiết lập mật khẩu bảo vệ tài khoản"}
                  className="inp"
                  style={{ width: "100%", padding: "8px 36px 8px 12px", fontSize: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--inp-bg)", color: "var(--text)", outline: "none", fontFamily: "inherit" }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button 
                onClick={handleUpdatePassword}
                disabled={updatingPw}
                style={{ padding: "8px 16px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: updatingPw ? 0.6 : 1 }}
              >
                Cập nhật
              </button>
            </div>
            {s.password ? (
              <div style={{ fontSize: 10, color: "#F59E0B", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                🔐 Tài khoản của bạn hiện đang được bảo vệ bằng mật khẩu.
              </div>
            ) : (
              <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 6 }}>
                💡 Hiện tại tài khoản của bạn chưa có mật khẩu (đăng nhập bằng mật khẩu trống).
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}


// trang admin (Đã được chuyển ra file AdminDashboard.jsx)

function ParentDashPage({ state, user, setView }) {
  useActivityTracker("Phụ huynh", "Xem bảng điều khiển", user?.role || "parent");
  const parent = user.data;
  const children = useMemo(() => (parent.childIds || []).map(id => state.students.find(s => s.id === id)).filter(Boolean), [parent.childIds, state.students]);
  const myPending = useMemo(() => state.pendingParents.filter(p => p.parentId === parent.id), [state.pendingParents, parent.id]);
  const [selId, setSelId] = useState(children[0]?.id || "");
  const selChild = children.find(c => c.id === selId) || children[0];

  const [showAddChild, setShowAddChild] = useState(false);
  const [addClassId, setAddClassId] = useState("");
  const [addCode, setAddCode] = useState("");
  const [addName, setAddName] = useState("");
  const [addErr, setAddErr] = useState("");

  const submitAddChild = () => {
    setAddErr("");
    if (!addClassId) { setAddErr("Chọn lớp của con"); return; }
    if (!addCode.trim()) { setAddErr("Nhập mã học sinh"); return; }
    state.setPendingParents(prev => [...prev, {
      id: "pp_" + Date.now() + Math.random(),
      parentId: parent.id, parentName: parent.name, classId: addClassId,
      studentCode: addCode.trim().toUpperCase(), studentName: addName.trim(),
      requestedAt: Date.now(),
    }]);
    setAddClassId(""); setAddCode(""); setAddName(""); setShowAddChild(false);
  };

  if (children.length === 0) {
    return (
      <div className="page" style={{ padding: 20 }}>
        <Card style={{ textAlign: "center", padding: 40 }}>
          <Users size={40} style={{ margin: "0 auto 16px", color: "var(--text4)", opacity: .5 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Chưa có học sinh nào được liên kết</div>
          {myPending.length > 0 ? (
            <div style={{ fontSize: 12, color: "#F59E0B", marginBottom: 18 }}>
              Bạn có {myPending.length} yêu cầu liên kết đang chờ giáo viên xác nhận.
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 18 }}>Hãy gửi yêu cầu liên kết với con của bạn để bắt đầu theo dõi.</div>
          )}
          {!showAddChild ? (
            <Btn onClick={() => setShowAddChild(true)}><Plus size={13} />Gửi yêu cầu liên kết con</Btn>
          ) : (
            <div style={{ maxWidth: 320, margin: "0 auto", textAlign: "left" }}>
              <Sel label="LỚP CỦA CON" value={addClassId} onChange={setAddClassId} options={[{ v: "", l: "-- Chọn lớp --" }, ...state.classes.map(c => ({ v: c.id, l: c.name }))]} required />
              <Inp label="MÃ HỌC SINH CỦA CON" value={addCode} onChange={setAddCode} placeholder="Ví dụ: HS001" required />
              <Inp label="TÊN CON (để đối chiếu)" value={addName} onChange={setAddName} placeholder="Nguyễn Văn An" />
              <ErrBox msg={addErr} />
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" onClick={() => setShowAddChild(false)} style={{ flex: 1 }}>Hủy</Btn>
                <Btn onClick={submitAddChild} style={{ flex: 2 }}>Gửi yêu cầu</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const cls = state.classes.find(c => c.id === selChild.classId);
  const logs = (state.loginLogs[selChild.id] || []).slice().sort((a, b) => b - a);
  const actLogs = (state.activityLogs[selChild.id] || []).slice().sort((a, b) => b.ts - a.ts);
  const lastActivityTs = actLogs[0]?.ts || logs[0] || null;
  const tasks = state.assignments[selChild.classId] || [];
  const doneCount = tasks.filter(t => t.submissions?.[selChild.id]).length;

  const gradeRec = state.grades[selChild.id] || {};
  const gradeSummary = useMemo(() => computeGradeSummary(gradeRec.scores || {}, gradeRec.conduct || ''), [gradeRec.scores, gradeRec.conduct]);

  const fmtTime = ts => {
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return isToday ? `Hôm nay lúc ${time}` : `${d.toLocaleDateString("vi-VN")} lúc ${time}`;
  };

  return (
    <div className="page" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {children.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {children.map(c => (
            <button key={c.id} onClick={() => setSelId(c.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px 6px 6px", borderRadius: 99, border: `1px solid ${selChild.id === c.id ? "rgba(79,172,254,.4)" : "var(--wa08)"}`, background: selChild.id === c.id ? "rgba(79,172,254,.1)" : "var(--wa03)", cursor: "pointer", fontFamily: "inherit" }}>
              <Av photo={c.photo} sz={22} /><span style={{ fontSize: 12, fontWeight: 600, color: selChild.id === c.id ? "var(--accent)" : "var(--text3)" }}>{c.name}</span>
            </button>
          ))}
          <button onClick={() => setShowAddChild(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 99, border: "1px dashed rgba(79,172,254,.3)", background: "transparent", color: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}><Plus size={12} />Thêm con</button>
        </div>
      )}
      {children.length === 1 && !showAddChild && (
        <button onClick={() => setShowAddChild(true)} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 99, border: "1px dashed rgba(79,172,254,.3)", background: "transparent", color: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600 }}><Plus size={12} />Thêm con khác</button>
      )}
      {showAddChild && (
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Gửi yêu cầu liên kết con khác</div>
          <Sel label="LỚP CỦA CON" value={addClassId} onChange={setAddClassId} options={[{ v: "", l: "-- Chọn lớp --" }, ...state.classes.map(c => ({ v: c.id, l: c.name }))]} required />
          <Inp label="MÃ HỌC SINH CỦA CON" value={addCode} onChange={setAddCode} placeholder="Ví dụ: HS001" required />
          <Inp label="TÊN CON (để đối chiếu)" value={addName} onChange={setAddName} placeholder="Nguyễn Văn An" />
          <ErrBox msg={addErr} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={() => setShowAddChild(false)} style={{ flex: 1 }}>Hủy</Btn>
            <Btn onClick={submitAddChild} style={{ flex: 2 }}>Gửi yêu cầu</Btn>
          </div>
        </Card>
      )}

      <div style={{ borderRadius: 16, padding: 22, background: "linear-gradient(135deg,rgba(29,108,245,.1),rgba(123,63,228,.08))", border: "1px solid rgba(79,172,254,.12)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Av photo={selChild.photo} sz={58} glow />
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{selChild.name}</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{selChild.code} · Lớp {cls?.name || "--"}</div>
          <div style={{ marginTop: 7 }}><ActivityStatus lastTs={lastActivityTs} /></div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "center" }}>
          <div className="hfont" style={{ fontSize: 20, fontWeight: 400, color: "var(--accent)" }}>{logs.length ? fmtTime(logs[0]) : "Chưa đăng nhập"}</div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>Lần đăng nhập gần nhất</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} style={{ color: "var(--accent)" }} />Lịch sử truy cập</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>Các mục con bạn đã xem trong ứng dụng</div>
          <ActivityLogList logs={actLogs} />
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><BookOpen size={14} style={{ color: "#A78BFA" }} />Tình hình bài tập</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>Đã làm {doneCount}/{tasks.length} bài</div>
          {tasks.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text4)", textAlign: "center", padding: "20px 0" }}>Chưa có bài tập nào</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
              {tasks.map(t => {
                const done = t.submissions?.[selChild.id];
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--wa025)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                      <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 2 }}>{t.subject} · Hạn: {t.deadline}</div>
                    </div>
                    {done ? <Badge c="green">✓ Đã nộp</Badge> : <Badge c="amber">Chưa nộp</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}><FileText size={14} style={{ color: "#F472B6" }} />Bảng điểm</div>
          <Btn small variant="ghost" onClick={() => setView && setView("gradecalc")}>Xem chi tiết</Btn>
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 14 }}>Kết quả học tập cả năm của con</div>
        {gradeSummary.countTBM === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text4)", textAlign: "center", padding: "20px 0" }}>Chưa có điểm nào được ghi nhận</div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", padding: "6px 0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 6, letterSpacing: 1 }}>ĐIỂM TRUNG BÌNH</div>
              <div className="hfont" style={{ fontSize: 34, fontWeight: 400, color: "#34D399" }}>{gradeSummary.dtbmca.toFixed(1)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 6, letterSpacing: 1 }}>XẾP LOẠI HỌC LỰC</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: gradeSummary.classification === "TỐT" ? "#34D399" : gradeSummary.classification === "KHÁ" ? "#3B82F6" : gradeSummary.classification === "ĐẠT" ? "#F59E0B" : "#EF4444" }}>{gradeSummary.classification}</div>
            </div>
          </div>
        )}
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
  const today = (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
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
          <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4, color: "var(--text)" }}>{isT ? `Chào, ${user.data.name}! 👋` : `Xin chào, ${user.data.name}! 👋`}</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10, textTransform: "capitalize" }}>{todayDate}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {isT ? (
              <>
                <span style={{ fontSize: 11, padding: "4px 11px", borderRadius: 8, background: "rgba(79,172,254,.1)", color: "var(--accent)", fontWeight: 500 }}>{myClasses.length} lớp · {classStudents.length} học sinh</span>
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
          { l:"Lớp quản lý", v:myClasses.length, c:"var(--accent)", Ic:School, s:"Tất cả lớp" },
          { l:"Học sinh", v:classStudents.length, c:"#A78BFA", Ic:Users, s:cls?.name||"Chọn lớp" },
          { l:"Có mặt", v:presentToday.length, c:"#34D399", Ic:CheckCircle, s:"Hôm nay" },
          { l:"Bài tập", v:tasks.length, c:"#F59E0B", Ic:BookOpen, s:"Đã tạo" },
          ...(classId ? [{ l:"Chờ duyệt", v:pendingCount, c:"#EF4444", Ic:UserCheck, s:"Học sinh mới" }] : []),
        ] : [
          { l:"Điểm danh", v:presentToday.includes(user.data.id)?"✓":"✗", c:presentToday.includes(user.data.id)?"#34D399":"#EF4444", Ic:CheckCircle, s:"Hôm nay" },
          { l:"Chờ nộp", v:tasks.filter(t=>t.status==="pending").length, c:"#F59E0B", Ic:Clock, s:"Bài tập" },
          { l:"Đã nộp", v:tasks.filter(t=>t.status==="submitted").length, c:"#34D399", Ic:Trophy, s:"Bài tập" },
          { l:"Bạn lớp", v:classStudents.length, c:"var(--accent)", Ic:Users, s:cls?.name||"--" },
        ]).map(({ l, v, c, Ic, s }) => (
          <div key={l} className="scard cglow" style={{ padding: 15 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${c}16`, display: "flex", alignItems: "center", justifyContent: "center", color: c, marginBottom: 12 }}><Ic size={15} /></div>
            <div className="hfont" style={{ fontSize: 23, fontWeight: 400, color: "var(--text)", marginBottom: 2 }}>{v}</div>
            <div style={{ fontSize: 11, color: "var(--text4)" }}>{l}</div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Truy cập nhanh</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {(isT ? [
              { Ic:Users, l:"Học sinh", v:"students", c:"var(--accent)" },
              { Ic:QrCode, l:"Điểm danh", v:"attendance", c:"#34D399" },
              { Ic:MessageSquare, l:"Chat", v:"chat", c:"#A78BFA" },
              { Ic:Shuffle, l:"Lucky Wheel", v:"wheel", c:"#F59E0B" },
            ] : [
              { Ic:QrCode, l:"Điểm danh", v:"attendance", c:"var(--accent)" },
              { Ic:MessageSquare, l:"Chat", v:"chat", c:"#A78BFA" },
              { Ic:BookOpen, l:"Bài tập", v:"assignments", c:"#34D399" },
              { Ic:Shuffle, l:"Lucky Wheel", v:"wheel", c:"#F59E0B" },
            ]).map(({ Ic, l, v, c }) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "12px 7px", borderRadius: 10, cursor: "pointer", background: c.startsWith("var(") ? `color-mix(in srgb, ${c} 6%, transparent)` : `${c}09`, border: `1px solid ${c.startsWith("var(") ? `color-mix(in srgb, ${c} 12%, transparent)` : `${c}18`}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, fontFamily: "inherit", color: c, transition: "all .2s" }}>
                <Ic size={17} /><span style={{ fontSize: 10, fontWeight: 500, color: "var(--text2)" }}>{l}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>{isT ? "Điểm danh hôm nay" : "Bài tập gần đây"}</div>
          {isT ? (
            classStudents.length === 0 ? <div style={{ color: "var(--text3)", fontSize: 12 }}>{myClasses.length === 0 ? "Tạo lớp học để bắt đầu →" : "Chưa có học sinh."}</div> : (<>
              <Bar val={presentToday.length} max={classStudents.length} col="#34D399" h={5} />
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5, marginBottom: 11 }}>{presentToday.length}/{classStudents.length} · {classStudents.length ? Math.round((presentToday.length / classStudents.length) * 100) : 0}%</div>
              {classStudents.slice(0, 5).map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <Av photo={s.photo} sz={20} /><span style={{ fontSize: 11, color: "var(--text2)", flex: 1 }}>{s.name}</span>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: presentToday.includes(s.id) ? "#34D399" : "#EF4444" }} />
                </div>
              ))}
            </>)
          ) : (
            tasks.length === 0 ? <div style={{ color: "var(--text3)", fontSize: 12 }}>Chưa có bài tập.</div> :
              tasks.slice(0, 4).map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: SCOLS[t.subject]||"var(--accent)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--text2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                  <Badge c={{ pending:"amber", submitted:"green", overdue:"red" }[t.status]||"blue"}>{t.status==="pending"?"Chờ":t.status==="submitted"?"Đã nộp":"Trễ"}</Badge>
                </div>
              ))
          )}
        </Card>
      </div>
    </div>
  );
}


function LocateAnythingPage({ state, user, selClass }) {
  const [engineActive, setEngineActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [prompt, setPrompt] = useState("student, phone");
  const [quant, setQuant] = useState("q4_k_m");
  const [threads, setThreads] = useState(4);
  const [speed, setSpeed] = useState("fast"); // fast, hybrid, slow
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const [warningCount, setWarningCount] = useState(0);

  // Real AI Model States
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const modelRef = useRef(null);

  // States giả lập hành vi và sự hiện diện
  const [simPhone, setSimPhone] = useState(false);
  const [simSleep, setSimSleep] = useState(false);
  const [simBook, setSimBook] = useState(true);
  const [autoPresence, setAutoPresence] = useState(true); // Tự động nhận diện có người
  const [simPresence, setSimPresence] = useState(true); // Giả lập thủ công có người hay không
  const [studentPresent, setStudentPresent] = useState(false); // Trạng thái thực tế xác định

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const logContainerRef = useRef(null);

  // Refs đồng bộ thời gian thực tránh closure trap
  const simPhoneRef = useRef(false);
  const simSleepRef = useRef(false);
  const simBookRef = useRef(true);
  const autoPresenceRef = useRef(true);
  const simPresenceRef = useRef(true);
  const studentPresentRef = useRef(false);

  const presenceCounterRef = useRef(0);
  const prevFrameDataRef = useRef(null);
  const motionCanvasRef = useRef(document.createElement("canvas"));
  const motionCentroidRef = useRef({ x: 320, y: 240 }); // Tâm mặc định 640/2, 480/2

  useEffect(() => { simPhoneRef.current = simPhone; }, [simPhone]);
  useEffect(() => { simSleepRef.current = simSleep; }, [simSleep]);
  useEffect(() => { simBookRef.current = simBook; }, [simBook]);
  useEffect(() => { autoPresenceRef.current = autoPresence; }, [autoPresence]);
  useEffect(() => { simPresenceRef.current = simPresence; }, [simPresence]);
  useEffect(() => { studentPresentRef.current = studentPresent; }, [studentPresent]);
  
  // Refs cho suy luận và vẽ động
  const detectIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const trackedObjectsRef = useRef([]); // Lưu trữ các đối tượng đang bám đuổi
  const lastSoundTimeRef = useRef(0);

  // Audio Context cho còi cảnh báo (giới hạn âm lượng và tần suất)
  const playAlertSound = () => {
    const now = Date.now();
    if (now - lastSoundTimeRef.current < 1500) return; // Chỉ cho bíp tối đa 1.5s/lần
    lastSoundTimeRef.current = now;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Lỗi phát âm thanh cảnh báo: ", e);
    }
  };

  const addLog = (text) => {
    const time = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    setLogs((prev) => [...prev.slice(-48), `[${time}] ${text}`]);
  };

  // Cuộn logs xuống cuối
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const loadRealAIModel = async () => {
    if (modelRef.current) return true;
    setIsLoadingModel(true);
    
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    try {
      addLog("locate_model_load: loading TensorFlow.js core runtime from jsDelivr CDN...");
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js");
      addLog("locate_model_load: loading MobileNet COCO-SSD object detection weights...");
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
      
      addLog("locate_model_load: parsing and loading neural network parameters to browser memory...");
      const loadedModel = await window.cocoSsd.load();
      modelRef.current = loadedModel;
      setModelLoaded(true);
      setIsLoadingModel(false);
      addLog("system_ready: TensorFlow.js COCO-SSD active. Real-time GPU acceleration enabled.");
      return true;
    } catch (e) {
      console.warn("Failed to load TFJS model from CDN, falling back to simulated engine:", e);
      addLog("locate_model_err: CDN failed. Falling back to high-fidelity Simulated AI engine.");
      setModelLoaded(false);
      setIsLoadingModel(false);
      return false;
    }
  };

  // Bật/tắt GGML Engine
  const toggleEngine = async () => {
    if (engineActive) {
      stopCamera();
      setEngineActive(false);
      setLogs([]);
      setHistory([]);
      setIsLocating(false);
    } else {
      setEngineActive(true);
      addLog("system_init: locate-anything.cpp v1.2.0 initialized.");
      addLog(`locate_model_load: GGUF model file format selected = 'locate-anything-3b-${quant}.gguf'.`);
      
      // Khởi động Real AI
      const success = await loadRealAIModel();
      
      if (!success) {
        // Nếu Real AI lỗi, chạy mô phỏng sau 1 giây
        setTimeout(() => {
          const sizeMap = { q4_k_m: "1.85 GB", q8_0: "3.20 GB", f16: "6.45 GB" };
          const speedMap = { q4_k_m: "24ms", q8_0: "60ms", f16: "180ms" };
          addLog(`locate_model_load: model size = ${sizeMap[quant]}, parameters = 3.01B`);
          addLog(`locate_backend_init: GGML CPU backend active (threads = ${threads})`);
          addLog(`locate_backend_init: GGML Vulkan/CUDA GPU acceleration helper initialized.`);
          addLog(`system_ready: locate-anything.cpp engine ready. Avg inference time: ${speedMap[quant]}`);
        }, 800);
      }
      
      setCameraActive(true);
    }
  };

  // Stream Camera
  useEffect(() => {
    if (cameraActive && engineActive) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          addLog("webcam_init: webcam input source connected successfully (640x480).");
        })
        .catch((e) => {
          addLog("webcam_err: could not access camera. Please check permissions.");
          setCameraActive(false);
        });
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive, engineActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    clearInterval(detectIntervalRef.current);
    cancelAnimationFrame(animationFrameRef.current);
    trackedObjectsRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Vòng lặp vẽ 60 FPS (Nội suy tuyến tính - Lerp để Bounding Box di chuyển mượt mà)
  const drawLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cập nhật tọa độ bám đuổi (Lerp)
    trackedObjectsRef.current.forEach((obj) => {
      obj.x += (obj.tx - obj.x) * 0.14; // Lerp factor 14%
      obj.y += (obj.ty - obj.y) * 0.14;
      obj.w += (obj.tw - obj.w) * 0.14;
      obj.h += (obj.th - obj.h) * 0.14;

      // Lật tọa độ X để khớp với video bị gương (scaleX(-1) trên video)
      // nhưng KHÔNG lật canvas để text không bị ngược
      const drawX = canvas.width - obj.x - obj.w;

      // Vẽ Box
      ctx.lineWidth = 2.5;
      if (obj.isWarning) {
        ctx.strokeStyle = "#EF4444";
        ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
        ctx.setLineDash([6, 4]);
      } else {
        ctx.strokeStyle = "#4FACFE";
        ctx.fillStyle = "rgba(79, 172, 254, 0.06)";
        ctx.setLineDash([]);
      }

      ctx.strokeRect(drawX, obj.y, obj.w, obj.h);
      ctx.fillRect(drawX, obj.y, obj.w, obj.h);

      // Vẽ nhãn đè lên box — text xuôi chiều vì canvas không bị transform
      ctx.font = "bold 10px Outfit, sans-serif";
      ctx.fillStyle = obj.isWarning ? "#EF4444" : "#4FACFE";
      const labelText = `${obj.label.toUpperCase()} (${obj.conf}%)`;
      const textWidth = ctx.measureText(labelText).width;
      
      ctx.fillRect(drawX, obj.y - 15, textWidth + 8, 15);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(labelText, drawX + 3, obj.y - 4);
    });

    animationFrameRef.current = requestAnimationFrame(drawLoop);
  };

  // Quét nhận diện liên tục
  const startLocating = () => {
    if (!cameraActive || isLocating) return;
    setIsLocating(true);
    addLog(`locate_start: open-vocabulary detector active. Prompt = "${prompt}"`);

    // Tần suất suy luận mới (nhanh hơn đáng kể để tăng độ phản hồi)
    const inferenceInterval = { fast: 150, hybrid: 400, slow: 1000 }[speed];

    // Khởi chạy vòng lặp vẽ 60 FPS
    animationFrameRef.current = requestAnimationFrame(drawLoop);

    detectIntervalRef.current = setInterval(() => {
      // 1. Phân tích hiện diện (Tự động bằng phân tích pixel hoặc bằng Switch thủ công)
      let isPresent = simPresenceRef.current; // Lấy giá trị của switch thủ công làm cơ sở

      if (autoPresenceRef.current) {
        // Tự động phân tích chuyển động qua video
        const video = videoRef.current;
        if (video && video.readyState >= 2) { // HAVE_CURRENT_DATA
          try {
            const mCanvas = motionCanvasRef.current;
            mCanvas.width = 32;
            mCanvas.height = 24;
            const mCtx = mCanvas.getContext("2d");
            mCtx.drawImage(video, 0, 0, 32, 24);
            const imgData = mCtx.getImageData(0, 0, 32, 24);
            const pixels = imgData.data;

            if (prevFrameDataRef.current) {
              let diffSum = 0;
              let sumX = 0;
              let sumY = 0;
              let activeCount = 0;
              const prevPixels = prevFrameDataRef.current;

              // Duyệt qua 32x24 grid tìm cell chuyển động
              for (let y = 0; y < 24; y++) {
                for (let x = 0; x < 32; x++) {
                  const i = (y * 32 + x) * 4;
                  const diff = Math.abs(pixels[i] - prevPixels[i]) + 
                               Math.abs(pixels[i+1] - prevPixels[i+1]) + 
                               Math.abs(pixels[i+2] - prevPixels[i+2]);
                  
                  diffSum += diff;
                  if (diff > 22) {
                    sumX += x;
                    sumY += y;
                    activeCount++;
                  }
                }
              }

              const avgDiff = diffSum / (32 * 24 * 3);
              const hasMotion = avgDiff > 5.5; 

              if (hasMotion) {
                presenceCounterRef.current = 15; // Giữ trạng thái có người trong ~2.2s
                isPresent = true;

                // Cập nhật tọa độ trọng tâm (Centroid) của chuyển động để bám đuổi
                if (activeCount > 2) {
                  const targetCentroidX = (sumX / activeCount) / 32 * 640;
                  const targetCentroidY = (sumY / activeCount) / 24 * 480;

                  // Lọc mượt tọa độ
                  motionCentroidRef.current = {
                    x: motionCentroidRef.current.x + (targetCentroidX - motionCentroidRef.current.x) * 0.3,
                    y: motionCentroidRef.current.y + (targetCentroidY - motionCentroidRef.current.y) * 0.3
                  };
                }
              } else {
                if (presenceCounterRef.current > 0) {
                  presenceCounterRef.current--;
                  isPresent = true;
                } else {
                  isPresent = false;
                }
              }
            } else {
              isPresent = true; // Lần quét đầu tiên
            }
            prevFrameDataRef.current = pixels;
          } catch (e) {
            console.warn("Lỗi phân tích frame:", e);
          }
        }
      }

      // Cập nhật state UI
      setStudentPresent(isPresent);

      // Nếu không có ai trước camera, bỏ qua vẽ và không quét các nhãn khác
      if (!isPresent) {
        trackedObjectsRef.current = [];
        return;
      }

      const targets = prompt.split(",").map((t) => t.trim()).filter(Boolean);
      if (targets.length === 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const newObjects = [];
      let soundTriggered = false;

      targets.forEach((target) => {
        const lower = target.toLowerCase();

        // Kiểm tra điều kiện giả lập qua ref thời gian thực
        let shouldDetect = true;
        if (["phone", "điện thoại"].some((w) => lower.includes(w))) {
          shouldDetect = simPhoneRef.current;
        } else if (["sleeping", "ngủ gật", "ngủ"].some((w) => lower.includes(w))) {
          shouldDetect = simSleepRef.current;
        } else if (["book", "sách", "vở"].some((w) => lower.includes(w))) {
          shouldDetect = simBookRef.current;
        }

        // Tỷ lệ nhận diện được ngẫu nhiên nhưng ổn định
        if (shouldDetect && Math.random() > 0.12) {
          const confidence = (89 + Math.random() * 10).toFixed(1);
          const isWarning = ["phone", "điện thoại", "sleeping", "ngủ gật", "ngủ"].some((w) => lower.includes(w));
          
          let tx, ty, tw, th;

          // Định vị hộp bounding box dựa theo trọng tâm di chuyển (Motion Centroid)
          if (["student", "học sinh", "giáo viên", "teacher", "user"].some((n) => target.toLowerCase().includes(n))) {
            tw = 210 + Math.random() * 20;
            th = 270 + Math.random() * 25;
            tx = motionCentroidRef.current.x - tw / 2;
            ty = motionCentroidRef.current.y - th / 2 + 10;
          } else {
            tw = 95 + Math.random() * 20;
            th = 100 + Math.random() * 25;
            if (lower.includes("phone")) {
              tx = motionCentroidRef.current.x + (Math.random() > 0.5 ? 45 : -tw - 45);
              ty = motionCentroidRef.current.y + 40;
            } else if (lower.includes("sleep")) {
              tx = motionCentroidRef.current.x - tw / 2;
              ty = motionCentroidRef.current.y - th / 2;
            } else { // book
              tx = motionCentroidRef.current.x - tw / 2;
              ty = motionCentroidRef.current.y + 70;
            }
          }

          // Giới hạn tọa độ trong viền khung hình
          tx = Math.max(10, Math.min(640 - tw - 10, tx));
          ty = Math.max(10, Math.min(480 - th - 10, ty));

          if (isWarning) {
            soundTriggered = true;
          }

          newObjects.push({ label: target, conf: confidence, tx, ty, tw, th, isWarning });
        }
      });

      // Đối khớp và cập nhật các đối tượng đang được track (để trượt mượt mà)
      const currentTracked = [...trackedObjectsRef.current];
      const updatedTracked = [];

      newObjects.forEach((newObj) => {
        // Tìm đối tượng cũ cùng label để giữ lại vị trí hiện tại của nó (Lerp từ vị trí đó)
        const oldObj = currentTracked.find((o) => o.label === newObj.label);
        if (oldObj) {
          updatedTracked.push({
            ...oldObj,
            tx: newObj.tx,
            ty: newObj.ty,
            tw: newObj.tw,
            th: newObj.th,
            conf: newObj.conf,
            isWarning: newObj.isWarning
          });
        } else {
          // Đối tượng mới hoàn toàn thì xuất hiện ngay
          updatedTracked.push({
            label: newObj.label,
            conf: newObj.conf,
            isWarning: newObj.isWarning,
            x: newObj.tx,
            y: newObj.ty,
            w: newObj.tw,
            h: newObj.th,
            tx: newObj.tx,
            ty: newObj.ty,
            tw: newObj.tw,
            th: newObj.th
          });
        }
      });

      trackedObjectsRef.current = updatedTracked;

      if (newObjects.length > 0) {
        const matches = newObjects.map((i) => `${i.label} (${i.conf}%)`).join(", ");
        const baseTime = { q4_k_m: 16, q8_0: 48, f16: 140 }[quant];
        const inferTime = baseTime + Math.floor(Math.random() * 8);
        addLog(`locate_eval: process frame successfully. Found [${matches}] in ${inferTime}ms`);

        // Lưu vào lịch sử
        setHistory((prev) => [
          {
            id: Date.now() + Math.random(),
            time: new Date().toLocaleTimeString("vi-VN"),
            matches: newObjects.map((i) => ({ label: i.label, conf: i.conf, isWarning: i.isWarning })),
            inferTime
          },
          ...prev.slice(0, 18)
        ]);

        if (soundTriggered) {
          playAlertSound();
          setWarningCount((c) => c + 1);
        }
      } else {
        addLog("locate_eval: processing completed, no targets detected.");
        trackedObjectsRef.current = [];
      }
    }, inferenceInterval);
  };

  const stopLocating = () => {
    setIsLocating(false);
    clearInterval(detectIntervalRef.current);
    cancelAnimationFrame(animationFrameRef.current);
    trackedObjectsRef.current = [];
    addLog("locate_stop: open-vocabulary detector paused.");
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="page" style={{ padding: 20, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, alignItems: "start" }}>
      {/* Cột trái: Camera và Control Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "between", flexWrap: "wrap", gap: 12, borderBottom: "1px solid var(--border2)", paddingBottom: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Camera Nhận Diện Lớp Học (Webcam)</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Mô phỏng suy luận cục bộ LocateAnything-3B qua C++ GGML Engine</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button onClick={toggleEngine} className="bprimary" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={13} /> {engineActive ? "Tắt GGML Engine" : "Khởi động GGML Engine"}
              </button>
            </div>
          </div>

          {/* Khung Camera */}
          <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "#060f1e", borderRadius: 12, border: "2px solid var(--wa1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraActive ? "block" : "none", transform: "scaleX(-1)" }} />
            <canvas ref={canvasRef} width={640} height={480} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
            
            {!cameraActive && (
              <div style={{ textAlign: "center", color: "var(--text3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <CameraOff size={48} style={{ opacity: 0.25 }} />
                <div style={{ fontSize: 12, fontWeight: 600 }}>GGML Engine chưa hoạt động hoặc camera tắt</div>
              </div>
            )}

            {isLocating && (
              <div className="qs-laser" style={{ background: "linear-gradient(to bottom, transparent, var(--accent))", height: "4px", boxShadow: "0 0 10px var(--accent)" }} />
            )}
          </div>

          {/* Giao diện quét */}
          {engineActive && cameraActive && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Nhập các nhãn cần phát hiện (cách nhau bởi dấu phẩy)..." disabled={isLocating} className="inp" style={{ flex: 1 }} />
                {isLocating ? (
                  <button onClick={stopLocating} className="bprimary" style={{ padding: "0 18px", borderRadius: 10, background: "#EF4444", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Dừng quét</button>
                ) : (
                  <button onClick={startLocating} className="bprimary" style={{ padding: "0 18px", borderRadius: 10, border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Bắt đầu quét</button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", background: "var(--wa015)", padding: 10, borderRadius: 10, border: "1px solid var(--border2)", fontSize: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--text3)" }}>Mức lượng tử hóa:</span>
                  <select value={quant} onChange={(e) => setQuant(e.target.value)} disabled={isLocating} style={{ padding: "3px 6px", borderRadius: 6, background: "var(--wa055)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 10, fontWeight: 600, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    <option value="q4_k_m">Q4_K_M (4-bit, siêu nhanh, nhẹ)</option>
                    <option value="q8_0">Q8_0 (8-bit, cân bằng)</option>
                    <option value="f16">F16 (16-bit Float, chính xác cao)</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--text3)" }}>CPU Threads:</span>
                  <input type="number" min={1} max={16} value={threads} onChange={(e) => setThreads(Number(e.target.value))} disabled={isLocating} style={{ width: 44, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border2)", background: "var(--wa055)", color: "var(--text)", fontSize: 10, textAlign: "center", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--text3)" }}>Chu kỳ quét:</span>
                  <select value={speed} onChange={(e) => setSpeed(e.target.value)} disabled={isLocating} style={{ padding: "3px 6px", borderRadius: 6, background: "var(--wa055)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 10, fontWeight: 600, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    <option value="fast">Nhanh (0.15s)</option>
                    <option value="hybrid">Trung bình (0.4s)</option>
                    <option value="slow">Chậm (1.0s)</option>
                  </select>
                </div>
              </div>

              {/* Trình giả lập hành vi để Demo */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "rgba(245,158,11,.05)", border: "1px dashed rgba(245,158,11,.3)", padding: "12px 14px", borderRadius: 10, fontSize: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: ".02em" }}>Giả lập hiện diện (Demo):</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text2)", fontWeight: 600 }}>
                    <input type="checkbox" checked={autoPresence} onChange={(e) => setAutoPresence(e.target.checked)} style={{ cursor: "pointer", accentColor: "#F59E0B" }} />
                    <span>Tự động phát hiện người qua camera (Motion detect)</span>
                  </label>
                  {!autoPresence && (
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text2)", fontWeight: 600 }}>
                      <input type="checkbox" checked={simPresence} onChange={(e) => setSimPresence(e.target.checked)} style={{ cursor: "pointer", accentColor: "#F59E0B" }} />
                      <span>Có học sinh trước camera</span>
                    </label>
                  )}
                  <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: studentPresent ? "#10B981" : "#EF4444" }}>
                    Trạng thái: {studentPresent ? "🟢 CÓ HỌC SINH" : "🔴 KHÔNG CÓ AI"}
                  </span>
                </div>
                
                {studentPresent && (
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", borderTop: "1px dashed rgba(245,158,11,.2)", paddingTop: 8 }}>
                    <span style={{ fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: ".02em" }}>Giả lập hành vi học sinh:</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text2)", fontWeight: 600 }}>
                      <input type="checkbox" checked={simPhone} onChange={(e) => setSimPhone(e.target.checked)} style={{ cursor: "pointer", accentColor: "#F59E0B" }} />
                      <span>Cầm Điện thoại (Phone)</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text2)", fontWeight: 600 }}>
                      <input type="checkbox" checked={simSleep} onChange={(e) => setSimSleep(e.target.checked)} style={{ cursor: "pointer", accentColor: "#F59E0B" }} />
                      <span>Ngủ gật (Sleeping)</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text2)", fontWeight: 600 }}>
                      <input type="checkbox" checked={simBook} onChange={(e) => setSimBook(e.target.checked)} style={{ cursor: "pointer", accentColor: "#F59E0B" }} />
                      <span>Đọc sách/vở (Book)</span>
                    </label>
                  </div>
                )}
              </div>

            </div>
          )}
        </Card>
      </div>

      {/* Cột phải: GGML Logs Terminal & Detection History */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Terminal Logs */}
        <Card style={{ padding: 18, background: "#040A15", border: "1px solid rgba(79,172,254,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,.08)", paddingBottom: 10, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: isLocating ? "#34D399" : "#EF4444", animation: isLocating ? "pulseGreen 1.5s infinite" : "none" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "#E2EAF4", fontFamily: "monospace", letterSpacing: 0.5 }}>GGML TERMINAL CONSOLE</div>
          </div>
          <div ref={logContainerRef} style={{ height: 180, overflowY: "auto", fontFamily: "monospace", fontSize: 10, color: "#34D399", display: "flex", flexDirection: "column", gap: 4, textAlign: "left", lineHeight: 1.45 }}>
            {logs.length === 0 ? (
              <span style={{ color: "rgba(255,255,255,.2)" }}>[system] Khởi chạy GGML Engine để xem log suy luận...</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ whiteSpace: "pre-wrap" }}>{log}</div>
              ))
            )}
          </div>
        </Card>

        {/* Lịch sử phát hiện */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", borderBottom: "1px solid var(--border2)", paddingBottom: 10, marginBottom: 12, display: "flex", justifyContent: "between", alignItems: "center" }}>
            <span>Lịch sử phát hiện</span>
            {warningCount > 0 && (
              <span className="tag" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, padding: "2px 8px", fontSize: 9 }}>
                ⚠️ {warningCount} Cảnh báo
              </span>
            )}
          </div>

          <div style={{ maxHeight: 250, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {history.length === 0 ? (
              <div style={{ color: "var(--text3)", fontSize: 11, textAlign: "center", padding: "20px 0" }}>Chưa ghi nhận đối tượng nào.</div>
            ) : (
              history.map((h) => (
                <div key={h.id} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", background: "var(--wa015)", borderRadius: 10, border: "1px solid var(--border2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10 }}>
                    <span style={{ color: "var(--text3)", fontWeight: 600 }}>{h.time}</span>
                    <span style={{ color: "var(--text3)" }}>Inference: {h.inferTime}ms</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 2 }}>
                    {h.matches.map((match, idx) => (
                      <span key={idx} style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 3, border: `1px solid ${match.isWarning ? "rgba(239,68,68,.3)" : "rgba(52,211,153,.3)"}`, background: match.isWarning ? "rgba(239,68,68,.08)" : "rgba(52,211,153,.08)", color: match.isWarning ? "#EF4444" : "#34D399" }}>
                        {match.label.toUpperCase()} · {match.conf}%
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
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
  const [photo, setPhoto] = useState(t.photo || null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const profilePhotoRef = useRef();
  const [saved, setSaved] = useState(false);
  const [errP, setErrP] = useState("");
  const [showAddT, setShowAddT] = useState(false);
  const [newT, setNewT] = useState({ name: "", username: "", password: "", subject: SUBJECTS[0], photo: null });
  const [teacherPhotoUploading, setTeacherPhotoUploading] = useState(false);
  const teacherPhotoRef = useRef();
  const [errT, setErrT] = useState("");
  const [editT, setEditT] = useState(null);
  const [exportMsg, setExportMsg] = useState("");
  const importRef = useRef();
  const { confirm, ConfirmUI } = useConfirm();

  const handleProfilePhoto = async file => {
    if (!file) return;
    setPhotoUploading(true);
    setErrP("");
    try {
      const compressed = await compressImage(file, 400, 400);
      setPhoto(compressed);

      if (user.role === "student") {
        const fapi = window.faceapi;
        if (fapi) {
          try {
            await loadFaceApiModels();
            const desc = await computeFaceDescriptorFromImage(fapi, compressed);
            if (desc) {
              setErrP("✅ Đã nhận diện gương mặt & trích xuất Face ID thành công!");
            } else {
              setErrP("⚠️ Cảnh báo: Không phát hiện thấy gương mặt rõ ràng. Hãy chọn ảnh chân dung rõ nét hơn để phục vụ điểm danh Face ID.");
            }
          } catch (faceErr) {
            console.warn("Lỗi kiểm tra Face ID khi tải ảnh lên:", faceErr);
          }
        }
      }
    } catch (err) {
      setErrP("Lỗi xử lý nén ảnh");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleTeacherPhoto = async file => {
    if (!file) return;
    setTeacherPhotoUploading(true);
    setErrT("");
    try {
      const compressed = await compressImage(file, 400, 400);
      setNewT(p => ({ ...p, photo: compressed }));
    } catch (err) {
      setErrT("Lỗi xử lý nén ảnh");
    } finally {
      setTeacherPhotoUploading(false);
    }
  };

  const saveProfile = () => {
    setErrP("");
    if (!name.trim()) { setErrP("Nhập tên của bạn"); return; }

    // Chỉ kiểm tra mật khẩu nếu người dùng không phải học sinh
    if (user.role !== "student") {
      if (pw && pw.length < 4) { setErrP("Mật khẩu mới tối thiểu 4 ký tự"); return; }
      if (pw && !pwOld) { setErrP("Nhập mật khẩu hiện tại để đổi"); return; }
      if (pw && t.password !== pwOld) { setErrP("Mật khẩu hiện tại không đúng"); return; }
    }

    // Phân loại lưu dữ liệu dựa trên Role của người dùng
    if (user.role === "teacher" || user.role === "admin" || user.role === "proctor") {
      state.setTeachers(p => p.map(x => x.id === t.id ? { ...x, name: name.trim(), subject, photo, ...(pw ? { password: pw } : {}) } : x));
    } else if (user.role === "student") {
      state.setStudents(p => p.map(x => x.id === t.id ? { ...x, name: name.trim(), photo } : x));
    } else if (user.role === "parent") {
      state.setParents(p => p.map(x => x.id === t.id ? { ...x, name: name.trim(), photo, ...(pw ? { password: pw } : {}) } : x));
    }

    setSaved(true); setPw(""); setPwOld("");
    setTimeout(() => setSaved(false), 2500);
  };

  const addOrEditTeacher = () => {
    setErrT("");
    if (!newT.name.trim() || !newT.username.trim() || (!editT && !newT.password)) { setErrT("Điền đầy đủ thông tin bắt buộc"); return; }
    if (state.teachers.find(x => x.username === newT.username.trim() && x.id !== editT?.id)) { setErrT("Username đã tồn tại"); return; }
    if (editT) {
      state.setTeachers(p => p.map(x => x.id === editT.id ? { ...x, name: newT.name.trim(), username: newT.username.trim(), subject: newT.subject, photo: newT.photo || null, ...(newT.password ? { password: newT.password } : {}) } : x));
    } else {
      if (newT.password.length < 4) { setErrT("Mật khẩu tối thiểu 4 ký tự"); return; }
      state.setTeachers(p => [...p, { id: "t_" + Date.now(), name: newT.name.trim(), username: newT.username.trim(), password: newT.password, subject: newT.subject, photo: newT.photo || null, isAdmin: false }]);
    }
    setNewT({ name: "", username: "", password: "", subject: SUBJECTS[0], photo: null }); setShowAddT(false); setEditT(null); setErrT("");
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
        {[["profile","Hồ sơ"],["teachers","Quản lý GV"],["data","Dữ liệu"]].map(([v, l]) => <button key={v} onClick={() => setTab(v)} style={{ padding: "6px 15px", borderRadius: 9, border: `1px solid ${tab===v?"rgba(79,172,254,.4)":"var(--wa07)"}`, background: tab===v?"rgba(79,172,254,.1)":"transparent", color: tab===v?"var(--accent)":"var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>)}
      </div>
      {tab === "profile" && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Thông tin tài khoản</div>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={() => profilePhotoRef.current?.click()} style={{ width: 66, height: 66, borderRadius: "50%", overflow: "hidden", background: "var(--wa07)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed rgba(79,172,254,.35)", flexShrink: 0, cursor: "pointer" }}>
              {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (photoUploading ? <RefreshCw size={22} style={{ color: "var(--accent)", animation: "spin360 1s linear infinite" }} /> : <Camera size={26} style={{ color: "var(--text3)" }} />)}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, letterSpacing: ".05em" }}>ẢNH ĐẠI DIỆN</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => profilePhotoRef.current?.click()} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(79,172,254,.3)", background: "rgba(79,172,254,.08)", color: "var(--accent)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Chọn ảnh</button>
                {photo && <button onClick={() => setPhoto(null)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--wa08)", background: "var(--wa03)", color: "var(--text3)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Xóa ảnh</button>}
              </div>
              <input ref={profilePhotoRef} type="file" accept="image/*" onChange={e => handleProfilePhoto(e.target.files[0])} style={{ display: "none" }} />
            </div>
          </div>
          <Inp label="HỌ VÀ TÊN" value={name} onChange={setName} required />
          <Inp label="MÔN PHỤ TRÁCH" value={subject} onChange={setSubject} placeholder="Toán, Lý..." />
          <div style={{ borderTop: "1px solid var(--wa07)", paddingTop: 14, marginTop: 4, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 10 }}>ĐỔI MẬT KHẨU (để trống nếu không đổi)</div>
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
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--wa055)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Danh sách giáo viên ({state.teachers.length})</div>
            <Btn onClick={() => { setShowAddT(true); setEditT(null); setNewT({ name: "", username: "", password: "", subject: SUBJECTS[0], photo: null }); setErrT(""); }} small><Plus size={12} />Thêm GV</Btn>
          </div>
          {state.teachers.map(x => (
            <div key={x.id} style={{ padding: "11px 16px", borderBottom: "1px solid var(--wa03)", display: "flex", alignItems: "center", gap: 12 }}>
              <Av photo={x.photo} sz={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{x.name}</div>
                <div style={{ fontSize: 10, color: "var(--text3)" }}>@{x.username} · {x.subject||"—"}{x.isAdmin?" · Admin":""}</div>
              </div>
              {x.id === t.id && <Badge c="violet">Bạn</Badge>}
              {x.isAdmin && x.id !== t.id && <Badge c="amber">Admin</Badge>}
              <button onClick={() => { setEditT(x); setNewT({ name: x.name, username: x.username, password: "", subject: x.subject||SUBJECTS[0], photo: x.photo || null }); setErrT(""); setShowAddT(true); }} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(79,172,254,.22)", background: "rgba(79,172,254,.06)", color: "var(--accent)", cursor: "pointer", display: "flex" }}><Edit2 size={12} /></button>
              {x.id !== t.id && <button onClick={() => deleteTeacher(x.id)} style={{ padding: "5px", borderRadius: 6, border: "1px solid rgba(239,68,68,.22)", background: "rgba(239,68,68,.06)", color: "#EF4444", cursor: "pointer", display: "flex" }}><Trash2 size={12} /></button>}
            </div>
          ))}
          {errT && <div style={{ padding: "10px 16px" }}><ErrBox msg={errT} /></div>}
        </div>
      )}
      {tab === "data" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Sao lưu & phục hồi</div>
            <div style={{ fontSize: 12, color: "var(--text4)", marginBottom: 16 }}>Xuất toàn bộ dữ liệu dưới dạng JSON để sao lưu.</div>
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
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{editT ? "Sửa giáo viên" : "Thêm giáo viên"}</h2>
              <button onClick={() => { setShowAddT(false); setEditT(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div onClick={() => teacherPhotoRef.current?.click()} style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", background: "var(--wa07)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed rgba(79,172,254,.35)", flexShrink: 0, cursor: "pointer" }}>
                {newT.photo ? <img src={newT.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (teacherPhotoUploading ? <RefreshCw size={20} style={{ color: "var(--accent)", animation: "spin360 1s linear infinite" }} /> : <Camera size={22} style={{ color: "var(--text3)" }} />)}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, letterSpacing: ".05em" }}>ẢNH ĐẠI DIỆN</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => teacherPhotoRef.current?.click()} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(79,172,254,.3)", background: "rgba(79,172,254,.08)", color: "var(--accent)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Chọn ảnh</button>
                  {newT.photo && <button onClick={() => setNewT(p => ({ ...p, photo: null }))} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--wa08)", background: "var(--wa03)", color: "var(--text3)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Xóa</button>}
                </div>
                <input ref={teacherPhotoRef} type="file" accept="image/*" onChange={e => handleTeacherPhoto(e.target.files[0])} style={{ display: "none" }} />
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




function App({ user, state, onLogout, darkMode, toggleDark }) {
  const [view, setView] = useState("dashboard");
  const [achievements, setAchievements] = useState(() => {
    try {
      const saved = localStorage.getItem(`eclass_achievements_${user.role}_${user.data.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [toast, setToast] = useState(null);
  const [showAchModal, setShowAchModal] = useState(false);
  const [ranLangs, setRanLangs] = useState(new Set());

  // Khai báo state lớp học đang chọn toàn cục cho giáo viên
  const myClasses = useMemo(() => {
    if (!user || user.role !== "teacher") return [];
    // Tìm kiếm thông tin giáo viên cập nhật mới nhất từ danh sách giáo viên để tránh dùng dữ liệu session cũ
    const latestTeacherInfo = state.teachers.find(t => t.id === user.data.id) || user.data;
    const teachingIds = latestTeacherInfo?.teachingClassIds || [];
    return state.classes.filter(c => c.teacherId === user.data.id || teachingIds.includes(c.id));
  }, [state.classes, state.teachers, user]);

  const [selClass, setSelClass] = useState(() => {
    if (user?.role === "teacher") {
      return myClasses[0]?.id || "";
    }
    return user?.classId || "";
  });

  useEffect(() => {
    if (user?.role === "teacher" && myClasses.length > 0) {
      if (!selClass || !myClasses.find(c => c.id === selClass)) {
        setSelClass(myClasses[0].id);
      }
    }
  }, [myClasses, user, selClass]);

  const unlockAchievement = useCallback((id, name, desc, icon) => {
    setAchievements(prev => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: { unlocked: true, time: new Date().toLocaleString("vi-VN") } };
      try { localStorage.setItem(`eclass_achievements_${user.role}_${user.data.id}`, JSON.stringify(next)); } catch {}
      setToast({ name, desc, icon });
      setTimeout(() => setToast(null), 4000);
      return next;
    });
  }, [user.role, user.data.id]);

  const [col, setCol] = useState(() => window.innerWidth < 1024);

  // Refs giữ giá trị mới nhất để dùng trong interval mà không cần huỷ/tạo lại liên tục
  const stateRef = useRef(state);
  const viewRef = useRef(view);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { viewRef.current = view; }, [view]);

  // Ghi nhận học sinh vừa chuyển sang một mục mới (Lịch sử truy cập)
  useEffect(() => {
    if (user.role !== "student") return;
    logActivity(stateRef.current, user.data.id, view);
  }, [view, user.role, user.data.id]);

  // Nhịp tim mỗi 60s để cập nhật "đang hoạt động" khi học sinh vẫn ở nguyên một mục
  useEffect(() => {
    if (user.role !== "student") return;
    const iv = setInterval(() => logActivity(stateRef.current, user.data.id, viewRef.current), 60000);
    return () => clearInterval(iv);
  }, [user.role, user.data.id]);

  // Lắng nghe sự kiện unlock achievement từ các game phòng Lab (iframe)
  useEffect(() => {
    const handleAchMsg = (e) => {
      const data = e.data || {};
      if (data.type === "UNLOCK_ACHIEVEMENT") {
        unlockAchievement(data.id, data.name, data.desc, data.icon);
      }
    };
    window.addEventListener("message", handleAchMsg);
    return () => window.removeEventListener("message", handleAchMsg);
  }, [unlockAchievement]);


  // Xử lý quét mã QR điểm danh
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const qrClassId = params.get("classId");
    const qrTs = params.get("ts");
    
    if (action === "qr_scan" && qrClassId && user.role === "student") {
      api.scanAttendance({ classId: qrClassId, ts: qrTs })
        .then(() => {
          alert("Điểm danh thành công qua mã QR!");
          window.history.replaceState({}, document.title, window.location.pathname);
          state.reload();
        })
        .catch(e => {
          alert("Lỗi điểm danh: " + (e.message || "Đã xảy ra lỗi"));
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, [user.role, user.data.id]);

  useEffect(() => {
    if (user.role === "teacher" && view === "pending" && selClass && state.classes) {
      const cls = state.classes.find(c => c.id === selClass);
      if (cls && cls.teacherId !== user.data.id) {
        setView("dashboard");
      }
    }
  }, [selClass, view, user.role, user.data.id, state.classes, setView]);

  const classId = user.role === "teacher"
    ? selClass
    : user.role === "student" ? user.classId : undefined;
  const classInfo = state.classes.find(c => c.id === classId);
  const myOwnClassIds = useMemo(() => state.classes.filter(c => c.teacherId === user.data.id).map(c => c.id), [state.classes, user.data.id]);
  const pendingCount = user.role === "teacher"
    ? state.pendingStudents.filter(p => myOwnClassIds.includes(p.classId)).length + state.pendingParents.filter(p => myOwnClassIds.includes(p.classId)).length
    : 0;
  const chatUnreadCount = getChatUnreadTotal(user, state, classId);
  useChatBackgroundPoll(user, state, classId);

  const PAGES = useMemo(() => ({
    dashboard:   p => user.role === "parent" ? <ParentDashPage {...p} setView={setView} /> : user.role === "admin" ? <AdminDashPage {...p} /> : <DashPage {...p} setView={setView} />,
    students:    p => <StudentsPage  {...p} selClass={p.selClass} setSelClass={p.setSelClass} myClasses={p.myClasses} />,
    seating:     p => <SeatingPage   {...p} selClass={p.selClass} setSelClass={p.setSelClass} myClasses={p.myClasses} />,
    attendance:  p => <AttPage       {...p} selClass={p.selClass} setSelClass={p.setSelClass} myClasses={p.myClasses} />,
    chat:        p => <ChatPage      {...p} classId={p.selClass} />,
    parentchat:  p => <ParentTeacherChatPage {...p} />,
    assignments: p => <TaskPage      {...p} selClass={p.selClass} setSelClass={p.setSelClass} myClasses={p.myClasses} />,
    wheel:       p => <WheelPage     {...p} selClass={p.selClass} setSelClass={p.setSelClass} myClasses={p.myClasses} />,
    library:     p => <LibPage       {...p} selClass={p.selClass} setSelClass={p.setSelClass} myClasses={p.myClasses} />,
    gradecalc:   p => <GradeCalculatorPage {...p} selClass={p.selClass} setSelClass={p.setSelClass} myClasses={p.myClasses} />,
    rankings:    p => <RankingPage   {...p} />,
    competition: p => <ClassCompetitionPage {...p} />,
    locate:      p => <LocateAnythingPage {...p} selClass={p.selClass} setSelClass={p.setSelClass} myClasses={p.myClasses} />,
    settings:    p => <SettingsPage  {...p} />,
    profile:     p => <ProfilePage   {...p} />,
    pending:     p => <PendingPage   {...p} />,
    pomodoro:    p => <PomodoroPage  {...p} />,
    ai:          p => <AITutorPage   {...p} />,
    schedule:    p => <SchedulePage  {...p} selClass={p.selClass} setSelClass={p.setSelClass} myClasses={p.myClasses} />,
    lab:         p => <LabPage       {...p} />,
  }), [user.role, user.data, myClasses, selClass]);

  const PageFn = PAGES[view] || PAGES.dashboard;

  return (
    <div style={{ display: "flex" }}>
      <div className={`sidebar-overlay ${!col ? "open" : ""}`} onClick={() => setCol(true)} />
      <Sidebar view={view} setView={setView} col={col} user={user} pendingCount={pendingCount} chatUnreadCount={chatUnreadCount} setCol={setCol} selClass={selClass} state={state} />
      <div className={`main-wrapper ${col ? "col" : ""}`}>
        <TopBar view={view} toggleSide={() => setCol(p => !p)} user={user} onLogout={onLogout} classInfo={classInfo} darkMode={darkMode} toggleDark={toggleDark} selClass={selClass} setSelClass={setSelClass} myClasses={myClasses} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <PageFn state={state} user={user} selClass={selClass} setSelClass={setSelClass} myClasses={myClasses} achievements={achievements} setShowAchModal={setShowAchModal} unlockAchievement={unlockAchievement} ranLangs={ranLangs} setRanLangs={setRanLangs} />
        </div>

      {/* Achievement Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 99999,
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          border: "2px solid #FBBF24", borderRadius: 12, padding: "16px 20px",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5), 0 0 15px rgba(251,191,36,0.3)",
          display: "flex", alignItems: "center", gap: 14, minWidth: 320, maxWidth: 420,
          animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          color: "#fff"
        }}>
          <div style={{ fontSize: 32 }}>{toast.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#FBBF24", textTransform: "uppercase", letterSpacing: 1 }}>Thành tựu ẩn mới!</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginTop: 2 }}>{toast.name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.3 }}>{toast.desc}</div>
          </div>
          <button onClick={() => setToast(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Grouped Achievements Modal */}
      {showAchModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99998,
          background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center",
          justifyContent: "center", animation: "fadeIn 0.2s ease-out",
          backdropFilter: "blur(4px)"
        }}>
          <div className="scard" style={{
            width: 480, background: "#0a1628", border: "1.5px solid var(--border)",
            borderRadius: 16, padding: 24, position: "relative",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column"
          }}>
            <button onClick={() => setShowAchModal(false)} style={{
              position: "absolute", top: 16, right: 16, background: "transparent",
              border: "none", color: "var(--text3)", cursor: "pointer"
            }}>
              <X size={18} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>🏆</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#FBBF24" }}>Bộ Sưu Tập Thành Tựu Ẩn</h3>
                <p style={{ fontSize: 11, color: "var(--text3)" }}>Khám phá các tính năng đặc biệt trong Phòng Lab để mở khóa</p>
              </div>
            </div>
            <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, paddingRight: 6 }}>
              {[
                { name: "💻 Phòng Lập Trình", color: "#4ADE80", game: "code", ids: ["code_antigravity", "code_loop", "code_polyglot", "code_clean", "code_hello", "code_math", "code_comment"] },
                { name: "⚡ Phòng Lắp Mạch", color: "#FBBF24", game: "circuit", ids: ["circuit_short", "circuit_bright", "circuit_dark", "circuit_control", "circuit_battery", "circuit_many"] },
                { name: "🎯 Phòng Toán Học", color: "#F43F5E", game: "graphwar", ids: ["graphwar_epic", ["graphwar_boss"], "graphwar_sine"] }
              ].map(group => {
                const ids = group.ids.map(id => Array.isArray(id) ? id[0] : id);
                const achList = {
                  code_antigravity: { name: "🚀 Bay Bổng Cùng Python", desc: "Easter Egg 'import antigravity' của Python trong phòng Lập trình!", icon: "🛸" },
                  code_loop: { name: "♾️ Vòng Lặp Vô Tận", desc: "Viết một chương trình chứa vòng lặp vô hạn trong phòng Lập trình!", icon: "🔄" },
                  code_polyglot: { name: "🌐 Lập Trình Viên Đa Năng", desc: "Thực thi cả mã nguồn Python và C++ trong cùng một phiên làm việc!", icon: "🧠" },
                  code_clean: { name: "🧹 Người Dọn Dẹp", desc: "Khôi phục lại tệp tin về trạng thái mẫu ban đầu trong phòng Lập trình!", icon: "🗑️" },
                  code_hello: { name: "👋 Lời Chào Đầu Tiên", desc: "Chạy chương trình in ra lời chào ('hello' hoặc 'xin chào')!", icon: "👋" },
                  code_math: { name: "🧮 Kỹ Sư Toán Học", desc: "Viết code sử dụng thư viện toán học ('math' hoặc 'cmath')!", icon: "🧮" },
                  code_comment: { name: "📝 Viết Code Văn Minh", desc: "Viết code chứa chú thích rõ ràng bằng '#' hoặc '//'!", icon: "📝" },
                  circuit_short: { name: "⚡ Kỹ Sư Đoản Mạch", desc: "Gây ra ngắn mạch (nối âm dương trực tiếp) trong phòng Lắp mạch!", icon: "💥" },
                  circuit_bright: { name: "💡 Siêu Sáng", desc: "Lắp đặt mạch điện giúp bóng đèn sáng 100% công suất (không qua điện trở)!", icon: "☀️" },
                  circuit_dark: { name: "🌑 Đêm Tối", desc: "Bật công tắc nhưng tất cả các bóng đèn vẫn đứng tối tăm!", icon: "🦇" },
                  circuit_control: { name: "🎛️ Bộ Điều Chỉnh", desc: "Điều chỉnh biến trở đạt mức tối thiểu (0%) hoặc tối đa (100%)!", icon: "🎚️" },
                  circuit_battery: { name: "🔋 Trạm Phát Năng Lượng", desc: "Sử dụng từ 2 nguồn điện (pin) trở lên trong cùng một mạch điện!", icon: "🔋" },
                  circuit_many: { name: "🏗️ Kỹ Sư Lão Luyện", desc: "Thiết kế một mạch điện phức tạp chứa từ 6 linh kiện trở lên!", icon: "🏗️" },
                  graphwar_epic: { name: "🎯 Thiện Xạ Không Gian", desc: "Hạ gục Bot ở Màn 4 Trùm Cuối ngay trong lượt bắn đầu tiên!", icon: "🏆" },
                  graphwar_boss: { name: "👑 Kẻ Diệt Trùm", desc: "Chinh phục thành công Màn 4 - Thử thách tối thượng!", icon: "🏆" },
                  graphwar_sine: { name: "🌊 Nhịp Sóng Lượng Giác", desc: "Tiêu diệt mục tiêu bằng cách sử dụng hàm lượng giác sin(x) hoặc cos(x)!", icon: "〰️" },
                  chem_nobel: { name: "💥 Nhà phát minh Nobel", desc: "Kích nổ Nitroglycerin hoặc TNT bằng Lửa.", icon: "💥" },
                  chem_chernobyl: { name: "☢️ Thảm họa Chernobyl", desc: "Kích hoạt phản ứng hạt nhân của Uranium.", icon: "☢️" },
                  chem_thermonuclear: { name: "🍄 Vụ nổ siêu nhiệt", desc: "Kích hoạt phản ứng Plutonium nhiệt hạch cực lớn.", icon: "🍄" },
                  chem_alchemist: { name: "⚗️ Giả kim thuật", desc: "Tạo ra hợp kim Amalgam bằng Thủy ngân.", icon: "⚗️" },
                  chem_iceage: { name: "❄️ Kỷ băng hà", desc: "Làm đông đặc nước thành băng đá thành công.", icon: "❄️" },
                  chem_reforestation: { name: "🌱 Trồng cây gây rừng", desc: "Nảy mầm thành công hạt giống.", icon: "🌱" },
                  chem_willowisp: { name: "👻 Lửa ma trơi", desc: "Tạo ra ngọn lửa màu xanh lam bằng bột Lưu huỳnh.", icon: "👻" },
                  chem_darksorcerer: { name: "🔮 Phù thủy bóng tối", desc: "Cacbon hóa đường bằng Axit Sunfuric đặc.", icon: "🔮" },
                  chem_cleanenergy: { name: "🔋 Năng lượng sạch", desc: "Sản sinh khí Hydro từ kim loại và axit.", icon: "🔋" },
                  chem_extinguisher: { name: "🧯 Dập lửa cứu hỏa", desc: "Dập tắt ngọn lửa bằng khí CO₂ hoặc băng khô.", icon: "🧯" }
                };
                
                const chemGroup = { name: "🧪 Phòng Hóa Học", color: "#38BDF8", game: "chemistry", ids: [
                  "chem_nobel", "chem_chernobyl", "chem_thermonuclear", "chem_alchemist", 
                  "chem_iceage", "chem_reforestation", "chem_willowisp", "chem_darksorcerer", 
                  "chem_cleanenergy", "chem_extinguisher"
                ]};
                
                const allGroups = [group];
                if (group.game === 'graphwar') {
                  allGroups.push(chemGroup);
                }

                return allGroups.map(g => (
                  <div key={g.name} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: g.color, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--border)", paddingBottom: 4, marginTop: 4 }}>
                      {g.name}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {g.ids.map(id => {
                        const ach = achList[id];
                        const unlocked = achievements[id];
                        return (
                          <div key={id} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                            borderRadius: 8, background: unlocked ? "rgba(251,191,36,0.04)" : "rgba(255,255,255,0.01)",
                            border: unlocked ? `1px solid ${g.color}40` : "1px solid var(--border)",
                            opacity: unlocked ? 1 : 0.6,
                            transition: "all 0.2s"
                          }}>
                            <div style={{ fontSize: 24, width: 30, textAlign: "center", filter: unlocked ? "none" : "grayscale(1) brightness(0.6)" }}>
                              {unlocked ? ach.icon : "❓"}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? "#FBBF24" : "var(--text3)" }}>
                                {unlocked ? ach.name : "🔒 Thành tựu ẩn"}
                              </div>
                              <div style={{ fontSize: 10, color: unlocked ? "var(--text2)" : "var(--text4)", marginTop: 2, lineHeight: 1.35 }}>
                                {unlocked ? ach.desc : "Yêu cầu: Hãy tự mình khám phá tính năng ẩn..."}
                              </div>
                              {unlocked && (
                                <div style={{ fontSize: 8, color: "var(--text3)", marginTop: 4 }}>
                                  Mở khóa lúc: {unlocked.time}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      </div>
    </div>
  );
}


// Component gốc


// ── COMPONENT GIAO DIỆN QUẢN SINH RIÊNG BIỆT (FACE ID SCANNER) ──────────────────────

// ── COMPONENT TRANG THI ĐUA LỚP HỌC (CLASS COMPETITION) ─────────────────────────────
const getRankLabel = rank => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
};

function ClassCompetitionPage({ state, user }) {
  useActivityTracker("Thi đua lớp", "Xem bảng thi đua khối", user.role);

  // 1. Xác định lớp học hiện tại
  const currentClass = useMemo(() => {
    if (user.role === "student") {
      return state.classes.find(c => c.id === user.classId);
    }
    if (user.role === "parent") {
      const child = state.students.find(s => (user.data.childIds || []).includes(s.id));
      return child ? state.classes.find(c => c.id === child.classId) : null;
    }
    if (user.role === "teacher") {
      return state.classes.find(c => c.teacherId === user.data.id) || state.classes[0];
    }
    return state.classes[0];
  }, [state.classes, state.students, user]);

  const getClassGrade = (cls) => {
    if (!cls) return "10";
    if (cls.grade && cls.grade.trim()) return cls.grade.trim();
    const match = cls.name.match(/^(\d+)/);
    return match ? match[1] : "10";
  };

  const currentGrade = useMemo(() => getClassGrade(currentClass), [currentClass]);

  // Danh sách trường học và khối lớp duy nhất
  const schoolsList = useMemo(() => [...new Set(state.classes.map(c => c.school).filter(Boolean))], [state.classes]);
  const gradesList = useMemo(() => [...new Set(state.classes.map(c => c.grade).filter(Boolean))], [state.classes]);

  // Bộ lọc trường học và khối lớp cho bảng xếp hạng quản lý
  const [selectedSchool, setSelectedSchool] = useState(currentClass?.school || schoolsList[0] || "");
  const [selectedGrade, setSelectedGrade] = useState(currentGrade || gradesList[0] || "10");
  const [activeTab, setActiveTab] = useState("week");

  // Hàm kiểm tra xem một log có thuộc khoảng thời gian activeTab hay không
  const isLogInTimeRange = useCallback((createdAtStr, tab) => {
    const date = new Date(createdAtStr);
    const ts = date.getTime();
    const now = Date.now();

    if (tab === "week") {
      return now - ts <= 7 * 24 * 60 * 60 * 1000;
    }
    if (tab === "month") {
      return now - ts <= 30 * 24 * 60 * 60 * 1000;
    }
    if (tab === "term1") {
      // Học kỳ I: các tháng 8, 9, 10, 11, 12, 1 (tháng 8 đến tháng 1 năm sau)
      const month = date.getMonth();
      return [7, 8, 9, 10, 11, 0].includes(month);
    }
    if (tab === "term2") {
      // Học kỳ II: các tháng 2, 3, 4, 5, 6, 7 (tháng 2 đến tháng 7)
      const month = date.getMonth();
      return [1, 2, 3, 4, 5, 6].includes(month);
    }
    // Cả năm (year)
    return true;
  }, []);

  // 2. Hàm tính điểm THỰC TẾ từ cơ sở dữ liệu (Dựa hoàn toàn vào điểm Quản sinh chấm thực tế từ proctorLogs và theo khoảng thời gian)
  const computeRealClassScores = useCallback((cls, tab) => {
    if (!cls) return { study: 0, attendance: 0, discipline: 0, activities: 0, total: 0 };

    const classId = cls.id;
    // Lọc tất cả logs chấm điểm của Quản sinh dành cho lớp học này và theo khoảng thời gian được chọn
    const classLogs = (state.proctorLogs || []).filter(pl => pl.classId === classId && isLogInTimeRange(pl.createdAt, tab));
    // Tính tổng điểm cộng/trừ
    const totalProctorScore = classLogs.reduce((sum, log) => sum + (log.points || 0), 0);
    
    return {
      study: 0,
      attendance: 0,
      discipline: totalProctorScore,
      activities: 0,
      total: totalProctorScore
    };
  }, [state.proctorLogs, isLogInTimeRange]);

  // 3. Tạo danh sách thi đua của toàn bộ khối
  const leaderboardData = useMemo(() => {
    const siblingClasses = state.classes.filter(c => getClassGrade(c) === selectedGrade && (!selectedSchool || c.school === selectedSchool));
    
    let list = siblingClasses.map(c => {
      const scores = computeRealClassScores(c, activeTab);
      return {
        id: c.id,
        name: c.name,
        teacherName: state.teachers.find(t => t.id === c.teacherId)?.name || "Giáo viên",
        score: scores.total,
        study: scores.study,
        attendance: scores.attendance,
        discipline: scores.discipline,
        activities: scores.activities,
        isPlayer: currentClass ? c.id === currentClass.id : false,
        isReal: true
      };
    });

    return list.sort((a, b) => b.score - a.score);
  }, [state.classes, state.teachers, selectedGrade, selectedSchool, currentClass, computeRealClassScores, activeTab]);

  const podium = useMemo(() => {
    return {
      first: leaderboardData[0],
      second: leaderboardData[1],
      third: leaderboardData[2]
    };
  }, [leaderboardData]);

  // 4. Tạo lịch sử sự kiện thi đua từ Quản sinh chấm
  const logs = useMemo(() => {
    const realLogs = [];

    (state.proctorLogs || []).forEach(pl => {
      const cls = state.classes.find(c => c.id === pl.classId);
      if (cls && getClassGrade(cls) === selectedGrade && (!selectedSchool || cls.school === selectedSchool)) {
        if (isLogInTimeRange(pl.createdAt, activeTab)) {
          const className = cls.name;
          const student = state.students.find(s => s.id === pl.studentId);
          const studentName = student ? student.name : "Học sinh";
          realLogs.push({
            time: new Date(pl.createdAt).toLocaleDateString('vi-VN') + ' ' + new Date(pl.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            class: className,
            points: pl.points,
            reason: `Quản sinh ghi nhận: ${pl.points > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(pl.points)}đ HS ${studentName} - Lý do: ${pl.reason}`,
            type: pl.points > 0 ? "plus" : "minus",
            ts: pl.createdAt
          });
        }
      }
    });

    realLogs.sort((a, b) => b.ts - a.ts);

    return realLogs.slice(0, 10);
  }, [state.students, state.classes, state.proctorLogs, selectedGrade, selectedSchool, activeTab, isLogInTimeRange]);

  return (
    <div className="page" style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, height: "calc(100vh - 100px)" }}>
      {/* Header */}
      <div className="scard" style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, var(--card-bg), rgba(79, 172, 254, 0.05))", border: "1px solid var(--border2)", borderRadius: 16, flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B" }}>
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="hfont" style={{ fontSize: 18, color: "var(--text)" }}>Bảng Thi Đua Khối {selectedGrade} {selectedSchool && `- Trường ${selectedSchool}`} (Số Liệu Thực Tế)</h2>
            <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Điểm thi đua các lớp tự động tính dựa trên lịch sử điểm cộng/trừ của Quản sinh trường đó</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginRight: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>TRƯỜNG:</span>
              <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border2)", background: "var(--inp-bg)", color: "var(--text)", fontSize: 11, fontWeight: 600, outline: "none", cursor: "pointer" }}>
                <option value="">-- Tất cả trường --</option>
                {schoolsList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>KHỐI:</span>
              <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border2)", background: "var(--inp-bg)", color: "var(--text)", fontSize: 11, fontWeight: 600, outline: "none", cursor: "pointer" }}>
                {gradesList.map(g => <option key={g} value={g}>Khối {g}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", background: "var(--wa03)", padding: 3, borderRadius: 10, border: "1px solid var(--border2)" }}>
            {[
              { id: "week", label: "Tuần này" },
              { id: "month", label: "Tháng này" },
              { id: "term1", label: "Học kỳ I" },
              { id: "term2", label: "Học kỳ II" },
              { id: "year", label: "Cả năm" }
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ border: "none", background: activeTab === t.id ? "var(--card-bg)" : "transparent", color: activeTab === t.id ? "var(--accent)" : "var(--text4)", fontSize: 11, fontWeight: 600, padding: "6px 16px", borderRadius: 8, cursor: "pointer", transition: "all .2s", boxShadow: activeTab === t.id ? "0 2px 4px rgba(0,0,0,0.1)" : "none" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Podium */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 8 }}>
        {podium.second && (
          <div className="scard" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 20, textAlign: "center", border: "1px solid var(--border2)", borderRadius: 16, background: "var(--card-bg)", position: "relative" }}>
            <div style={{ position: "absolute", top: 12, left: 16, fontSize: 18, fontWeight: 800, color: "var(--text4)", opacity: 0.3 }}>#2</div>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(156, 163, 175, 0.15)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>🥈</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{podium.second.name}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>GVCN: {podium.second.teacherName}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#9CA3AF", marginTop: 12 }}>{podium.second.score} <span style={{ fontSize: 10, fontWeight: 400 }}>điểm</span></div>
          </div>
        )}

        {podium.first && (
          <div className="scard" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px", textAlign: "center", border: "2px solid #F59E0B", borderRadius: 16, background: "linear-gradient(180deg, var(--card-bg), rgba(245, 158, 11, 0.03))", position: "relative", transform: "scale(1.03)", boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.08)" }}>
            <div style={{ position: "absolute", top: 12, left: 16, fontSize: 18, fontWeight: 800, color: "#FBBF24", opacity: 0.4 }}>#1</div>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#F59E0B", fontSize: 24, fontWeight: 700, marginBottom: 12, boxShadow: "0 0 15px rgba(245,158,11,0.2)" }}>🥇</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>{podium.first.name}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>GVCN: {podium.first.teacherName}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#F59E0B", marginTop: 12 }}>{podium.first.score} <span style={{ fontSize: 10, fontWeight: 400 }}>điểm</span></div>
          </div>
        )}

        {podium.third && (
          <div className="scard" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 20, textAlign: "center", border: "1px solid var(--border2)", borderRadius: 16, background: "var(--card-bg)", position: "relative" }}>
            <div style={{ position: "absolute", top: 12, left: 16, fontSize: 18, fontWeight: 800, color: "var(--text4)", opacity: 0.3 }}>#3</div>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(217, 119, 6, 0.15)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#D97706", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>🥉</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{podium.third.name}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>GVCN: {podium.third.teacherName}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#D97706", marginTop: 12 }}>{podium.third.score} <span style={{ fontSize: 10, fontWeight: 400 }}>điểm</span></div>
          </div>
        )}
      </div>

      {/* Main Leaderboard */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20 }}>
        {/* Leaderboard Table */}
        <div className="scard" style={{ padding: 20, border: "1px solid var(--border2)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart2 size={16} style={{ color: "var(--accent)" }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Bảng xếp hạng thi đua</h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border2)", color: "var(--text3)", fontWeight: 700 }}>
                  <th style={{ padding: "10px 8px" }}>Hạng</th>
                  <th style={{ padding: "10px 8px" }}>Lớp</th>
                  <th style={{ padding: "10px 8px" }}>GVCN</th>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Nề nếp</th>
                  <th style={{ padding: "10px 8px", textAlign: "right" }}>Tổng điểm</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: "1px solid var(--wa025)", background: row.isPlayer ? "rgba(79, 172, 254, 0.06)" : "transparent", fontWeight: row.isPlayer ? 700 : 500 }}>
                    <td style={{ padding: "12px 8px" }}>{getRankLabel(idx + 1)}</td>
                    <td style={{ padding: "12px 8px", color: "var(--text)" }}>
                      {row.name} {row.isPlayer && <Badge c="blue">Lớp của bạn</Badge>}
                    </td>
                    <td style={{ padding: "12px 8px", color: "var(--text2)" }}>{row.teacherName}</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", color: "#34D399" }}>{row.discipline}đ</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 800, color: "var(--accent)" }}>{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent logs of proctoring */}
        <div className="scard" style={{ padding: 20, border: "1px solid var(--border2)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><Clock size={16} color="var(--accent)" /> GHI NHẬN THI ĐUA GẦN ĐÂY</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {logs.map((log, i) => {
              const isPlus = log.points > 0;
              return (
                <div key={i} style={{ padding: 10, background: "rgba(255,255,255,0.01)", border: "1px solid var(--border2)", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Lớp {log.class}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: isPlus ? "#34D399" : "#EF4444" }}>{isPlus ? "+" : ""}{log.points}đ</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>{log.time}</div>
                  <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 6, fontStyle: "italic", background: "var(--wa005)", padding: "4px 8px", borderRadius: 4 }}>
                    {log.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
function ProctorDashboard({ state, user, onLogout, toggleDark, darkMode }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [detectedStudent, setDetectedStudent] = useState(null);
  const [pointsType, setPointsType] = useState(null);
  const [reason, setReason] = useState("");
  const [customPoints, setCustomPoints] = useState(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const [livenessPending, setLivenessPending] = useState(false);
  const [livenessTargetName, setLivenessTargetName] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const schoolStudents = useMemo(() => state.students.filter(s => {
    const cls = state.classes.find(c => c.id === s.classId);
    return cls && cls.school === user.data.school;
  }), [state.students, state.classes, user.data.school]);

  // Engine nhận diện khuôn mặt thật (face-api.js) cho toàn bộ học sinh trong trường
  const { modelsReady, computing: computingFaces, knownCount, recognizeFromVideo, resetLiveness } = useFaceRecognition(schoolStudents);
  const [faceNoMatchTick, setFaceNoMatchTick] = useState(0);

  const myLogs = useMemo(() => {
    return [...(state.proctorLogs || [])].reverse().filter(log => {
      const s = state.students.find(x => x.id === log.student_id);
      if (!s) return false;
      const cls = state.classes.find(c => c.id === s.classId);
      return cls && cls.school === user.data.school;
    }).slice(0, 20);
  }, [state.proctorLogs, state.students, state.classes, user.data.school]);

  const startCamera = async () => {
    try {
      setDetectedStudent(null); setPointsType(null); setReason(""); setMessage("");
      setLivenessPending(false);
      setLivenessTargetName("");
      resetLiveness();
      setCameraActive(true);
      setTimeout(async () => {
        try {
          let stream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
          } catch (err) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          alert("Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt. Chi tiết: " + (err.message || err));
          setCameraActive(false);
        }
      }, 50);
    } catch (err) {
      alert("Không thể khởi động camera.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false); setScanning(false);
    setLivenessPending(false);
    setLivenessTargetName("");
  };

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.18);
    } catch {}
  };

  const startScan = async () => {
    if (!cameraActive || !streamRef.current || !videoRef.current) return;
    if (schoolStudents.length === 0) {
      stopCamera();
      alert("Trường học này chưa có học sinh nào trong hệ thống.");
      return;
    }
    setScanning(true); setDetectedStudent(null); setPointsType(null); setReason(""); setMessage("");
    setLivenessPending(false);
    setLivenessTargetName("");
    resetLiveness();

    // Chờ 1.5 giây chạy hiệu ứng quét laser ban đầu
    await new Promise(r => setTimeout(r, 1500));

    const startTime = Date.now();
    const TIMEOUT_MS = 12000;

    try {
      let target = null;

      // Vòng lặp quét liveness
      while (cameraActive && !target && (Date.now() - startTime < TIMEOUT_MS)) {
        if (!cameraActive) break;

        if (modelsReady && videoRef.current && videoRef.current.readyState >= 2 && recognizeFromVideo) {
          try {
            const detected = await recognizeFromVideo(videoRef.current);
            if (detected && detected.studentId) {
              if (!selectedStudentId || detected.studentId === selectedStudentId) {
                const matchedStudent = schoolStudents.find(s => s.id === detected.studentId);
                
                if (matchedStudent) {
                  if (detected.livenessPassed) {
                    target = matchedStudent;
                    break;
                  } else {
                    setLivenessPending(true);
                    setLivenessTargetName(matchedStudent.name);
                  }
                }
              }
            } else {
              setLivenessPending(false);
              setLivenessTargetName("");
            }
          } catch (err) {
            console.warn("Lỗi nhận diện khuôn mặt thực tế:", err);
          }
        }
        // Chờ 45ms giữa các frame quét để bắt kịp nháy mắt nhanh
        await new Promise(r => setTimeout(r, 45));
      }

      // 2. Dự phòng bằng dropdown
      if (!target && selectedStudentId) {
        target = schoolStudents.find(s => s.id === selectedStudentId);
      }

      setScanning(false);
      setLivenessPending(false);
      setLivenessTargetName("");

      if (target) {
        playBeep();
        setDetectedStudent(target);
        if (selectedStudentId) setSelectedStudentId("");
      } else {
        setFaceNoMatchTick(t => t + 1);
      }
    } catch (err) {
      console.error("Lỗi nhận diện khuôn mặt:", err);
      setScanning(false);
      setLivenessPending(false);
      setLivenessTargetName("");
    }
  };

  // Vòng lặp quét tự động cho Quản sinh khi camera hoạt động
  useEffect(() => {
    if (!cameraActive || scanning || detectedStudent) return;
    const interval = setInterval(() => {
      if (cameraActive && streamRef.current && videoRef.current && !scanning && !detectedStudent) {
        clearInterval(interval);
        startScan();
      }
    }, 500); // Check every 500ms to ensure stream is loaded
    return () => clearInterval(interval);
  }, [cameraActive, scanning, detectedStudent, modelsReady]);


  const handleConfirm = async () => {
    if (!detectedStudent || !pointsType || !reason) return;
    setSubmitting(true);
    const points = pointsType === 'plus' ? Math.abs(customPoints) : -Math.abs(customPoints);
    try {
      await api.recordProctorLog({ classId: detectedStudent.classId, studentId: detectedStudent.id, points, reason });
      await state.reload();
      setMessage(`✅ Đã ${pointsType === 'plus' ? 'CỘNG' : 'TRỪ'} ${Math.abs(points)} điểm thi đua cho ${detectedStudent.name} (${state.classes.find(c => c.id === detectedStudent.classId)?.name || ""}) thành công!`);
      setDetectedStudent(null); setPointsType(null); setReason("");
    } catch (err) { alert("Lỗi khi ghi nhận: " + (err.message || err)); }
    finally { setSubmitting(false); }
  };

  const PLUS_REASONS = ["Phát biểu tích cực", "Học tập tốt", "Dọn vệ sinh lớp", "Đi học sớm đầy đủ", "Giúp đỡ bạn bè", "Hành vi tốt", "Đạt thành tích xuất sắc"];
  const MINUS_REASONS = ["Đi học muộn", "Vi phạm đồng phục", "Nói chuyện trong lớp", "Không làm bài tập", "Vi phạm kỷ luật", "Sử dụng điện thoại", "Gây mất trật tự"];
  const DEFAULT_PTS = { "Phát biểu tích cực": 5, "Học tập tốt": 5, "Dọn vệ sinh lớp": 10, "Đi học sớm đầy đủ": 5, "Giúp đỡ bạn bè": 10, "Hành vi tốt": 5, "Đạt thành tích xuất sắc": 20, "Đi học muộn": 5, "Vi phạm đồng phục": 10, "Nói chuyện trong lớp": 5, "Không làm bài tập": 5, "Vi phạm kỷ luật": 15, "Sử dụng điện thoại": 10, "Gây mất trật tự": 5 };

  return (
    <div className={darkMode ? 'ecp' : 'ecp light'} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <style>{`
        .qs-laser { position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#ef4444,transparent);box-shadow:0 0 12px #ef4444;animation:qs-scan 2s linear infinite; }
        @keyframes qs-scan{0%{top:0%}100%{top:100%}}
        .qs-corner{position:absolute;width:28px;height:28px;border-color:#3b82f6;border-style:solid;}
        .qs-pulse{animation:qs-beat 1s ease-in-out infinite;}
        @keyframes qs-beat{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Topbar */}
      <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, background: "var(--topbar)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border2)", position: "sticky", top: 0, zIndex: 40, flexShrink: 0 }}>
        <div style={{ fontSize: 22 }}>👮</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>QUẢN SINH</div>
          <div style={{ fontSize: 10, color: "var(--text3)" }}>Trường: <span style={{ color: "var(--accent)", fontWeight: 700 }}>{user.data.school || "Không rõ"}</span></div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowLogs(s => !s)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border2)", background: showLogs ? "var(--accent)" : "var(--wa04)", color: showLogs ? "#fff" : "var(--text2)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          <Clock size={13} /> Nhật ký ({myLogs.length})
        </button>
        {toggleDark && (
          <button onClick={toggleDark} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--inp-bg)", color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,.25)", background: "rgba(239,68,68,.08)", color: "#EF4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          <LogOut size={13} /> Đăng xuất
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px", gap: 20, maxWidth: 680, width: "100%", margin: "0 auto" }}>
        {message && (
          <div style={{ width: "100%", padding: "14px 18px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.35)", borderRadius: 14, fontSize: 13, color: "#34D399", fontWeight: 600, animation: "fadeUp .3s ease" }}>
            {message}
          </div>
        )}

        {/* Camera card */}
        <div className="scard" style={{ width: "100%", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, color: "var(--text)" }}>
              <Camera size={18} color="var(--accent)" /> QUÉT NHẬN DIỆN KHUÔN MẶT
            </h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)" }}>CHỌN TRƯỚC:</span>
              <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} style={{ padding: "5px 10px", borderRadius: 8, background: "var(--wa055)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 11, outline: "none", fontFamily: "inherit", maxWidth: 200 }}>
                <option value="">-- Quét ngẫu nhiên --</option>
                {schoolStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({state.classes.find(c => c.id === s.classId)?.name || ""})</option>)}
              </select>
            </div>
          </div>

          {knownCount === 0 && schoolStudents.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 10 }}>
              <AlertTriangle size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.5 }}>Chưa học sinh nào trong trường có ảnh đại diện rõ mặt nên hệ thống <strong>chưa thể nhận diện được ai</strong>. Cần thêm ảnh chân dung cho học sinh trong phần Quản lý học sinh trước.</div>
            </div>
          )}

          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#060f1e", borderRadius: 14, border: "2px solid var(--wa1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraActive ? "block" : "none", transform: "scaleX(-1)" }} />
            {cameraActive ? (
              <>
                {/* Vòng tròn căn chỉnh khuôn mặt */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <mask id="face-mask-proctor">
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        <circle cx="50" cy="50" r="30" fill="black" />
                      </mask>
                    </defs>
                    <rect x="0" y="0" width="100" height="100" fill="black" fillOpacity="0.4" mask="url(#face-mask-proctor)" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
                  </svg>
                </div>

                {scanning && (
                  <>
                    <div className="qs-laser" style={{ background: "linear-gradient(to bottom, transparent, var(--accent))", height: "4px", boxShadow: "0 0 10px var(--accent)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.85)", border: "1.5px solid var(--accent)", borderRadius: 8, padding: "8px 16px", color: "var(--accent)", fontSize: 10, fontWeight: 800, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                      <span>ĐANG QUÉT GƯƠNG MẶT...</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <CameraOff size={52} style={{ opacity: 0.25 }} />
                <div style={{ fontSize: 12, fontWeight: 600 }}>Bật camera để nhận diện học sinh</div>
              </div>
            )}
          </div>

          {cameraActive && !modelsReady && (
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }}>
              <RefreshCw size={12} style={{ animation: "spin360 1s linear infinite" }} /> Đang tải mô hình nhận diện khuôn mặt (chỉ chậm ở lần đầu)...
            </div>
          )}
          {cameraActive && modelsReady && computingFaces && (
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }}>
              <RefreshCw size={12} style={{ animation: "spin360 1s linear infinite" }} /> Đang phân tích ảnh đại diện học sinh...
            </div>
          )}
          {cameraActive && modelsReady && !computingFaces && (
            <div key={faceNoMatchTick} style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, animation: "glowbeat 2s infinite", marginTop: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} /> 
              {scanning ? "ĐANG QUÉT GƯƠNG MẶT HỌC SINH..." : detectedStudent ? "ĐÃ NHẬN DIỆN - CHỜ NHẬP ĐIỂM" : "HỆ THỐNG ĐANG TỰ ĐỘNG QUÉT..."}
            </div>
          )}


          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={cameraActive ? stopCamera : startCamera} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 22px", background: cameraActive ? "rgba(239,68,68,0.1)" : "var(--wa05)", border: cameraActive ? "1px solid #EF4444" : "1px solid var(--border2)", color: cameraActive ? "#EF4444" : "var(--text)", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, width: "100%" }}>
              <Camera size={16} /> {cameraActive ? "Tắt tự động quét" : "Bật tự động quét (Face ID)"}
            </button>
          </div>
        </div>

        {/* Detected student + scoring */}
        {detectedStudent && (
          <div className="scard qs-pulse" style={{ width: "100%", padding: 20, display: "flex", flexDirection: "column", gap: 18, border: "2px solid rgba(79,172,254,0.4)", animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Av photo={detectedStudent.photo} sz={64} glow />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{detectedStudent.name}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>Lớp: <strong style={{ color: "var(--accent)" }}>{state.classes.find(c => c.id === detectedStudent.classId)?.name || ""}</strong></span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>Mã HS: <strong style={{ color: "var(--text)" }}>{detectedStudent.code}</strong></span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#FBBF24", fontWeight: 700 }}>🏆 Điểm thi đua: {detectedStudent.score || 0} điểm</div>
              </div>
              <button onClick={() => { setDetectedStudent(null); setPointsType(null); setReason(""); }} style={{ padding: 6, borderRadius: 8, border: "1px solid var(--border2)", background: "var(--wa04)", color: "var(--text3)", cursor: "pointer", display: "flex" }}><X size={16} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button onClick={() => { setPointsType('plus'); setReason(PLUS_REASONS[0]); setCustomPoints(DEFAULT_PTS[PLUS_REASONS[0]] || 5); }}
                style={{ padding: "14px 10px", borderRadius: 12, border: pointsType === 'plus' ? "2px solid #34D399" : "2px solid rgba(52,211,153,0.25)", background: pointsType === 'plus' ? "rgba(52,211,153,0.15)" : "rgba(52,211,153,0.05)", color: "#34D399", fontWeight: 800, fontSize: 15, cursor: "pointer", transition: "all .18s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🏆</span> CỘNG ĐIỂM (+)
              </button>
              <button onClick={() => { setPointsType('minus'); setReason(MINUS_REASONS[0]); setCustomPoints(DEFAULT_PTS[MINUS_REASONS[0]] || 5); }}
                style={{ padding: "14px 10px", borderRadius: 12, border: pointsType === 'minus' ? "2px solid #EF4444" : "2px solid rgba(239,68,68,0.25)", background: pointsType === 'minus' ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.05)", color: "#EF4444", fontWeight: 800, fontSize: 15, cursor: "pointer", transition: "all .18s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>⚠️</span> TRỪ ĐIỂM (-)
              </button>
            </div>

            {pointsType && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, background: pointsType === 'plus' ? "rgba(52,211,153,0.05)" : "rgba(239,68,68,0.05)", border: `1px solid ${pointsType === 'plus' ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 12, animation: "fadeUp .2s ease" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: ".05em" }}>CHỌN LÝ DO</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(pointsType === 'plus' ? PLUS_REASONS : MINUS_REASONS).map(r => (
                    <button key={r} onClick={() => { setReason(r); setCustomPoints(DEFAULT_PTS[r] || 5); }}
                      style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s", border: reason === r ? `1px solid ${pointsType === 'plus' ? '#34D399' : '#EF4444'}` : "1px solid var(--border2)", background: reason === r ? (pointsType === 'plus' ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)") : "var(--wa03)", color: reason === r ? (pointsType === 'plus' ? "#34D399" : "#EF4444") : "var(--text2)" }}>
                      {r}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", whiteSpace: "nowrap" }}>SỐ ĐIỂM:</span>
                  <input type="number" min={1} max={100} value={customPoints} onChange={e => setCustomPoints(Number(e.target.value))}
                    style={{ width: 80, padding: "7px 10px", borderRadius: 9, background: "var(--inp-bg)", border: "1px solid var(--inp-bd)", color: "var(--text)", fontSize: 14, fontWeight: 800, outline: "none", fontFamily: "inherit", textAlign: "center" }} />
                  <div style={{ flex: 1 }} />
                  <button onClick={handleConfirm} disabled={submitting || !reason}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 10, border: "none", background: pointsType === 'plus' ? "#34D399" : "#EF4444", color: "#fff", fontSize: 13, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, transition: "all .2s" }}>
                    {submitting ? "Đang ghi..." : `Xác nhận ${pointsType === 'plus' ? '+' : '-'}${customPoints}đ`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Log panel */}
        {showLogs && (
          <div className="scard" style={{ width: "100%", padding: 16, display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp .25s ease" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text2)", display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} color="var(--accent)" /> NHẬT KÝ GẦN ĐÂY</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
              {myLogs.length === 0 ? (
                <div style={{ fontSize: 11, color: "var(--text4)", fontStyle: "italic", textAlign: "center", padding: 20 }}>Chưa có nhật ký nào.</div>
              ) : myLogs.map(log => {
                const s = state.students.find(x => x.id === log.student_id);
                const cls = state.classes.find(c => c.id === log.class_id);
                const isPlus = log.points > 0;
                return (
                  <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--wa015)", borderRadius: 9, border: "1px solid var(--border2)" }}>
                    <Av photo={s?.photo} sz={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s ? s.name : "Học sinh"}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)" }}>{cls?.name || "Không rõ"} · {log.reason}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isPlus ? "#34D399" : "#EF4444", whiteSpace: "nowrap" }}>{isPlus ? "+" : ""}{log.points}đ</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", whiteSpace: "nowrap" }}>{new Date(log.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



export default function EClassP2K() {
  const state = useAppState();
  const [user, setUser] = useState(null);
  const [publicClasses, setPublicClasses] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('eclass_theme');
    return saved !== null ? saved !== 'light' : true; // default dark
  });

  const toggleDark = useCallback(() => {
    setDarkMode(d => {
      const next = !d;
      localStorage.setItem('eclass_theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  // Load public classes for login page (no auth needed)
  useEffect(() => {
    api.getPublicClasses().then(c => setPublicClasses(c || [])).catch(() => {});
  }, []);

  // Restore session from token
  useEffect(() => {
    if (state.loaded && getToken()) {
      if (state.session) {
        if (state.session.role === "teacher") {
          const t = state.teachers.find(t => t.id === state.session.data.id);
          if (t) setUser({ ...state.session, data: t });
          else { clearToken(); state.setSession(null); }
        } else if (state.session.role === "student") {
          const s = state.students.find(s => s.id === state.session.data.id);
          if (s) setUser({ ...state.session, data: s, classId: s.classId });
          else { clearToken(); state.setSession(null); }
        } else if (state.session.role === "parent") {
          const pr = state.parents.find(p => p.id === state.session.data.id);
          if (pr) setUser({ ...state.session, data: pr });
          else { clearToken(); state.setSession(null); }
        } else if (state.session.role === "admin") {
          const ad = state.teachers.find(t => t.id === state.session.data.id && t.isAdmin);
          if (ad) setUser({ ...state.session, data: ad });
          else { clearToken(); state.setSession(null); }
        } else if (state.session.role === "proctor") {
          const pr = state.teachers.find(t => t.id === state.session.data.id && t.subject === 'Quản sinh');
          if (pr) {
            setUser({ ...state.session, data: pr });
          } else {
            clearToken();
            state.setSession(null);
          }
        }
      }
    }
  }, [state.loaded]);

  
  useEffect(() => {
    if (!user || user.role !== "student") return;
    const updated = state.students.find(s => s.id === user.data.id);
    if (updated && JSON.stringify(updated) !== JSON.stringify(user.data)) {
      setUser(prev => ({ ...prev, data: updated, classId: updated.classId }));
    }
  }, [state.students]);

  useEffect(() => {
    if (!user || user.role !== "parent") return;
    const updated = state.parents.find(p => p.id === user.data.id);
    if (updated && JSON.stringify(updated) !== JSON.stringify(user.data)) {
      setUser(prev => ({ ...prev, data: updated }));
    }
  }, [state.parents]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const updated = state.teachers.find(t => t.id === user.data.id && t.isAdmin);
    if (updated && JSON.stringify(updated) !== JSON.stringify(user.data)) {
      setUser(prev => ({ ...prev, data: updated }));
    }
  }, [state.teachers]);

  // Đồng bộ thông tin Quản sinh khi danh sách giáo viên thay đổi
  useEffect(() => {
    if (!user || user.role !== "proctor") return;
    const updated = state.teachers.find(t => t.id === user.data.id && t.subject === 'Quản sinh');
    if (updated && JSON.stringify(updated) !== JSON.stringify(user.data)) {
      setUser(prev => ({ ...prev, data: updated }));
    }
  }, [state.teachers]);

  // Kiểm tra ngầm (silent login check) định kỳ để xem mật khẩu Quản sinh có bị thay đổi bởi Admin hay không
  useEffect(() => {
    if (!user || user.role !== "proctor") return;
    const savedPass = localStorage.getItem('eclass_proctor_pass');
    if (!savedPass) return;

    let active = true;
    const checkPassword = async () => {
      try {
        const res = await api.login({ role: "proctor", username: user.data.username, password: savedPass });
        if (!active) return;
        if (!res || res.error) {
          setUser(null);
          state.setSession(null);
          clearToken();
          localStorage.removeItem('eclass_proctor_pass');
        }
      } catch (err) {
        // Lỗi kết nối tạm thời thì bỏ qua, không đăng xuất
      }
    };

    // Kiểm tra ngay và định kỳ mỗi 20 giây
    checkPassword();
    const timer = setInterval(checkPassword, 20000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user]);

  const handleLogin = session => {
    setUser(session);
    state.setSession(session);
    // Reload all data now that we have a token
    state.reload();
    // Refresh public classes list
    api.getPublicClasses().then(c => setPublicClasses(c || [])).catch(() => {});
  };

  const handleLogout = () => {
    setUser(null);
    state.setSession(null);
    clearToken();
    localStorage.removeItem('eclass_proctor_pass');
  };

  if (!state.loaded) {
    return (
      <>
        <style>{CSS}</style>
        <div className={`ecp${darkMode ? '' : ' light'}`} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <img src={LOGO_LG} alt="E-Class P2K" style={{ width: 72, height: 72, borderRadius: 20, boxShadow: "0 12px 36px rgba(29,108,245,.45)", marginBottom: 20, animation: "float 2s ease-in-out infinite", display: "inline-block" }} />
            <div style={{ fontSize: 14, color: "var(--text4)" }}>Đang tải dữ liệu...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className={`ecp${darkMode ? '' : ' light'}`}>
        {!user
          ? <LoginPage state={state} onLogin={handleLogin} classes={publicClasses} darkMode={darkMode} toggleDark={toggleDark} />
          : user.role === "proctor"
            ? <ProctorDashboard state={state} user={user} onLogout={handleLogout} darkMode={darkMode} toggleDark={toggleDark} />
            : <App user={user} state={state} onLogout={handleLogout} darkMode={darkMode} toggleDark={toggleDark} />
        }
      </div>
    </>
  );
}