import { Hash } from "lucide-react";

const PROXY = (import.meta.env.VITE_API_URL || "https://seahorse-app-47666.ondigitalocean.app") + "/api/proxy/image";

interface ChatPhotoProps {
  photoUrl?: string | null;
  title?: string;
  size?: "sm" | "md" | "lg";
}

export function ChatPhoto({ photoUrl, title = "", size = "md" }: ChatPhotoProps) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  const s = sizes[size];

  if (photoUrl) {
    return (
      <img
        src={`${PROXY}?url=${encodeURIComponent(photoUrl)}`}
        alt={title}
        className={`${s} rounded-lg object-cover shrink-0`}
        onError={(e: any) => {
          e.target.style.display = "none";
          if (e.target.nextElementSibling) {
            e.target.nextElementSibling.style.display = "flex";
          }
        }}
      />
    );
  }

  return (
    <div className={`${s} rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0`}>
      <Hash className={size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4"} />
    </div>
  );
}
