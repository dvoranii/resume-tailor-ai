import { GripVertical, Trash2 } from "lucide-react";

interface BulletRowProps {
  content: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  placeholder?: string;
}

export default function BulletRow({
  content,
  onChange,
  onDelete,
  placeholder,
}: BulletRowProps) {
  return (
    <div className="flex items-start gap-2">
      <GripVertical size={15} className="text-text-muted mt-2.5 shrink-0" />
      <span className="text-text-muted mt-2 shrink-0 text-sm">•</span>
      <input
        type="text"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          placeholder ?? "Describe an achievement or responsibility..."
        }
        className="flex-1 bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
      />
      <button
        onClick={onDelete}
        className="text-text-muted hover:text-red-400 transition-colors mt-2"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
