// File: src/pages/LineSupport/LineSupportDashboard.tsx
import { useEffect, useState, useCallback } from "react";
import MainLayout from "../../../layouts/MainLayout";
import { motion } from "framer-motion";
import {
  Users, CheckCircle, AlertTriangle, RefreshCw,
  TrendingUp, Bot, Ticket, Clock,
} from "lucide-react";

// Components & types from LineSupportComponents
import { type Stats, type TicketsStats, type Issue, type RatingItem, type TrendItem, type ActivityItem, LINE_API_BASE } from "./LineSupportComponents/types";
import { StatCardCustom, ResolutionPieChart, RatingBarChart, TrendsChart, ActivityFeed, TopIssuesTable, DepartmentChart } from "./LineSupportComponents/DashboardComponents";

// ============== Main Component ==============
const LineSupportDashboard = () => {
  // State
  const [stats, setStats] = useState<Stats | null>(null);
  const [tickets, setTickets] = useState<TicketsStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch functions
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${LINE_API_BASE}/stats`);
      const json = await res.json();
      setStats(json.data);
    } catch (err) { console.error("Error fetching stats:", err); }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch(`${LINE_API_BASE}/tickets`);
      const json = await res.json();
      const ticketsArray: { status: string }[] = json.data?.tickets || [];
      setTickets({
        total: ticketsArray.length,
        pending: ticketsArray.filter((t) => t.status === "pending").length,
        inProgress: ticketsArray.filter((t) => t.status === "in_progress").length,
        waitingUserConfirm: ticketsArray.filter((t) => t.status === "waiting_user_confirm").length,
        resolved: ticketsArray.filter((t) => t.status === "resolved").length,
      });
    } catch (err) { console.error("Error fetching tickets:", err); }
  }, []);

  const fetchIssues = useCallback(async () => {
    try {
      const res = await fetch(`${LINE_API_BASE}/stats/issues?limit=10`);
      const json = await res.json();
      setIssues(json.data);
    } catch (err) { console.error("Error fetching issues:", err); }
  }, []);

  const fetchRatings = useCallback(async () => {
    try {
      const res = await fetch(`${LINE_API_BASE}/stats/ratings`);
      const json = await res.json();
      setRatings(json.data);
    } catch (err) { console.error("Error fetching ratings:", err); }
  }, []);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await fetch(`${LINE_API_BASE}/stats/trends`);
      const json = await res.json();
      setTrends(json.data);
    } catch (err) { console.error("Error fetching trends:", err); }
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`${LINE_API_BASE}/stats/activity`);
      const json = await res.json();
      setActivities(json.data);
    } catch (err) { console.error("Error fetching activity:", err); }
  }, []);

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchStats(), fetchTickets(), fetchIssues(), fetchRatings(), fetchTrends(), fetchActivity()]);
      } catch {
        setError("ไม่สามารถเชื่อมต่อกับ Line Support API ได้");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [fetchStats, fetchTickets, fetchIssues, fetchRatings, fetchTrends, fetchActivity]);

  // Refresh
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchTickets(), fetchIssues(), fetchRatings(), fetchTrends(), fetchActivity()]);
    setLoading(false);
  };

  // Computed values
  const averageRating = (() => {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, item) => sum + item.rating * item.count, 0);
    const count = ratings.reduce((sum, item) => sum + item.count, 0);
    return count > 0 ? (total / count).toFixed(1) : 0;
  })();

  const resolutionPieData = tickets
    ? [
        { name: "แก้ไขเสร็จสมบูรณ์", value: tickets.resolved, status: "resolved" as const },
        { name: "รอผู้แจ้งตรวจสอบ", value: tickets.waitingUserConfirm, status: "waiting_user_confirm" as const },
        { name: "กำลังดำเนินงาน", value: tickets.inProgress, status: "in_progress" as const },
        { name: "รอดำเนินการ", value: tickets.pending, status: "pending" as const },
      ]
    : [];

  const ticketResolutionRate = tickets && tickets.total > 0 ? ((tickets.resolved / tickets.total) * 100).toFixed(1) : "0";

  // ============== Loading ==============
  if (loading && !stats) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-800 animate-spin border-t-indigo-500" />
              <Bot className="w-7 h-7 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">กำลังโหลดข้อมูล Line Support AI...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ============== Error ==============
  if (error && !stats) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">เชื่อมต่อไม่สำเร็จ</h3>
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
      <div className="p-2 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Line Support AI</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard สำหรับดูข้อมูลการใช้งาน LINE IT Support Bot</p>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> รีเฟรช
          </button>
        </motion.div>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <StatCardCustom label="ผู้ใช้ทั้งหมด" value={stats?.totalUsers ?? 0} icon={<Users className="w-5 h-5" />} gradient="from-cyan-500 to-blue-600" shadow="shadow-cyan-500/20" />
          <StatCardCustom label="Tickets ทั้งหมด" value={tickets?.total ?? 0} icon={<Ticket className="w-5 h-5" />} gradient="from-indigo-500 to-purple-600" shadow="shadow-indigo-500/20" />
          <StatCardCustom label="รอดำเนินการ" value={tickets?.pending ?? 0} icon={<AlertTriangle className="w-5 h-5" />} gradient="from-amber-500 to-orange-600" shadow="shadow-amber-500/20" />
          <StatCardCustom label="กำลังดำเนินงาน" value={tickets?.inProgress ?? 0} icon={<TrendingUp className="w-5 h-5" />} gradient="from-blue-500 to-sky-600" shadow="shadow-blue-500/20" />
          <StatCardCustom label="รอผู้แจ้งตรวจสอบ" value={tickets?.waitingUserConfirm ?? 0} icon={<Users className="w-5 h-5" />} gradient="from-purple-500 to-pink-600" shadow="shadow-purple-500/20" />
          <StatCardCustom label="แก้ไขเสร็จสมบูรณ์" value={tickets?.resolved ?? 0} icon={<CheckCircle className="w-5 h-5" />} gradient="from-emerald-500 to-green-600" shadow="shadow-emerald-500/20" />
          <StatCardCustom label="เวลาแก้เฉลี่ย (ชม.)" value={stats?.averageResolutionTime ?? "0"} icon={<Clock className="w-5 h-5" />} gradient="from-rose-500 to-red-600" shadow="shadow-rose-500/20" />
        </motion.div>

        {/* Charts Row 1: Resolution + Rating */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResolutionPieChart data={resolutionPieData} rate={ticketResolutionRate} />
          <RatingBarChart ratings={ratings} averageRating={averageRating} />
        </motion.div>

        {/* Charts Row 2: Trends + Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <TrendsChart trends={trends} />
          <ActivityFeed activities={activities} />
        </motion.div>

        {/* Charts Row 3: Issues + Departments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TopIssuesTable issues={issues} />
          <DepartmentChart departments={stats?.departmentStats || []} />
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default LineSupportDashboard;
