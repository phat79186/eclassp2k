import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, AlertCircle, RefreshCw, Eye, CornerDownRight, CheckCircle2 } from 'lucide-react';

async function getBestCameraStream(baseConstraints = {}) {
  try {
    let devices = await navigator.mediaDevices.enumerateDevices();
    let hasLabels = devices.some(d => d.label);
    if (!hasLabels) {
      try {
        const temp = await navigator.mediaDevices.getUserMedia({ video: true });
        temp.getTracks().forEach(track => track.stop());
        devices = await navigator.mediaDevices.enumerateDevices();
      } catch (e) {
        console.warn("Xin quyền camera thất bại:", e);
      }
    }
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    const nvDevice = videoDevices.find(d => 
      d.label && (
        d.label.toLowerCase().includes('nvidia') || 
        d.label.toLowerCase().includes('broadcast')
      )
    );
    const optimal = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    };
    let constraints = { video: { ...optimal, ...baseConstraints } };
    if (nvDevice) {
      console.log("Ưu tiên chọn camera NVIDIA:", nvDevice.label);
      constraints.video.deviceId = { exact: nvDevice.deviceId };
    }
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    console.warn("Lỗi chọn camera tối ưu, dùng cấu hình dự phòng:", err);
    return await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, ...baseConstraints } });
  }
}

const FACE_MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";

export default function AttendanceCamera({ 
  onStatusChange, 
  onWarningTrigger,
  isActive = true,
  studentName = "Học sinh"
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const requestRef = useRef(null);

  // States
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectStatus, setDetectStatus] = useState("INITIALIZING"); // INITIALIZING, OK, DRAFTING, WARNING, NO_FACE
  const [blinkCount, setBlinkCount] = useState(0);
  const [draftCountdown, setDraftCountdown] = useState(30);

  // Tracking refs for algorithms
  const isEyeClosedRef = useRef(false);
  const draftTimerStartRef = useRef(null);
  const lastStateRef = useRef("INITIALIZING");
  const earHistoryRef = useRef([]);

  // Load face-api models
  useEffect(() => {
    let active = true;
    const loadModels = async () => {
      const fapi = window.faceapi;
      if (!fapi) {
        setLoadingError("Không tìm thấy thư viện face-api.js trên window.");
        return;
      }
      try {
        await Promise.all([
          fapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
          fapi.nets.faceLandmark68TinyNet.loadFromUri(FACE_MODEL_URL)
        ]);
        if (active) setModelLoaded(true);
      } catch (err) {
        console.error("Lỗi tải models:", err);
        if (active) setLoadingError("Không thể tải các mô hình AI nhận diện khuôn mặt.");
      }
    };
    loadModels();
    return () => { active = false; };
  }, []);

  // Control camera stream
  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    try {
      const stream = await getBestCameraStream({ facingMode: "user" });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Lỗi truy cập Camera:", err);
      setDetectStatus("WARNING");
      onWarningTrigger?.("Không thể truy cập camera. Vui lòng cấp quyền.");
    }
  }, [onWarningTrigger]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive && modelLoaded) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive, modelLoaded, startCamera, stopCamera]);

  // Helper calculations for Blink & Head Pose
  const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const calculateEAR = (eyePoints) => {
    const p2_p6 = getDistance(eyePoints[1], eyePoints[5]);
    const p3_p5 = getDistance(eyePoints[2], eyePoints[4]);
    const p1_p4 = getDistance(eyePoints[0], eyePoints[3]);
    return (p2_p6 + p3_p5) / (2.0 * p1_p4);
  };

  // Main loop using requestAnimationFrame
  const detectLoop = useCallback(async () => {
    const video = videoRef.current;
    const fapi = window.faceapi;
    if (!video || video.paused || video.ended || !fapi || !modelLoaded) {
      requestRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      const detection = await fapi
        .detectSingleFace(video, new fapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.45 }))
        .withFaceLandmarks(true);

      if (!detection) {
        setDetectStatus("NO_FACE");
        draftTimerStartRef.current = null;
        if (lastStateRef.current !== "NO_FACE") {
          onStatusChange?.("NO_FACE");
          lastStateRef.current = "NO_FACE";
        }
      } else {
        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();
        const jaw = landmarks.getJawOutline();

        // 1. Blink Detection logic (Adaptive V-Shape rolling buffer)
        const earLeft = calculateEAR(leftEye);
        const earRight = calculateEAR(rightEye);
        const avgEAR = (earLeft + earRight) / 2.0;

        if (!earHistoryRef.current) {
          earHistoryRef.current = [];
        }
        earHistoryRef.current.push(avgEAR);
        if (earHistoryRef.current.length > 20) {
          earHistoryRef.current.shift();
        }

        if (earHistoryRef.current.length >= 4) {
          const maxEAR = Math.max(...earHistoryRef.current);
          const minEAR = Math.min(...earHistoryRef.current);
          const dropPercent = (maxEAR - minEAR) / maxEAR;

          if (dropPercent > 0.18 && minEAR < 0.24) {
            // Khi mắt hồi phục mở lại
            if (avgEAR > maxEAR - (maxEAR - minEAR) * 0.25) {
              setBlinkCount(c => c + 1);
              earHistoryRef.current = []; // Reset history
            }
          }
        }

        // 2. Head Pose logic
        const eyeCenterY = (leftEye[0].y + rightEye[3].y) / 2;
        const noseTip = nose[3]; // Point 30
        const chin = jaw[8]; // Point 8
        const upperFaceHeight = noseTip.y - eyeCenterY;
        const totalFaceHeight = chin.y - eyeCenterY;

        // Approximate Pitch (head nodding down/up)
        // Straight face ratio is ~0.35. Looking down ratio is larger (>= 0.55 is approx -35 deg)
        const pitchRatio = upperFaceHeight / (totalFaceHeight || 1);
        const pitchAngle = (0.35 - pitchRatio) * 175;

        // Approximate Yaw (head turning left/right)
        const noseBridge = nose[0]; // Point 27
        const leftCheek = jaw[0]; // Point 0
        const rightCheek = jaw[16]; // Point 16
        const leftDist = noseBridge.x - leftCheek.x;
        const rightDist = rightCheek.x - noseBridge.x;
        const yawRatio = leftDist / (rightDist || 1);
        const yawAngle = (yawRatio - 1) * 45;

        // Proctor rules application
        let currentStatus = "OK";
        let warningMessage = "";

        if (Math.abs(yawAngle) > 30) {
          currentStatus = "WARNING";
          warningMessage = "Vui lòng không nhìn sang hai bên.";
        } else if (pitchAngle < -35) {
          // Exceeds -35 degrees (too low, or looking under desk)
          currentStatus = "WARNING";
          warningMessage = "Không được cúi đầu quá sâu.";
        } else if (pitchAngle < -15) {
          // Drafting zone: between -15 and -35 degrees
          currentStatus = "DRAFTING";
          if (!draftTimerStartRef.current) {
            draftTimerStartRef.current = Date.now();
          }
          const elapsed = (Date.now() - draftTimerStartRef.current) / 1000;
          const remaining = Math.max(0, Math.ceil(30 - elapsed));
          setDraftCountdown(remaining);

          if (elapsed > 30) {
            currentStatus = "WARNING";
            warningMessage = "Thời gian cúi đầu làm nháp vượt quá 30 giây.";
          }
        } else {
          // Back to normal
          draftTimerStartRef.current = null;
          setDraftCountdown(30);
        }

        // Apply status changes
        setDetectStatus(currentStatus);
        if (currentStatus !== lastStateRef.current) {
          onStatusChange?.(currentStatus);
          lastStateRef.current = currentStatus;
          if (currentStatus === "WARNING" && warningMessage) {
            onWarningTrigger?.(warningMessage);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi trong vòng lặp nhận diện:", err);
    }

    requestRef.current = requestAnimationFrame(detectLoop);
  }, [modelLoaded, onStatusChange, onWarningTrigger]);

  // Hook to run detection loop
  useEffect(() => {
    if (cameraActive && modelLoaded) {
      requestRef.current = requestAnimationFrame(detectLoop);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [cameraActive, modelLoaded, detectLoop]);

  // Dynamic CSS variables for UI styling matching status
  const getStatusColor = () => {
    switch (detectStatus) {
      case "OK": return "#10B981"; // Green
      case "DRAFTING": return "#F59E0B"; // Yellow
      case "WARNING": return "#EF4444"; // Red
      case "NO_FACE": return "#6B7280"; // Gray
      default: return "#4FACFE"; // Deep Navy accent
    }
  };

  const getStatusText = () => {
    switch (detectStatus) {
      case "INITIALIZING": return "Đang khởi tạo...";
      case "OK": return "Trạng thái: Hợp lệ";
      case "DRAFTING": return `Đang nháp bài (${draftCountdown}s)`;
      case "WARNING": return "Cảnh báo vi phạm!";
      case "NO_FACE": return "Không phát hiện khuôn mặt";
      default: return "Chờ phát hiện";
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-2xl border bg-slate-900 shadow-2xl transition-all duration-300"
         style={{ borderColor: getStatusColor() }}>
      
      {/* Header Info Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-[#4FACFE]" />
          <span className="text-sm font-semibold text-slate-200">{studentName}</span>
        </div>
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-300"
             style={{ backgroundColor: `${getStatusColor()}20`, color: getStatusColor() }}>
          {detectStatus === "OK" && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
          {detectStatus === "DRAFTING" && <Eye className="w-3.5 h-3.5 mr-1 animate-pulse" />}
          {detectStatus === "WARNING" && <AlertCircle className="w-3.5 h-3.5 mr-1 animate-bounce" />}
          <span>{getStatusText()}</span>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center">
        {!cameraActive && (
          <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-4">
            {loadingError ? (
              <>
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-sm">{loadingError}</p>
              </>
            ) : (
              <>
                <RefreshCw className="w-10 h-10 text-[#4FACFE] animate-spin" />
                <p className="text-sm font-medium">Đang kết nối camera giám sát...</p>
              </>
            )}
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Circular Face Alignment Overlay */}
        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <mask id="face-mask">
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <circle cx="50" cy="45" r="28" fill="black" />
                </mask>
              </defs>
              {/* Outer shaded layer */}
              <rect x="0" y="0" width="100" height="100" fill="black" fillOpacity="0.45" mask="url(#face-mask)" />
              {/* Circular border guide */}
              <circle 
                cx="50" 
                cy="45" 
                r="28" 
                fill="none" 
                stroke={getStatusColor()} 
                strokeWidth="0.8" 
                strokeDasharray="4,2" 
                className="transition-colors duration-300 animate-[spin_120s_linear_infinite]"
              />
              <circle 
                cx="50" 
                cy="45" 
                r="29" 
                fill="none" 
                stroke={getStatusColor()} 
                strokeWidth="0.2" 
                className="transition-colors duration-300 opacity-60"
              />
            </svg>
          </div>
        )}

        {/* Diagnostic canvas if needed for overlays (hidden by default, used for computing) */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Proctor Dashboard Stats Bar */}
      <div className="bg-slate-950 p-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
        <div className="flex items-center space-x-1.5">
          <Eye className="w-4 h-4 text-emerald-500" />
          <span>Số lần nháy mắt: <strong className="text-white text-sm ml-1">{blinkCount}</strong></span>
        </div>
        <div className="flex items-center space-x-1 text-slate-500">
          <CornerDownRight className="w-3.5 h-3.5" />
          <span>Pitch max: -35° | Timeout: 30s</span>
        </div>
      </div>
    </div>
  );
}
