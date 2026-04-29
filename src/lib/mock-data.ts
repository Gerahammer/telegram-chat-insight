// Shared domain types. All actual data comes from the backend API.

export type Sentiment = "positive" | "neutral" | "negative";
export type ChatType = "group" | "supergroup" | "channel";
export type AttentionStatus = "needs_attention" | "no_activity" | "ok" | "urgent";
export type ActionPriority = "low" | "medium" | "high";
export type ActionStatus = "open" | "in_progress" | "resolved" | "dismissed";

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
  isActive?: boolean;
  todaySummary?: string;
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
