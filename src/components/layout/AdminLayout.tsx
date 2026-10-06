import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen min-w-0 bg-[#1f2335] text-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/10 bg-[#16161e] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            className="-m-2.5 p-2.5 text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-white">
            Admin Panel
          </div>
        </div>
        <main className="min-w-0 p-3 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}