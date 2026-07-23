// File: src/pages/LineSupport/users.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayout";
import { motion } from "framer-motion";
import {
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  // Bot,
  AlertTriangle,
} from "lucide-react";

// ============== Types ==============
interface User {
  _id: string;
  lineUserId: string;
  name: string;
  employeeId: string;
  department: string;
  isActive?: boolean;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============== Constants ==============
const LINE_API_BASE = "/line-api";

// ============== Component ==============
const LineSupportUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = useCallback(async (pageNum: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${LINE_API_BASE}/users?page=${pageNum}&limit=30&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setUsers(json.data.users);
      setPagination(json.data.pagination);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("ไม่สามารถเชื่อมต่อกับ Line Support API ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  const prevSearchTermRef = useRef(searchTerm);

  // Fetch users when page or searchTerm changes (with debounce for search)
  useEffect(() => {
    const isSearchChange = prevSearchTermRef.current !== searchTerm;
    
    const delayDebounceFn = setTimeout(() => {
      // If search term changed, always fetch page 1 regardless of current page state
      // This prevents fetching a high page number of a filtered result set
      fetchUsers(isSearchChange ? 1 : page, searchTerm);
      prevSearchTermRef.current = searchTerm;
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, searchTerm, fetchUsers]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleRefresh = () => {
    fetchUsers(page, searchTerm);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Department color mapping
  const getDeptColor = (dept: string) => {
    const colors: Record<string, string> = {
      IT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
      HR: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
      Finance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      Marketing: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      Sales: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    };
    return colors[dept] || "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  };

  // Avatar gradient mapping
  // const getAvatarGradient = (index: number) => {
  //   const gradients = [
  //     "from-indigo-400 to-purple-500",
  //     "from-cyan-400 to-blue-500",
  //     "from-emerald-400 to-green-500",
  //     "from-rose-400 to-pink-500",
  //     "from-amber-400 to-orange-500",
  //     "from-violet-400 to-fuchsia-500",
  //   ];
  //   return gradients[index % gradients.length];
  // };

  // We now use server-side filtering
  const filteredUsers = users;

  // ============== Error State ==============
  if (error && users.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">
              เชื่อมต่อไม่สำเร็จ
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-2 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                รายชื่อผู้ใช้งาน
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ผู้ใช้ LINE IT Support Bot ทั้งหมด
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {pagination?.total ?? "-"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ผู้ใช้ทั้งหมด</p>
            </div>
          </div>
          {/* <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {pagination?.totalPages ?? "-"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">จำนวนหน้า</p>
            </div>
          </div> */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {filteredUsers.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ผลลัพธ์ที่แสดง</p>
            </div>
          </div> */}
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, LINE User ID หรือแผนก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-sm"
            />
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-4 font-semibold">#</th>
                  <th className="text-left px-6 py-4 font-semibold">ชื่อ</th>
                  <th className="text-left px-6 py-4 font-semibold">รหัสพนักงาน</th>
                  <th className="text-center px-6 py-4 font-semibold">สถานะ</th>
                  <th className="text-left px-6 py-4 font-semibold">แผนก</th>
                  <th className="text-left px-4 sm:px-6 py-4 font-semibold hidden md:table-cell">LINE User ID</th>
                  <th className="text-left px-4 sm:px-6 py-4 font-semibold hidden sm:table-cell">วันที่ลงทะเบียน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-3 border-cyan-200 dark:border-cyan-800 animate-spin border-t-cyan-500" />
                        <p className="text-gray-400 dark:text-gray-500 text-sm animate-pulse">
                          กำลังโหลดข้อมูล...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 dark:text-gray-500 text-sm">
                        {searchTerm ? "ไม่พบผู้ใช้ที่ตรงกับการค้นหา" : "ไม่พบข้อมูลผู้ใช้"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => {
                    const rowNum = ((pagination?.page ?? 1) - 1) * (pagination?.limit ?? 30) + index + 1;
                    return (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                      >
                        <td className="px-6 py-4 text-gray-400 dark:text-gray-500 font-mono text-xs">
                          {rowNum}
                        </td>
                        <td className="px-6 py-4">
                          <Link to={`/line-support/user/${user.lineUserId}`} state={{ userName: user.name, employeeId: user.employeeId }} className="font-medium text-gray-800 dark:text-gray-200 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                            {user.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                            {user.employeeId}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full ${user.isActive !== false ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"}`}>
                            {user.isActive !== false ? "ทำงานอยู่" : "ลาออก"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getDeptColor(user.department)}`}
                          >
                            {user.department}
                          </span>
                        </td>

                        <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                          <span className="text-gray-400 dark:text-gray-500 font-mono text-xs">
                            {user.lineUserId.slice(0, 20)}...
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">
                          {user.createdAt ? formatDate(user.createdAt) : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> ก่อนหน้า
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === pageNum
                        ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ถัดไป <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default LineSupportUsers;
