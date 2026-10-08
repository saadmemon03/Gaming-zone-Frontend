import { useState, useEffect } from "react";
import { Gamepad2, Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

// ---------- Validation helpers ----------
const EMAIL_FORMAT = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

const validateEmail = (value: string): string => {
  if (!value) return "Email is required";
  const trimmed = value.trim().toLowerCase();
  if ((trimmed.match(/@/g) || []).length !== 1) return "Email must contain exactly one @";
  if (trimmed.includes("..")) return "Email cannot contain consecutive dots";
  if (!EMAIL_FORMAT.test(trimmed)) return "Enter a valid email address (e.g. user@example.com)";
  return "";
};

const validatePassword = (value: string): string => {
  if (!value) return "Password is required";
  return "";
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminLogin = location.pathname === "/admin/login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("gaming_token");
    const role = localStorage.getItem("gaming_user_role")?.toLowerCase();
    if (token) {
      if (role === "admin" || role === "manager" || role === "staff") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/user", { replace: true });
      }
    }
  }, [navigate]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) setEmailError(validateEmail(val));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (passwordError) setPasswordError(validatePassword(val));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return; // validation fail → API call nahi hogi

    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res.user.role === "admin" || res.user.role === "manager" || res.user.role === "staff") {
        navigate("/admin");
      } else if (adminLogin) {
        authApi.logout();
        setError("This account does not have admin access.");
      } else {
        navigate("/user");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to login";

      if (message.toLowerCase().includes("verify") || message.toLowerCase().includes("otp")) {
        navigate("/verify-otp", { state: { email } });
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border bg-[#0f172a]/70 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2";
  const inputOk = "border-white/10 focus:border-violet-400 focus:ring-violet-500/40";
  const inputBad = "border-red-500/60 focus:border-red-400 focus:ring-red-500/40";

  return (
    <div className="gaming-shell flex min-h-screen items-center justify-center p-4 text-white">
      <div className="gaming-orb gaming-orb-left" />
      <div className="gaming-orb gaming-orb-right" />

      <div className="gaming-panel w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-pink-500 shadow-[0_0_30px_rgba(124,58,237,0.5)]">
            <Gamepad2 size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">GameZone</h1>
          <p className="mt-2 text-sm text-slate-300">
            {adminLogin ? "Admin sign in" : "Sign in to continue your next match"}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} noValidate className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => setEmailError(validateEmail(email))}
              maxLength={254}
              autoComplete="email"
              className={`${inputBase} ${emailError ? inputBad : inputOk}`}
              placeholder="you@gmail.com"
            />
            {emailError && <p className="mt-1.5 text-xs text-red-300">{emailError}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => setPasswordError(validatePassword(password))}
                autoComplete="current-password"
                className={`${inputBase} pr-12 ${passwordError ? inputBad : inputOk}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError && <p className="mt-1.5 text-xs text-red-300">{passwordError}</p>}
            <div className="mt-2 text-right">
              <a href="/forgot-password" className="text-sm font-medium text-violet-300 transition hover:text-violet-200">
                Forgot Password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {!adminLogin && (
          <div className="mt-6 text-center text-sm text-slate-400">
            New player?{" "}
            <a href="/register" className="font-semibold text-violet-300 transition hover:text-violet-200">
              Create Account
            </a>
          </div>
        )}
      </div>
    </div>
  );
}