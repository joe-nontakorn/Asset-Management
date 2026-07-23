import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MainLayout from "../../../../layouts/MainLayout";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../../../../components/common/Card";
import {
  ChevronLeft,
  Trash2,
  Search,
  AlertCircle,
  Archive,
  MapPin,
  Eye,
  // CheckCircle2,
  XCircle
} from "lucide-react";

interface DisposedAssetItem {
  id: number;
  asset_no: string;
  serial_no: string;
  type_name: string;
  brand: string;
  model: string;
  subtype_name: string;
  description: string;
  name: string;
  status: string;
  employee_name: string;
  location_name: string;
  purchase_date: string;
  warranty_expiry: string;
  disposed_date: string;
  disposed_by?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface DisposedAssetData {
  asset: DisposedAssetItem;
  history: {
    date: string;
    from_employee: string | null;
    to_employee: string | null;
    from_location: string | null;
    to_location: string | null;
    duration: string;
    remarks: string;
  }[];
}


const apiUrl = import.meta.env.VITE_API_URL;

const DisposedAssets = () => {
  const [assets, setAssets] = useState<DisposedAssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState("");

  const [assetDetail, setAssetDetail] = useState<DisposedAssetData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filterType = searchParams.get("type") || "";
  const filterStatus = searchParams.get("status") || "";
  const filterLocation = searchParams.get("location") || "";
  const sortOrder = searchParams.get("sort") || "";

  const fetchAssets = async () => {
    try {
      setLoading(true);
      let url = `${apiUrl}/api/assets/search`;
      const params = new URLSearchParams();

      if (filterType) params.append("type_id", filterType);
      if (filterStatus) params.append("status", filterStatus);
      if (filterLocation) params.append("location_name", filterLocation);
      if (sortOrder) {
        params.append("sort_by", "purchase_date");
        params.append("order", sortOrder);
      }

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await fetch(url);
      const data = await res.json();

      const filteredData = (data.data || []).filter(
        (asset: DisposedAssetItem) => asset.status === "disposed"
      );
      setAssets(filteredData);
    } catch (error) {
      console.error("Error loading assets:", error);
      setAssets([]);
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [searchParams]);

  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const calculateRemainingWarranty = (expiry?: string): string => {
    if (!expiry) return "-";
    const today = new Date();
    const expDate = new Date(expiry);
    const diffTime = expDate.getTime() - today.getTime();
    if (diffTime < 0) return "หมดประกัน";

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    let result = "";
    if (years > 0) result += `${years} ปี `;
    if (months > 0) result += `${months} เดือน`;

    return result.trim() || "น้อยกว่า 1 เดือน";
  };

  const fetchAssetHistory = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/assets/${id}/history`);
      if (!res.ok) return;
      const data: ApiResponse<DisposedAssetData> = await res.json();
      if (data.success) {
        setAssetDetail(data.data);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to load asset history:", err);
    }
  };

  // const getStatusBadge = (status: string) => {
  //   return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
  // };

  // const getStatusIcon = (status: string) => {
  //   return <XCircle size={12} />;
  // };

  // const translateStatus = (status: string): string => {
  //   return "จำหน่ายแล้ว";
  // };

  const handleUpdateClick = (serialNo: string) => {
    navigate(`/update-asset/${serialNo}?${searchParams.toString()}`);
  };

  const filteredAssets = assets.filter(asset =>
    asset.asset_no?.toLowerCase().includes(keyword.toLowerCase()) ||
    asset.serial_no?.toLowerCase().includes(keyword.toLowerCase()) ||
    asset.brand?.toLowerCase().includes(keyword.toLowerCase()) ||
    asset.model?.toLowerCase().includes(keyword.toLowerCase()) ||
    asset.employee_name?.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <MainLayout>
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
          <div className="flex flex-col gap-4">
            {/* Top Row: Title and Main Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/AllAsset")}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="p-2 bg-rose-600/10 text-rose-600 rounded-xl dark:bg-rose-500/20 dark:text-rose-400">
                  <Trash2 size={20} />
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">รายการจำหน่ายแล้ว</h1>
              </div>
            </div>

            {/* Bottom Row: Search and Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  แสดงทั้งหมด {filteredAssets.length} รายการที่ถูกจำหน่ายออก
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <Search size={14} className="text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="ค้นหารายการจำหน่าย..."
                    className="bg-transparent border-none outline-none text-[11px] w-48 md:w-64"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">กำลังโหลดข้อมูลรายการจำหน่าย...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-700/30 text-left">
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">#</th>
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Asset No</th>
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Serial No</th>
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">ข้อมูล</th>
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">description</th>
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">ผู้ใช้ / สถานที่</th>
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">ประวัติการจำหน่าย</th>
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">การรับประกัน</th>
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-3 text-gray-400">
                        <Archive size={24} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">ไม่พบรายการที่จำหน่ายแล้ว</p>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset, index) => (
                    <tr key={asset.id} className="group hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors">
                      <td className="px-3 py-2.5 text-[11px] font-medium text-gray-400 text-center">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => fetchAssetHistory(asset.id)}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {asset.asset_no}
                          <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-600 dark:text-gray-300 font-mono">
                        {asset.serial_no}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">{asset.brand}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{asset.model}</span>
                          <div className="flex gap-1 mt-1">
                            <span className="text-[9px] px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400 uppercase font-bold">{asset.type_name}</span>
                            {asset.subtype_name && <span className="text-[9px] px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 uppercase font-bold">{asset.subtype_name}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 max-w-[150px]" title={asset.description || ""}>
                          {asset.description || "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-700 dark:text-gray-300">
                            <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-gray-400 text-[10px]">👤</span>
                            <span className="font-bold">{asset.employee_name || "ไม่มีผู้ใช้งาน"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <MapPin size={10} />
                            {asset.location_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">จำหน่ายแล้ว</span>
                          <span className="text-[9px] text-gray-400 italic">โดย: {asset.disposed_by || "Admin"}</span>
                          {asset.disposed_date && <span className="text-[9px] text-gray-400 italic">เมื่อ: {formatThaiDate(asset.disposed_date)}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 leading-tight">{calculateRemainingWarranty(asset.warranty_expiry)}</span>
                          <span className="text-[9px] text-gray-400 leading-tight">หมด: {formatThaiDate(asset.warranty_expiry)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => handleUpdateClick(asset.serial_no)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="แก้ไขข้อมูล"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal แสดงรายละเอียดทรัพย์สิน */}
      {isModalOpen && assetDetail && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 dark:text-gray-100 w-full max-w-4xl p-0 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Archive size={16} className="text-rose-500" />
                รายละเอียดทรัพย์สิน (จำหน่ายแล้ว)
              </h2>
              <button
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Asset No</span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{assetDetail.asset.asset_no}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Serial No</span>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{assetDetail.asset.serial_no}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">สถานะปัจจุบัน</span>
                  <p className="text-xs font-bold text-rose-600 uppercase">จำหน่ายแล้ว</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">แบรนด์/รุ่น</span>
                  <p className="text-sm text-gray-900 dark:text-white">{assetDetail.asset.brand} - {assetDetail.asset.model}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">ผู้ถือครอง</span>
                  <p className="text-sm text-gray-900 dark:text-white">{assetDetail.asset.employee_name || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">สถานที่</span>
                  <p className="text-sm text-gray-900 dark:text-white">{assetDetail.asset.location_name || "-"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">วันที่ซื้อ</span>
                  <p className="text-sm text-gray-900 dark:text-white">{formatThaiDate(assetDetail.asset.purchase_date)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">วันหมดประกัน</span>
                  <p className="text-sm text-gray-900 dark:text-white">{formatThaiDate(assetDetail.asset.warranty_expiry)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 mb-8">
                <div className="space-y-2 flex-1">
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <span className="text-blue-500">👥</span> เคยอยู่กับใครมาบ้าง
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(assetDetail.history
                      .filter(item => item.to_employee && item.to_employee !== "-")
                      .map(item => item.to_employee)
                    )].length > 0 ? (
                      [...new Set(assetDetail.history
                        .filter(item => item.to_employee && item.to_employee !== "-")
                        .map(item => item.to_employee)
                      )].map((employee, idx) => (
                        <span key={idx} className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
                          {employee}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <span className="text-emerald-500">📍</span> เคยอยู่ที่ไหนมาบ้าง
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(assetDetail.history
                      .filter(item => item.to_location && item.to_location !== "-")
                      .map(item => item.to_location)
                    )].length > 0 ? (
                      [...new Set(assetDetail.history
                        .filter(item => item.to_location && item.to_location !== "-")
                        .map(item => item.to_location)
                      )].map((location, idx) => (
                        <span key={idx} className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
                          {location}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <MapPin size={14} className="text-blue-500" />
                  ประวัติการใช้งานและสถานที่
                </h3>
                <div className="overflow-hidden border border-gray-100 dark:border-gray-700 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">วันที่</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">การเปลี่ยนแปลง</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">ระยะเวลา</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {assetDetail.history.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-4 py-3 text-[11px] text-gray-600 dark:text-gray-400">
                            {formatThaiDate(item.date)}
                          </td>
                          <td className="px-4 py-3 text-[11px]">
                            {item.from_employee && item.to_employee && item.from_employee !== item.to_employee ? (
                              <div className="flex flex-col">
                                <span className="text-rose-500 font-medium">จาก: {item.from_employee}</span>
                                <span className="text-emerald-500 font-bold">ไปยัง: {item.to_employee}</span>
                              </div>
                            ) : item.to_employee && item.to_employee !== "-" ? (
                              <span className="text-blue-600 dark:text-blue-400 font-bold">มอบหมายให้: {item.to_employee}</span>
                            ) : (
                              <span className="text-gray-500">อัปเดตข้อมูล</span>
                            )}
                            {item.to_location && (
                              <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                <MapPin size={10} /> {item.to_location}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[10px] text-center">
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500">
                              {item.duration || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
};

export default DisposedAssets;
