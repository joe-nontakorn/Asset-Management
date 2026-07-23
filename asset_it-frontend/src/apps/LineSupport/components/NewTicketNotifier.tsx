// src/apps/LineSupport/components/NewTicketNotifier.tsx
import { useEffect, useState, useRef } from "react";
import { X, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addNotification } from "../../../utils/notificationUtils";

interface TicketData {
  _id: string;
  ticketId: string;
  name: string;
  issueSummary: string;
  reportedAt: string;
  status: string;
}

export default function NewTicketNotifier() {
  const [newTickets, setNewTickets] = useState<TicketData[]>([]);
  const lastCheckRef = useRef<string | null>(null);

  useEffect(() => {
    // Initial fetch to mark existing tickets so we don't notify old ones
    const initFetch = async () => {
      try {
        const res = await fetch("/line-api/tickets?limit=20");
        const json = await res.json();

        if (json.success && json.data && json.data.tickets) {
          const tickets = json.data.tickets as TicketData[];
          if (tickets.length > 0) {
            // Sort by reportedAt descending to get the newest
            const sorted = tickets.sort((a, b) =>
              new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
            );
            lastCheckRef.current = sorted[0].reportedAt || new Date().toISOString();
          } else {
            lastCheckRef.current = new Date().toISOString();
          }
        } else {
          lastCheckRef.current = new Date().toISOString();
        }
      } catch (err) {
        console.error("Init NewTicketNotifier error:", err);
        lastCheckRef.current = new Date().toISOString();
      }
    };

    initFetch();

    const interval = setInterval(async () => {
      if (!lastCheckRef.current) return;
      try {
        const res = await fetch("/line-api/tickets?limit=20");
        const json = await res.json();

        if (json.success && json.data && json.data.tickets) {
          const tickets = json.data.tickets as TicketData[];

          // Filter tickets created after our last check
          // and we only want to notify for "pending" tickets (new ones)
          const newlyCreated = tickets.filter(t =>
            t.status === "pending" &&
            t.reportedAt &&
            new Date(t.reportedAt) > new Date(lastCheckRef.current!)
          );

          if (newlyCreated.length > 0) {
            // Sort so the most recent is first
            const sorted = newlyCreated.sort((a, b) =>
              new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
            );

            // Update last timestamp
            lastCheckRef.current = sorted[0].reportedAt;

            // Add to notification stack (UI Toast)
            setNewTickets(prev => [...prev, ...newlyCreated]);

            // Trigger notification history refresh in Header
            addNotification();
          }
        }
      } catch (err) {
        console.error("Polling new tickets failed:", err);
      }
    }, 5000); // Check every 5s

    return () => clearInterval(interval);
  }, []);

  // auto remove oldest toast after 8 seconds
  useEffect(() => {
    if (newTickets.length > 0) {
      const timer = setTimeout(() => {
        setNewTickets(prev => prev.slice(1));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [newTickets]);

  const dismiss = (id: string) => {
    setNewTickets(prev => prev.filter(t => t._id !== id));
  };

  if (newTickets.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {newTickets.map(ticket => (
          <motion.div
            key={ticket._id}
            initial={{ opacity: 0, x: 80, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.85, transition: { duration: 0.25 } }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-orange-700 rounded-2xl shadow-2xl shadow-orange-500/20 dark:shadow-orange-500/10 overflow-hidden pointer-events-auto"
          >
            {/* Gradient Accent Top Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500" />

            <div className="p-5 flex items-start gap-4 pr-12">
              {/* Large Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                <Ticket className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  🎫 มี Ticket ใหม่เข้ามา!
                </h4>
                <div className="space-y-1.5">
                  <p className="text-sm text-gray-700 dark:text-gray-200 font-medium break-words">
                    {ticket.issueSummary || "ไม่มีหัวข้อปัญหา"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-orange-700 dark:text-orange-400">ผู้แจ้ง:</span> {ticket.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    ID: {ticket.ticketId || ticket._id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <div className="h-1 w-full bg-gray-100 dark:bg-gray-700">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
                className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-r"
              />
            </div>

            {/* Close Button */}
            <button
              onClick={() => dismiss(ticket._id)}
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
