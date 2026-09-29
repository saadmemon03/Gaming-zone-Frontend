import { useState } from "react";
import { Gamepad2, Eye, EyeOff } from "lucide-react";
import { authApi } from "../services/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.login(email, password);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#273449] bg-[#151C2C] p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#7C3AED]">
            <Gamepad2 size={32} />
          </div>
          <h1 className="text-2xl font-bold">GameZone Admin</h1>
          <p className="text-sm text-slate-400">Sign in to manage your system</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#273449] bg-[#0B0F19] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              placeholder="saadblogger53@gmail.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#273449] bg-[#0B0F19] px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="mt-2 text-right">
              <a href="/forgot-password" className="text-sm text-[#7C3AED] hover:text-[#6D28D9]">
                Forgot Password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#7C3AED] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#6D28D9] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
