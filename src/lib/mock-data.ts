// Centralized mock data for the ReplyRadar demo UI.
// Replace with real API calls when wiring up the backend.

export type Sentiment = "positive" | "neutral" | "negative";
export type ChatType = "group" | "supergroup" | "channel";
export type AttentionStatus = "needs_attention" | "no_activity" | "ok" | "urgent";
export type ActionPriority = "low" | "medium" | "high";
export type ActionStatus = "open" | "in_progress" | "resolved";

export interface Chat {
  id: string;
  name: string;
  type: ChatType;
  members: number;
  lastActivity: string; // ISO
  messagesToday: number;
  attention: AttentionStatus;
  sentiment: Sentiment;
  connected: boolean;
  unanswered: number;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  chatId: string;
  chatName: string;
  requestedBy: string;
  priority: ActionPriority;
  status: ActionStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  author: string;
  text: string;
  time: string;
  flagged?: boolean;
}

export const chats: Chat[] = [
  { id: "vip", name: "VIP Affiliates", type: "supergroup", members: 142, lastActivity: "2026-04-29T09:42:00Z", messagesToday: 87, attention: "urgent", sentiment: "negative", connected: true, unanswered: 4 },
  { id: "sportuna", name: "Sportuna Partners", type: "group", members: 38, lastActivity: "2026-04-29T08:15:00Z", messagesToday: 24, attention: "needs_attention", sentiment: "neutral", connected: true, unanswered: 2 },
  { id: "payments", name: "Payments Team", type: "group", members: 12, lastActivity: "2026-04-29T10:01:00Z", messagesToday: 41, attention: "needs_attention", sentiment: "neutral", connected: true, unanswered: 3 },
  { id: "tracking", name: "Tracking Issues", type: "supergroup", members: 56, lastActivity: "2026-04-29T07:22:00Z", messagesToday: 19, attention: "urgent", sentiment: "negative", connected: true, unanswered: 5 },
  { id: "support", name: "Support Group", type: "supergroup", members: 210, lastActivity: "2026-04-29T09:58:00Z", messagesToday: 134, attention: "ok", sentiment: "positive", connected: true, unanswered: 1 },
  { id: "media", name: "Media Buyers", type: "group", members: 27, lastActivity: "2026-04-28T18:10:00Z", messagesToday: 0, attention: "no_activity", sentiment: "neutral", connected: true, unanswered: 0 },
  { id: "seo", name: "SEO Team", type: "group", members: 9, lastActivity: "2026-04-27T14:30:00Z", messagesToday: 0, attention: "no_activity", sentiment: "neutral", connected: true, unanswered: 0 },
];

export const actionItems: ActionItem[] = [
  { id: "a1", title: "Approve payment for Alex", description: "Affiliate Alex requested payout approval for April. Pending finance sign-off.", chatId: "payments", chatName: "Payments Team", requestedBy: "Alex K.", priority: "high", status: "open", createdAt: "2026-04-29T08:12:00Z" },
  { id: "a2", title: "Check missing conversions in Germany", description: "GEO DE shows 0 conversions since 06:00 UTC. Possible postback issue.", chatId: "tracking", chatName: "Tracking Issues", requestedBy: "Maria S.", priority: "high", status: "in_progress", createdAt: "2026-04-29T06:45:00Z" },
  { id: "a3", title: "Reply to affiliate about CPA increase", description: "Top affiliate asked about a CPA bump for the Sportuna offer.", chatId: "vip", chatName: "VIP Affiliates", requestedBy: "Daniel R.", priority: "medium", status: "open", createdAt: "2026-04-29T09:10:00Z" },
  { id: "a4", title: "Send updated invoice", description: "Partner requested a corrected invoice with new VAT details.", chatId: "sportuna", chatName: "Sportuna Partners", requestedBy: "Lukas P.", priority: "medium", status: "open", createdAt: "2026-04-29T07:55:00Z" },
  { id: "a5", title: "Investigate blocked tracking link", description: "Tracking link flagged by ad network. Need a fresh redirect domain.", chatId: "tracking", chatName: "Tracking Issues", requestedBy: "Olivia M.", priority: "high", status: "open", createdAt: "2026-04-29T05:30:00Z" },
  { id: "a6", title: "Confirm campaign launch for FR", description: "France campaign scheduled for tomorrow needs final creative approval.", chatId: "media", chatName: "Media Buyers", requestedBy: "Tom B.", priority: "low", status: "in_progress", createdAt: "2026-04-28T16:20:00Z" },
  { id: "a7", title: "Update payout terms doc", description: "Reflect new minimum payout threshold in onboarding docs.", chatId: "vip", chatName: "VIP Affiliates", requestedBy: "Sarah W.", priority: "low", status: "resolved", createdAt: "2026-04-27T11:00:00Z" },
  { id: "a8", title: "Reset blocked Telegram user", description: "User accidentally banned from VIP group, needs unban.", chatId: "support", chatName: "Support Group", requestedBy: "Pavel N.", priority: "low", status: "resolved", createdAt: "2026-04-28T13:42:00Z" },
];

export const messageVolume = [
  { day: "Wed", messages: 412 },
  { day: "Thu", messages: 380 },
  { day: "Fri", messages: 521 },
  { day: "Sat", messages: 198 },
  { day: "Sun", messages: 167 },
  { day: "Mon", messages: 489 },
  { day: "Tue", messages: 305 },
];

export const sentimentTimeline = [
  { time: "00:00", score: 0.2 },
  { time: "04:00", score: 0.1 },
  { time: "08:00", score: -0.3 },
  { time: "10:00", score: -0.5 },
  { time: "12:00", score: -0.2 },
  { time: "14:00", score: 0.1 },
  { time: "16:00", score: 0.3 },
];

export const activityBreakdown = [
  { name: "Active", value: 4, color: "hsl(var(--success))" },
  { name: "Needs attention", value: 2, color: "hsl(var(--warning))" },
  { name: "Urgent", value: 2, color: "hsl(var(--destructive))" },
  { name: "No activity", value: 2, color: "hsl(var(--muted-foreground))" },
];

export const recentSummaries = [
  { id: "s1", chat: "VIP Affiliates", summary: "Discussion focused on payout delays and a request for a CPA increase from a top affiliate. Two unanswered questions remain about Q2 commission structure.", time: "2h ago", attention: "urgent" as AttentionStatus },
  { id: "s2", chat: "Tracking Issues", summary: "Multiple reports of missing conversions in DE and FR. One blocked tracking link reported by an ad network — escalation in progress.", time: "3h ago", attention: "urgent" as AttentionStatus },
  { id: "s3", chat: "Payments Team", summary: "Three payouts pending approval. Finance team aligned on new VAT invoice template.", time: "4h ago", attention: "needs_attention" as AttentionStatus },
  { id: "s4", chat: "Support Group", summary: "Mostly positive — onboarding questions resolved quickly by team. One unban request still pending.", time: "5h ago", attention: "ok" as AttentionStatus },
];

export const chatMessages: Record<string, Message[]> = {
  vip: [
    { id: "m1", author: "Alex K.", text: "Hey team, any update on April payouts?", time: "08:12", flagged: true },
    { id: "m2", author: "Daniel R.", text: "Can we talk about a CPA increase for Sportuna?", time: "09:10", flagged: true },
    { id: "m3", author: "Sarah W.", text: "I sent the new payout terms — please review.", time: "09:24" },
    { id: "m4", author: "Alex K.", text: "Still waiting on the payout confirmation 🙏", time: "09:42", flagged: true },
  ],
  payments: [
    { id: "m1", author: "Maria S.", text: "Approved 3 payouts this morning.", time: "08:00" },
    { id: "m2", author: "Lukas P.", text: "Need updated invoice with new VAT details.", time: "08:30", flagged: true },
    { id: "m3", author: "Pavel N.", text: "Done — uploading shortly.", time: "10:01" },
  ],
  tracking: [
    { id: "m1", author: "Maria S.", text: "DE postbacks showing 0 since 06:00.", time: "06:45", flagged: true },
    { id: "m2", author: "Olivia M.", text: "Tracking link blocked by network — investigating.", time: "07:22", flagged: true },
  ],
};

export const chatSummary = (chatId: string) => {
  const map: Record<string, string> = {
    vip: "Today the chat focused on payment approval, tracking issues, and campaign performance. One affiliate asked for an update about payout and did not receive a reply. There was also a technical issue related to tracking links and a request to revisit CPA terms for the Sportuna offer.",
    payments: "Finance approved three payouts and aligned on a new VAT invoice template. One partner is still waiting on a corrected invoice.",
    tracking: "Multiple reports of missing conversions in DE and FR. A tracking link was blocked by an ad network and a fresh redirect domain is being prepared.",
    sportuna: "Partners discussed Q2 promo plans and requested updated invoices. Sentiment was neutral with no urgent escalations.",
    support: "Mostly resolved onboarding questions. One unban request still pending action.",
    media: "No activity in the last 24 hours.",
    seo: "No activity in the last 24 hours.",
  };
  return map[chatId] ?? "No summary available for this chat yet.";
};
