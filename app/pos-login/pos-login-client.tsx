"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Coffee,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Store,
  User
} from "lucide-react";

export default function PosLoginClient({ branches, employees }: { branches: any[], employees: any[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Selected testing branch
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id?.toString() || "");

  const branchEmployees = employees.filter(e => e.branch_id.toString() === selectedBranch && e.status === 'ACTIVE');

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

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server error (${res.status}): Please restart your Next.js dev server.`);
      }

      if (!res.ok) throw new Error(data?.error || "Login failed");

      if (data.token) {
        sessionStorage.setItem("er_auth_token", data.token);
      }

      router.push(data.redirect || "/admin/pos");
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
          input:focus, select:focus { border-color: ${brandAccent} !important; box-shadow: 0 0 0 3px ${brandAccent}22; }
          .input-container:focus-within svg { color: ${brandAccent} !important; }
          
          .layout-wrapper {
            display: flex;
            flex-direction: row;
            gap: 24px;
            align-items: center;
            justify-content: center;
            width: 100%;
            max-width: 850px;
          }
          .login-card {
            width: 100%;
            max-width: 340px;
            flex-shrink: 0;
            background: ${cardBg};
            border: 1px solid ${border};
            border-radius: 16px;
            padding: 28px 24px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.05);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .info-card {
            width: 100%;
            flex: 1;
            max-width: 340px;
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 16px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            max-height: 480px;
          }
          @media (max-width: 850px) {
            .layout-wrapper {
              flex-direction: column;
              align-items: center;
            }
            .info-card { max-width: 380px; }
          }
        `}
      </style>

      <div className="layout-wrapper">
        <div className="login-card">
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: brandBlue }}></div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
            <img src="/logo-light.png" alt="ER COFFEELAB" style={{ height: 38, width: "auto", marginBottom: 8 }} />
            <p style={{ color: textMuted, fontSize: 12, fontWeight: 600, textAlign: "center" }}>
              Staff & POS Portal
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {error && (
              <div style={{ padding: "10px", fontSize: "13px", color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", textAlign: "center", fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: textDark, marginLeft: 2 }}>Alamat Email Pegawai</label>
              <div className="input-container" style={{ position: "relative" }}>
                <Mail size={16} color={textMuted} style={{ position: "absolute", left: 12, top: 12, transition: "color 0.2s" }} />
                <input
                  type="email"
                  placeholder="kasir@ercoffeelab.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    borderRadius: 8,
                    border: "1px solid " + border,
                    background: "#fff",
                    color: textDark,
                    fontSize: 13,
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
                <a href="#" className="no-underline hover:no-underline" style={{ fontSize: 11, fontWeight: 700, color: brandAccent, textDecoration: "none" }}>Lupa sandi?</a>
              </div>
              <div className="input-container" style={{ position: "relative" }}>
                <Lock size={16} color={textMuted} style={{ position: "absolute", left: 12, top: 12, transition: "color 0.2s" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 36px",
                    borderRadius: 8,
                    border: "1px solid " + border,
                    background: "#fff",
                    color: textDark,
                    fontSize: 13,
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
                    right: 12,
                    top: 12,
                    background: "none",
                    border: "none",
                    color: textMuted,
                    cursor: "pointer",
                    padding: 0,
                    display: "flex"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: brandBlue,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
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
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : (
                <>
                  <LogIn size={16} />
                  Masuk ke POS
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid " + border }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: textMuted, marginBottom: 8 }}>
              Sistem Internal Terenkripsi &bull; Akses Terbatas
            </p>
            <Link href="/login" className="no-underline hover:no-underline" style={{ fontSize: 12, fontWeight: 700, color: textMuted, textDecoration: "none", display: "inline-block" }}>
              &larr; Kembali ke Admin Portal
            </Link>
          </div>
        </div>

        {/* INFO CARD (TESTING CREDENTIALS) */}
        <div className="info-card">
          <p style={{ fontSize: 12, fontWeight: 800, color: brandAccent, marginBottom: 12, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>🧪</span> DAFTAR AKSES STAFF
          </p>
          <p style={{ fontSize: 11, color: textMuted, marginBottom: 16, lineHeight: 1.5 }}>
            Pilih cabang untuk melihat akun pegawai yang memiliki akses login.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 11, color: textDark, flex: 1, overflow: "hidden" }}>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 12, borderRadius: 8, display: "flex", flexDirection: "column", height: "100%" }}>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: textDark }}>Pilih Cabang</label>
                <div style={{ position: "relative" }}>
                  <Store size={16} color={brandBlue} style={{ position: "absolute", left: 12, top: 11 }} />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 32px",
                      borderRadius: 6,
                      border: "1px solid " + border,
                      background: "#f8fafc",
                      color: textDark,
                      fontSize: 12,
                      fontWeight: 700,
                      outline: "none",
                      cursor: "pointer",
                      appearance: "none"
                    }}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div style={{ position: "absolute", right: 12, top: 14, pointerEvents: "none" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <div style={{ overflowY: "auto", flex: 1, paddingRight: 4, maxHeight: "180px" }}>
                {branchEmployees.length === 0 ? (
                  <div style={{ padding: 16, textAlign: "center", color: textMuted, fontSize: 11, fontStyle: "italic", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
                    Tidak ada pegawai dengan akses login di cabang ini.
                  </div>
                ) : (
                  <>
                    <span style={{ fontWeight: 800, color: brandBlue, display: "block", marginBottom: 6, fontSize: 12 }}>Daftar Kasir / Barista</span>
                    <p style={{ fontSize: 10, color: textMuted, marginBottom: 8, fontStyle: "italic", lineHeight: 1.4 }}>
                      <strong style={{ color: brandBlue }}>Password: kasir123</strong>
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {branchEmployees.map((emp, idx) => (
                        <div key={emp.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: idx === branchEmployees.length - 1 ? "none" : "1px dashed #e2e8f0", paddingBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: textDark }}>{emp.name}</span>
                          <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: brandBlue }}>
                            {emp.email || "Belum ada email"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
