"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Coffee, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck,
  Store,
  Unlock
} from "lucide-react";

export default function LoginPage() {
  const [loginType, setLoginType] = useState<"SUPERADMIN" | "OUTLET">("SUPERADMIN");
  
  // Super Admin state
  const [email, setEmail] = useState("superadmin@ercoffeelab.id");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  
  // Admin Outlet state
  const [branchId, setBranchId] = useState("1");
  const [pin, setPin] = useState("1234");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  /* ── palette ── */
  const P = "#1a1e4b";
  const A = "#6c72cb";
  const G = "#22c55e";
  
  const bg = "#0d0f1a";
  const bg2 = "#151729";
  const bg3 = "#1c1f3a";
  const tx = "#e8e9f0";
  const tx2 = "#8b8fa8";
  const brd = "#2a2d4a";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (loginType === "SUPERADMIN") {
        if (!email || !password) return;
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        router.push(data.redirect || "/admin/dashboard");
      } else {
        if (!branchId || !pin) return;
        const res = await fetch("/api/auth/pos-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ branchId: Number(branchId), pin }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "POS Login failed");

        router.push(data.redirect || "/pos");
      }
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
      color: tx, 
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; }
          button:hover { filter: brightness(1.1); }
          input:focus { border-color: ${A} !important; box-shadow: 0 0 0 3px ${A}33; }
          .input-container:focus-within svg { color: ${A} !important; }
        `}
      </style>

      <div style={{ 
        width: "100%", 
        maxWidth: 360, 
        background: bg2, 
        border: "1px solid " + brd, 
        borderRadius: 16, 
        padding: "32px 24px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: loginType === "SUPERADMIN" ? P : G }}></div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <img src="/logo-dark.png" alt="ER COFFEELAB" style={{ height: 40, width: "auto", marginBottom: 16 }} />
          
          <div style={{ display: "flex", gap: 10, marginTop: 16, background: bg3, padding: 4, borderRadius: 8, width: "100%" }}>
            <button 
              type="button"
              onClick={() => {
                setLoginType("SUPERADMIN");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 6,
                border: "none",
                background: loginType === "SUPERADMIN" ? P : "transparent",
                color: loginType === "SUPERADMIN" ? "#fff" : tx2,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Super Admin
            </button>
            <button 
              type="button"
              onClick={() => {
                setLoginType("OUTLET");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 6,
                border: "none",
                background: loginType === "OUTLET" ? G : "transparent",
                color: loginType === "OUTLET" ? "#fff" : tx2,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Admin Outlet
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          
          {error && (
            <div style={{ padding: "10px", fontSize: "13px", color: "#f87171", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.2)", borderRadius: "6px", textAlign: "center" }}>
              {error}
            </div>
          )}

          {loginType === "SUPERADMIN" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: tx2, marginLeft: 2 }}>Alamat Email</label>
                <div className="input-container" style={{ position: "relative" }}>
                  <Mail size={16} color={tx2} style={{ position: "absolute", left: 12, top: 11, transition: "color 0.2s" }} />
                  <input 
                    type="email" 
                    placeholder="admin@ercoffeelab.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "10px 14px 10px 38px", 
                      borderRadius: 8, 
                      border: "1px solid " + brd, 
                      background: bg3, 
                      color: tx, 
                      fontSize: 13, 
                      outline: "none",
                      transition: "all 0.2s"
                    }} 
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: tx2, marginLeft: 2 }}>Kata Sandi</label>
                  <a href="#" style={{ fontSize: 11, fontWeight: 600, color: A, textDecoration: "none" }}>Lupa sandi?</a>
                </div>
                <div className="input-container" style={{ position: "relative" }}>
                  <Lock size={16} color={tx2} style={{ position: "absolute", left: 12, top: 11, transition: "color 0.2s" }} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "10px 38px 10px 38px", 
                      borderRadius: 8, 
                      border: "1px solid " + brd, 
                      background: bg3, 
                      color: tx, 
                      fontSize: 13, 
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
                      top: 11, 
                      background: "none", 
                      border: "none", 
                      color: tx2, 
                      cursor: "pointer",
                      padding: 0,
                      display: "flex"
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, marginBottom: 4 }}>
                <input type="checkbox" id="remember" style={{ accentColor: P, width: 14, height: 14, cursor: "pointer" }} />
                <label htmlFor="remember" style={{ fontSize: 12, color: tx2, cursor: "pointer", userSelect: "none" }}>
                  Ingat saya di perangkat ini
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  borderRadius: 8, 
                  border: "none", 
                  background: P, 
                  color: "#fff", 
                  fontWeight: 700, 
                  fontSize: 13, 
                  cursor: isLoading ? "not-allowed" : "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: 8,
                  marginTop: 4,
                  opacity: isLoading ? 0.8 : 1,
                  transition: "all 0.2s"
                }}
              >
                {isLoading ? (
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }}>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : (
                  <>
                    <LogIn size={16} />
                    Masuk ke Dasbor
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: tx2, marginLeft: 2 }}>ID Cabang</label>
                <div className="input-container" style={{ position: "relative" }}>
                  <Store size={16} color={tx2} style={{ position: "absolute", left: 12, top: 11, transition: "color 0.2s" }} />
                  <input 
                    type="number" 
                    placeholder="Contoh: 1"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "10px 14px 10px 38px", 
                      borderRadius: 8, 
                      border: "1px solid " + brd, 
                      background: bg3, 
                      color: tx, 
                      fontSize: 13, 
                      fontWeight: 600,
                      outline: "none",
                      transition: "all 0.2s"
                    }} 
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: tx2, marginLeft: 2 }}>PIN Kasir (4-6 digit)</label>
                <div className="input-container" style={{ position: "relative" }}>
                  <Lock size={16} color={tx2} style={{ position: "absolute", left: 12, top: 11, transition: "color 0.2s" }} />
                  <input 
                    type="password" 
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "10px 14px 10px 38px", 
                      borderRadius: 8, 
                      border: "1px solid " + brd, 
                      background: bg3, 
                      color: tx, 
                      fontSize: 16,
                      letterSpacing: 4, 
                      fontWeight: 800,
                      outline: "none",
                      transition: "all 0.2s"
                    }} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || pin.length < 4}
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  borderRadius: 8, 
                  border: "none", 
                  background: (pin.length >= 4) ? G : bg3, 
                  color: (pin.length >= 4) ? "#fff" : tx2, 
                  fontWeight: 700, 
                  fontSize: 13, 
                  cursor: (pin.length >= 4 && !isLoading) ? "pointer" : "not-allowed", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: 8,
                  marginTop: 8,
                  opacity: isLoading ? 0.8 : 1,
                  transition: "all 0.2s"
                }}
              >
                {isLoading ? (
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }}>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : (
                  <>
                    <Unlock size={16} />
                    Buka POS Terminal
                  </>
                )}
              </button>
            </>
          )}

        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 11, color: tx2 }}>
            Sistem Internal Terenkripsi &bull; Akses Terbatas
          </p>
        </div>
      </div>
    </div>
  );
}
