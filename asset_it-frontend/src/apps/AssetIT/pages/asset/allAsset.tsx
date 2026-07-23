// File: frontend/src/pages/asset/allAsset.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../../../layouts/MainLayout";
import Card from "../../../../components/common/Card";
// import PageHeader from "../../../../components/common/PageHeader";
import {
    Search,
    Download,
    Package,
    Clock,
    MapPin,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Edit3,
    Eye,
    Plus,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Archive
} from "lucide-react";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
import "../../../../assets/custom.css";

const apiUrl = import.meta.env.VITE_API_URL;

interface Asset {
    id: number;
    asset_no: string;
    serial_no: string;
    asset_name: string;
    brand: string;
    name: string;
    model: string;
    description?: string;
    status: string;
    emp_id: string | null;
    employee_name: string | null;
    employee_email: string | null;
    type_name: string;
    subtype_name: string;
    location_name: string;
    location_abbreviation: string;
    purchase_date?: string;
    warranty_expiry?: string;
}

interface AssetType {
    id: number;
    name: string;
}

interface AssetSubtype {
    id: number;
    name: string;
    type_id: number; // frontend expects this field; we'll map from asset_type_id returned by backend
}

interface BackendSubtypeRow {
    id: number;
    name?: string;
    asset_type_id?: number;
    type_id?: number;
}

// interface AssetHistoryItem {
//     date: string;
//     from_employee: string | null;
//     to_employee: string | null;
//     from_location: string | null;
//     to_location: string | null;
//     duration: string | null;
//     remarks?: string;
// }

interface AssetData {
    asset: {
        id: number;
        asset_no: string;
        serial_no: string;
        name: string;
        brand: string;
        model: string;
        type_id: number;
        status: string;
        emp_id: number | null;
        location_id: number;
        purchase_date: string;
        warranty_expiry: string;
        employee_name: string;
        location_name: string;
    };
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

const AllAsset = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    // State สำหรับเก็บรายการตัวเลือกใน Filter
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [assetSubtypes, setAssetSubtypes] = useState<AssetSubtype[]>([]);
    const [filteredSubtypes, setFilteredSubtypes] = useState<AssetSubtype[]>([]);
    const [locations, setLocations] = useState<string[]>([]);

    const navigate = useNavigate();
    const [assetDetail, setAssetDetail] = useState<AssetData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();

    // รับค่าจาก URL
    const filterType = searchParams.get("type") || "";
    const filterSubtype = searchParams.get("subtype") || "";
    const filterStatus = searchParams.get("status") || "";
    const filterLocation = searchParams.get("location") || "";
    const sortOrder = searchParams.get("sort") || "";
    const keyword = searchParams.get("search") || "";

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 200;

    const updateFilter = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (value) newParams.set(key, value);
        else newParams.delete(key);
        setSearchParams(newParams);
        setCurrentPage(1);
    };

    // ========== Assets ==========
    const fetchAssets = async () => {
        try {
            setLoading(true);
            let url = `${apiUrl}/api/assets/search`;
            const params = new URLSearchParams();

            if (filterType) params.append("type_id", filterType);
            if (filterSubtype) params.append("subtype_id", filterSubtype);
            if (filterStatus) params.append("status", filterStatus);
            if (filterLocation) params.append("location_name", filterLocation);

            if (sortOrder) {
                params.append("sort_by", "purchase_date");
                params.append("order", sortOrder);
            }

            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;

            const res = await fetch(url);

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.warn(`fetchAssets: non-OK response ${res.status} ${res.statusText}`, text);
                setAssets([]);
                return;
            }

            let data: ApiResponse<Asset[]>;
            try {
                data = await res.json();
            } catch (parseErr) {
                const text = await res.text().catch(() => "");
                console.error("fetchAssets: response not valid JSON:", text, parseErr);
                setAssets([]);
                return;
            }

            const filteredData = (data.data || []).filter((asset: Asset) => asset.status !== 'disposed');
            setAssets(filteredData);
        } catch (error) {
            console.error("Error loading assets:", error);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    };

    // ========== Filter options ==========
    // ดึง asset types + locations (ไม่ดึง subtypes ที่นี่แล้ว)
    // วิธีแก้ไข 1: Type assertion
    const fetchFilterOptions = async () => {
        try {
            // Asset Types
            const typeRes = await fetch(`${apiUrl}/api/assets/types-id`);
            if (!typeRes.ok) {
                const t = await typeRes.text().catch(() => "");
                console.warn("Could not fetch types:", typeRes.status, t);
                setAssetTypes([]);
            } else {
                try {
                    const typeData = await typeRes.json();
                    setAssetTypes(typeData.data || []);
                } catch (e) {
                    console.warn("types response not JSON:", e);
                    setAssetTypes([]);
                }
            }

            // Locations: ใช้ /api/assets/search เพื่อดึง unique locations และเรียงตามตัวอักษร
            const allAssetsRes = await fetch(`${apiUrl}/api/assets/search`);
            if (!allAssetsRes.ok) {
                const t = await allAssetsRes.text().catch(() => "");
                console.warn("Could not fetch all assets for locations:", allAssetsRes.status, t);
                setLocations([]);
            } else {
                try {
                    const allAssetsData: ApiResponse<Asset[]> = await allAssetsRes.json();
                    if (allAssetsData.data) {
                        const uniqueLocations = [...new Set(allAssetsData.data.map((a: Asset) => a.location_name).filter(Boolean))] as string[];
                        // เรียงตามตัวอักษร (ภาษาไทย/อังกฤษ)
                        const sortedLocations = uniqueLocations.sort((a, b) => a.localeCompare(b, 'th'));
                        setLocations(sortedLocations);
                    }
                } catch (e) {
                    console.warn("all assets response not JSON:", e);
                    setLocations([]);
                }
            }
        } catch (error) {
            console.error("Error loading filter options:", error);
        }
    };
    // ========== Subtypes per type ==========
    // ========== Subtypes per type ==========
    const fetchSubtypesByType = async (typeId: string) => {
        if (!typeId) {
            setAssetSubtypes([]);
            return;
        }
        try {
            const res = await fetch(`${apiUrl}/api/assets/subtypes-id?type_id=${typeId}`);
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                console.warn("Could not fetch subtypes:", res.status, txt);
                setAssetSubtypes([]);
                return;
            }
            let data: unknown;
            try {
                data = await res.json();
            } catch (err) {
                const txt = await res.text().catch(() => "");
                console.error("subtypes response not JSON:", txt, err);
                setAssetSubtypes([]);
                return;
            }

            // Type guard function to validate the response structure
            const isValidResponse = (value: unknown): value is { data: BackendSubtypeRow[] } => {
                return (
                    typeof value === 'object' &&
                    value !== null &&
                    'data' in value &&
                    Array.isArray((value as { data: unknown }).data)
                );
            };

            // Use type guard to safely extract data
            const rows = isValidResponse(data) ? data.data : [];

            const mapped: AssetSubtype[] = rows.map((r) => ({
                id: Number(r.id),
                name: String(r.name ?? ""),
                // normalize possible backend field names to frontend `type_id`
                type_id: Number(r.asset_type_id ?? r.type_id ?? 0)
            }));

            setAssetSubtypes(mapped);
        } catch (err) {
            console.warn("Could not fetch subtypes (network):", err);
            setAssetSubtypes([]);
        }
    };

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
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                console.warn(`fetchAssetHistory: non-OK ${res.status}`, txt);
                return;
            }
            let data: ApiResponse<AssetData>;
            try {
                data = await res.json();
            } catch (err) {
                const txt = await res.text().catch(() => "");
                console.error("fetchAssetHistory: response not JSON:", txt, err);
                return;
            }
            if (data.success) {
                setAssetDetail(data.data);
                setIsModalOpen(true);
            } else {
                console.warn("fetchAssetHistory: success flag false", data);
            }
        } catch (err) {
            console.error("Failed to load asset history:", err);
        }
    };

    useEffect(() => {
        if (filterType && assetSubtypes.length > 0) {
            const filtered = assetSubtypes.filter(subtype =>
                subtype.type_id === parseInt(filterType)
            );
            setFilteredSubtypes(filtered);

            // ตรวจสอบว่า subtype ปัจจุบันยังใช้ได้กับ type ที่เลือกหรือไม่
            if (filterSubtype) {
                const isCurrentSubtypeValid = filtered.some(sub => sub.id === parseInt(filterSubtype));
                if (!isCurrentSubtypeValid) {
                    updateFilter("subtype", "");
                }
            }
        } else {
            setFilteredSubtypes([]);
            // แก้ไข: ไม่ควร reset subtype ถ้า type ยังไม่ได้เลือก หรือกำลังโหลดข้อมูล
            // เฉพาะเมื่อมั่นใจว่าไม่มี subtypes สำหรับ type นี้
            if (filterType && assetSubtypes.length > 0 && filterSubtype) {
                updateFilter("subtype", "");
            }
        }
    }, [filterType, assetSubtypes, filterSubtype]); // เพิ่ม filterSubtype เป็น dependency

    // เพิ่ม useEffect เพื่อโหลด subtypes เมื่อ component mount และมี filterType ใน URL
    useEffect(() => {
        // ถ้ามี filterType ใน URL เมื่อ component mount ให้โหลด subtypes
        if (filterType && assetSubtypes.length === 0) {
            fetchSubtypesByType(filterType);
        }
    }, []); // ทำงานครั้งเดียวเมื่อ component mount

    // แก้ไข useEffect สำหรับ filterType
    useEffect(() => {
        if (filterType) {
            fetchSubtypesByType(filterType);
        } else {
            setAssetSubtypes([]);
            setFilteredSubtypes([]);
            // รีเซ็ต subtype เฉพาะเมื่อ type ถูกล้าง
            if (filterSubtype) updateFilter("subtype", "");
        }
    }, [filterType]); // ลบ dependency อื่นๆ ออก

    // ปรับปรุงการนำทางไปหน้า update ให้ส่ง searchParams ไปด้วย
    const handleUpdateClick = (serialNo: string) => {
        navigate(`/update-asset/${serialNo}?${searchParams.toString()}`);
    };

    // เรียกครั้งแรก
    useEffect(() => {
        fetchFilterOptions();
    }, []);

    // เมื่อ filter เปลี่ยน
    useEffect(() => {
        fetchAssets();
    }, [filterType, filterSubtype, filterStatus, filterLocation, sortOrder]);

    // Helper functions (status color / text) ... (เหมือนเดิม)
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
            case 'in_use':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'broken':
                return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
            case 'retired':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'disposed':
                return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'available':
            case 'in_use':
                return <CheckCircle2 size={12} />;
            case 'broken':
                return <AlertCircle size={12} />;
            case 'retired':
                return <Archive size={12} />;
            case 'disposed':
                return <XCircle size={12} />;
            default:
                return <CheckCircle2 size={12} />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'available':
                return 'สำรอง';
            case 'in_use':
                return 'ใช้งานอยู่';
            case 'broken':
                return 'เสีย';
            case 'retired':
                return 'รอจำหน่าย';
            case 'disposed':
                return 'จำหน่าย';
            default:
                return status;
        }
    };

    const filteredAssets = assets.filter(asset =>
        asset.asset_name?.toLowerCase().includes(keyword.toLowerCase()) ||
        asset.name?.toLowerCase().includes(keyword.toLowerCase()) ||
        asset.asset_no?.toLowerCase().includes(keyword.toLowerCase()) ||
        asset.serial_no?.toLowerCase().includes(keyword.toLowerCase()) ||
        asset.model?.toLowerCase().includes(keyword.toLowerCase()) ||
        asset.brand?.toLowerCase().includes(keyword.toLowerCase()) ||
        asset.employee_name?.toLowerCase().includes(keyword.toLowerCase()) ||
        asset.employee_email?.toLowerCase().includes(keyword.toLowerCase()) ||
        asset.location_name?.toLowerCase().includes(keyword.toLowerCase())
    );

    const sortedAssets = [...filteredAssets].sort((a, b) => {
        if (!sortOrder) return 0;
        const dateA = new Date(a.purchase_date || '1970-01-01').getTime();
        const dateB = new Date(b.purchase_date || '1970-01-01').getTime();

        if (sortOrder === 'asc') {
            return dateA - dateB;
        } else if (sortOrder === 'desc') {
            return dateB - dateA;
        }
        return 0;
    });

    const handleExportCSV = () => {
        if (sortedAssets.length === 0) return;

        const csvRows: string[] = [];
        const headers = [
            "Asset No",
            "Serial No",
            "ประเภท",
            "ประเภทย่อย",
            "brands",
            "รุ่น",
            "สถานะ",
            "ผู้ใช้งาน",
            "สถานที่",
            "วันที่ซื้อ",
            "วันหมดประกัน",
            "เหลือเวลา"
        ];
        csvRows.push(headers.join(","));

        for (const a of sortedAssets) {
            csvRows.push([
                a.asset_no ?? "-",
                a.serial_no ?? "-",
                a.type_name ?? "-",
                a.subtype_name ?? "-",
                a.brand ?? "-",
                (a.model ? a.model.replace(/,/g, " ") : "-"),
                getStatusText(a.status ?? "-"),
                a.employee_name ?? "-",
                a.location_name ?? "-",
                formatThaiDate(a.purchase_date),
                formatThaiDate(a.warranty_expiry),
                calculateRemainingWarranty(a.warranty_expiry)
            ].join(","));
        }

        const BOM = "\uFEFF";
        const csvString = BOM + csvRows.join("\n");

        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "assets.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const totalItems = sortedAssets.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAssets = sortedAssets.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const goToPrevPage = () => { if (currentPage > 1) goToPage(currentPage - 1); };
    const goToNextPage = () => { if (currentPage < totalPages) goToPage(currentPage + 1); };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        const end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <MainLayout>
            <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
                    <div className="flex flex-col gap-4">
                        {/* Top Row: Title and Main Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl dark:bg-blue-500/20 dark:text-blue-400">
                                    <Package size={20} />
                                </div>
                                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">จัดการทรัพย์สิน</h1>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate("/disposed-asset")}
                                    className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                >
                                    <Clock size={16} />
                                    รายการจำหน่าย
                                </button>
                                <button
                                    onClick={() => navigate("/AddAsset")}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                >
                                    <Plus size={16} />
                                    เพิ่มทรัพย์สิน
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row: Filters, Search and Export */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 mr-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Filters:</span>
                                </div>
                                <select
                                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-[11px] font-medium shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                                    value={filterType}
                                    onChange={(e) => updateFilter("type", e.target.value)}
                                >
                                    <option value="">ประเภท: ทั้งหมด</option>
                                    {[...assetTypes].sort((a, b) => a.name.localeCompare(b.name, 'th')).map((type) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>

                                <select
                                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-[11px] font-medium shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50 cursor-pointer"
                                    value={filterSubtype}
                                    onChange={(e) => updateFilter("subtype", e.target.value)}
                                    disabled={!filterType || filteredSubtypes.length === 0}
                                >
                                    <option value="">ประเภทย่อย: ทั้งหมด</option>
                                    {filteredSubtypes.map((subtype) => (
                                        <option key={subtype.id} value={subtype.id}>{subtype.name}</option>
                                    ))}
                                </select>

                                <select
                                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-[11px] font-medium shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                                    value={filterStatus}
                                    onChange={(e) => updateFilter("status", e.target.value)}
                                >
                                    <option value="">สถานะ: ทั้งหมด</option>
                                    <option value="available">สำรอง</option>
                                    <option value="in_use">ใช้งานอยู่</option>
                                    <option value="broken">เสีย</option>
                                    <option value="retired">รอจำหน่าย</option>
                                </select>

                                <select
                                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-[11px] font-medium shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                                    value={filterLocation}
                                    onChange={(e) => updateFilter("location", e.target.value)}
                                >
                                    <option value="">สถานที่: ทั้งหมด</option>
                                    {locations.map((loc) => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                    <Search size={14} className="text-gray-400 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหา..."
                                        className="bg-transparent border-none outline-none text-[11px] w-24 md:w-32"
                                        value={keyword}
                                        onChange={(e) => updateFilter("search", e.target.value)}
                                    />
                                </div>

                                <select
                                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-[11px] font-medium shadow-sm outline-none cursor-pointer"
                                    value={sortOrder}
                                    onChange={(e) => updateFilter("sort", e.target.value)}
                                >
                                    <option value="">เรียงวันที่</option>
                                    <option value="desc">ใหม่-เก่า</option>
                                    <option value="asc">เก่า-ใหม่</option>
                                </select>

                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm active:scale-95"
                                >
                                    <Download size={14} />
                                    CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">กำลังโหลดข้อมูลทรัพย์สิน...</p>
                    </div>
                ) : currentAssets.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 text-gray-400">
                            <Package size={32} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                            {keyword ? 'ไม่พบทรัพย์สินที่ตรงกับการค้นหา' : 'ไม่พบข้อมูลทรัพย์สิน'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-700/30 text-left">
                                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">#</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Asset No</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Serial No</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">ข้อมูล</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">description</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">ผู้ใช้งาน / สถานที่</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">สถานะ</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">การรับประกัน</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {currentAssets.map((asset, index) => (
                                        <tr key={asset.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                            <td className="px-3 py-2.5 text-[11px] font-medium text-gray-400 text-center">
                                                {startIndex + index + 1}
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
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-700 dark:text-gray-300 min-w-0">
                                                        <span className="w-4 h-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-gray-400 text-[10px]">👤</span>
                                                        <div className="flex flex-wrap items-baseline gap-x-1.5 min-w-0">
                                                            <span className="font-bold">{asset.employee_name || "ไม่มีผู้ใช้งาน"}</span>
                                                            {asset.employee_email && (
                                                                <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 break-all">
                                                                    {asset.employee_email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                                        <MapPin size={10} />
                                                        {asset.location_name} ({asset.location_abbreviation})
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusColor(asset.status)}`}>
                                                    {getStatusIcon(asset.status)}
                                                    {getStatusText(asset.status)}
                                                </span>
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
                                                    <Edit3 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ✅ Pagination Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 order-2 sm:order-1">
                                หน้า <span className="text-gray-900 dark:text-white font-bold">{currentPage}</span> จาก <span className="text-gray-900 dark:text-white font-bold">{totalPages}</span>
                            </div>

                            <div className="flex items-center gap-1.5 order-1 sm:order-2">
                                <button
                                    onClick={() => goToPage(1)}
                                    disabled={currentPage === 1}
                                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30"
                                    title="หน้าแรก"
                                >
                                    <ChevronsLeft size={20} />
                                </button>
                                <button
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 1}
                                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30"
                                    title="หน้าก่อนหน้า"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="flex items-center gap-1 mx-2">
                                    {getPageNumbers().map(pageNum => (
                                        <button
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${currentPage === pageNum
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30"
                                    title="หน้าถัดไป"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <button
                                    onClick={() => goToPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30"
                                    title="หน้าสุดท้าย"
                                >
                                    <ChevronsRight size={20} />
                                </button>
                            </div>
                        </div>
                    </>
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
                                <Package size={16} className="text-blue-500" />
                                รายละเอียดทรัพย์สิน
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
                                    <p className={`text-xs font-bold uppercase ${assetDetail.asset.status === 'available' ? 'text-emerald-500' :
                                        assetDetail.asset.status === 'in_use' ? 'text-blue-500' :
                                            assetDetail.asset.status === 'broken' ? 'text-rose-500' :
                                                assetDetail.asset.status === 'retired' ? 'text-amber-500' :
                                                    'text-gray-500'
                                        }`}>
                                        {getStatusText(assetDetail.asset.status)}
                                    </p>
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
                                                        ) : item.from_location && item.to_location && item.from_location !== item.to_location ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-amber-500 font-medium">ย้ายจาก: {item.from_location}</span>
                                                                <span className="text-emerald-500 font-bold">ไปยัง: {item.to_location}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500">อัปเดตข้อมูล</span>
                                                        )}
                                                        {item.to_location && item.to_location !== "-" && (!item.from_location || item.from_location === item.to_location) && (
                                                            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                                <MapPin size={10} /> {item.to_location}
                                                            </div>
                                                        )}
                                                        {item.to_location && item.to_location !== "-" && item.from_location && item.from_location !== item.to_location && (
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

export default AllAsset;
