// src/components/NewUserNotifier.tsx
import { useEffect, useState, useRef } from "react";
import { X, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addNotification } from "../../../utils/notificationUtils";

interface User {
  _id: string;
  name: string;
  employeeId: string;
  email?: string;
  createdAt: string;
}

export default function NewUserNotifier() {
  const [newUsers, setNewUsers] = useState<User[]>([]);
  const lastUpdateRef = useRef<string | null>(null);

  useEffect(() => {
    // Initial fetch to get the current latest user time so we don't alert old users on reload
    const initFetch = async () => {
      try {
        const res = await fetch("/line-api/users?page=1&limit=1");
        const json = await res.json();
        if (json.success && json.data.users.length > 0) {
          lastUpdateRef.current = json.data.users[0].createdAt;
        } else {
          lastUpdateRef.current = new Date().toISOString();
        }
      } catch (err) {
        console.error("Init NewUserNotifier error:", err);
        lastUpdateRef.current = new Date().toISOString();
      }
    };

    initFetch();

    const interval = setInterval(async () => {
      if (!lastUpdateRef.current) return;
      try {
        // Fetch recent users
        const res = await fetch("/line-api/users?page=1&limit=10");
        const json = await res.json();

        if (json.success && json.data.users) {
          const fetchedUsers = json.data.users as User[];

          // filter users who registered after our last check
          const newlyRegistered = fetchedUsers.filter(
            u => new Date(u.createdAt) > new Date(lastUpdateRef.current!)
          );

          if (newlyRegistered.length > 0) {
            // Update last timestamp to the newest user in the list (index 0 is newest)
            lastUpdateRef.current = newlyRegistered[0].createdAt;

            // Add to notification stack (UI Toast)
            setNewUsers(prev => [...prev, ...newlyRegistered]);

            // Trigger notification history refresh in Header
            addNotification();
          }
        }
      } catch (err) {
        console.error("Polling new users failed:", err);
      }
    }, 5000); // Check every 5s

    return () => clearInterval(interval);
  }, []);

  // auto remove oldest toast after 10 seconds
  useEffect(() => {
    if (newUsers.length > 0) {
      const timer = setTimeout(() => {
        setNewUsers(prev => prev.slice(1));
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [newUsers]);

  const dismiss = (id: string) => {
    setNewUsers(prev => prev.filter(u => u._id !== id));
  };

  if (newUsers.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {newUsers.map(user => (
          <motion.div
            key={user._id}
            initial={{ opacity: 0, x: 80, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.85, transition: { duration: 0.25 } }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 rounded-2xl shadow-2xl shadow-blue-500/20 dark:shadow-blue-500/10 overflow-hidden pointer-events-auto"
          >
            {/* Gradient Accent Top Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-sky-500 to-indigo-500" />

            <div className="p-5 flex items-start gap-4 pr-12">
              {/* Large Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-sky-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                <UserPlus className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  🎉 มีผู้ใช้ใหม่ลงทะเบียน!
                </h4>
                <div className="space-y-1.5">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">รหัส:</span> {user.employeeId || "-"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">ชื่อ:</span> {user.name || "-"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 break-all">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">Email:</span> {user.email || "ไม่ระบุ"}
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <div className="h-1 w-full bg-gray-100 dark:bg-gray-700">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 10, ease: "linear" }}
                className="h-full bg-gradient-to-r from-blue-400 to-sky-500 rounded-r"
              />
            </div>

            {/* Close Button */}
            <button
              onClick={() => dismiss(user._id)}
              className="absolute top-4 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
