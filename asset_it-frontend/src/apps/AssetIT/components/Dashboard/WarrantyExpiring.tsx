// file: frontend/src/components/Dashboard/WarrantyExpiring.tsx
// ตารางแสดงรายการทรัพย์สินที่ใกล้หมดประกัน + หมดแล้ว
// ใช้ข้อมูลจาก /api/assets/search

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ShieldX, ShieldCheck, Loader2 } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

interface AssetItem {
  id: number;
  asset_no: string;
  serial_no: string;
  name: string;
  brand: string;
  model: string;
  type_name: string;
  subtype_name: string;
  status: string;
  employee_name: string | null;
  location_name: string;
  warranty_expiry: string;
  purchase_date: string;
}

type FilterTab = "urgent" | "expired" | "active";

const WarrantyExpiring = () => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("urgent");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/api/assets/search`);
        const data = await res.json();
        if (data.data) {
          const active = (data.data as AssetItem[]).filter(
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
  const ninetyDays = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  const expired = assets.filter((a) => new Date(a.warranty_expiry) < today);
  const urgent = assets
    .filter((a) => {
      const exp = new Date(a.warranty_expiry);
      return exp >= today && exp <= ninetyDays;
    })
    .sort(
      (a, b) =>
        new Date(a.warranty_expiry).getTime() - new Date(b.warranty_expiry).getTime()
    );
  const active = assets
    .filter((a) => new Date(a.warranty_expiry) > ninetyDays)
    .sort(
      (a, b) =>
        new Date(a.warranty_expiry).getTime() - new Date(b.warranty_expiry).getTime()
    );

  const displayList =
    activeTab === "urgent" ? urgent : activeTab === "expired" ? expired : active;

  const tabs: { key: FilterTab; label: string; count: number; icon: React.ReactNode; color: string }[] = [
    {
      key: "urgent",
      label: "ใกล้หมดประกัน (≤90 วัน)",
      count: urgent.length,
      icon: <ShieldAlert size={14} />,
      color: "text-amber-600 dark:text-amber-400 border-amber-500",
    },
    {
      key: "expired",
      label: "หมดประกันแล้ว",
      count: expired.length,
      icon: <ShieldX size={14} />,
      color: "text-rose-600 dark:text-rose-400 border-rose-500",
    },
    {
      key: "active",
      label: "ยังมีประกัน (>90 วัน)",
      count: active.length,
      icon: <ShieldCheck size={14} />,
      color: "text-emerald-600 dark:text-emerald-400 border-emerald-500",
    },
  ];

  const formatThaiDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const getDaysText = (dateStr: string) => {
    const exp = new Date(dateStr);
    const diff = Math.ceil(
      (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return { text: `หมด ${Math.abs(diff)} วัน`, isExpired: true, days: diff };
    if (diff === 0) return { text: "หมดวันนี้!", isExpired: true, days: 0 };
    const years = Math.floor(diff / 365);
    const months = Math.floor((diff % 365) / 30);
    if (years > 0) return { text: `${years} ปี ${months > 0 ? `${months} ด.` : ""}`, isExpired: false, days: diff };
    if (months > 0) return { text: `${months} เดือน`, isExpired: false, days: diff };
    return { text: `${diff} วัน`, isExpired: false, days: diff };
  };

  const getStatusBadgeColor = (days: number) => {
    if (days <= 0) return "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300";
    if (days <= 30) return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400";
    if (days <= 90) return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
  };

  const getAssetStatusText = (status: string) => {
    switch (status) {
      case "available": return "สำรอง";
      case "in_use": return "ใช้งาน";
      case "broken": return "เสีย";
      case "retired": return "รอจำหน่าย";
      default: return status;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md text-gray-800 dark:text-gray-100 dark:border dark:border-gray-700 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldAlert size={20} className="text-amber-500" />
            รายละเอียดการรับประกัน
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            ข้อมูลวันหมดประกันทรัพย์สินทั้งหมด
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? tab.color
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.key
                  ? "bg-current/10"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <ShieldCheck size={36} className="mx-auto mb-3 text-emerald-400" />
          <p className="text-sm font-medium">ไม่มีรายการในหมวดนี้</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-800">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase text-center">
                  #
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase text-left">
                  Asset No
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase text-left">
                  อุปกรณ์
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase text-left">
                  ประเภท
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase text-left">
                  ผู้ใช้งาน
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase text-center">
                  สถานะ
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase text-center">
                  วันหมดประกัน
                </th>
                <th className="px-2 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase text-center">
                  เวลาคงเหลือ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayList.map((a, idx) => {
                const info = getDaysText(a.warranty_expiry);
                return (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/update-asset/${a.serial_no}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <td className="px-2 py-2.5 text-[11px] text-gray-400 text-center">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-2.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {a.asset_no}
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="text-[11px] font-medium text-gray-900 dark:text-white">
                        {a.brand}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        {a.model}
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400 font-bold uppercase">
                        {a.type_name}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-[11px] text-gray-600 dark:text-gray-400">
                      {a.employee_name || "-"}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full font-bold">
                        {getAssetStatusText(a.status)}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-[11px] text-center text-gray-600 dark:text-gray-400">
                      {formatThaiDate(a.warranty_expiry)}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeColor(
                          info.days
                        )}`}
                      >
                        {info.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WarrantyExpiring;
