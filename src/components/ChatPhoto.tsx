import { useState } from "react";
import { Hash } from "lucide-react";

// `??` (not `||`) so an explicit empty string (same-origin / single ingress) is kept
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const LEGACY_PROXY = API_BASE + "/api/proxy/image";

interface ChatPhotoProps {
  photoUrl?: string | null;
  title?: string;
  size?: "sm" | "md" | "lg";
}

function resolvePhotoSrc(photoUrl: string): string {
  // New format: backend returns a relative URL like "/api/proxy/chat-photo/clxxx".
  if (photoUrl.startsWith("/")) return API_BASE + photoUrl;
  // Backward-compat: server might return a Telegram file_id or a full https:// URL
  // (older deploys). Pipe through the legacy /image proxy.
  const param = photoUrl.startsWith("https://")
    ? `url=${encodeURIComponent(photoUrl)}`
    : `fileId=${encodeURIComponent(photoUrl)}`;
  return `${LEGACY_PROXY}?${param}`;
}

export function ChatPhoto({ photoUrl, title = "", size = "md" }: ChatPhotoProps) {
  const [failed, setFailed] = useState(false);
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" };
  const s = sizes[size];
  const iconSize = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4";

  if (photoUrl && !failed) {
    return (
      <img
        src={resolvePhotoSrc(photoUrl)}
        alt={title}
        onError={() => setFailed(true)}
        className={`${s} rounded-lg object-cover shrink-0`}
      />
    );
  }

  return (
    <div className={`${s} rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0`}>
      <Hash className={iconSize} />
    </div>
  );
}
