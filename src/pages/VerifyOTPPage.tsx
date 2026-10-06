import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { authApi } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

export default function VerifyOTPPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from navigation state if available, else empty
  const initialEmail = location.state?.email || "";
  
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown === 0) return;
    const timer = window.setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.verifyEmail(email, otp);
      toast.success("Account verified successfully! You can now login.");
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your email address to resend the verification code.");
      return;
    }

    setResendLoading(true);
    try {
      const response = await authApi.resendVerificationOtp(normalizedEmail);
      setEmail(normalizedEmail);
      setOtp("");
      setResendCooldown(30);
      toast.success(response.message);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1f2335] p-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#273449] bg-[#151C2C] p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#7C3AED]">
            <MailCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="text-sm text-slate-400 mt-2 text-center">
            Enter the 6-digit verification code sent to your email. It expires in 10 minutes.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
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
              6-Digit OTP
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only allow numbers
              className="w-full rounded-lg border border-[#273449] bg-[#1f2335] px-4 py-3 text-center tracking-[0.5em] text-xl font-mono text-white placeholder-slate-500 outline-none transition focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full rounded-lg bg-[#7C3AED] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#6D28D9] disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify Account"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || resendLoading || resendCooldown > 0}
            className="w-full rounded-lg border border-[#7C3AED]/50 px-4 py-3 text-sm font-medium text-violet-200 transition hover:bg-[#7C3AED]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resendLoading
              ? "Sending new code..."
              : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
