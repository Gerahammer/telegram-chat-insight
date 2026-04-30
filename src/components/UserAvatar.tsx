// Consistent color avatar for users — same color every time for same name

const COLORS = [
  "bg-red-500",
  "bg-orange-500", 
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name: string): string {
  return COLORS[hashName(name) % COLORS.length];
}

interface UserAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ name, size = "md", className = "" }: UserAvatarProps) {
  const color = getColor(name || "?");
  const initials = getInitials(name || "?");
  
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${color} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}

// For a group of avatars (like showing multiple senders)
interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: "sm" | "md";
}

export function AvatarGroup({ names, max = 3, size = "sm" }: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const extra = names.length - max;

  return (
    <div className="flex -space-x-1.5">
      {shown.map((name, i) => (
        <UserAvatar key={i} name={name} size={size} className="ring-2 ring-background" />
      ))}
      {extra > 0 && (
        <div className={`${size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-xs"} bg-muted rounded-full flex items-center justify-center font-semibold text-muted-foreground ring-2 ring-background shrink-0`}>
          +{extra}
        </div>
      )}
    </div>
  );
}
