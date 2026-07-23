import { useState, useEffect, useRef } from "react";
import { User, ChevronDown, Sun, Moon, Menu, Bell, Trash2, Check, UserPlus, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  getNotificationHistory,
  markAsRead,
  markAllAsRead,
  clearHistory,
  type AppNotification
} from "../../utils/notificationUtils";

interface TokenPayload {
  id: number;
  role: string;
  exp: number;
}

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const loadNotifications = async () => {
    const data = await getNotificationHistory();
    setNotifications(data);
  };

  // ดึง role จาก token เมื่อโหลด component
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && typeof token === "string") {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        setRole(decoded.role);
      } catch {
        setRole(null);
      }
    } else {
      setRole(null);
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // Poll every 10s
    window.addEventListener("notifications-updated", loadNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-updated", loadNotifications);
    };
  }, []);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Theme configuration
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <header className="w-full h-16 bg-blue-600 dark:bg-gray-800 text-white flex items-center justify-between px-4 sm:px-6 shadow-md z-10 relative transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold truncate">IT Service Management</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors"
          title="Toggle Theme"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setDropdownOpen(false);
            }}
            className="p-2 rounded-full hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-blue-600 dark:border-gray-800 animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-[-60px] sm:right-0 mt-2 w-[320px] sm:w-[380px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-800 overflow-hidden ring-1 ring-black/5">
              {/* Notif Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="font-bold text-sm">การแจ้งเตือนล่าสุด</h3>
                <div className="flex gap-3">
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> อ่านทั้งหมด
                  </button>
                  <button
                    onClick={clearHistory}
                    className="text-[11px] font-semibold text-gray-400 hover:text-red-500 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> ล้าง
                  </button>
                </div>
              </div>

              {/* Notif List */}
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 dark:text-gray-500">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`px-5 py-4 flex gap-4 cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/40 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/40"}`}
                      >
                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                          n.type === "new_user"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-500"
                            : n.type === "new_ticket"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                          }`}>
                          {n.type === "new_user" ? (
                            <UserPlus className="w-5 h-5" />
                          ) : n.type === "new_ticket" ? (
                            <Bell className="w-5 h-5" />
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="text-sm font-bold truncate pr-2">{n.title}</p>
                            <span className="text-[10px] text-gray-400 font-medium shrink-0">{formatTime(n.timestamp)}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-normal line-clamp-2">
                            {n.content}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* View All Footer */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">แจ้งเตือนย้อนหลัง 50 รายการล่าสุด</p>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-1 focus:outline-none hover:bg-blue-700 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors duration-200"
          >
            <User className="w-5 h-5" />
            <span className="hidden sm:inline">{role ?? "Guest"}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl shadow-2xl z-20 border border-gray-200 dark:border-gray-800 overflow-hidden ring-1 ring-black/5">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">บัญชีผู้ใช้</p>
                <p className="text-sm font-bold truncate">{role ?? "Guest"}</p>
              </div>
              <div className="p-1">
                <button
                  className="w-full px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-left transition-colors duration-200 rounded-lg flex items-center gap-2 font-medium"
                  onClick={handleLogout}
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
