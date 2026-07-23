import { useEffect, useState } from "react";
import MainLayout from "../../../../layouts/MainLayout";
import Card from "../../../../components/common/Card";
import {
  Plus,
  Edit3,
  List,
  Layers,
  CheckCircle2,
  X,
  FolderOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

interface AssetType {
  id: number;
  name: string;
}

interface AssetSubtype {
  id: number;
  asset_type_id: number;
  name: string;
  description: string | null;
  is_active: number;
  asset_type_name?: string;
}

export default function SetAssetSubtype() {
  const [subtypes, setSubtypes] = useState<AssetSubtype[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [assetTypeId, setAssetTypeId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchSubtypes = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/settings/asset-subtype/get-subtypes`);
      const data: ApiResponse<AssetSubtype[]> = await res.json();
      setSubtypes(data.data || []);
    } catch {
      setSubtypes([]);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/settings/asset-type/get-asset-types`);
      const data: ApiResponse<AssetType[]> = await res.json();
      setTypes(data.data || []);
    } catch {
      setTypes([]);
    }
  };

  useEffect(() => {
    fetchSubtypes();
    fetchTypes();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const clearForm = () => {
    setAssetTypeId("");
    setName("");
    setDescription("");
    setIsActive(true);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !assetTypeId) {
      setSuccessMsg("❌ กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      asset_type_id: Number(assetTypeId),
      name,
      description,
      is_active: isActive ? 1 : 0
    };

    const url = editingId
      ? `${apiUrl}/api/settings/asset-subtype/update/${editingId}`
      : `${apiUrl}/api/settings/asset-subtype/add`;

    try {
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(editingId ? "✅ แก้ไขสำเร็จ!" : "✅ เพิ่มประเภทย่อยสำเร็จ!");
        fetchSubtypes();
        clearForm();
        setShowModal(false);
      } else {
        setSuccessMsg(`❌ ${data.error || "เกิดข้อผิดพลาด"}`);
      }
    } catch {
      setSuccessMsg("❌ ไม่สามารถเชื่อมต่อ API ได้");
    }
    setIsSubmitting(false);
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Compact Header Card */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl dark:bg-blue-500/20 dark:text-blue-400">
                  <Layers size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">จัดการประเภททรัพย์สิน</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    clearForm();
                    setShowModal(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  <Plus size={16} />
                  เพิ่มประเภทย่อย
                </button>
              </div>
            </div>
          </div>

          {successMsg && (
            <div className={`m-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${successMsg.includes("✅")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                : "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
              }`}>
              {successMsg.includes("✅") ? <CheckCircle2 size={16} /> : <X size={16} />}
              {successMsg}
            </div>
          )}

          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Categories Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100 dark:border-gray-700">
                  <FolderOpen size={16} className="text-blue-500" />
                  <h3 className="text-xs font-bold text-gray-800 dark:text-white">ประเภทหลัก ({types.length})</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {types.map((type) => (
                    <div key={type.id} className="p-2 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-lg flex justify-between items-center group hover:border-blue-200 transition-all">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{type.name}</span>
                      <button
                        onClick={() => {
                          setAssetTypeId(type.id.toString());
                          setName(type.name);
                          setShowModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-md transition-all"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub Categories Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100 dark:border-gray-700">
                  <List size={16} className="text-purple-500" />
                  <h3 className="text-xs font-bold text-gray-800 dark:text-white">ประเภทย่อย ({subtypes.length})</h3>
                </div>
                <div className="space-y-2">
                  {subtypes.map((item) => (
                    <div key={item.id} className="p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg flex justify-between items-center hover:shadow-sm transition-all group">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">ประเภทหลัก: <span className="font-bold text-blue-500">{item.asset_type_name || item.asset_type_id}</span></div>
                        {item.description && <div className="text-[10px] text-gray-400 mt-0.5 italic truncate">{item.description}</div>}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setAssetTypeId(String(item.asset_type_id));
                            setName(item.name);
                            setDescription(item.description || "");
                            setIsActive(item.is_active === 1);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

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
                  {editingId ? "แก้ไขข้อมูล" : "เพิ่มประเภทย่อยใหม่"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">ประเภทหลัก *</label>
                  <select
                    value={assetTypeId}
                    onChange={(e) => setAssetTypeId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">-- เลือกประเภทหลัก --</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">ชื่อประเภทย่อย *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ระบุชื่อประเภทย่อย..."
                    className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">รายละเอียด</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500/20 border-gray-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">เปิดใช้งานรายการนี้</label>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 dark:bg-gray-700/30 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">ยกเลิก</button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}