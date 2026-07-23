// src/utils/notificationUtils.ts
export type NotificationType = "new_user" | "resolved_ticket" | "new_ticket";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
}

const API_BASE = import.meta.env.VITE_LINE_API_BASE ? `${import.meta.env.VITE_LINE_API_BASE}/api` : "/line-api";

export const getNotificationHistory = async (): Promise<AppNotification[]> => {
  try {
    const res = await fetch(`${API_BASE}/notifications`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error("Failed to fetch notification history", err);
    return [];
  }
};

// No longer need client-side addNotification because the server handles it,
// but keeping it as a trigger for UI refresh.
export const addNotification = async () => {
  // The server now creates notifications automatically when events occur.
  // We just trigger a reload event for the UI to be safe.
  window.dispatchEvent(new Event("notifications-updated"));
};

export const markAsRead = async (id: string) => {
  try {
    await fetch(`${API_BASE}/notifications/${id}/read`, { method: "PUT" });
    window.dispatchEvent(new Event("notifications-updated"));
  } catch (err) {
    console.error("Failed to mark as read", err);
  }
};

export const markAllAsRead = async () => {
  try {
    await fetch(`${API_BASE}/notifications/read-all`, { method: "PUT" });
    window.dispatchEvent(new Event("notifications-updated"));
  } catch (err) {
    console.error("Failed to mark all as read", err);
  }
};

export const clearHistory = async () => {
  try {
    await fetch(`${API_BASE}/notifications`, { method: "DELETE" });
    window.dispatchEvent(new Event("notifications-updated"));
  } catch (err) {
    console.error("Failed to clear history", err);
  }
};
