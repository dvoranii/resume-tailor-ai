import { Sun, HelpCircle } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex items-center justify-end gap-3 px-6 py-3 border-b border-border bg-bg-sidebar">
      <button className="text-text-muted hover:text-text-primary transition-colors">
        <Sun size={18} />
      </button>
      <button className="text-text-muted hover:text-text-primary transition-colors">
        <HelpCircle size={18} />
      </button>
      <div className="flex items-center gap-2 ml-2 cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold">
          JD
        </div>
        <span className="text-text-primary text-sm">John Doe</span>
      </div>
    </header>
  );
}
