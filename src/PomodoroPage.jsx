import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Coffee, Book } from 'lucide-react';

const MODES = {
  focus: { label: 'Tập trung', time: 25 * 60, color: '#F43F5E', icon: Book },
  shortBreak: { label: 'Nghỉ ngắn', time: 5 * 60, color: '#3B82F6', icon: Coffee },
  longBreak: { label: 'Nghỉ dài', time: 15 * 60, color: '#10B981', icon: Coffee },
};

export default function PomodoroPage() {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.time);
  const [isActive, setIsActive] = useState(false);
  const [task, setTask] = useState('');
  
  // Ref for the audio element
  const audioRef = useRef(null);

  // Khôi phục state từ localStorage khi khởi tạo
  useEffect(() => {
    const saved = localStorage.getItem('eclass_pomodoro');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMode(parsed.mode || 'focus');
        setTimeLeft(parsed.timeLeft !== undefined ? parsed.timeLeft : MODES.focus.time);
        setIsActive(parsed.isActive || false);
        setTask(parsed.task || '');
        
        // Nếu đang active nhưng đã tắt trang, ta cần tính khoảng thời gian đã trôi qua
        if (parsed.isActive && parsed.lastSaved) {
          const elapsed = Math.floor((Date.now() - parsed.lastSaved) / 1000);
          const newTimeLeft = Math.max(0, parsed.timeLeft - elapsed);
          setTimeLeft(newTimeLeft);
          if (newTimeLeft === 0) setIsActive(false);
        }
      } catch (e) {
        console.error('Error parsing pomodoro state', e);
      }
    }
  }, []);

  // Lưu state vào localStorage mỗi khi thay đổi
  useEffect(() => {
    const stateToSave = {
      mode,
      timeLeft,
      isActive,
      task,
      lastSaved: Date.now()
    };
    localStorage.setItem('eclass_pomodoro', JSON.stringify(stateToSave));
  }, [mode, timeLeft, isActive, task]);

  // Logic đếm ngược
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsActive(false);
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log('Audio play failed', e));
            }
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (!isActive && timeLeft !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(MODES[mode].time);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].time);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].time);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((MODES[mode].time - timeLeft) / MODES[mode].time) * 100;
  const currentMode = MODES[mode];
  const ModeIcon = currentMode.icon;

  return (
    <div className="page" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100%' }}>
      {/* Hidden audio element for bell sound */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      <div style={{ maxWidth: 500, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={28} style={{ color: 'var(--accent)' }} /> Pomodoro Timer
        </div>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 30, textAlign: 'center' }}>
          Quản lý thời gian học tập hiệu quả bằng phương pháp Pomodoro
        </div>

        {/* Khung nhập Nhiệm vụ (tuỳ chọn) */}
        <div style={{ width: '100%', marginBottom: 30 }}>
          <input
            type="text"
            placeholder="Bạn đang làm gì? (ví dụ: Giải toán hình học...)"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: 12,
              border: '1px solid var(--inp-bd)',
              background: 'var(--inp-bg)',
              color: 'var(--text)',
              fontSize: 15,
              outline: 'none',
              textAlign: 'center',
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onFocus={e => e.target.style.border = '1px solid var(--accent)'}
            onBlur={e => e.target.style.border = '1px solid var(--inp-bd)'}
          />
        </div>

        {/* Chuyển đổi chế độ */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 40, background: 'var(--wa05)', padding: 6, borderRadius: 100 }}>
          {Object.entries(MODES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              style={{
                padding: '8px 16px',
                borderRadius: 100,
                border: 'none',
                background: mode === key ? val.color : 'transparent',
                color: mode === key ? '#FFF' : 'var(--text2)',
                fontSize: 13,
                fontWeight: mode === key ? 700 : 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.3s ease'
              }}
            >
              <val.icon size={14} />
              {val.label}
            </button>
          ))}
        </div>

        {/* Vòng tròn đếm ngược */}
        <div style={{ position: 'relative', width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--wa06)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={currentMode.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 1 }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: currentMode.color, display: 'flex', alignItems: 'center', gap: 6, opacity: 0.9, lineHeight: 1 }}>
              <ModeIcon size={16} />
              {currentMode.label}
            </div>
          </div>
        </div>

        {/* Các nút điều khiển */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={resetTimer}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--wa08)',
              color: 'var(--text2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--wa14)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--wa08)'}
          >
            <RotateCcw size={20} />
          </button>
          
          <button
            onClick={toggleTimer}
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              border: 'none',
              background: isActive ? 'var(--wa1)' : currentMode.color,
              color: isActive ? 'var(--text)' : '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isActive ? 'none' : `0 8px 24px ${currentMode.color}66`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'scale(1)'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" style={{ marginLeft: 6 }} />}
          </button>

          <div style={{ width: 50 }} /> {/* Spacer to center the play button */}
        </div>
      </div>
    </div>
  );
}