// src/apps/AssetIT/pages/setting/setLocation.tsx
import { useEffect, useState } from "react";
import MainLayout from "../../../../layouts/MainLayout";
import Card from "../../../../components/common/Card";
import {
    MapPin,
    Plus,
    Edit3,
    Trash2,
    Map as MapIcon,
    X,
    Navigation,
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const apiUrl = import.meta.env.VITE_API_URL;

interface Location {
    id: number;
    name: string;
    abbreviation: string;
    description: string;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    updated_at: string;
}

function formatThaiDate(dateStr: string): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export default function SetLocation() {
    const [name, setName] = useState("");
    const [abbreviation, setAbbreviation] = useState("");
    const [description, setDescription] = useState("");
    const [latitude, setLatitude] = useState<number | undefined>();
    const [longitude, setLongitude] = useState<number | undefined>();
    const [successMsg, setSuccessMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null); // เพิ่ม state นี้

    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/settings/location/get-locations`);
            const data = await res.json();
            if (data.success) setLocations(data.data || []);
            else setLocations([]);
        } catch {
            setLocations([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    // ฟังก์ชันเคลียร์ฟอร์ม
    const clearForm = () => {
        setName("");
        setAbbreviation("");
        setDescription("");
        setLatitude(undefined);
        setLongitude(undefined);
        setEditingId(null);
    };

    const handleAddLocation = async () => {
        if (!name.trim() || !abbreviation.trim()) {
            setSuccessMsg("❌ กรุณากรอกชื่อและตัวย่อ");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${apiUrl}/api/settings/location/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, abbreviation, description, latitude, longitude }),
            });
            const responseData = await res.json();
            if (res.ok && responseData.success) {
                setSuccessMsg("✅ เพิ่ม Location สำเร็จ!");
                clearForm();
                setShowModal(false);
                fetchLocations();
            } else {
                alert(`❌ ${responseData.error || "เกิดข้อผิดพลาดในการเพิ่ม"}`);
            }
        } catch {
            setSuccessMsg("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: number, locationName: string) => {
        if (!confirm(`ยืนยันการลบ "${locationName}"?`)) return;
        try {
            const res = await fetch(`${apiUrl}/api/settings/location/delete/${id}`, {
                method: "DELETE",
            });
            const responseData = await res.json();
            if (res.ok && responseData.success) {
                setLocations(prev => prev.filter(loc => loc.id !== id));
                setSuccessMsg("✅ ลบเรียบร้อย");
            } else {
                setSuccessMsg(`❌ ${responseData.error || "เกิดข้อผิดพลาดในการลบ"}`);
            }
        } catch {
            setSuccessMsg("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    const handleUpdateLocation = async (id: number) => {
        if (!name.trim() || !abbreviation.trim()) {
            setSuccessMsg("❌ กรุณากรอกชื่อและตัวย่อ");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${apiUrl}/api/settings/location/update/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    abbreviation,
                    description,
                    latitude,
                    longitude,
                }),
            });
            const responseData = await res.json();
            if (res.ok && responseData.success) {
                alert("✅ แก้ไข Location สำเร็จ!");
                clearForm();
                setShowModal(false);
                fetchLocations();
            } else {
                alert(`❌ ${responseData.error || "เกิดข้อผิดพลาดในการแก้ไข"}`);
            }

        } catch {
            alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
        setIsSubmitting(false);
    };

    return (
        <MainLayout>
            <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl dark:bg-blue-500/20 dark:text-blue-400">
                                <MapIcon size={20} />
                            </div>
                            <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">จัดการสถานที่</h1>
                        </div>

                        <button
                            onClick={() => {
                                clearForm();
                                setShowModal(true);
                            }}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            เพิ่มสถานที่
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">กำลังโหลดข้อมูลสถานที่...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-700/30 text-left">
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center w-16">#</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">ชื่อสถานที่</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center w-28">ตัวย่อ</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">รายละเอียด</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">พิกัด</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">สร้างเมื่อ</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">แก้ไขล่าสุด</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center w-32">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {locations.map((loc, index) => (
                                    <tr key={loc.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                        <td className="px-4 py-2 text-xs font-medium text-gray-400 text-center">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg">
                                                    <MapPin size={16} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{loc.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md uppercase">
                                                {loc.abbreviation || "-"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{loc.description || "-"}</p>
                                        </td>
                                        <td className="px-4 py-2">
                                            {loc.latitude && loc.longitude ? (
                                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
                                                    <Navigation size={10} className="text-blue-400" />
                                                    {loc.latitude}, {loc.longitude}
                                                </div>
                                            ) : "-"}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                                <Clock size={10} className="text-green-400" />
                                                {formatThaiDate(loc.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                                <Clock size={10} className="text-amber-400" />
                                                {formatThaiDate(loc.updated_at)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        setName(loc.name);
                                                        setAbbreviation(loc.abbreviation);
                                                        setDescription(loc.description || "");
                                                        setLatitude(loc.latitude ?? undefined);
                                                        setLongitude(loc.longitude ?? undefined);
                                                        setEditingId(loc.id);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-md transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(loc.id, loc.name)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 dark:text-gray-100 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {editingId ? <Edit3 className="text-amber-500" /> : <Plus className="text-blue-500" />}
                                    {editingId ? "แก้ไขสถานที่" : "เพิ่มสถานที่ใหม่"}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">ชื่อสถานที่ *</label>
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="ระบุชื่อสถานที่..."
                                        className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">ตัวย่อ (Station) *</label>
                                    <input
                                        value={abbreviation}
                                        onChange={e => setAbbreviation(e.target.value.toUpperCase())}
                                        placeholder="เช่น BKK, HY, CM..."
                                        className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">รายละเอียด</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                        className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Latitude</label>
                                        <input
                                            type="number"
                                            value={latitude ?? ""}
                                            onChange={e => setLatitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                                            placeholder="0.0000"
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Longitude</label>
                                        <input
                                            type="number"
                                            value={longitude ?? ""}
                                            onChange={e => setLongitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                                            placeholder="0.0000"
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50/50 dark:bg-gray-700/30 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => editingId ? handleUpdateLocation(editingId) : handleAddLocation()}
                                    disabled={isSubmitting}
                                    className="px-8 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {isSubmitting ? "กำลังบันทึก..." : (editingId ? "บันทึกการแก้ไข" : "บันทึกข้อมูล")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </MainLayout>
    );
}