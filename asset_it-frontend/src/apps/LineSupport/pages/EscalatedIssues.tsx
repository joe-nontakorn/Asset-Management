// File: src/pages/LineSupport/EscalatedIssues.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, AlertTriangle, CheckCircle,
  User as UserIcon, Phone, Mail, Building,
  CreditCard, ChevronDown, Play,
  MessageSquare, Loader2, Trash2,
} from "lucide-react";

// Shared types & constants
import {
  type TicketStatus, type Ticket, type PaginationInfo,
  LINE_API_BASE, STATUS_CONFIG, VALID_TRANSITIONS, normalizeStatus,
} from "./LineSupportComponents/types";

// Shared sub-components
import {
  StatusBadge, StatusStepper, StatusTimeline, ResolveModal,
} from "./LineSupportComponents/EscalatedComponents";

// ============== Main Component ==============
const EscalatedIssues = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal state
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const res = await fetch(`${LINE_API_BASE}/tickets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        setTickets(json.data.tickets || []);
        setPagination(json.data.pagination);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching escalated tickets:", err);
      if (!silent) setError("ไม่สามารถโหลดปัญหาที่ส่งต่อได้");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchTicketDetail = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`${LINE_API_BASE}/tickets/${ticketId}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.data) return json.data as Ticket;
      return null;
    } catch { return null; }
  }, []);

  useEffect(() => {
    fetchTickets(false);
    const intervalId = setInterval(() => fetchTickets(true), 5000);
    return () => clearInterval(intervalId);
  }, [fetchTickets]);

  const handleExpand = async (ticket: Ticket) => {
    if (expandedId === ticket.ticketId) { setExpandedId(null); return; }
    setExpandedId(ticket.ticketId);
    const detail = await fetchTicketDetail(ticket.ticketId);
    if (detail) {
      setTickets((prev) => prev.map((t) => (t.ticketId === ticket.ticketId ? detail : t)));
    }
  };

  const advanceStatus = async (ticketId: string, newStatus: TicketStatus) => {
    setUpdatingId(ticketId);
    try {
      const ticket = tickets.find(t => t.ticketId === ticketId);
      const payload: { status: TicketStatus; resolutionComment?: string } = { status: newStatus };
      if ((newStatus === "resolved" || newStatus === "waiting_user_confirm") && ticket?.resolutionComment) {
        payload.resolutionComment = ticket.resolutionComment;
      }

      const res = await fetch(`${LINE_API_BASE}/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || errJson?.message || "Update failed");
      }
      const json = await res.json();
      if (json.success && json.data) {
        setTickets((prev) => prev.map((t) => (t.ticketId === ticketId ? json.data : t)));
      } else {
        await fetchTickets();
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("ไม่สามารถเปลี่ยนสถานะได้: " + (err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"));
    } finally {
      setUpdatingId(null);
    }
  };

  const resolveTicket = async (ticketId: string, comment: string, targetStatus: TicketStatus = "resolved", files: File[] = []) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("status", targetStatus);
      formData.append("resolutionComment", comment);
      formData.append("staffName", "IT Support Admin");
      files.forEach((file) => formData.append("files", file));

      const res = await fetch(`${LINE_API_BASE}/tickets/${ticketId}/status`, { method: "PUT", body: formData });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || errJson?.error || "Update failed");
      }
      const json = await res.json();
      if (json.success && json.data) {
        setTickets((prev) => prev.map((t) => (t.ticketId === ticketId ? json.data : t)));
      } else {
        await fetchTickets();
      }
      setResolveTarget(null);
    } catch (err) {
      console.error("Error updating ticket status:", err);
      alert("ไม่สามารถดำเนินการได้: " + (err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTicket = async (ticket: Ticket) => {
    const displayId = ticket.ticketId || ticket._id.slice(-6).toUpperCase();
    const confirmed = confirm(
      `คุณต้องการลบ ID: ${displayId}\n"${ticket.issueSummary || "ไม่ระบุหัวข้อ"}"\n\nใช่หรือไม่?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${LINE_API_BASE}/tickets/${ticket.ticketId}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setTickets((prev) => prev.filter((t) => t.ticketId !== ticket.ticketId));
        if (expandedId === ticket.ticketId) setExpandedId(null);
        alert(`✅ ลบ Ticket ${displayId} เรียบร้อยแล้ว`);
      } else {
        alert(`❌ ไม่สามารถลบได้: ${json?.error || json?.message || "กรุณาลองใหม่อีกครั้ง"}`);
      }
    } catch (err) {
      console.error("Error deleting ticket:", err);
      alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const handleRefresh = () => fetchTickets(false);

  const openLiveChat = (ticket: Ticket) => {
    if (!ticket.lineUserId) {
      alert("Ticket นี้ยังไม่พบข้อมูล LINE user สำหรับเปิดแชทสด");
      return;
    }

    const query = ticket.conversationId ? `?conversationId=${encodeURIComponent(ticket.conversationId)}` : "";
    navigate(`/line-support/user/${encodeURIComponent(ticket.lineUserId)}${query}`, {
      state: {
        userName: ticket.name,
        employeeId: ticket.employeeId,
        fromTicketId: ticket.ticketId,
      },
    });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  // Filtered & counts
  const filteredTickets = filterStatus === "all" ? tickets : tickets.filter((t) => t.status === filterStatus);
  const counts = {
    all: tickets.length,
    pending: tickets.filter((t) => t.status === "pending").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    waiting_user_confirm: tickets.filter((t) => t.status === "waiting_user_confirm").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  // Action button renderer
  const renderActionButton = (ticket: Ticket) => {
    const normStatus = normalizeStatus(ticket.status);
    const nextStatus = VALID_TRANSITIONS[normStatus];
    if (!nextStatus) {
      return (
        <button disabled className="px-3 py-1.5 bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-500 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 border border-gray-200 dark:border-gray-700/50 shadow-sm opacity-60 cursor-not-allowed">
          <CheckCircle className="w-4 h-4" /> แก้ไขแล้ว
        </button>
      );
    }

    const isUpdating = updatingId === ticket.ticketId;
    if (nextStatus === "in_progress") {
      return (
        <button disabled={isUpdating} onClick={(e) => { e.stopPropagation(); advanceStatus(ticket.ticketId, "in_progress"); }}
          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800/60 shadow-sm disabled:opacity-60">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} รับเคส
        </button>
      );
    }
    if (nextStatus === "waiting_user_confirm") {
      return (
        <button disabled={isUpdating} onClick={(e) => { e.stopPropagation(); setResolveTarget(ticket.ticketId); }}
          className="px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors border border-purple-200 dark:border-purple-800/60 shadow-sm disabled:opacity-60">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} แจ้งแก้ไขเสร็จ
        </button>
      );
    }
    if (nextStatus === "resolved") {
      return (
        <button disabled={isUpdating} onClick={(e) => { e.stopPropagation(); advanceStatus(ticket.ticketId, "resolved"); }}
          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors border border-emerald-200 dark:border-emerald-800/60 shadow-sm disabled:opacity-60">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} ปิดเคสถาวร
        </button>
      );
    }
    return null;
  };

  // ============== Error State ==============
  if (error && tickets.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
            <button onClick={handleRefresh} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">ลองใหม่อีกครั้ง</button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ============== Main Render ==============
  return (
    <MainLayout>
      <div className="p-2 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">ปัญหาที่ส่งต่อ IT Admin (Tickets)</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">รายการแจ้งซ่อม / แจ้งปัญหาจากผู้ใช้ที่สร้างเป็น Ticket ให้ทีม IT</p>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> รีเฟรช
          </button>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-wrap gap-2">
          {([
            { key: "all" as const, label: "ทั้งหมด", count: counts.all },
            { key: "pending" as const, label: "รอดำเนินการ", count: counts.pending },
            { key: "in_progress" as const, label: "กำลังดำเนินงาน", count: counts.in_progress },
            { key: "waiting_user_confirm" as const, label: "รอผู้แจ้งตรวจสอบ", count: counts.waiting_user_confirm },
            { key: "resolved" as const, label: "แก้ไขเสร็จสมบูรณ์", count: counts.resolved },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${filterStatus === tab.key ? "bg-gray-800 dark:bg-white text-white dark:text-gray-900 border-gray-800 dark:border-white shadow-md" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"}`}>
              {tab.label}
              <span className={`ml-2 inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filterStatus === tab.key ? "bg-white/20 dark:bg-gray-900/30 text-white dark:text-gray-900" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </motion.div>

        {loading && tickets.length > 0 && (
          <div className="w-full flex justify-center py-4">
            <div className="flex items-center gap-2 text-amber-500 text-sm font-medium">
              <div className="w-5 h-5 rounded-full border-2 border-amber-200 dark:border-amber-800 animate-spin border-t-amber-500" /> กำลังอัปเดต...
            </div>
          </div>
        )}

        {/* Tickets List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-4">
          {loading && tickets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-amber-200 dark:border-amber-800 animate-spin border-t-amber-500 mx-auto" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 dark:text-emerald-500 mx-auto mb-4 opacity-70" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {filterStatus === "all" ? "ไม่พบ Ticket ในขณะนี้" : `ไม่พบ Ticket สถานะ "${STATUS_CONFIG[filterStatus as TicketStatus]?.label}"`}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">ไม่มีประวัติการแจ้งซ่อมจากการเปิด Ticket ในหมวดนี้</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => {
                const isExpanded = expandedId === ticket.ticketId;
                const normStatus = normalizeStatus(ticket.status);
                const statusCfg = STATUS_CONFIG[normStatus];
                const StatusIcon = statusCfg.icon;

                return (
                  <div key={ticket._id} className={`bg-white dark:bg-gray-800 border rounded-2xl overflow-hidden shadow-sm transition-colors duration-200 ${isExpanded ? "border-amber-300 dark:border-amber-500/50 shadow-md ring-1 ring-amber-500/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                    {/* Card Header */}
                    <div className="p-4 sm:p-5 flex items-start gap-4 cursor-pointer relative pr-16 sm:pr-64" onClick={() => handleExpand(ticket)}>
                      <div className={`p-2.5 rounded-xl border shrink-0 ${statusCfg.bgLight} ${statusCfg.bgDark} ${statusCfg.borderLight} ${statusCfg.borderDark}`}>
                        <StatusIcon className={`w-5 h-5 ${statusCfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h4 className={`font-semibold text-base pr-12 sm:pr-0 break-words whitespace-pre-wrap ${ticket.status === "resolved" ? "text-gray-500 line-through dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                            {ticket.issueSummary || "ไม่ระบุหัวข้อปัญหา"}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={ticket.status} isBouncedBack={ticket.status === "in_progress" && ticket.statusHistory && ticket.statusHistory.length >= 2 && ticket.statusHistory[ticket.statusHistory.length - 2]?.status === "waiting_user_confirm"} />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">{formatDate(ticket.reportedAt)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" />{ticket.name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{ticket.department}</span>
                        </div>
                        {(ticket.acceptedAt || ticket.resolvedAt) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                            {ticket.acceptedAt && <span className="flex items-center gap-1"><Play className="w-3 h-3 text-blue-400" /> รับเคส: {formatDate(ticket.acceptedAt)}</span>}
                            {ticket.resolvedAt && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> ปิดเคส: {formatDate(ticket.resolvedAt)}</span>}
                          </div>
                        )}
                      </div>

                      {/* Desktop action */}
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden sm:flex items-center">{renderActionButton(ticket)}</div>
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {/* Ticket ID Badge */}
                      <div className="absolute top-0 right-0">
                        <span className="inline-flex items-center px-3 py-1 text-[10px] font-mono tracking-widest font-bold rounded-bl-xl border-b border-l bg-gray-100/90 text-gray-500 border-gray-200 dark:bg-gray-800/90 dark:text-gray-400 dark:border-gray-700/80 shadow-sm backdrop-blur-sm z-10">
                          ID: {ticket.ticketId || ticket._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Card Body (Expanded) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden">
                          <div className="p-4 sm:p-6 space-y-6">
                            {/* Stepper */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <StatusStepper status={ticket.status} />
                              <div className="sm:hidden">{renderActionButton(ticket)}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Reporter Info */}
                              <div className="space-y-4">
                                <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">ข้อมูลผู้แจ้ง</h5>
                                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500"><UserIcon className="w-4 h-4" /></div>
                                    <div><p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">ผู้แจ้งซ่อม</p></div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500"><CreditCard className="w-4 h-4" /></div>
                                    <div><p className="text-sm font-mono text-gray-900 dark:text-white">{ticket.employeeId}</p><p className="text-xs text-gray-500 dark:text-gray-400">รหัสพนักงาน</p></div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500"><Building className="w-4 h-4" /></div>
                                    <div><p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.department}</p><p className="text-xs text-gray-500 dark:text-gray-400">แผนก</p></div>
                                  </div>
                                </div>
                              </div>

                              {/* Contact & Resolution */}
                              <div className="space-y-4">
                                <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">ข้อมูลติดต่อ</h5>
                                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500"><Mail className="w-4 h-4" /></div>
                                    <div><p className="text-sm font-medium text-gray-900 dark:text-white break-all">{ticket.email || "ไม่ระบุ"}</p><p className="text-xs text-gray-500 dark:text-gray-400">อีเมล</p></div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-500"><Phone className="w-4 h-4" /></div>
                                    <div><p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.phone || "ไม่ระบุ"}</p><p className="text-xs text-gray-500 dark:text-gray-400">เบอร์โทรศัพท์</p></div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openLiveChat(ticket); }}
                                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors shadow-sm disabled:opacity-50"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  แชทสดกับผู้ใช้
                                </button>
                                {ticket.resolutionComment && (
                                  <div className="space-y-2">
                                    <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> รายละเอียดการแก้ไข</h5>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap break-words">{ticket.resolutionComment}</div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status History */}
                            {ticket.statusHistory && ticket.statusHistory.length > 0 && <StatusTimeline history={ticket.statusHistory} />}

                            {/* Delete Button */}
                            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700/60">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket); }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl text-xs font-semibold transition-colors border border-red-200 dark:border-red-800/60 shadow-sm"
                              >
                                <Trash2 className="w-4 h-4" /> ลบ Ticket
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Load More */}
        {pagination?.hasMore && (
          <div className="flex justify-center pt-4">
            <button className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm rounded-xl transition-colors">โหลดเพิ่มเติม</button>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      <ResolveModal
        isOpen={resolveTarget !== null}
        onClose={() => setResolveTarget(null)}
        onSubmit={(comment, files) => {
          if (resolveTarget) {
            const ticket = tickets.find(t => t.ticketId === resolveTarget);
            const targetStatus = ticket?.status === 'in_progress' ? 'waiting_user_confirm' : 'resolved';
            resolveTicket(resolveTarget, comment, targetStatus, files);
          }
        }}
        isSubmitting={isSubmitting}
      />
    </MainLayout>
  );
};

export default EscalatedIssues;
