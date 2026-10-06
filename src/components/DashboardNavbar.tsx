import { useState } from "react";
import { Gamepad2, LogOut, MoreVertical, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardNavbarProps {
  isLoggedIn: boolean;
  activeTab: "book" | "history" | "profile";
  onSelectTab: (tab: "book" | "history") => void;
  onLogout: () => void;
  onLogin: () => void;
}

export default function DashboardNavbar({
  isLoggedIn,
  activeTab,
  onSelectTab,
  onLogout,
  onLogin,
}: DashboardNavbarProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectTab = (tab: "book" | "history") => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#16161e]/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => selectTab("book")}
          className="flex items-center gap-3"
          aria-label="GameZone dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 shadow-lg shadow-indigo-400/20 sm:h-12 sm:w-12">
            <Gamepad2 size={24} className="text-white" />
          </span>
          <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
            GAME<span className="text-indigo-400">ZONE</span>
          </span>
        </button>

        <div className="flex items-center justify-end gap-2 md:gap-6">
          <div className="hidden rounded-full border border-white/10 bg-white/5 p-1 md:flex">
            <button
              type="button"
              onClick={() => selectTab("book")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 ${
                activeTab === "book"
                  ? "bg-indigo-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="rounded-full px-6 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:text-white"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => navigate("/gallery")}
              className="rounded-full px-6 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:text-white"
            >
              Gallery
            </button>
            <button
              type="button"
              onClick={() => navigate("/contact")}
              className="rounded-full px-6 py-2 text-sm font-medium text-slate-400 transition-all duration-300 hover:text-white"
            >
              Contact
            </button>
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => selectTab("history")}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 ${
                  activeTab === "history"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                My Bookings
              </button>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-400"
              >
                <User size={18} />
                <span className="whitespace-nowrap">Login / Register</span>
              </button>
            )}
          </div>

          <div className="relative md:hidden">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <MoreVertical size={20} />
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-white/10 bg-[#24283b] p-2 shadow-2xl">
                <button
                  type="button"
                  onClick={() => selectTab("book")}
                  className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                    activeTab === "book"
                      ? "bg-indigo-500 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  Dashboard
                </button>
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => selectTab("history")}
                    className={`mt-1 w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                      activeTab === "history"
                        ? "bg-indigo-500 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    My Bookings
                  </button>
                )}
                {[
                  { label: "About Us", path: "/about" },
                  { label: "Gallery", path: "/gallery" },
                  { label: "Contact", path: "/contact" },
                ].map((link) => (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => {
                      navigate(link.path);
                      setMobileMenuOpen(false);
                    }}
                    className="mt-1 w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="my-1 border-t border-white/10" />
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onLogin();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-indigo-400 transition-all hover:bg-indigo-500/10"
                  >
                    <User size={16} />
                    Login
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
