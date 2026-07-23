// file: frontend/src/components/Dashboard/RecentActivity.tsx

import { useEffect, useState } from "react";
import { Clock, ArrowRight, MapPin, User, RefreshCw, Loader2 } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

interface Activity {
    id: number;
    asset_no: string;
    asset_name: string;
    brand: string;
    model: string;
    date: string;
    date_thai: string;
    from_location_name: string | null;
    from_location_abbreviation: string | null;
    to_location_name: string | null;
    to_location_abbreviation: string | null;
    from_emp_name: string | null;
    to_emp_name: string | null;
}

const RecentActivity = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/dashboard/RecentActivity`);
            const data = await res.json();
            setActivities(data.data || []);
        } catch (error) {
            console.error("Error loading recent activity:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชม.ที่แล้ว`;
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
        return date.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm h-[480px] flex flex-col transition-colors duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                        <Clock size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">การเคลื่อนไหวล่าสุด</p>
                    </div>
                </div>
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {activities.length} รายการ
                </span>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-gray-300 dark:text-gray-600" />
                </div>
            ) : activities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <Clock size={32} className="mb-2" />
                    <p className="text-sm font-medium">ไม่มีประวัติล่าสุด</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                    {activities.slice(0, 20).map((a) => {
                        const isLocationChange = a.from_location_abbreviation !== a.to_location_abbreviation;
                        const isEmpChange = a.from_emp_name !== a.to_emp_name;
                        const isDataUpdate = !isLocationChange && !isEmpChange;

                        return (
                            <div
                                key={a.id}
                                className="group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                                        isLocationChange
                                            ? "bg-violet-50 dark:bg-violet-500/10 text-violet-500"
                                            : isEmpChange
                                            ? "bg-sky-50 dark:bg-sky-500/10 text-sky-500"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                                    }`}>
                                        {isLocationChange ? (
                                            <MapPin size={14} />
                                        ) : isEmpChange ? (
                                            <User size={14} />
                                        ) : (
                                            <RefreshCw size={14} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                                {a.asset_no}
                                            </span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                {a.brand} {a.model}
                                            </span>
                                        </div>

                                        {isLocationChange && (
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                                                <span className="font-medium text-rose-500 dark:text-rose-400">{a.from_location_abbreviation || "-"}</span>
                                                <ArrowRight size={10} className="text-gray-400" />
                                                <span className="font-medium text-emerald-600 dark:text-emerald-400">{a.to_location_abbreviation || "-"}</span>
                                            </div>
                                        )}
                                        {isEmpChange && (
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                                                <span className="text-gray-500">{a.from_emp_name || "-"}</span>
                                                <ArrowRight size={10} className="text-gray-400" />
                                                <span className="font-medium">{a.to_emp_name || "-"}</span>
                                            </div>
                                        )}
                                        {isDataUpdate && (
                                            <span className="text-[11px] text-gray-400 dark:text-gray-500 italic">แก้ไขข้อมูล</span>
                                        )}
                                    </div>

                                    {/* Time */}
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                                        {formatRelativeTime(a.date_thai)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RecentActivity;
