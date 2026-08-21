export default function DiffColumnHeaders() {
  return (
    <div className="grid grid-cols-2 gap-4 mb-1">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
        Original
      </span>
      <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">
        Tailored
      </span>
    </div>
  );
}
