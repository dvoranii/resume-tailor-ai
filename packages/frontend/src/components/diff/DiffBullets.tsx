export default function DiffBullets({
  original,
  tailored,
}: {
  original: string[];
  tailored: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ul className="flex flex-col gap-1">
        {original.map((b, i) => (
          <li
            key={i}
            className={`text-xs leading-relaxed px-2 py-1 rounded ${
              b !== tailored[i]
                ? "bg-red-950/40 text-red-300"
                : "text-text-muted"
            }`}
          >
            {b || <span className="opacity-40 italic">empty</span>}
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-1">
        {tailored.map((b, i) => (
          <li
            key={i}
            className={`text-xs leading-relaxed px-2 py-1 rounded ${
              b !== original[i]
                ? "bg-green-950/40 text-green-300"
                : "text-text-muted"
            }`}
          >
            {b || <span className="opacity-40 italic">empty</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
