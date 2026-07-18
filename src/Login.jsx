import React, { useEffect, useState, useRef } from 'react';
import { LogIn, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

const GOOGLE_CLIENT_ID = "109827346123-google-client-id-here.apps.googleusercontent.com"; // Thay bằng Client ID thực tế của bạn

export default function Login({ onLoginSuccess }) {
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const googleBtnRef = useRef(null);

  // Load Google Identity Services script động
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setErrorMsg("Không thể tải thư viện đăng nhập của Google. Vui lòng kiểm tra kết nối mạng.");
    };
    document.body.appendChild(script);

    return () => {
      // Dọn dẹp script khi unmount nếu cần
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Khởi tạo nút đăng nhập Google sau khi script đã load xong
  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !googleBtnRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      window.google.accounts.id.renderButton(
        googleBtnRef.current,
        { 
          theme: "filled_dark", 
          size: "large", 
          width: "320", 
          text: "signin_with", 
          shape: "pill",
          logo_alignment: "left"
        }
      );
    } catch (err) {
      console.error("Lỗi khởi tạo nút Google Login:", err);
      setErrorMsg("Khởi tạo đăng nhập thất bại. Vui lòng thử lại.");
    }
  }, [scriptLoaded]);

  // Xử lý callback token từ Google gửi về
  const handleGoogleCredentialResponse = async (response) => {
    if (!response.credential) {
      setErrorMsg("Không nhận được mã xác thực hợp lệ từ Google.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // Gửi Google ID Token lên Java Backend để xác thực & phân quyền
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken: response.credential })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Xác thực tài khoản thất bại.");
      }

      const data = await res.json();
      // data sẽ chứa { token: "...", user: { id: "...", role: "...", name: "..." } }
      
      if (data.token && data.user) {
        localStorage.setItem("eclass_jwt_token", data.token);
        onLoginSuccess(data.user); // Trả thông tin user về App.jsx
      } else {
        throw new Error("Dữ liệu trả về từ server không hợp lệ.");
      }
    } catch (err) {
      console.error("Lỗi kết nối auth backend:", err);
      setErrorMsg(err.message || "Có lỗi xảy ra khi kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#050C1A", // Dark Navy matching design system
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: "20px"
    }}>
      <div className="login-card" style={{
        background: "rgba(10, 22, 40, 0.95)",
        border: "1px solid rgba(79, 172, 254, 0.15)",
        borderRadius: "24px",
        padding: "40px 32px",
        width: "100%",
        maxWidth: "420px",
        textAlign: "center",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
        animation: "vqFadeUp 0.5s ease"
      }}>
        {/* Logo / Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 20px rgba(79, 172, 254, 0.3)"
          }}>
            <LogIn size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>S-Class P2K</h2>
          <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.45)", margin: 0 }}>
            Hệ Thống Quản Lý & Giám Sát Học Tập Toàn Diện
          </p>
        </div>

        {/* Info Notification */}
        <div style={{
          background: "rgba(79, 172, 254, 0.05)",
          border: "1px solid rgba(79, 172, 254, 0.2)",
          borderRadius: "12px",
          padding: "12px 16px",
          marginBottom: "24px",
          textAlign: "left"
        }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "#4FACFE", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
            <Sparkles size={14} />
            <span>Tự Động Nhận Diện Vai Trò</span>
          </div>
          <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", margin: 0, lineHeight: 1.4 }}>
            Hệ thống tự động phân quyền (Học sinh, Giáo viên, Phụ huynh) dựa trên Email đăng ký trong Database.
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "24px",
            color: "#FCA5A5",
            fontSize: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textAlign: "left",
            lineHeight: 1.4
          }}>
            <ShieldAlert size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading / Action Area */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60px",
          margin: "10px 0"
        }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#4FACFE", fontSize: "13px", fontWeight: 600 }}>
              <RefreshCw className="animate-spin" size={16} />
              <span>Đang kiểm tra tài khoản...</span>
            </div>
          ) : (
            <div ref={googleBtnRef} style={{ transition: "opacity 0.2s", opacity: scriptLoaded ? 1 : 0.5 }} />
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "32px", fontSize: "11px", color: "rgba(255, 255, 255, 0.3)" }}>
          Bảo mật bởi Google OAuth 2.0 & S-Class P2K Security Engine.
        </div>
      </div>
    </div>
  );
}
