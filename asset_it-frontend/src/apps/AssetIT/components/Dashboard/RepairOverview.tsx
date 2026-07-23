// file: frontend/src/components/Dashboard/RepairOverview.tsx
// → WarrantyAlert — สรุปสถานะประกันทรัพย์สิน

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ShieldCheck, ShieldX, ShieldOff, Loader2, ChevronRight } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

interface AssetWarranty {
  id: number;
  asset_no: string;
  serial_no: string;
  name: string;
  brand: string;
  model: string;
  type_name: string;
  status: string;
  employee_name: string | null;
  location_name: string;
  warranty_expiry: string;
}

const WarrantyAlert = () => {
  const [assets, setAssets] = useState<AssetWarranty[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/api/assets/search`);
        const data = await res.json();
        if (data.data) {
          const active = (data.data as AssetWarranty[]).filter(
            (a) => a.status !== "disposed" && a.warranty_expiry
          );
          setAssets(active);
        }
      } catch (err) {
        console.error("Failed to fetch warranty data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDays = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  const expired = assets.filter((a) => new Date(a.warranty_expiry) < today);
  const expiringIn30 = assets.filter((a) => {
    const exp = new Date(a.warranty_expiry);
    return exp >= today && exp <= thirtyDays;
  });
  const expiringIn90 = assets.filter((a) => {
    const exp = new Date(a.warranty_expiry);
    return exp > thirtyDays && exp <= ninetyDays;
  });
  const activeWarranty = assets.filter((a) => new Date(a.warranty_expiry) > ninetyDays);

  const summaryCards = [
    {
      label: "หมดประกัน",
      count: expired.length,
      color: "text-gray-500 dark:text-gray-400",
      bgColor: "bg-gray-50 dark:bg-gray-700/40",
      borderColor: "border-gray-200 dark:border-gray-600",
      icon: <ShieldOff size={18} />,
    },
    {
      label: "< 30 วัน",
      count: expiringIn30.length,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-500/10",
      borderColor: "border-rose-200 dark:border-rose-500/20",
      icon: <ShieldX size={18} />,
    },
    {
      label: "30-90 วัน",
      count: expiringIn90.length,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-500/10",
      borderColor: "border-amber-200 dark:border-amber-500/20",
      icon: <ShieldAlert size={18} />,
    },
    {
      label: "> 90 วัน",
      count: activeWarranty.length,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
      borderColor: "border-emerald-200 dark:border-emerald-500/20",
      icon: <ShieldCheck size={18} />,
    },
  ];

  const urgentList = [...expiringIn30, ...expiringIn90]
    .sort(
      (a, b) =>
        new Date(a.warranty_expiry).getTime() - new Date(b.warranty_expiry).getTime()
    )
    .slice(0, 5);

  const getDaysRemaining = (dateStr: string) => {
    const exp = new Date(dateStr);
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return `หมดแล้ว`;
    return `${diff} วัน`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm h-[480px] flex flex-col transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10">
            <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Warranty Status</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">สถานะการรับประกัน</p>
          </div>
        </div>
        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          {assets.length} รายการ
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gray-300 dark:text-gray-600" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Summary Grid */}
          <div className="grid grid-cols-4 gap-2 p-4">
            {summaryCards.map((s) => (
              <div
                key={s.label}
                className={`${s.bgColor} border ${s.borderColor} rounded-xl p-3 flex flex-col items-center gap-1 transition-all hover:scale-[1.02]`}
              >
                <div className={s.color}>{s.icon}</div>
                <span className={`text-xl font-extrabold ${s.color} tabular-nums`}>{s.count}</span>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 text-center leading-tight">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Urgent Header */}
          <div className="flex items-center justify-between px-5 py-2">
            <span className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              ⚠️ รายการเร่งด่วน
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {expiringIn30.length + expiringIn90.length} รายการ
            </span>
          </div>

          {/* Urgent List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
            {urgentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShieldCheck size={28} className="mb-2 text-emerald-400" />
                <p className="text-xs font-medium">ไม่มีรายการเร่งด่วน 🎉</p>
              </div>
            ) : (
              urgentList.map((a) => {
                const daysLeft = Math.ceil(
                  (new Date(a.warranty_expiry).getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysLeft <= 30;

                return (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/update-asset/${a.serial_no}`)}
                    className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {a.asset_no}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200/60 dark:bg-gray-600 rounded text-gray-500 dark:text-gray-400 font-medium">
                          {a.type_name}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {a.brand} {a.model}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${
                          isUrgent
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        }`}
                      >
                        {getDaysRemaining(a.warranty_expiry)}
                      </span>
                      <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyAlert;
