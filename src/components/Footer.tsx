import { Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FooterProps {
  variant?: "public" | "dashboard";
  contactDetails?: {
    email: string;
    phone: string;
    address: string;
  };
  onBookStation?: () => void;
  onMyBookings?: () => void;
}

const defaultContactDetails = {
  email: "saadblogger53@gmail.com",
  phone: "+92 313 3184171",
  address: "Hyderabad City, Pakistan",
};

export default function Footer({
  variant = "public",
  contactDetails = defaultContactDetails,
  onBookStation,
  onMyBookings,
}: FooterProps) {
  const navigate = useNavigate();
  const isDashboard = variant === "dashboard";

  return (
    <footer
      className={`relative z-10 mt-auto border-t border-white/10 pb-8 backdrop-blur-sm ${
        isDashboard
          ? "bg-[#16161e]/90 pt-10 sm:pt-12"
          : "bg-[#16161e] pt-12"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 shadow-lg shadow-indigo-400/20">
                <Gamepad2 size={20} className="text-white" />
              </div>
              <h2 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-xl font-black tracking-tight text-transparent">
                GAME<span className="text-indigo-400">ZONE</span>
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              The ultimate destination for premium gaming. High-end rigs,
              comfortable environment, and endless entertainment.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={onBookStation ?? (() => navigate("/user"))}
                  className="transition-colors hover:text-indigo-300"
                >
                  Book a Station
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={
                    onMyBookings ??
                    (() =>
                      navigate("/user?tab=history", {
                        state: { tab: "history" },
                      }))
                  }
                  className="transition-colors hover:text-indigo-300"
                >
                  My Bookings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/about")}
                  className="transition-colors hover:text-indigo-300"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/contact")}
                  className="transition-colors hover:text-indigo-300"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-white">Contact Us</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>{contactDetails.email}</li>
              <li>{contactDetails.phone}</li>
              <li>{contactDetails.address}</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-white">Follow Us</h4>
            <div className="flex gap-4 font-bold text-slate-400">
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 transition-all hover:bg-indigo-500 hover:text-white">
                f
              </div>
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 transition-all hover:bg-indigo-500 hover:text-white">
                X
              </div>
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 transition-all hover:bg-indigo-500 hover:text-white">
                ig
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-center text-sm text-slate-500 md:flex-row">
          <p>&copy; {new Date().getFullYear()} GameZone. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="cursor-pointer transition-colors hover:text-indigo-300">
              Privacy Policy
            </span>
            <span className="cursor-pointer transition-colors hover:text-indigo-300">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
