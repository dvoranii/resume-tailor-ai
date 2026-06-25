import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Download,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Resume Builder", icon: FileText, path: "/resume" },
  { label: "Jobs", icon: Briefcase, path: "/jobs" },
  { label: "Exports", icon: Download, path: "/exports" },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-56 h-full bg-bg-sidebar border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
          <FileText size={15} className="text-white" />
        </div>
        <span className="text-text-primary font-semibold text-sm tracking-wide">
          ResumeAI
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-surface"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 py-4 border-t border-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-accent text-white"
                : "text-text-muted hover:text-text-primary hover:bg-bg-surface"
            }`
          }
        >
          <Settings size={17} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
