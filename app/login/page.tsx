"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Coffee, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  /* ── Light Palette ── */
  const brandBlue = "#1a1e4b";
  const brandAccent = "#6c72cb";
  const bg = "#f5f6fa";
  const cardBg = "#ffffff";
  const textDark = "#1e293b";
  const textMuted = "#64748b";
  const border = "#e2e8f0";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email || !password) return;
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push(data.redirect || "/admin/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh", 
      background: bg, 
      fontFamily: "'Source Sans 3', system-ui, sans-serif", 
      color: textDark, 
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; }
          button:hover { filter: brightness(1.1); }
          input:focus { border-color: ${brandAccent} !important; box-shadow: 0 0 0 3px ${brandAccent}22; }
          .input-container:focus-within svg { color: ${brandAccent} !important; }
          
          .layout-wrapper {
            display: flex;
            flex-direction: row;
            gap: 24px;
            align-items: stretch;
            justify-content: center;
            width: 100%;
            max-width: 800px;
          }
          .login-card {
            width: 100%;
            max-width: 380px;
            flex-shrink: 0;
            background: ${cardBg};
            border: 1px solid ${border};
            border-radius: 16px;
            padding: 40px 32px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.05);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .info-card {
            width: 100%;
            max-width: 380px;
            flex-shrink: 0;
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 16px;
            padding: 32px;
            display: flex;
            flex-direction: column;
          }
          @media (max-width: 850px) {
            .layout-wrapper {
              flex-direction: column;
              align-items: center;
            }
          }
        `}
      </style>

      <div className="layout-wrapper">
        <div className="login-card">
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: brandBlue }}></div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <img src="/logo-light.png" alt="ER COFFEELAB" style={{ height: 44, width: "auto", marginBottom: 12 }} />
          <p style={{ color: textMuted, fontSize: 13, fontWeight: 600, textAlign: "center" }}>
            Admin & Management Portal
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {error && (
            <div style={{ padding: "10px", fontSize: "13px", color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", textAlign: "center", fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: textDark, marginLeft: 2 }}>Alamat Email</label>
            <div className="input-container" style={{ position: "relative" }}>
              <Mail size={18} color={textMuted} style={{ position: "absolute", left: 14, top: 12, transition: "color 0.2s" }} />
              <input 
                type="email" 
                placeholder="admin@ercoffeelab.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  width: "100%", 
                  padding: "12px 14px 12px 42px", 
                  borderRadius: 10, 
                  border: "1px solid " + border, 
                  background: "#fff", 
                  color: textDark, 
                  fontSize: 14, 
                  fontWeight: 600,
                  outline: "none",
                  transition: "all 0.2s"
                }} 
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: textDark, marginLeft: 2 }}>Kata Sandi</label>
              <a href="#" style={{ fontSize: 11, fontWeight: 700, color: brandAccent, textDecoration: "none" }}>Lupa sandi?</a>
            </div>
            <div className="input-container" style={{ position: "relative" }}>
              <Lock size={18} color={textMuted} style={{ position: "absolute", left: 14, top: 12, transition: "color 0.2s" }} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  width: "100%", 
                  padding: "12px 42px 12px 42px", 
                  borderRadius: 10, 
                  border: "1px solid " + border, 
                  background: "#fff", 
                  color: textDark, 
                  fontSize: 14, 
                  fontWeight: 600,
                  outline: "none",
                  transition: "all 0.2s"
                }} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: "absolute", 
                  right: 14, 
                  top: 12, 
                  background: "none", 
                  border: "none", 
                  color: textMuted, 
                  cursor: "pointer",
                  padding: 0,
                  display: "flex"
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 8 }}>
            <input type="checkbox" id="remember" style={{ accentColor: brandBlue, width: 16, height: 16, cursor: "pointer", borderRadius: 4 }} />
            <label htmlFor="remember" style={{ fontSize: 13, fontWeight: 600, color: textMuted, cursor: "pointer", userSelect: "none" }}>
              Ingat saya di perangkat ini
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: "100%", 
              padding: "14px", 
              borderRadius: 10, 
              border: "none", 
              background: brandBlue, 
              color: "#fff", 
              fontWeight: 700, 
              fontSize: 14, 
              cursor: isLoading ? "not-allowed" : "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 8,
              marginTop: 4,
              opacity: isLoading ? 0.9 : 1,
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(26, 30, 75, 0.2)"
            }}
          >
            {isLoading ? (
              <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <>
                <LogIn size={18} />
                Masuk ke Dasbor
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 32, paddingTop: 20, borderTop: "1px solid " + border }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: textMuted }}>
            Sistem Internal Terenkripsi &bull; Akses Terbatas
          </p>
        </div>
        </div>

        {/* INFO CARD (TESTING CREDENTIALS) */}
        <div className="info-card">
          <p style={{ fontSize: 13, fontWeight: 800, color: brandAccent, marginBottom: 16, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>🧪</span> TESTING CREDENTIALS
          </p>
          <p style={{ fontSize: 12, color: textMuted, marginBottom: 20, lineHeight: 1.5 }}>
            Berikut adalah akses login untuk proses testing sistem ER Coffeelab. Gunakan kredensial di bawah ini:
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 12, color: textDark }}>
            
            {/* SUPER ADMIN */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 12, borderRadius: 8 }}>
              <span style={{ fontWeight: 800, color: brandBlue, display: "block", marginBottom: 8, fontSize: 13 }}>Super Admin (Semua Cabang)</span>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 4, alignItems: "center" }}>
                <span style={{ color: textMuted, fontWeight: 600 }}>Email</span>
                <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: brandBlue, justifySelf: "start" }}>superadmin@ercoffeelab.id</span>
                
                <span style={{ color: textMuted, fontWeight: 600 }}>Password</span>
                <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: brandBlue, justifySelf: "start" }}>admin123</span>
              </div>
            </div>

            {/* ADMIN OUTLET (STORE ADMIN) */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 12, borderRadius: 8 }}>
              <span style={{ fontWeight: 800, color: brandBlue, display: "block", marginBottom: 8, fontSize: 13 }}>Admin Outlet (Per Cabang)</span>
              <p style={{ fontSize: 11, color: textMuted, marginBottom: 8, fontStyle: "italic" }}>Password untuk semua admin outlet: <strong style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "1px 4px", borderRadius: 4, color: brandBlue }}>login123</strong></p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e2e8f0", paddingBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: textDark }}>Cabang CBD Jakarta</span>
                  <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: brandBlue }}>cbd@ercoffeelab.id</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e2e8f0", paddingBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: textDark }}>Cabang Grand Indonesia</span>
                  <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: brandBlue }}>gi@ercoffeelab.id</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e2e8f0", paddingBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: textDark }}>Cabang Kemang</span>
                  <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: brandBlue }}>kemang@ercoffeelab.id</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e2e8f0", paddingBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: textDark }}>Cabang BSD</span>
                  <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: brandBlue }}>bsd@ercoffeelab.id</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, color: textDark }}>Cabang Bandung</span>
                  <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: brandBlue }}>bandung@ercoffeelab.id</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

