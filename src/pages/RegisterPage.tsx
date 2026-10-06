import { useState } from "react";
import { Gamepad2, Eye, EyeOff } from "lucide-react";
import { authApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.register({ name, email, password, phone });
      toast.success("OTP sent to your email!");
      navigate("/verify-otp", { state: { email } });
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1f2335] p-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#273449] bg-[#151C2C] p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#7C3AED]">
            <Gamepad2 size={32} />
          </div>
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-sm text-slate-400">Sign up for GameZone</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#273449] bg-[#1f2335] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#273449] bg-[#1f2335] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-[#273449] bg-[#1f2335] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              placeholder="+92 313 3184171"
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
                minLength={8}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}"
                title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#273449] bg-[#1f2335] px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
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
            <p className="mt-2 text-xs text-slate-400">
              At least 8 characters with uppercase, lowercase, a number, and a special character.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[#7C3AED] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#6D28D9] disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <a href="/login" className="text-[#7C3AED] hover:text-[#6D28D9]">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
