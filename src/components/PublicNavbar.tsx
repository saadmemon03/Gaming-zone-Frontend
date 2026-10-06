import { useState } from "react";
import { Gamepad2, LogOut, Menu, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../services/api";

const links = [
  { label: "Dashboard", path: "/user" },
  { label: "About Us", path: "/about" },
  { label: "Gallery", path: "/gallery" },
  { label: "Contact", path: "/contact" },
];

export default function PublicNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goTo = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const goToBookings = () => {
    navigate("/user?tab=history", { state: { tab: "history" } });
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    authApi.logout();
    toast.success("Logged out successfully");
    navigate("/login");
    setMobileMenuOpen(false);
  };

  const linkClass = (path: string, mobile = false) => {
    const active = pathname === path;
    if (mobile) {
      return `mt-1 flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium transition-all ${
        active
          ? "bg-indigo-500 text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`;
    }
    return `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 lg:px-5 ${
      active
        ? "bg-indigo-500 text-white shadow-md"
        : "text-slate-400 hover:text-white"
    }`;
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#16161e]/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => goTo("/user")}
          className="flex shrink-0 items-center gap-2 sm:gap-3"
          aria-label="GameZone dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 shadow-lg shadow-indigo-400/20 sm:h-12 sm:w-12">
            <Gamepad2 size={24} className="text-white" />
          </span>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent sm:text-2xl">
            GAME<span className="text-indigo-400">ZONE</span>
          </span>
        </button>

        <div className="hidden min-w-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex lg:gap-2">
          {links.map((link) => (
            <button
              key={link.path}
              type="button"
              aria-current={pathname === link.path ? "page" : undefined}
              onClick={() => goTo(link.path)}
              className={linkClass(link.path)}
            >
              {link.label}
            </button>
          ))}
          <button
            type="button"
            onClick={goToBookings}
            className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:text-white lg:px-5"
          >
            My Bookings
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 lg:flex"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

          <div className="relative lg:hidden">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-white/10 bg-[#24283b] p-2 shadow-2xl">
                {links.map((link) => (
                  <button
                    key={link.path}
                    type="button"
                    aria-current={pathname === link.path ? "page" : undefined}
                    onClick={() => goTo(link.path)}
                    className={linkClass(link.path, true)}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={goToBookings}
                  className="mt-1 flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
                >
                  My Bookings
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
