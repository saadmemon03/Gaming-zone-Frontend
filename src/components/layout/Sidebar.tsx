import {
  LayoutDashboard,
  Monitor,
  Gamepad2,
  CalendarCheck,
  Users,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    name: "Gaming Stations",
    icon: Monitor,
    path: "/stations",
  },
  {
    name: "Games",
    icon: Gamepad2,
    path: "/games",
  },
  {
    name: "Bookings",
    icon: CalendarCheck,
    path: "/bookings",
  },
  {
    name: "Customers",
    icon: Users,
    path: "/customers",
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64
          border-r border-[#273449]
          bg-[#0B0F19]
          transition-transform duration-300
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-[#273449] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7C3AED]">
              <Gamepad2 size={20} />
            </div>

            <div>
              <h1 className="text-sm font-bold text-white">
                GameZone
              </h1>
              <p className="text-xs text-slate-500">
                Admin Panel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.path}
                href={item.path}
                onClick={onClose}
                className="
                  flex items-center gap-3 rounded-lg
                  px-3 py-2.5
                  text-sm font-medium
                  text-slate-400
                  transition
                  hover:bg-[#151C2C]
                  hover:text-white
                "
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 w-full border-t border-[#273449] p-4">
          <button
            onClick={() => {
              localStorage.removeItem("gaming_token");
              window.location.href = "/login";
            }}
            className="
              flex w-full items-center gap-3 rounded-lg
              px-3 py-2.5 text-sm
              text-slate-400
              hover:bg-red-500/10 hover:text-red-400
            "
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}