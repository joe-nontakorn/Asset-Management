// Dashboard Components - shared types and constants
import { Clock, Play, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============== Types ==============
export interface Stats {
  totalConversations: number;
  resolvedConversations: number;
  unresolvedConversations: number;
  escalatedConversations: number;
  resolutionRate: string;
  averageRating: string;
  totalUsers: number;
  conversationsToday: number;
  conversationsThisWeek: number;
  averageResolutionTime: string;
  departmentStats: Array<{ department: string; count: number }>;
}

export interface TicketsStats {
  total: number;
  pending: number;
  inProgress: number;
  waitingUserConfirm: number;
  resolved: number;
}

export interface Issue {
  issue: string;
  count: number;
  resolvedCount: number;
  resolutionRate: string;
  averageRating: number | null;
}

export interface RatingItem {
  rating: number;
  count: number;
}

export interface TrendItem {
  date: string;
  count: number;
  resolved: number;
}

export interface ActivityItem {
  id: string;
  user: string;
  issue?: string;
  status: string;
  time: string;
  type: "new_ticket" | "status_change";
  targetUser?: string;
}

export interface ConversationAttachment {
  url: string;
  filename: string;
  type: string;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  source?: "user" | "assistant_ai" | "assistant_human" | "system";
  agentName?: string;
  attachments?: ConversationAttachment[];
  conversationId?: string;
  sessionId?: string;
  issue?: string;
  ticketId?: string;
  eventType?: "ticket_opened" | "ticket_status";
}

export interface HumanHandoff {
  active: boolean;
  agentId?: string;
  agentName?: string;
  startedAt?: string | null;
  lastAgentMessageAt?: string | null;
  lastAgentActivityAt?: string | null;
  endedAt?: string | null;
  reason?: string;
}

export interface ConversationUserSummary {
  name: string;
  employeeId: string;
  department: string;
  phone?: string;
}

export interface ConversationRecord {
  _id: string;
  lineUserId: string;
  sessionId: string;
  messages: ConversationMessage[];
  issue: string;
  resolved: boolean;
  escalated?: boolean;
  rating?: number;
  status: string;
  createdAt: string;
  closedAt?: string;
  humanHandoff?: HumanHandoff;
  user?: ConversationUserSummary;
}

export interface UserLiveChatThread {
  lineUserId: string;
  user?: ConversationUserSummary;
  activeConversationId?: string | null;
  humanHandoff?: HumanHandoff | null;
  messages: ConversationMessage[];
  tickets: Ticket[];
  conversations: Array<{
    _id: string;
    issue: string;
    createdAt: string;
    status: string;
    escalated?: boolean;
    resolved?: boolean;
    rating?: number;
    sessionId: string;
    humanHandoff?: HumanHandoff | null;
    messageCount: number;
  }>;
}

// Escalated Issues types
export type TicketStatus = "pending" | "in_progress" | "waiting_user_confirm" | "resolved";

export interface StatusHistoryEntry {
  status: TicketStatus;
  changedAt: string;
  comment?: string;
  changedBy?: string;
}

export interface Ticket {
  _id: string;
  ticketId: string;
  lineUserId?: string;
  conversationId?: string;
  name: string;
  employeeId: string;
  department: string;
  email: string;
  phone: string;
  issueSummary: string;
  status: TicketStatus;
  reportedAt: string;
  acceptedAt?: string;
  resolvedAt?: string;
  resolutionComment?: string;
  statusHistory?: StatusHistoryEntry[];
  __v: number;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

// ============== Constants ==============
export const LINE_API_BASE = "/line-api";
export const RATING_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
export const PIE_COLORS = ["#6366f1", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6"];
export const STATUS_CHART_COLORS: Record<TicketStatus, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  waiting_user_confirm: "#a855f7",
  resolved: "#10b981",
};

export const DARK_TOOLTIP = {
  backgroundColor: "rgba(30, 30, 45, 0.95)",
  border: "none",
  borderRadius: "12px",
  fontSize: "12px",
  padding: "8px 12px",
};

export interface StatusConfigItem {
  label: string;
  color: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  icon: LucideIcon;
}

export const STATUS_CONFIG: Record<TicketStatus, StatusConfigItem> = {
  pending: {
    label: "รอดำเนินการ",
    color: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-900/40",
    borderLight: "border-amber-200",
    borderDark: "dark:border-amber-700",
    icon: Clock,
  },
  in_progress: {
    label: "กำลังดำเนินงาน",
    color: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-900/40",
    borderLight: "border-blue-200",
    borderDark: "dark:border-blue-700",
    icon: Play,
  },
  waiting_user_confirm: {
    label: "รอผู้แจ้งตรวจสอบ",
    color: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50",
    bgDark: "dark:bg-purple-900/40",
    borderLight: "border-purple-200",
    borderDark: "dark:border-purple-700",
    icon: CheckCircle,
  },
  resolved: {
    label: "แก้ไขเสร็จสมบูรณ์",
    color: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-50",
    bgDark: "dark:bg-emerald-900/40",
    borderLight: "border-emerald-200",
    borderDark: "dark:border-emerald-700",
    icon: CheckCircle,
  },
};

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus | null> = {
  pending: "in_progress",
  in_progress: "waiting_user_confirm",
  waiting_user_confirm: "resolved",
  resolved: null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeStatus = (status: string | number | undefined | null): TicketStatus => {
  if (status === 0 || status === "0") return "resolved";
  if (status === 1 || status === "1") return "pending";
  const s = String(status || "").toLowerCase();
  if (s === "pending" || s === "in_progress" || s === "waiting_user_confirm" || s === "resolved") return s as TicketStatus;
  return "pending";
};
