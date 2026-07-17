import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Plus, Trash2, Play, Pause, Save, CheckCircle, Circle } from 'lucide-react';
import api from './api';

const FILE_ICONS = { pdf:"📄",docx:"📝",pptx:"📊",xlsx:"📈",mp4:"🎬",mp3:"🎵",jpg:"🖼️",png:"🖼️",zip:"📦",txt:"📃",youtube:"▶️",link:"🔗",other:"📁" };
const SUBJECTS = ["Toán", "Ngữ văn", "Ngoại ngữ", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "Giáo dục công dân", "Kinh tế pháp luật", "Tin học", "Công nghệ", "Giáo dục quốc phòng – An ninh", "Thể dục", "Giáo dục địa phương"];

// Helper components
const Inp = ({ label, value, onChange, placeholder, required, type = "text" }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5, letterSpacing: ".05em" }}>{label} {required && <span style={{color:"#EF4444"}}>*</span>}</div>}
    <input type={type} className="inp" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ display: "block" }} />
  </div>
);

const Sel = ({ label, value, onChange, options, required, disabled }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5, letterSpacing: ".05em" }}>{label} {required && <span style={{color:"#EF4444"}}>*</span>}</div>}
    <select className="inp" value={value} onChange={e=>onChange(e.target.value)} style={{ display: "block" }} disabled={disabled}>
      {options.map(o => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>))}
    </select>
  </div>
);

const Btn = ({ children, onClick, variant="primary", small=false, style={} }) => {
  const base = { padding: small ? "6px 13px" : "9px 20px", borderRadius: 10, fontSize: small ? 11 : 13, fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", transition: "all .2s", border: "none", ...style };
  if (variant === "primary") return <button onClick={onClick} className="bprimary" style={base}>{children}</button>;
  if (variant === "ghost")   return <button onClick={onClick} style={{ ...base, border: "1px solid var(--wa1)", background: "var(--wa04)", color: "var(--text3)" }}>{children}</button>;
  if (variant === "danger")  return <button onClick={onClick} style={{ ...base, border: "1px solid rgba(239,68,68,.28)", background: "rgba(239,68,68,.08)", color: "#EF4444" }}>{children}</button>;
  if (variant === "success") return <button onClick={onClick} style={{ ...base, border: "1px solid rgba(52,211,153,.28)", background: "rgba(52,211,153,.08)", color: "#34D399" }}>{children}</button>;
  return null;
};

// ----------------------------------------------------
// 1. Assignment Builder (Teacher UI)
// ----------------------------------------------------
export function AssignmentBuilder({ onSave, onCancel, defaultSubject, disabledSubject }) {
  const [task, setTask] = useState({ title: "", desc: "", subject: defaultSubject || SUBJECTS[0], deadline: "", priority: false, type: "standard", attachments: [], questions: [], videoUrl: "", videoSource: "link", audioUrl: "", audioSource: "link", strictFullscreen: true });

  useEffect(() => {
    if (defaultSubject) {
      setTask(p => ({ ...p, subject: defaultSubject }));
    }
  }, [defaultSubject]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef();
  const videoFileRef = useRef();
  const audioFileRef = useRef();

  const handleVideoUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 1024) { 
      alert(`Video "${file.name}" quá lớn (vượt quá 1GB).`);
      return; 
    }
    setUploading(true);
    const r = new FileReader();
    r.onload = () => {
      setTask(p => ({ ...p, videoUrl: r.result, videoName: file.name }));
      setUploading(false);
    };
    r.readAsDataURL(file);
  };

  const handleAudioUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 50) { 
      alert(`Audio "${file.name}" quá lớn (vượt quá 50MB).`);
      return; 
    }
    setUploading(true);
    const r = new FileReader();
    r.onload = () => {
      setTask(p => ({ ...p, audioUrl: r.result, audioName: file.name }));
      setUploading(false);
    };
    r.readAsDataURL(file);
  };


  const handleFileUpload = e => {
    const files = Array.from(e.target.files); if (!files.length) return;
    setUploading(true);
    Promise.all(files.map(file => new Promise(res => {
      if (file.size > 1024 * 1024 * 100) { 
        alert(`Tài liệu "${file.name}" quá lớn (vượt quá 100MB).`);
        res(null); return; 
      }
      const r = new FileReader();
      r.onload = () => res({ name: file.name, size: (file.size / 1024).toFixed(0) + "KB", type: file.name.split(".").pop().toLowerCase(), data: r.result });
      r.readAsDataURL(file);
    }))).then(results => { 
      setTask(p => ({ ...p, attachments: [...p.attachments, ...results.filter(Boolean)] })); 
      setUploading(false); 
    });
  };

  const handleFileDrop = files => {
    if (!files || !files.length) return;
    setUploading(true);
    Promise.all(Array.from(files).map(file => new Promise(res => {
      if (file.size > 1024 * 1024 * 100) { 
        alert(`Tài liệu "${file.name}" quá lớn (vượt quá 100MB).`);
        res(null); return; 
      }
      const r = new FileReader();
      r.onload = () => res({ name: file.name, size: (file.size / 1024).toFixed(0) + "KB", type: file.name.split(".").pop().toLowerCase(), data: r.result });
      r.readAsDataURL(file);
    }))).then(results => { 
      setTask(p => ({ ...p, attachments: [...p.attachments, ...results.filter(Boolean)] })); 
      setUploading(false); 
    });
  };

  const addQuestion = () => {
    setTask(p => ({
      ...p,
      questions: [...p.questions, { id: "q_" + Date.now(), type: "multiple_choice", content: "", options: ["", "", "", ""], correctAnswer: 0, timestamp: 0 }]
    }));
  };

  const updateQuestion = (idx, field, val) => {
    setTask(p => {
      const q = [...p.questions];
      q[idx][field] = val;
      return { ...p, questions: q };
    });
  };

  const updateOption = (qIdx, optIdx, val) => {
    setTask(p => {
      const q = [...p.questions];
      q[qIdx].options[optIdx] = val;
      return { ...p, questions: q };
    });
  };

  const deleteQuestion = (idx) => {
    setTask(p => ({ ...p, questions: p.questions.filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    if (!task.title.trim()) return setErr("Nhập tên bài tập");
    if (!task.deadline) return setErr("Chọn deadline");
    if (task.type === "video" && !task.videoUrl.trim()) return setErr("Vui lòng nhập link Video");
    
    // Validate questions
    if (task.type === "quiz" || task.type === "video") {
      if (task.questions.length === 0) return setErr("Vui lòng thêm ít nhất 1 câu hỏi");
      for (const q of task.questions) {
        if (!q.content.trim()) return setErr("Vui lòng nhập đủ nội dung câu hỏi");
        if (q.type === "multiple_choice" && q.options.some(o => !o.trim())) return setErr("Vui lòng nhập đủ các lựa chọn trắc nghiệm");
      }
    }
    
    // Ensure all timestamps in interactive video questions are numbers
    const finalizedQuestions = task.questions.map(q => ({
      ...q,
      timestamp: q.timestamp !== undefined ? parseFloat(q.timestamp) || 0 : 0
    }));

    onSave({
      ...task,
      questions: finalizedQuestions
    });
  };

  return createPortal(
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal-flex" style={{ width: 600, maxHeight: "85vh", padding: 20, border: "1.5px solid var(--modal-bd)", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Thêm bài tập mới</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>
        </div>
        
        <div style={{ overflowY: "auto", paddingRight: 5, flex: 1 }}>
          <Inp label="TÊN BÀI TẬP" value={task.title} onChange={v => setTask(p => ({ ...p, title: v }))} placeholder="Bài tập chương 3..." required />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 5, letterSpacing: ".05em" }}>MÔ TẢ</div>
            <textarea value={task.desc} onChange={e => setTask(p => ({ ...p, desc: e.target.value }))} placeholder="Mô tả chi tiết..." rows={2} style={{ width: "100%", padding: "9px 13px", borderRadius: 10, background: "var(--wa04)", border: "1px solid var(--wa1)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Sel label="MÔN HỌC" value={task.subject} onChange={v => setTask(p => ({ ...p, subject: v }))} options={SUBJECTS} required disabled={disabledSubject} />
            <Inp label="DEADLINE" type="date" value={task.deadline} onChange={v => setTask(p => ({ ...p, deadline: v }))} required />
          </div>
          
          <div style={{ display: "flex", gap: 15, marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text3)", cursor: "pointer" }}>
              <input type="checkbox" checked={task.priority} onChange={e => setTask(p => ({ ...p, priority: e.target.checked }))} style={{ accentColor: "#F59E0B" }} />⚡ Ưu tiên cao
            </label>
          </div>

          <Sel label="LOẠI BÀI TẬP" value={task.type} onChange={v => setTask(p => ({ ...p, type: v }))} options={[
            { v: "standard", l: "Bài tập File / Tự luận truyền thống" },
            { v: "quiz", l: "Trắc nghiệm / Trả lời ngắn" },
            { v: "video", l: "Video tương tác (Chống tua & Chèn câu hỏi)" }
          ]} />

          {task.type === "standard" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, letterSpacing: ".05em" }}>ĐÍNH KÈM FILE</div>
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={e => { e.preventDefault(); setDragActive(false); handleFileDrop(e.dataTransfer.files); }}
                style={{ 
                  borderRadius: 12, 
                  border: dragActive ? "2px dashed var(--accent)" : "2px dashed var(--inp-bd)", 
                  background: dragActive ? "rgba(79,172,254,.08)" : "var(--wa04)", 
                  padding: "28px 20px 24px", 
                  transition: "all .2s", 
                  textAlign: "center",
                  cursor: "default"
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(79,172,254,.14)", border: "1px solid rgba(79,172,254,.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Upload size={22} style={{ color: "var(--accent)" }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text3)", marginBottom: 5 }}>Kéo &amp; thả file vào đây</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>hoặc nhấn nút bên dưới để chọn từ máy tính</div>
                
                <button 
                  type="button"
                  onClick={() => fileRef.current?.click()} 
                  style={{ 
                    padding: "9px 24px", 
                    borderRadius: 10, 
                    border: "1px solid rgba(79,172,254,.5)", 
                    background: "rgba(79,172,254,.15)", 
                    color: "var(--accent)", 
                    fontSize: 12, 
                    fontWeight: 700, 
                    cursor: "pointer", 
                    fontFamily: "inherit", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: 7, 
                    marginBottom: 16, 
                    transition: "all .2s" 
                  }}
                >
                  <Upload size={14} />Chọn file để tải lên
                </button>

                <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  {[["PDF","#EF4444"],["DOCX","#3B82F6"],["PPTX","#F59E0B"],["XLSX","#10B981"],["MP4","#8B5CF6"],["IMG","#06B6D4"]].map(([t, c]) => (
                    <span key={t} style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 5, background: `${c}18`, color: c, letterSpacing: ".05em", border: `1px solid ${c}30` }}>{t}</span>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: "var(--text4)" }}>Tối đa 100MB mỗi file</div>
              </div>
              <input ref={fileRef} type="file" multiple onChange={handleFileUpload} style={{ display: "none" }} />
              {task.attachments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {task.attachments.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "rgba(79,172,254,.07)", border: "1px solid rgba(79,172,254,.18)", fontSize: 11, color: "var(--accent)" }}>
                      <span>{FILE_ICONS[f.type]||"📁"}</span><span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                      <button onClick={() => setTask(p => ({ ...p, attachments: p.attachments.filter((_,j)=>j!==i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", display: "flex", padding: 0, marginLeft: 2 }}><X size={11} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {task.type === "video" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 15, marginBottom: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
                  <input type="radio" checked={task.videoSource === "link"} onChange={() => setTask(p => ({ ...p, videoSource: "link" }))} style={{ accentColor: "var(--accent)" }} /> Dùng Link Video
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
                  <input type="radio" checked={task.videoSource === "upload"} onChange={() => setTask(p => ({ ...p, videoSource: "upload" }))} style={{ accentColor: "var(--accent)" }} /> Tải lên Video
                </label>
              </div>

              {task.videoSource === "link" ? (
                <Inp label="LINK VIDEO (Trực tiếp .mp4)" value={task.videoUrl} onChange={v => setTask(p => ({ ...p, videoUrl: v, videoName: null }))} placeholder="https://example.com/video.mp4" />
              ) : (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, letterSpacing: ".05em" }}>CHỌN VIDEO TỪ MÁY</div>
                  {task.videoName ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(16,185,129,.07)", border: "1.5px solid rgba(16,185,129,.3)" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(16,185,129,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#10B981", border: "1px solid rgba(16,185,129,.2)" }}>
                        🎬
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.videoName}</div>
                        <div style={{ fontSize: 10, color: "#10B981", fontWeight: 600 }}>✓ Video sẵn sàng (Tối đa 1GB)</div>
                      </div>
                      <button onClick={() => setTask(p => ({ ...p, videoUrl: "", videoName: null }))} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.08)", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <X size={12} />Đổi
                      </button>
                    </div>
                  ) : (
                    <div 
                      style={{ 
                        borderRadius: 12, 
                        border: "2px dashed var(--inp-bd)", 
                        background: "var(--wa04)", 
                        padding: "20px 16px", 
                        textAlign: "center", 
                        cursor: "pointer",
                        transition: "all .2s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "rgba(79,172,254,.03)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--inp-bd)"; e.currentTarget.style.background = "var(--wa04)"; }}
                      onClick={() => videoFileRef.current?.click()}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(79,172,254,.1)", border: "1px solid rgba(79,172,254,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "var(--accent)" }}>
                        <Upload size={18} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", marginBottom: 4 }}>
                        {uploading ? "Đang xử lý tải lên..." : "Tải lên file Video trực tiếp"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>
                        Hỗ trợ file video dung lượng tối đa 1GB
                      </div>
                    </div>
                  )}
                  <input ref={videoFileRef} type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: "none" }} />
                </div>
              )}
            </div>
          )}

          {task.type === "quiz" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 15, marginBottom: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
                  <input type="radio" checked={task.audioSource === "link"} onChange={() => setTask(p => ({ ...p, audioSource: "link" }))} style={{ accentColor: "var(--accent)" }} /> Không có / Dùng Link Audio
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
                  <input type="radio" checked={task.audioSource === "upload"} onChange={() => setTask(p => ({ ...p, audioSource: "upload" }))} style={{ accentColor: "var(--accent)" }} /> Tải lên Audio (Listening)
                </label>
              </div>

              {task.audioSource === "link" ? (
                <Inp label="LINK AUDIO (Tùy chọn - .mp3)" value={task.audioUrl} onChange={v => setTask(p => ({ ...p, audioUrl: v, audioName: null }))} placeholder="https://example.com/audio.mp3" />
              ) : (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 8, letterSpacing: ".05em" }}>CHỌN AUDIO TỪ MÁY</div>
                  {task.audioName ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(16,185,129,.07)", border: "1.5px solid rgba(16,185,129,.3)" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(16,185,129,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#10B981", border: "1px solid rgba(16,185,129,.2)" }}>
                        🎵
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.audioName}</div>
                        <div style={{ fontSize: 10, color: "#10B981", fontWeight: 600 }}>✓ Audio sẵn sàng (Tối đa 50MB)</div>
                      </div>
                      <button onClick={() => setTask(p => ({ ...p, audioUrl: "", audioName: null }))} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.08)", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <X size={12} />Đổi
                      </button>
                    </div>
                  ) : (
                    <div 
                      style={{ 
                        borderRadius: 12, 
                        border: "2px dashed var(--inp-bd)", 
                        background: "var(--wa04)", 
                        padding: "20px 16px", 
                        textAlign: "center", 
                        cursor: "pointer",
                        transition: "all .2s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "rgba(79,172,254,.03)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--inp-bd)"; e.currentTarget.style.background = "var(--wa04)"; }}
                      onClick={() => audioFileRef.current?.click()}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(79,172,254,.1)", border: "1px solid rgba(79,172,254,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "var(--accent)" }}>
                        <Upload size={18} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", marginBottom: 4 }}>
                        {uploading ? "Đang xử lý tải lên..." : "Tải lên file Audio trực tiếp"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>
                        Hỗ trợ file nghe dung lượng tối đa 50MB
                      </div>
                    </div>
                  )}
                  <input ref={audioFileRef} type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: "none" }} />
                </div>
              )}

              {/* Giới hạn thời gian làm bài */}
              <div style={{ marginTop: 14 }}>
                <Inp 
                  label="GIỚI HẠN THỜI GIAN (Phút)" 
                  type="number" 
                  value={task.timeLimit || ""} 
                  onChange={v => setTask(p => ({ ...p, timeLimit: Math.max(0, parseInt(v) || 0) }))} 
                  placeholder="Bỏ trống = Không giới hạn" 
                />
              </div>
            </div>
          )}

          {(task.type === "quiz" || task.type === "video") && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)" }}>DANH SÁCH CÂU HỎI</div>
                <Btn small variant="ghost" onClick={addQuestion}><Plus size={12} /> Thêm câu hỏi</Btn>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {task.questions.map((q, idx) => (
                  <div key={q.id} style={{ padding: 14, borderRadius: 10, background: "var(--wa03)", border: "1px solid var(--wa07)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Câu {idx + 1}</div>
                      <button onClick={() => deleteQuestion(idx)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}><Trash2 size={14} /></button>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: task.type === "video" ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 10 }}>
                      <Sel label="LOẠI CÂU HỎI" value={q.type} onChange={v => updateQuestion(idx, "type", v)} options={[
                        { v: "multiple_choice", l: "Trắc nghiệm 4 lựa chọn" },
                        { v: "true_false", l: "Đúng / Sai" },
                        { v: "short_answer", l: "Trả lời ngắn" },
                        { v: "essay", l: "Tự luận" }
                      ]} />
                      {task.type === "video" && (
                        <Inp label="THỜI GIAN HIỂN THỊ (Giây)" value={q.timestamp} onChange={v => updateQuestion(idx, "timestamp", v)} placeholder="Ví dụ: 120" />
                      )}
                    </div>
                    
                    <div style={{ marginBottom: 10 }}>
                      <textarea value={q.content} onChange={e => updateQuestion(idx, "content", e.target.value)} placeholder="Nội dung câu hỏi..." rows={2} style={{ width: "100%", padding: "9px", borderRadius: 8, background: "var(--wa05)", border: "none", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
                    </div>

                    {q.type === "multiple_choice" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="radio" checked={q.correctAnswer === optIdx} onChange={() => updateQuestion(idx, "correctAnswer", optIdx)} style={{ accentColor: "var(--accent)" }} />
                            <input value={opt} onChange={e => updateOption(idx, optIdx, e.target.value)} placeholder={`Lựa chọn ${optIdx + 1}`} style={{ flex: 1, padding: "7px 10px", borderRadius: 6, background: "var(--wa05)", border: q.correctAnswer === optIdx ? "1px solid var(--accent)" : "1px solid transparent", color: "var(--text)", fontSize: 11, outline: "none" }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === "true_false" && (
                      <div style={{ display: "flex", gap: 15 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
                          <input type="radio" checked={q.correctAnswer === 1} onChange={() => updateQuestion(idx, "correctAnswer", 1)} style={{ accentColor: "var(--accent)" }} /> Đúng
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
                          <input type="radio" checked={q.correctAnswer === 0} onChange={() => updateQuestion(idx, "correctAnswer", 0)} style={{ accentColor: "var(--accent)" }} /> Sai
                        </label>
                      </div>
                    )}

                  </div>
                ))}
                {task.questions.length === 0 && <div style={{ fontSize: 11, color: "var(--text4)", textAlign: "center", padding: 10 }}>Chưa có câu hỏi nào.</div>}
              </div>
            </div>
          )}
        </div>
        
        {err && <div style={{ background: "rgba(239,68,68,.1)", color: "#FCA5A5", padding: "8px 12px", borderRadius: 8, fontSize: 11, display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}><X size={14} />{err}</div>}
        <div style={{ display: "flex", gap: 9, marginTop: 16, flexShrink: 0 }}>
          <Btn variant="ghost" onClick={onCancel} style={{ flex: 1 }}>Hủy</Btn>
          <Btn onClick={handleSave} style={{ flex: 2 }}>Tạo bài tập</Btn>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ----------------------------------------------------
// 2. Interactive Video Player (Student UI)
// ----------------------------------------------------
export function InteractiveVideoPlayer({ task, onComplete }) {
  const videoRef = useRef(null);
  const [maxPlayedTime, setMaxPlayedTime] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);

  // Sort questions by timestamp
  const sortedQuestions = useMemo(() => {
    return [...(task.questions || [])].sort((a, b) => a.timestamp - b.timestamp);
  }, [task.questions]);

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    
    // Update max played time
    if (!vid.seeking && vid.currentTime > maxPlayedTime) {
      setMaxPlayedTime(vid.currentTime);
    }

    // Check for questions
    const curTime = vid.currentTime;
    for (const q of sortedQuestions) {
      // If we crossed a question timestamp and haven't answered it yet
      if (curTime >= q.timestamp && answers[q.id] === undefined && activeQuestion?.id !== q.id) {
        vid.pause();
        setActiveQuestion(q);
        break; // Only show one question at a time
      }
    }
  };

  const handleSeeking = () => {
    const vid = videoRef.current;
    if (!vid) return;
    // Prevent seeking forward beyond maxPlayedTime (allow 1s buffer)
    if (vid.currentTime > maxPlayedTime + 1) {
      vid.currentTime = maxPlayedTime;
    }
  };

  const handleEnded = () => {
    setCompleted(true);
  };

  const submitQuestionAnswer = (ans) => {
    setAnswers(p => ({ ...p, [activeQuestion.id]: ans }));
    setActiveQuestion(null);
    videoRef.current?.play();
  };

  const submitAll = () => {
    onComplete(answers);
  };

  return (
    <div style={{ width: "100%", background: "var(--bg2)", borderRadius: 12, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "relative" }}>
        <video 
          ref={videoRef}
          src={task.videoUrl} 
          controls={!activeQuestion}
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onEnded={handleEnded}
          style={{ width: "100%", maxHeight: "60vh", display: "block" }}
        />
        
        {/* Overlay for active question */}
        {activeQuestion && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, padding: 20 }}>
            <div style={{ background: "var(--surface)", padding: 24, borderRadius: 12, width: "100%", maxWidth: 500 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>{activeQuestion.content}</div>
              
              {activeQuestion.type === "multiple_choice" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeQuestion.options.map((opt, i) => (
                    <button key={i} onClick={() => submitQuestionAnswer(i)} style={{ padding: "12px 16px", borderRadius: 8, background: "var(--wa05)", border: "1px solid var(--wa1)", color: "var(--text)", textAlign: "left", cursor: "pointer", transition: "all .2s" }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {activeQuestion.type === "true_false" && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => submitQuestionAnswer(1)} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "var(--wa05)", border: "1px solid var(--wa1)", color: "var(--text)", cursor: "pointer" }}>Đúng</button>
                  <button onClick={() => submitQuestionAnswer(0)} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "var(--wa05)", border: "1px solid var(--wa1)", color: "var(--text)", cursor: "pointer" }}>Sai</button>
                </div>
              )}

              {(activeQuestion.type === "short_answer" || activeQuestion.type === "essay") && (
                <form onSubmit={e => { e.preventDefault(); submitQuestionAnswer(e.target.elements.ans.value); }}>
                  <textarea name="ans" rows={activeQuestion.type === "essay" ? 4 : 2} placeholder="Nhập câu trả lời của bạn..." style={{ width: "100%", padding: "12px", borderRadius: 8, background: "var(--wa03)", border: "1px solid var(--wa1)", color: "var(--text)", marginBottom: 12, fontFamily: "inherit", resize: "vertical" }} required />
                  <Btn style={{ width: "100%" }}>Tiếp tục</Btn>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{task.title}</h3>
        <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>Xem hết video và trả lời tất cả các câu hỏi xuất hiện để hoàn thành bài tập.</p>
        
        {completed && (
          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 10, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#34D399", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle size={16} /> Bạn đã xem hết video!</div>
            <Btn onClick={submitAll} variant="success">Nộp bài ngay</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. Quiz Player (Student UI)
// ----------------------------------------------------
export function QuizPlayer({ task, onComplete, answers, setAnswers }) {
  const handleAnswer = (qId, val) => {
    setAnswers(p => ({ ...p, [qId]: val }));
  };

  const submitAll = () => {
    onComplete(answers);
  };

  return (
    <div style={{ width: "100%", background: "var(--surface)", borderRadius: 12, padding: 24, border: "1px solid var(--border)" }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{task.title}</h3>
      {task.desc && <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>{task.desc}</p>}
      
      {task.audioUrl && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 8, letterSpacing: ".05em" }}>FILE NGHE (LISTENING)</div>
          <audio src={task.audioUrl} controls style={{ width: "100%", height: 40, outline: "none", borderRadius: 8 }} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 30 }}>
        {task.questions?.map((q, idx) => (
          <div key={q.id} style={{ padding: 16, borderRadius: 10, background: "var(--wa03)", border: "1px solid var(--wa07)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>Câu {idx + 1}: {q.content || q.text}</div>
            
            {(q.type === "multiple_choice" || q.type === "mcq") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options.map((opt, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: answers[q.id] === i ? "rgba(79,172,254,.15)" : "var(--wa05)", border: answers[q.id] === i ? "1px solid var(--accent)" : "1px solid transparent", cursor: "pointer", transition: "all .2s" }}>
                    <input type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => handleAnswer(q.id, i)} style={{ accentColor: "var(--accent)" }} />
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {(q.type === "true_false" || q.type === "truefalse") && (
              <div style={{ display: "flex", gap: 12 }}>
                {[ {v:1,l:"Đúng"}, {v:0,l:"Sai"} ].map(opt => (
                  <label key={opt.v} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 8, background: answers[q.id] === opt.v ? "rgba(79,172,254,.15)" : "var(--wa05)", border: answers[q.id] === opt.v ? "1px solid var(--accent)" : "1px solid transparent", cursor: "pointer" }}>
                    <input type="radio" name={q.id} checked={answers[q.id] === opt.v} onChange={() => handleAnswer(q.id, opt.v)} style={{ accentColor: "var(--accent)" }} />
                    <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{opt.l}</span>
                  </label>
                ))}
              </div>
            )}

            {(q.type === "short_answer" || q.type === "short" || q.type === "essay") && (
              <textarea 
                value={answers[q.id] || ""} 
                onChange={e => handleAnswer(q.id, e.target.value)} 
                rows={q.type === "essay" ? 4 : 2} 
                placeholder="Nhập câu trả lời của bạn..." 
                style={{ width: "100%", padding: "12px", borderRadius: 8, background: "var(--wa05)", border: "1px solid var(--wa1)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }} 
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn onClick={submitAll} variant="success">Nộp bài ngay</Btn>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// AI Proctoring Camera Panel
// ----------------------------------------------------
export function ProctorCameraPanel({ onViolate, isCalibrating = false, onFaceStatus }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [gaze, setGaze] = useState("straight"); // straight, left, right, up, down
  const [countdown, setCountdown] = useState(null); // countdown timer for look down
  const countdownRef = useRef(null);
  const gazeTriggeredRef = useRef(false); // Prevents re-triggering on every frame

  const canvasRef = useRef(document.createElement("canvas"));

  const triggerGazeState = (direction) => {
    if (isCalibrating) return;
    if (gazeTriggeredRef.current) return; // Already triggered, wait for reset
    gazeTriggeredRef.current = true;

    // Clear any existing countdowns
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);

    if (direction === "left" || direction === "right" || direction === "up") {
      // Instantly violate after short delay
      setTimeout(() => {
        onViolate(`Liếc sang ${direction === "left" ? "TRÁI" : direction === "right" ? "PHẢI" : "TRÊN"}`);
      }, 800);
    } else if (direction === "down") {
      // Start 3 second countdown. They must press keyboard key!
      let remaining = 3;
      setCountdown(remaining);
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          setCountdown(null);
          // Violated!
          onViolate("Cúi xuống dưới mà không gõ bàn phím");
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    }
  };

  // Request webcam stream
  useEffect(() => {
    let activeStream = null;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        activeStream = s;
        setStream(s);
      })
      .catch(err => {
        console.warn("Webcam access denied or unavailable:", err);
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Safely assign stream to video srcObject after rendering
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Real-time tracking.js face tracking
  useEffect(() => {
    if (!stream || !window.tracking) return;

    const video = videoRef.current;
    if (!video) return;

    // Create face tracker
    const tracker = new window.tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);

    let baseline = null;
    let noFaceCounter = 0;
    let trackingTask = null;

    try {
      // Start tracking
      trackingTask = window.tracking.track(video, tracker);

      tracker.on('track', (event) => {
        if (event.data.length === 0) {
          // No face detected, update status to warning but do NOT violate to prevent false positives from backlight/shadows
          setGaze("away");
          if (onFaceStatus) onFaceStatus("none");
          return;
        }

        noFaceCounter = 0;
        const rect = event.data[0]; // First detected face
        
        // Calculate current face center
        const faceX = rect.x + rect.width / 2;
        const faceY = rect.y + rect.height / 2;

        // Calibrate baseline on first detection
        if (!baseline) {
          baseline = { x: faceX, y: faceY, width: rect.width, height: rect.height };
          if (onFaceStatus) onFaceStatus("stable");
          return;
        }

        // Calculate face center offset from baseline
        const dx = faceX - baseline.x;
        const dy = faceY - baseline.y;

        // Check head movement
        const thresholdX = baseline.width * 0.35; // 35% of face width
        const thresholdY = baseline.height * 0.35;

        if (dx < -thresholdX) {
          // Turned/moved right (mirrored: dx < 0 is right)
          setGaze("right");
          if (onFaceStatus) onFaceStatus("unstable");
          triggerGazeState("right");
        } else if (dx > thresholdX) {
          // Turned/moved left
          setGaze("left");
          if (onFaceStatus) onFaceStatus("unstable");
          triggerGazeState("left");
        } else if (dy < -thresholdY) {
          // Moved up
          setGaze("up");
          if (onFaceStatus) onFaceStatus("unstable");
          triggerGazeState("up");
        } else if (dy > thresholdY) {
          // Moved down
          setGaze("down");
          if (onFaceStatus) onFaceStatus("unstable");
          triggerGazeState("down");
        } else {
          // Head is back to center — reset trigger guard
          gazeTriggeredRef.current = false;
          setGaze(currentGaze => {
            if (currentGaze !== "down") {
              if (onFaceStatus) onFaceStatus("stable");
              return "straight";
            }
            return currentGaze;
          });
        }
      });
    } catch (e) {
      console.error("tracking.js start error:", e);
    }

    return () => {
      if (trackingTask) {
        trackingTask.stop();
      }
    };
  }, [stream]);

  // Listen to keyboard inputs to reset look-down threat
  useEffect(() => {
    const handleKeyDown = () => {
      // If student is looking down and presses a key, reset to straight!
      setGaze(currentGaze => {
        if (currentGaze === "down") {
          // Clear countdown and reset trigger guard
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          setCountdown(null);
          gazeTriggeredRef.current = false;
          return "straight";
        }
        return currentGaze;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // triggerGazeState moved to top of component to resolve hoisting ReferenceError

  // Handler for simulating gaze states manually via buttons
  const triggerGaze = (direction) => {
    setGaze(direction);
    triggerGazeState(direction);
  };

  return (
    <div style={{ width: 260, background: "rgba(10,20,40,.95)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block" }}></span>
        AI CAMERA GIÁM SÁT GIAN LẬN
      </div>

      {/* Video Container */}
      <div style={{ position: "relative", width: "100%", height: 160, borderRadius: 8, overflow: "hidden", background: "#000", border: "1px solid rgba(79,172,254,.3)" }}>
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 10, gap: 8 }}>
            <span>🔄 Đang kết nối camera...</span>
          </div>
        )}

        {/* HUD Target Overlays */}
        <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(16,185,129,.2)", pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Target grid crosshair */}
          <div style={{ width: 40, height: 40, border: "1px dashed rgba(16,185,129,.4)", borderRadius: "50%", position: "relative" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(16,185,129,.3)" }}></div>
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(16,185,129,.3)" }}></div>
          </div>
        </div>

        {/* AI Gaze Direction Vector Display */}
        {gaze !== "straight" && (
          <div style={{ position: "absolute", inset: 0, background: gaze === "away" ? "rgba(245,158,11,.1)" : "rgba(239,68,68,.15)", pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: gaze === "away" ? "#F59E0B" : "#EF4444", fontSize: 10, fontWeight: 700, padding: "4px 8px", background: "rgba(0,0,0,.75)", borderRadius: 6, textAlign: "center" }}>
              {gaze === "down" ? `CÚI XUỐNG: GÕ PHÍM (${countdown}s)` : gaze === "away" ? "KHÔNG THẤY MẶT / THIẾU SÁNG" : `LIẾC SANG ${gaze === "left" ? "TRÁI" : gaze === "right" ? "PHẢI" : "TRÊN"}!` }
            </div>
          </div>
        )}
      </div>

      {/* AI Stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(255,255,255,.03)", padding: 10, borderRadius: 8, border: "1px solid var(--wa01)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
          <span style={{ color: "var(--text4)" }}>Trạng thái:</span>
          <span style={{ fontWeight: 700, color: gaze === "straight" ? "#10B981" : (gaze === "down" || gaze === "away") ? "#F59E0B" : "#EF4444" }}>
            {gaze === "straight" ? "ĐANG TẬP TRUNG" : gaze === "away" ? "CẢNH BÁO (THIẾU SÁNG)" : gaze === "down" ? "CẢNH BÁO (CÚI ĐẦU)" : "PHÁT HIỆN GIAN LẬN!"}
          </span>
        </div>
        {gaze === "down" && (
          <div style={{ fontSize: 10, color: "#F59E0B", lineHeight: 1.4, marginTop: 4 }}>
            💡 Gõ phím bất kỳ để tắt cảnh báo cúi đầu!
          </div>
        )}
      </div>

      {/* Demo Controls */}
      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", letterSpacing: ".02em" }}>BẢNG THỬ NGHIỆM AI GIAN LẬN:</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <button onClick={() => triggerGaze("left")} style={{ padding: "6px 8px", background: "rgba(239,68,68,.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,.2)", borderRadius: 6, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Liếc Trái</button>
          <button onClick={() => triggerGaze("right")} style={{ padding: "6px 8px", background: "rgba(239,68,68,.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,.2)", borderRadius: 6, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Liếc Phải</button>
          <button onClick={() => triggerGaze("up")} style={{ padding: "6px 8px", background: "rgba(239,68,68,.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,.2)", borderRadius: 6, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Liếc Lên</button>
          <button onClick={() => triggerGaze("down")} style={{ padding: "6px 8px", background: "rgba(245,158,11,.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,.2)", borderRadius: 6, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Cúi đầu</button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. Student Assignment Wrapper Modal
// ----------------------------------------------------
export function StudentAssignmentModal({ task, user, onComplete, onCancel }) {
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(task.timeLimit ? task.timeLimit * 60 : 0);
  const [fails, setFails] = useState(0);
  const [faceStatus, setFaceStatus] = useState("none");
  const [isInFullscreen, setIsInFullscreen] = useState(true);
  const ignoreAntiCheatRef = useRef(false);

  // Face identity verification states
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceVerifying, setFaceVerifying] = useState(false);
  const [faceVerifyMsg, setFaceVerifyMsg] = useState("");
  const [faceApiReady, setFaceApiReady] = useState(false);
  const verifyVideoRef = useRef(null);
  const verifyStreamRef = useRef(null);
  const proctorVideoRef = useRef(null);
  const [avatarDesc, setAvatarDesc] = useState(null);
  const [cheatWarning, setCheatWarning] = useState("");
  const studentPhoto = user?.data?.photo || null;

  const [studentFile, setStudentFile] = useState(null);
  const studentFileInputRef = useRef(null);

  const handleStudentFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let type = "other";
      const ext = file.name.split(".").pop().toLowerCase();
      if (["jpg","jpeg","png","gif"].includes(ext)) type = "png";
      else if (ext === "pdf") type = "pdf";
      else if (["doc","docx"].includes(ext)) type = "docx";
      else if (["xls","xlsx"].includes(ext)) type = "xlsx";
      else if (["ppt","pptx"].includes(ext)) type = "pptx";
      else if (ext === "mp4") type = "mp4";
      else if (ext === "mp3") type = "mp3";

      setStudentFile({ name: file.name, type, data: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const answersRef = useRef({});
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Load face-api.js models
  useEffect(() => {
    if (!task.strictFullscreen || !studentPhoto) return;
    const loadModels = async () => {
      const fapi = window.faceapi;
      if (!fapi) return;
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";
        await Promise.all([
          fapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          fapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          fapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setFaceApiReady(true);
      } catch (e) {
        console.warn("face-api.js model load failed:", e);
        // If models fail to load, skip verification
        setFaceApiReady(true);
        setFaceVerified(true);
      }
    };
    loadModels();
  }, [task.strictFullscreen, studentPhoto]);

  // Run face verification against avatar photo
  const runFaceVerification = async () => {
    setFaceVerifying(true);
    setFaceVerifyMsg("Đang phân tích khuôn mặt...");
    const fapi = window.faceapi;

    if (!fapi || !faceApiReady) {
      setFaceVerified(true);
      setFaceVerifying(false);
      setFaceVerifyMsg("✅ Đã bỏ qua xác thực (thư viện chưa tải)");
      return;
    }

    try {
      // Detect face from avatar photo
      const avatarImg = new Image();
      avatarImg.crossOrigin = "anonymous";
      avatarImg.src = studentPhoto;
      await new Promise((res, rej) => { avatarImg.onload = res; avatarImg.onerror = rej; });

      const avatarDetection = await fapi.detectSingleFace(avatarImg, new fapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!avatarDetection) {
        setFaceVerifyMsg("⚠️ Không tìm thấy khuôn mặt trong ảnh đại diện. Vui lòng cập nhật ảnh rõ nét hơn.");
        setFaceVerifying(false);
        return;
      }
      setAvatarDesc(avatarDetection.descriptor);

      // Detect face from live camera
      const video = verifyVideoRef.current;
      if (!video) { setFaceVerifying(false); return; }

      const liveDetection = await fapi.detectSingleFace(video, new fapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!liveDetection) {
        setFaceVerifyMsg("⚠️ Không phát hiện được khuôn mặt qua camera. Hãy đảm bảo đủ ánh sáng và nhìn thẳng.");
        setFaceVerifying(false);
        return;
      }

      const distance = fapi.euclideanDistance(avatarDetection.descriptor, liveDetection.descriptor);
      const THRESHOLD = 0.55; // ≤0.55 = same person

      if (distance <= THRESHOLD) {
        setFaceVerified(true);
        setFaceVerifyMsg("✅ Xác thực khuôn mặt thành công!");
      } else {
        setFaceVerifyMsg(`❌ Khuôn mặt không khớp (${(distance * 100).toFixed(0)}% khác biệt). Vui lòng thử lại.`);
      }
    } catch (e) {
      console.warn("Face verification error:", e);
      // On error, let them through
      setFaceVerified(true);
      setFaceVerifyMsg("✅ Đã bỏ qua xác thực (lỗi hệ thống)");
    }
    setFaceVerifying(false);
  };

  // Start camera for verification panel & continuous proctoring
  useEffect(() => {
    if (!task.strictFullscreen || !studentPhoto) return;
    let activeStream = null;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        activeStream = s;
        verifyStreamRef.current = s;
        if (verifyVideoRef.current) verifyVideoRef.current.srcObject = s;
        if (proctorVideoRef.current) proctorVideoRef.current.srcObject = s;
      })
      .catch(e => console.warn("Verify camera error:", e));

    return () => {
      if (activeStream) activeStream.getTracks().forEach(t => t.stop());
    };
  }, [task.strictFullscreen, studentPhoto]);

  // Connect active stream to proctor video ref when it becomes available
  useEffect(() => {
    if (started && proctorVideoRef.current && verifyStreamRef.current) {
      proctorVideoRef.current.srcObject = verifyStreamRef.current;
    }
  }, [started]);

  // Continuous Proctoring Loop
  useEffect(() => {
    if (!started || !task.strictFullscreen || !faceApiReady || !avatarDesc || submitting) return;
    const fapi = window.faceapi;

    const timer = setInterval(async () => {
      const video = proctorVideoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const liveDetection = await fapi.detectSingleFace(video, new fapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        let warning = "";

        if (!liveDetection) {
          warning = "Không phát hiện khuôn mặt!";
        } else {
          const distance = fapi.euclideanDistance(avatarDesc, liveDetection.descriptor);
          if (distance > 0.55) {
            warning = "Khuôn mặt người thi thay đổi (Nghi vấn thi hộ)!";
          } else {
            const landmarks = liveDetection.landmarks;
            const nose = landmarks.getNose()[3];
            const jaw = landmarks.getJawOutline();
            const leftJaw = jaw[0];
            const rightJaw = jaw[16];
            const bottomJaw = jaw[8];
            const noseRoot = landmarks.getNose()[0];

            const dxLeft = nose.x - leftJaw.x;
            const dxRight = rightJaw.x - nose.x;
            const yawRatio = dxLeft / dxRight;

            const dyTop = nose.y - noseRoot.y;
            const dyBottom = bottomJaw.y - nose.y;
            const pitchRatio = dyBottom / dyTop;

            if (yawRatio > 2.2 || yawRatio < 0.45) {
              warning = "Liếc/quay đầu sang hai bên!";
            } else if (pitchRatio < 0.7) {
              warning = "Cúi đầu (nghi vấn xem tài liệu/điện thoại)!";
            } else if (pitchRatio > 2.0) {
              warning = "Ngẩng đầu lên trên!";
            }
          }
        }

        if (warning) {
          setCheatWarning(warning);
          setFails(prev => prev + 1);
        } else {
          setCheatWarning("");
        }
      } catch (e) {
        console.warn("Proctor monitor err", e);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [started, task.strictFullscreen, faceApiReady, avatarDesc, submitting]);

  // Handle fails threshold
  useEffect(() => {
    if (fails >= 5 && !submitting) {
      alert("HỦY BÀI THI: Hệ thống phát hiện gian lận (quay mặt/cúi đầu) liên tục 5 lần! Bài thi tự động chấm 0 điểm.");
      handleSubmit({
        ...answersRef.current,
        _metadata: { cheated: true, violations: fails, autoSubmitted: true, reason: "Phát hiện gian lận khuôn mặt qua camera" }
      });
    }
  }, [fails, submitting]);



  // Anti-F5 reload detection and state recovery
  useEffect(() => {
    if (window.__reloadChecked) return;

    const activeState = sessionStorage.getItem(`exam_active_${task.id}`);
    if (activeState === "true") {
      window.__reloadChecked = true;
      let reloadCount = parseInt(sessionStorage.getItem(`exam_reloads_${task.id}`) || "0") + 1;
      sessionStorage.setItem(`exam_reloads_${task.id}`, reloadCount.toString());

      if (reloadCount === 1) {
        alert("CẢNH BÁO: Phát hiện hành vi tải lại trang (F5)! Đây là lần vi phạm thứ 1. Nếu vi phạm lần thứ 2, bài thi sẽ tự động hủy và nhận 0 điểm.");
        setStarted(true);
        setTimeout(() => {
          reEnterFullscreen();
        }, 500);
      } else if (reloadCount >= 2) {
        alert("HỦY BÀI THI: Phát hiện hành vi tải lại trang (F5) lần thứ 2! Bài thi tự động nộp và nhận 0 điểm.");
        sessionStorage.setItem(`exam_active_${task.id}`, "false");
        handleSubmit({
          ...answersRef.current,
          _metadata: { cheated: true, violations: 2, autoSubmitted: true, reason: "Tải lại trang (F5) quá 1 lần" }
        });
      }
    }
  }, [task.id]);

  // Warn student before closing/reloading when active
  useEffect(() => {
    if (!started) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Cảnh báo: Hành vi tải lại hoặc đóng tab sẽ bị tính là vi phạm quy chế thi!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [started]);


  const handleSubmit = async (currentAnswers) => {
    sessionStorage.setItem(`exam_active_${task.id}`, "false");
    ignoreAntiCheatRef.current = true;
    setSubmitting(true);
    // Exit fullscreen mode if active
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    // Automatically attach cheat metadata if not present
    const finalAnswers = currentAnswers && currentAnswers._metadata ? currentAnswers : {
      ...currentAnswers,
      _metadata: { cheated: fails >= 1, violations: fails, autoSubmitted: false }
    };

    try {
      if (typeof onComplete === "function") {
        onComplete(finalAnswers);
      }
    } catch (e) {
      alert("Lỗi khi nộp bài: " + e.message);
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    sessionStorage.setItem(`exam_active_${task.id}`, "false");
    ignoreAntiCheatRef.current = true;
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.error(e);
    }
    onCancel();
  };

  const handleStart = async () => {
    window.__reloadChecked = false;
    sessionStorage.setItem(`exam_active_${task.id}`, "true");
    sessionStorage.setItem(`exam_reloads_${task.id}`, "0");
    if (task.strictFullscreen) {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }
        setIsInFullscreen(true);
      } catch (err) {
        console.error("Fullscreen error", err);
      }
    }
    setStarted(true);
  };

  const reEnterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      }
      setIsInFullscreen(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!started || !task.timeLimit) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          alert("Hết giờ làm bài! Bài thi của bạn đã tự động nộp.");
          handleSubmit(answersRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, task.timeLimit]);

  // Fullscreen and Tab Switch anti-cheat detection
  useEffect(() => {
    if (!started || !task.strictFullscreen) return;

    const handleFullscreenChange = () => {
      if (ignoreAntiCheatRef.current) return;
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsInFullscreen(isFull);
      if (!isFull) {
        // Auto-submit immediately with cheated metadata, no warnings, no alerts
        alert("HỦY BÀI THI: Phát hiện hành vi rời khỏi màn hình thi! Bài thi tự động chấm 0 điểm.");
        handleSubmit({
          ...answersRef.current,
          _metadata: { cheated: true, violations: 1, autoSubmitted: true, reason: "Thoát toàn màn hình" }
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    const handleBlur = () => {
      if (ignoreAntiCheatRef.current) return;
      // Auto-submit immediately with cheated metadata, no warnings, no alerts
      alert("HỦY BÀI THI: Phát hiện hành vi chuyển tab/rời trình duyệt! Bài thi tự động chấm 0 điểm.");
      handleSubmit({
        ...answersRef.current,
        _metadata: { cheated: true, violations: 1, autoSubmitted: true, reason: "Chuyển tab hoặc rời màn hình" }
      });
    };
    window.addEventListener("blur", handleBlur);

    // Disable F11, F5, Ctrl+R, Cmd+R
    const handleKeyDown = e => {
      if (e.key === "F11" || e.keyCode === 122) {
        e.preventDefault();
        alert("Phím F11 đã bị vô hiệu hóa để bảo đảm tính trung thực của bài thi!");
      }
      if (e.key === "F5" || e.keyCode === 116) {
        e.preventDefault();
        alert("Hành vi Refresh (F5) đã bị chặn để bảo đảm tính trung thực của bài thi!");
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.keyCode === 82)) {
        e.preventDefault();
        alert("Tổ hợp phím Refresh (Ctrl+R / Cmd+R) đã bị chặn để bảo đảm tính trung thực của bài thi!");
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [started, task.strictFullscreen]);

  return createPortal(
    <div className="modal-bg" style={{ zIndex: 9999 }}>
      {/* Absolute fullscreen warning overlay */}
      {!isInFullscreen && task.strictFullscreen && started && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,30,.98)", zIndex: 999999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, color: "#EF4444", fontWeight: 700, marginBottom: 8 }}>BẮT BUỘC TOÀN MÀN HÌNH</h2>
          <p style={{ fontSize: 13, color: "var(--text3)", maxWidth: 450, marginBottom: 24, lineHeight: 1.6 }}>
            Bài thi yêu cầu chế độ toàn màn hình để chống gian lận. 
            <br />
            Vui lòng bấm nút bên dưới để quay lại chế độ toàn màn hình.
            <br />
            <span style={{ color: "#F59E0B", fontWeight: 700 }}>Số lần vi phạm tối đa: 1 lần (Hành vi thoát toàn màn hình sẽ hủy bài thi và nhận 0 điểm)</span>
          </p>
          <button 
            onClick={reEnterFullscreen} 
            style={{ padding: "10px 24px", borderRadius: 8, background: "#10B981", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Quay lại toàn màn hình
          </button>
        </div>
      )}

      <div className="modal" style={{ width: (task.strictFullscreen && started) ? 1000 : ((task.type === "video" || task.mode === "video") ? 800 : 700), maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", background: "var(--bg)", border: "1.5px solid var(--modal-bd)", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge c={(task.type === "video" || task.mode === "video") ? "purple" : "blue"}>{(task.type === "video" || task.mode === "video") ? "Video Tương tác" : (task.type === "quiz" || task.mode === "quiz" || (task.questions && task.questions.length > 0)) ? "Trắc nghiệm" : "Tự luận"}</Badge>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Đang làm bài...</div>
          </div>
          
          {started && task.timeLimit > 0 && (
            <div style={{ fontSize: 12, fontWeight: 700, color: timeLeft < 60 ? "#EF4444" : "#F59E0B", display: "flex", alignItems: "center", gap: 6, background: timeLeft < 60 ? "rgba(239,68,68,.1)" : "rgba(245,158,11,.1)", padding: "5px 12px", borderRadius: 8, border: timeLeft < 60 ? "1px solid rgba(239,68,68,.2)" : "1px solid rgba(245,158,11,.2)" }}>
              ⏳ Thời gian còn lại: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}

          {!started && <button onClick={handleCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)" }}><X size={18} /></button>}
        </div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {submitting ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--accent)" }}>Đang nộp bài...</div>
          ) : task.strictFullscreen && started ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
              <div>
                {(task.type === "video" || task.mode === "video") ? (
                  <InteractiveVideoPlayer task={task} onComplete={handleSubmit} />
                ) : (
                  <QuizPlayer task={task} onComplete={handleSubmit} answers={answers} setAnswers={setAnswers} />
                )}
              </div>
              <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 15 }}>
                <div style={{ background: "rgba(10,20,40,.95)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, position: "sticky", top: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cheatWarning ? "#EF4444" : "var(--accent)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: cheatWarning ? "#EF4444" : "#10B981", display: "inline-block", boxShadow: cheatWarning ? "0 0 10px #EF4444" : "0 0 10px #10B981" }} />
                    {cheatWarning ? "PHÁT HIỆN GIAN LẬN!" : "ĐANG GIÁM SÁT..."}
                  </div>
                  <div style={{ borderRadius: 8, overflow: "hidden", background: "#000", border: `2px solid ${cheatWarning ? "#EF4444" : "rgba(16,185,129,.5)"}`, transition: "all .3s" }}>
                    <video ref={proctorVideoRef} autoPlay playsInline muted style={{ width: "100%", height: 180, objectFit: "cover", transform: "scaleX(-1)", display: "block" }} />
                  </div>
                  
                  {cheatWarning && (
                    <div style={{ marginTop: 12, padding: 12, background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, color: "#FCA5A5", fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
                      ⚠️ {cheatWarning}
                      <div style={{ marginTop: 6, color: "#EF4444", fontSize: 11, fontWeight: 700 }}>
                        Vi phạm: {fails}/5 lần (Tự động nộp bài nếu đạt 5)
                      </div>
                    </div>
                  )}
                  
                  {!cheatWarning && (
                    <div style={{ marginTop: 12, fontSize: 11, color: "var(--text4)", textAlign: "center" }}>
                      AI đang giám sát tư thế khuôn mặt. Vui lòng nhìn thẳng và tập trung làm bài.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (task.type === "video" || task.mode === "video") ? (
            <InteractiveVideoPlayer task={task} onComplete={handleSubmit} />
          ) : (task.type === "quiz" || task.mode === "quiz" || (task.questions && task.questions.length > 0)) ? (
            !started ? (
              task.strictFullscreen ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start", padding: 20, width: "100%" }}>
                  {/* Left: exam info + start button */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
                    <div style={{ fontSize: 42 }}>📝</div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{task.title}</h2>
                    {task.desc && <p style={{ fontSize: 12, color: "var(--text3)", maxWidth: 420 }}>{task.desc}</p>}
                    
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                      <div style={{ background: "var(--wa03)", border: "1px solid var(--wa07)", padding: "7px 14px", borderRadius: 10 }}>
                        <div style={{ fontSize: 9, color: "var(--text4)" }}>MÔN HỌC</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginTop: 2 }}>{task.subject}</div>
                      </div>
                      <div style={{ background: "var(--wa03)", border: "1px solid var(--wa07)", padding: "7px 14px", borderRadius: 10 }}>
                        <div style={{ fontSize: 9, color: "var(--text4)" }}>SỐ CÂU HỎI</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{task.questions?.length || 0} câu</div>
                      </div>
                      <div style={{ background: "var(--wa03)", border: "1px solid var(--wa07)", padding: "7px 14px", borderRadius: 10 }}>
                        <div style={{ fontSize: 9, color: "var(--text4)" }}>THỜI GIAN</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{task.timeLimit ? `${task.timeLimit} phút` : "Không giới hạn"}</div>
                      </div>
                    </div>

                    {/* Step indicators */}
                    <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "4px 0" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: faceVerified ? "rgba(16,185,129,.2)" : "rgba(79,172,254,.15)", border: `2px solid ${faceVerified ? "#10B981" : "var(--accent)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: faceVerified ? "#10B981" : "var(--accent)" }}>
                          {faceVerified ? "✓" : "1"}
                        </div>
                        <div style={{ fontSize: 9, color: "var(--text4)", textAlign: "center" }}>Xác thực<br/>danh tính</div>
                      </div>
                      <div style={{ width: 30, height: 1, background: "var(--border)" }} />
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: faceVerified ? "rgba(16,185,129,.2)" : "rgba(255,255,255,.05)", border: `2px solid ${faceVerified ? "#10B981" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: faceVerified ? "#10B981" : "var(--text4)" }}>
                          {faceVerified ? "✓" : "2"}
                        </div>
                        <div style={{ fontSize: 9, color: "var(--text4)", textAlign: "center" }}>Sẵn sàng<br/>giám sát</div>
                      </div>
                      <div style={{ width: 30, height: 1, background: "var(--border)" }} />
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.05)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--text4)" }}>3</div>
                        <div style={{ fontSize: 9, color: "var(--text4)", textAlign: "center" }}>Bắt đầu<br/>làm bài</div>
                      </div>
                    </div>

                    {faceVerifyMsg && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: faceVerified ? "#10B981" : faceVerifyMsg.startsWith("⚠️") ? "#F59E0B" : faceVerifyMsg.startsWith("❌") ? "#EF4444" : "var(--text3)", background: faceVerified ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.04)", border: `1px solid ${faceVerified ? "rgba(16,185,129,.2)" : "var(--border)"}`, borderRadius: 8, padding: "8px 14px", maxWidth: 380 }}>
                        {faceVerifyMsg}
                      </div>
                    )}

                    {faceVerified && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981" }}>
                        🟢 Xác thực danh tính thành công. Sẵn sàng làm bài!
                      </div>
                    )}

                    <button 
                      onClick={handleStart}
                      disabled={!faceVerified}
                      style={{ 
                        padding: "11px 32px", fontSize: 13, fontWeight: 700,
                        background: faceVerified ? "linear-gradient(135deg,var(--accent),var(--accent2))" : "rgba(255,255,255,.04)",
                        color: faceVerified ? "#fff" : "var(--text4)",
                        border: "none", borderRadius: 10,
                        cursor: faceVerified ? "pointer" : "not-allowed",
                        transition: "all .2s", marginTop: 4
                      }}
                    >
                      🚀 Bắt đầu làm bài
                    </button>
                  </div>

                  {/* Right: identity verification panel */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Avatar photo */}
                    {studentPhoto && (
                      <div style={{ background: "rgba(10,20,40,.95)", border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", marginBottom: 8 }}>ẢNH ĐẠI DIỆN (DÙNG ĐỂ XÁC THỰC)</div>
                        <img src={studentPhoto} alt="avatar" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(79,172,254,.3)" }} />
                      </div>
                    )}

                    {/* Live camera */}
                    <div style={{ background: "rgba(10,20,40,.95)", border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
                        CAMERA TRỰC TIẾP
                      </div>
                      <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", background: "#000", border: `1px solid ${faceVerified ? "rgba(16,185,129,.5)" : "rgba(79,172,254,.3)"}` }}>
                        <video ref={verifyVideoRef} autoPlay playsInline muted style={{ width: "100%", height: 130, objectFit: "cover", transform: "scaleX(-1)", display: "block" }} />
                        {faceVerified && (
                          <div style={{ position: "absolute", inset: 0, border: "2px solid #10B981", borderRadius: 8, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ background: "rgba(16,185,129,.85)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>✓ ĐÃ XÁC THỰC</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verify button */}
                    {!faceVerified && (
                      <button
                        onClick={runFaceVerification}
                        disabled={faceVerifying || !studentPhoto}
                        style={{ padding: "10px", fontSize: 12, fontWeight: 700, background: faceVerifying ? "rgba(255,255,255,.05)" : "rgba(79,172,254,.15)", color: faceVerifying ? "var(--text4)" : "var(--accent)", border: "1px solid rgba(79,172,254,.3)", borderRadius: 10, cursor: faceVerifying ? "not-allowed" : "pointer", transition: "all .2s" }}
                      >
                        {faceVerifying ? "⏳ Đang xác thực..." : !faceApiReady ? "⏳ Đang tải mô hình AI..." : "🔍 Xác thực khuôn mặt"}
                      </button>
                    )}

                    {!studentPhoto && (
                      <div style={{ fontSize: 10, color: "#F59E0B", textAlign: "center", padding: "6px 10px", background: "rgba(245,158,11,.08)", borderRadius: 8, border: "1px solid rgba(245,158,11,.2)" }}>
                        ⚠️ Tài khoản chưa có ảnh đại diện. Giáo viên cần cập nhật ảnh học sinh trước khi thi.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
                  <div style={{ fontSize: 48 }}>📝</div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{task.title}</h2>
                  {task.desc && <p style={{ fontSize: 13, color: "var(--text3)", maxWidth: 500 }}>{task.desc}</p>}
                  
                  <div style={{ display: "flex", gap: 12, margin: "10px 0", flexWrap: "wrap", justifyContent: "center" }}>
                    <div style={{ background: "var(--wa03)", border: "1px solid var(--wa07)", padding: "10px 20px", borderRadius: 10 }}>
                      <div style={{ fontSize: 10, color: "var(--text4)" }}>MÔN HỌC</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginTop: 2 }}>{task.subject}</div>
                    </div>
                    <div style={{ background: "var(--wa03)", border: "1px solid var(--wa07)", padding: "10px 20px", borderRadius: 10 }}>
                      <div style={{ fontSize: 10, color: "var(--text4)" }}>SỐ CÂU HỎI</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{task.questions?.length || 0} câu</div>
                    </div>
                    <div style={{ background: "var(--wa03)", border: "1px solid var(--wa07)", padding: "10px 20px", borderRadius: 10 }}>
                      <div style={{ fontSize: 10, color: "var(--text4)" }}>THỜI GIAN LÀM BÀI</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{task.timeLimit ? `${task.timeLimit} phút` : "Không giới hạn"}</div>
                    </div>
                  </div>

                  <button 
                    onClick={handleStart} 
                    style={{ padding: "12px 36px", fontSize: 14, fontWeight: 700, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", transition: "all .2s", marginTop: 14 }}
                    onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
                    onMouseLeave={e => e.currentTarget.style.filter = "none"}
                  >
                    Bắt đầu làm bài
                  </button>
                </div>
              )
            ) : (
              <QuizPlayer task={task} onComplete={handleSubmit} answers={answers} setAnswers={setAnswers} />
            )
          ) : (
            <div style={{ color: "var(--text)" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{task.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>{task.desc}</p>
              {task.attachments?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", marginBottom: 10 }}>TÀI LIỆU ĐÍNH KÈM:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {task.attachments.map((f, i) => (
                      <a key={i} href={f.data} download={f.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: "var(--wa03)", color: "var(--text)", textDecoration: "none" }}>
                        <span>{FILE_ICONS[f.type]||"📁"}</span> {f.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload file tự luận */}
              <div style={{ marginBottom: 20, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10, letterSpacing: ".04em" }}>TẢI LÊN FILE BÀI LÀM TỰ LUẬN:</div>
                {studentFile ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 8, background: "var(--wa03)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{FILE_ICONS[studentFile.type] || "📁"}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{studentFile.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>Tệp bài làm tự luận sẵn sàng nộp</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setStudentFile(null)} 
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 11, fontWeight: 600 }}
                    >
                      Xóa tệp
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => studentFileInputRef.current?.click()} 
                    style={{ border: "2px dashed var(--inp-bd)", borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: "var(--wa03)", transition: "border .2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📤</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>Chọn tệp tin bài làm tự luận của bạn</div>
                    <div style={{ fontSize: 10, color: "var(--text4)" }}>Hỗ trợ các định dạng PDF, hình ảnh, tài liệu Word/Excel...</div>
                    <input 
                      ref={studentFileInputRef} 
                      type="file" 
                      onChange={handleStudentFileUpload} 
                      style={{ display: "none" }} 
                    />
                  </div>
                )}
              </div>

              <Btn 
                onClick={() => {
                  if (!studentFile) {
                    alert("Vui lòng tải tệp bài làm lên trước khi nộp!");
                    return;
                  }
                  handleSubmit({ file: studentFile });
                }} 
                variant="success" 
                style={{ width: "100%" }}
              >
                Nộp bài tập tự luận
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const Badge = ({ children, c="blue" }) => {
  const cmap = { blue: ["var(--accent)", "rgba(79,172,254,.15)"], amber: ["#F59E0B", "rgba(245,158,11,.15)"], green: ["#10B981", "rgba(16,185,129,.15)"], red: ["#EF4444", "rgba(239,68,68,.15)"], purple: ["#A78BFA", "rgba(167,139,250,.15)"] };
  const [fg, bg] = cmap[c] || cmap.blue;
  return <span style={{ padding: "3px 8px", borderRadius: 6, background: bg, color: fg, fontSize: 10, fontWeight: 700, letterSpacing: ".02em", whiteSpace: "nowrap" }}>{children}</span>;
};
