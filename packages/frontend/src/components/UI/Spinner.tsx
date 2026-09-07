export default function Spinner({
  size = "md",
  color = "accent",
}: {
  size?: "sm" | "md" | "lg";
  color?: "accent" | "white" | "muted";
}) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const colorClasses = {
    accent: "border-accent",
    white: "border-white",
    muted: "border-text-muted",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full border-t-transparent animate-spin`}
    />
  );
}
