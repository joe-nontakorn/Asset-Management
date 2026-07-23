import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  RefreshCw,
  Bot,
  AlertTriangle,
  ArrowLeft,
  User as UserIcon,
  Headphones,
  Send,
  Phone,
  Paperclip,
  MessageCircleOff,
  Ticket,
  X,
} from "lucide-react";
import type { ConversationMessage, UserLiveChatThread } from "./LineSupportComponents/types";
import { LINE_API_BASE, normalizeStatus, STATUS_CONFIG, type TicketStatus } from "./LineSupportComponents/types";

const AGENT_NAME_KEY = "line-support-live-chat-agent-name";

const UserConversations = () => {
  const { lineUserId } = useParams<{ lineUserId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.userName;
  const employeeId = location.state?.employeeId;
  const focusedTicketId = location.state?.fromTicketId as string | undefined;

  const [thread, setThread] = useState<UserLiveChatThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentName, setAgentName] = useState(() => localStorage.getItem(AGENT_NAME_KEY) || "");
  const [replyText, setReplyText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Array<{ key: string; url: string }>>([]);
  const [actionLoading, setActionLoading] = useState<"takeover" | "release" | "send" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const lastMessageCountRef = useRef(0);

  const fetchThread = useCallback(async (silent = false) => {
    if (!lineUserId) return;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(`${LINE_API_BASE}/live-chat/user/${lineUserId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setThread(json.data as UserLiveChatThread);
    } catch (err) {
      console.error("Error fetching user live chat thread:", err);
      if (!silent) setError("ไม่สามารถโหลดห้องแชทของผู้ใช้นี้ได้");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [lineUserId]);

  useEffect(() => {
    fetchThread(false);
  }, [fetchThread]);

  useEffect(() => {
    if (!lineUserId) return;
    const timer = window.setInterval(() => {
      void fetchThread(true);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [fetchThread, lineUserId]);

  useEffect(() => {
    if (!lineUserId || thread?.humanHandoff?.active !== true) return;

    let cancelled = false;

    const sendPresence = async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`${LINE_API_BASE}/live-chat/user/${lineUserId}/presence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentName: agentName.trim() || "IT Support" }),
        });
        const json = await res.json().catch(() => null);
        if (!cancelled && json?.success && json?.data?.active === false) {
          await fetchThread(true);
        }
      } catch (err) {
        console.error("Error sending live chat presence heartbeat:", err);
      }
    };

    void sendPresence();
    const intervalId = window.setInterval(() => {
      void sendPresence();
    }, 30000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendPresence();
      }
    };

    window.addEventListener("focus", onVisibilityChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onVisibilityChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [agentName, fetchThread, lineUserId, thread?.humanHandoff?.active]);

  useEffect(() => {
    localStorage.setItem(AGENT_NAME_KEY, agentName);
  }, [agentName]);

  useEffect(() => {
    const imagePreviews = selectedFiles
      .filter((file) => file.type.startsWith("image/"))
      .map((file, index) => ({
        key: `${file.name}-${file.size}-${index}`,
        url: URL.createObjectURL(file),
      }));

    setFilePreviews(imagePreviews);

    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedFiles]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 120;
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [thread?.lineUserId]);

  useEffect(() => {
    const nextCount = thread?.messages.length || 0;
    const shouldScroll = nextCount > 0 && (lastMessageCountRef.current === 0 || shouldStickToBottomRef.current);
    lastMessageCountRef.current = nextCount;

    if (!shouldScroll) return;

    window.requestAnimationFrame(() => {
      messageEndRef.current?.scrollIntoView({ block: "end" });
    });
  }, [thread?.messages]);

  const postLiveChatAction = useCallback(async (
    action: "takeover" | "release" | "messages",
    payload: Record<string, unknown> | FormData,
  ) => {
    const res = await fetch(`${LINE_API_BASE}/live-chat/user/${lineUserId}/${action}`, {
      method: "POST",
      headers: payload instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.error || json?.message || "Request failed");
    }
    return json;
  }, [lineUserId]);

  const handleTakeover = async () => {
    setActionLoading("takeover");
    setActionError(null);
    try {
      await postLiveChatAction("takeover", { agentName: agentName.trim() || "IT Support" });
      await fetchThread(true);
    } catch (err) {
      console.error("Error taking over user thread:", err);
      setActionError(err instanceof Error ? err.message : "ไม่สามารถรับช่วงสนทนาได้");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRelease = async () => {
    setActionLoading("release");
    setActionError(null);
    try {
      await postLiveChatAction("release", { agentName: agentName.trim() || "IT Support" });
      await fetchThread(true);
    } catch (err) {
      console.error("Error releasing user thread:", err);
      setActionError(err instanceof Error ? err.message : "ไม่สามารถคืนให้ AI ได้");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() && selectedFiles.length === 0) return;
    setActionLoading("send");
    setActionError(null);
    try {
      const formData = new FormData();
      formData.append("agentName", agentName.trim() || "IT Support");
      if (replyText.trim()) {
        formData.append("text", replyText.trim());
      }
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      await postLiveChatAction("messages", formData);
      setReplyText("");
      setSelectedFiles([]);
      await fetchThread(true);
    } catch (err) {
      console.error("Error sending live chat message:", err);
      setActionError(err instanceof Error ? err.message : "ไม่สามารถส่งข้อความได้");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (incomingFiles.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...incomingFiles].slice(0, 5));
    event.target.value = "";
  };

  const handlePasteFiles = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (pastedFiles.length === 0) return;

    event.preventDefault();
    setSelectedFiles((prev) => [...prev, ...pastedFiles].slice(0, 5));
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleRefresh = async () => {
    await fetchThread(false);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handoffActive = thread?.humanHandoff?.active === true;
  const displayUserName = userName || thread?.user?.name;
  const displayEmployeeId = employeeId || thread?.user?.employeeId;
  const displayNameDisplay = displayUserName
    ? `${displayEmployeeId ? `${displayEmployeeId} - ` : ""}${displayUserName}`
    : `ID: ${lineUserId}`;

  const sortedTickets = useMemo(
    () => [...(thread?.tickets || [])].sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()),
    [thread?.tickets],
  );

  const getTicketStatusBadge = (status: string) => {
    const normalizedStatus = normalizeStatus(status) as TicketStatus;
    const statusConfig = STATUS_CONFIG[normalizedStatus];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConfig.bgLight} ${statusConfig.bgDark} ${statusConfig.color} ${statusConfig.borderLight} ${statusConfig.borderDark}`}
      >
        {statusConfig.label}
      </span>
    );
  };

  const renderMessageBubble = (msg: ConversationMessage, index: number) => {
    const source = msg.source || (msg.role === "assistant" ? "assistant_ai" : msg.role);
    const isUser = msg.role === "user";
    const isSystem = msg.role === "system" || source === "system";
    const isHuman = source === "assistant_human";
    const isTicketEvent = msg.eventType === "ticket_opened" || msg.eventType === "ticket_status";
    const label = isTicketEvent
      ? msg.eventType === "ticket_opened" ? "Ticket Opened" : "Ticket Update"
      : isSystem
        ? "System"
        : isUser
          ? "ผู้ใช้งาน"
          : isHuman
            ? `เจ้าหน้าที่${msg.agentName ? ` · ${msg.agentName}` : ""}`
            : "Bot AI";

    return (
      <div
        key={`${msg.conversationId || "system"}-${msg.timestamp || index}-${index}`}
        className={`flex ${isSystem ? "justify-center" : isHuman ? "justify-end" : "justify-start"}`}
      >
        <div className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] ${isSystem ? "" : isHuman ? "flex-row-reverse" : "flex-row"}`}>
          {!isSystem && (
            <div className="shrink-0 pt-1">
              {isUser ? (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60">
                  <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : isHuman ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-md shadow-green-500/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          )}

          <div
            className={`rounded-2xl px-3 py-2.5 text-[12px] leading-6 whitespace-pre-wrap ${
              isTicketEvent
                ? "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-100 border border-amber-200 dark:border-amber-800 rounded-xl"
                : isSystem
                  ? "bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl"
                  : isUser
                    ? "bg-indigo-600 text-white rounded-tl-sm shadow-sm"
                  : isHuman
                      ? "bg-teal-50 dark:bg-teal-900/30 text-teal-900 dark:text-teal-100 border border-teal-200 dark:border-teal-800 rounded-tr-sm shadow-sm"
                      : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-tl-sm shadow-sm"
            }`}
          >
            <div className="font-semibold text-[10px] mb-1 opacity-80 uppercase tracking-wide">
              {label}
            </div>
            {msg.content}
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {msg.attachments.map((attachment, attachmentIdx) => (
                  attachment.type === "image" ? (
                    <a
                      key={`${attachment.url}-${attachmentIdx}`}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.filename || "attachment"}
                        className="max-h-56 w-auto rounded-xl border border-white/10 object-contain"
                      />
                    </a>
                  ) : (
                    <a
                      key={`${attachment.url}-${attachmentIdx}`}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-[11px] underline underline-offset-2"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      {attachment.filename || attachment.url}
                    </a>
                  )
                ))}
              </div>
            )}
            <div className="mt-2 text-[9px] opacity-70">
              {formatDate(msg.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error && !thread) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full p-2 sm:p-4 xl:p-5 space-y-4 xl:space-y-5 min-h-[calc(100vh-84px)] overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 xl:gap-4"
        >
          <div className="flex items-center gap-3 xl:gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white transition-all shadow-sm group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <UserIcon className="w-5 h-5 xl:w-6 xl:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl xl:text-2xl font-bold text-gray-800 dark:text-white">ห้องแชทผู้ใช้</h1>
                <p className={`text-xs xl:text-sm ${displayUserName ? "font-medium" : "font-mono"} text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 rounded mt-1 inline-block`}>
                  {displayNameDisplay}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 xl:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs xl:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-start min-h-0 overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-4 min-h-0 min-w-0 xl:col-span-7"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 xl:p-4 shadow-sm space-y-3 xl:space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[13px] xl:text-sm font-semibold text-gray-800 dark:text-white">Live Chat Control</h3>
                  <p className="text-[11px] xl:text-xs text-gray-500 dark:text-gray-400 mt-1">ห้องแชทยาวของผู้ใช้ ห้องเดียวต่อคน</p>
                </div>
                <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  handoffActive
                    ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}>
                  {handoffActive ? <Headphones className="w-3.5 h-3.5" /> : <MessageCircleOff className="w-3.5 h-3.5" />}
                  {handoffActive ? "Human takeover" : "AI mode"}
                </div>
              </div>

              <div>
                <label className="block text-[11px] xl:text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  ชื่อเจ้าหน้าที่
                </label>
                <input
                  value={agentName}
                  onChange={(event) => setAgentName(event.target.value)}
                  placeholder="เช่น Nontakorn"
                  className="w-full px-3 py-2 xl:py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-[13px] xl:text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 xl:gap-3">
                <button
                  onClick={handleTakeover}
                  disabled={handoffActive || actionLoading !== null}
                  className="flex items-center justify-center gap-2 px-3 py-2 xl:py-2.5 rounded-xl bg-teal-500 text-white text-[13px] xl:text-sm font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  <Headphones className="w-4 h-4" />
                  {actionLoading === "takeover" ? "กำลังรับช่วง..." : "รับช่วง"}
                </button>
                <button
                  onClick={handleRelease}
                  disabled={!handoffActive || actionLoading !== null}
                  className="flex items-center justify-center gap-2 px-3 py-2 xl:py-2.5 rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100 text-[13px] xl:text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  <Bot className="w-4 h-4" />
                  {actionLoading === "release" ? "กำลังคืนให้ AI..." : "คืนให้ AI"}
                </button>
              </div>

              <div className="text-[10px] xl:text-[11px] text-gray-500 dark:text-gray-400">
                หากไม่มีการใช้งานห้องแชทนี้เกิน 5 นาที ระบบจะคืนสิทธิ์ให้ AI อัตโนมัติ
              </div>

              {thread?.user && (
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 xl:p-4 space-y-2.5 xl:space-y-3">
                  <div className="flex items-center gap-2 text-[13px] xl:text-sm font-semibold text-gray-800 dark:text-white">
                    <UserIcon className="w-4 h-4 text-indigo-500" />
                    {thread.user.name}
                  </div>
                  <div className="text-[11px] xl:text-xs text-gray-500 dark:text-gray-400">
                    {thread.user.employeeId} · {thread.user.department}
                  </div>
                  {thread.user.phone && (
                    <div className="flex items-center gap-2 text-[11px] xl:text-xs text-gray-500 dark:text-gray-400">
                      <Phone className="w-3.5 h-3.5" />
                      {thread.user.phone}
                    </div>
                  )}
                </div>
              )}

              {actionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
                  {actionError}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 xl:p-4 shadow-sm min-h-[260px] xl:min-h-[320px] max-h-[560px] xl:max-h-[calc(100vh-390px)] flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="w-4 h-4 text-amber-500" />
                <h3 className="text-[13px] xl:text-sm font-semibold text-gray-800 dark:text-white">Ticket ของผู้ใช้</h3>
              </div>
              <div className="min-h-0 overflow-y-auto pr-1">
                {sortedTickets.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มี Ticket</div>
                ) : sortedTickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className={`rounded-xl border px-3 xl:px-4 py-2.5 xl:py-3 ${ticket !== sortedTickets[sortedTickets.length - 1] ? "mb-2.5 xl:mb-3" : ""} ${
                      focusedTicketId === ticket.ticketId
                        ? "border-amber-300 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-900/10"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[13px] xl:text-sm font-semibold text-gray-900 dark:text-white">{ticket.ticketId}</div>
                        <div className="text-[11px] xl:text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(ticket.reportedAt)}</div>
                      </div>
                      {getTicketStatusBadge(ticket.status)}
                    </div>
                    <div className="text-[13px] xl:text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap break-words">
                      {ticket.issueSummary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full min-w-0 xl:col-span-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[520px] xl:min-h-[580px] 2xl:h-[calc(100vh-180px)] flex flex-col"
          >
            <div className="border-b border-gray-100 dark:border-gray-700 p-4 xl:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm xl:text-base font-semibold text-gray-900 dark:text-white">
                    ห้องแชทของ {displayUserName || "ผู้ใช้งาน"}
                  </h3>
                  <p className="text-[11px] xl:text-xs text-gray-500 dark:text-gray-400 mt-1">
                    รวมข้อความทุกช่วงสนทนา และแทรก event ของ Ticket ไว้ใน timeline เดียว
                  </p>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold w-fit ${
                  handoffActive
                    ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                }`}>
                  {handoffActive ? <Headphones className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  {handoffActive ? `กำลังดูแลโดย ${thread?.humanHandoff?.agentName || "เจ้าหน้าที่"}` : "AI ดูแลอยู่"}
                </div>
              </div>
            </div>

            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto p-2.5 sm:p-3 xl:p-4 space-y-2.5 xl:space-y-3 bg-gray-50/60 dark:bg-gray-900/20 min-h-0"
            >
              {loading && !thread ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-800 animate-spin border-t-indigo-500" />
                </div>
              ) : !thread || thread.messages.length === 0 ? (
                <div className="flex-1 grid place-items-center p-10 text-center">
                  <div>
                    <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">ยังไม่มีข้อความ</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ผู้ใช้นี้ยังไม่มีประวัติการสนทนา</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {thread.messages.map(renderMessageBubble)}
                </AnimatePresence>
              )}
              <div ref={messageEndRef} />
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 p-2.5 sm:p-3 xl:p-4 bg-white dark:bg-gray-800 space-y-2.5 xl:space-y-3">
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  {filePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filePreviews.map((preview) => (
                        <img
                          key={preview.key}
                          src={preview.url}
                          alt="preview"
                          className="h-20 w-auto rounded-xl border border-gray-200 dark:border-gray-700 object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 text-[11px] text-gray-700 dark:text-gray-200"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="max-w-[220px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  </div>
                </div>
              )}
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                onPaste={handlePasteFiles}
                disabled={!handoffActive || actionLoading !== null}
                rows={3}
                placeholder={handoffActive ? "พิมพ์ข้อความตอบกลับผู้ใช้ทาง LINE หรือวางรูปภาพได้ทันที" : "กดรับช่วงก่อนจึงจะส่งข้อความได้"}
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 xl:px-4 py-2.5 xl:py-3 text-[11px] xl:text-[12px] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-60 resize-none"
              />
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex-1 min-w-0">
                  เมื่อ Human takeover ทำงานอยู่ AI จะไม่ตอบทับ และข้อความใหม่ของ user จะเข้า timeline นี้ต่อเนื่อง
                </p>
                <div className="flex w-full sm:w-auto items-center justify-end gap-2 self-end shrink-0">
                  <label
                    className={`inline-flex h-10 items-center justify-center gap-2 px-2.5 sm:px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[11px] sm:text-[12px] font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap ${handoffActive ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : "opacity-50 cursor-not-allowed"}`}
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="hidden sm:inline">แนบไฟล์</span>
                    <span className="sm:hidden">แนบ</span>
                    <input
                      type="file"
                      multiple
                      hidden
                      onChange={handleFilesSelected}
                      disabled={!handoffActive || actionLoading !== null}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                    />
                  </label>
                  <button
                    onClick={handleSendMessage}
                    disabled={!handoffActive || (!replyText.trim() && selectedFiles.length === 0) || actionLoading !== null}
                    className="inline-flex h-10 min-w-[88px] sm:min-w-[104px] items-center justify-center gap-2 px-3 sm:px-4 rounded-xl bg-indigo-600 text-white text-[12px] font-semibold whitespace-nowrap hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">{actionLoading === "send" ? "กำลังส่ง..." : "ส่งข้อความ"}</span>
                    <span className="sm:hidden">{actionLoading === "send" ? "ส่ง..." : "ส่ง"}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserConversations;
