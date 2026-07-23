import { useEffect, useState, useCallback } from "react";
import MainLayout from "../../../../layouts/MainLayout";
import Card from "../../../../components/common/Card";
import {
  Plus,
  Edit3,
  CheckCircle2,
  X,
  FolderOpen,
  List,
  Settings2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const apiUrl = import.meta.env.VITE_API_URL;

interface AssetType {
  id: number;
  name: string;
  description: string | null;
}

interface AssetSubtype {
  id: number;
  asset_type_id: number;
  name: string;
  description: string | null;
  is_active: number;
  asset_type_name?: string;
}

export default function SetAssetType() {
  const [subtypes, setSubtypes] = useState<AssetSubtype[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSubtypeModal, setShowSubtypeModal] = useState(false);
  const [editingType, setEditingType] = useState<AssetType | null>(null);
  const [editingSubtype, setEditingSubtype] = useState<AssetSubtype | null>(null);

  // Form states
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");

  const [subtypeAssetTypeId, setSubtypeAssetTypeId] = useState("");
  const [subtypeName, setSubtypeName] = useState("");
  const [subtypeDesc, setSubtypeDesc] = useState("");
  const [subtypeIsActive, setSubtypeIsActive] = useState(true);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/settings/asset-type/get-asset-types`);
      const data = await res.json();
      return data.data || [];
    } catch { return []; }
  }, []);

  const fetchSubtypes = useCallback(async (typesData: AssetType[]) => {
    try {
      const res = await fetch(`${apiUrl}/api/settings/asset-subtype/get-subtypes`);
      const data = await res.json();
      const subtypesData = data.data || [];
      return subtypesData.map((s: AssetSubtype) => ({
        ...s,
        asset_type_name: typesData.find(t => t.id === s.asset_type_id)?.name || `ID: ${s.asset_type_id}`
      }));
    } catch { return []; }
  }, []);

  const loadData = useCallback(async () => {
    const typesData = await fetchTypes();
    setTypes(typesData);
    const subtypesData = await fetchSubtypes(typesData);
    setSubtypes(subtypesData);
  }, [fetchTypes, fetchSubtypes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleSaveType = async () => {
    if (!typeName.trim()) return;
    setIsSubmitting(true);
    const url = editingType
      ? `${apiUrl}/api/settings/asset-type/update/${editingType.id}`
      : `${apiUrl}/api/settings/asset-type/add`;

    try {
      const res = await fetch(url, {
        method: editingType ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: typeName, description: typeDesc })
      });
      if (res.ok) {
        setSuccessMsg(editingType ? "✅ แก้ไขประเภทหลักสำเร็จ" : "✅ เพิ่มประเภทหลักสำเร็จ");
        setShowTypeModal(false);
        loadData();
      }
    } catch { setSuccessMsg("❌ เกิดข้อผิดพลาด"); }
    setIsSubmitting(false);
  };

  const handleSaveSubtype = async () => {
    if (!subtypeName.trim() || !subtypeAssetTypeId) return;
    setIsSubmitting(true);
    const url = editingSubtype
      ? `${apiUrl}/api/settings/asset-subtype/update/${editingSubtype.id}`
      : `${apiUrl}/api/settings/asset-subtype/add`;

    try {
      const res = await fetch(url, {
        method: editingSubtype ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_type_id: Number(subtypeAssetTypeId),
          name: subtypeName,
          description: subtypeDesc,
          is_active: subtypeIsActive ? 1 : 0
        })
      });
      if (res.ok) {
        setSuccessMsg(editingSubtype ? "✅ แก้ไขประเภทย่อยสำเร็จ" : "✅ เพิ่มประเภทย่อยสำเร็จ");
        setShowSubtypeModal(false);
        loadData();
      }
    } catch { setSuccessMsg("❌ เกิดข้อผิดพลาด"); }
    setIsSubmitting(false);
  };

  return (
    <MainLayout>
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl dark:bg-blue-500/20 dark:text-blue-400">
                <Settings2 size={18} />
              </div>
              <h1 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">จัดการประเภททรัพย์สิน</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingType(null);
                  setTypeName("");
                  setTypeDesc("");
                  setShowTypeModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-gray-200 dark:border-gray-600 transition-all active:scale-95"
              >
                <Plus size={12} />
                เพิ่มประเภทหลัก
              </button>
              <button
                onClick={() => {
                  setEditingSubtype(null);
                  setSubtypeAssetTypeId("");
                  setSubtypeName("");
                  setSubtypeDesc("");
                  setSubtypeIsActive(true);
                  setShowSubtypeModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                <Plus size={12} />
                เพิ่มประเภทย่อย
              </button>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className={`m-4 p-2.5 rounded-lg text-[11px] font-bold flex items-center gap-2 ${successMsg.includes("✅") ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-rose-50 text-rose-700 border border-rose-100"
            }`}>
            {successMsg.includes("✅") ? <CheckCircle2 size={14} /> : <X size={14} />}
            {successMsg}
          </div>
        )}

        <div className="p-4 grid grid-cols-1 gap-6">
          {/* Main Categories */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100 dark:border-gray-700">
              <FolderOpen size={16} className="text-blue-500" />
              <h3 className="text-xs font-bold text-gray-800 dark:text-white">ประเภทหลัก ({types.length})</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {types.map(t => (
                <div key={t.id} className="p-2 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-lg flex justify-between items-center group hover:border-blue-200 transition-all">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t.name}</span>
                  <button
                    onClick={() => {
                      setEditingType(t);
                      setTypeName(t.name);
                      setTypeDesc(t.description || "");
                      setShowTypeModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-md transition-all"
                  >
                    <Edit3 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sub Categories */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100 dark:border-gray-700">
              <List size={16} className="text-purple-500" />
              <h3 className="text-xs font-bold text-gray-800 dark:text-white">ประเภทย่อย ({subtypes.length})</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {subtypes.map(s => (
                <div key={s.id} className="p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg flex justify-between items-center hover:shadow-sm transition-all group">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{s.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">ประเภทหลัก: <span className="font-bold text-blue-500">{s.asset_type_name}</span></div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${s.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingSubtype(s);
                        setSubtypeAssetTypeId(String(s.asset_type_id));
                        setSubtypeName(s.name);
                        setSubtypeDesc(s.description || "");
                        setSubtypeIsActive(s.is_active === 1);
                        setShowSubtypeModal(true);
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
      </Card>

      {/* Type Modal */}
      <AnimatePresence>
        {showTypeModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTypeModal(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between text-gray-900 dark:text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {editingType ? <Edit3 size={18} className="text-amber-500" /> : <Plus size={18} className="text-blue-500" />}
                  {editingType ? "แก้ไขประเภทหลัก" : "เพิ่มประเภทหลัก"}
                </h2>
                <button onClick={() => setShowTypeModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">ชื่อประเภทหลัก *</label>
                  <input value={typeName} onChange={e => setTypeName(e.target.value)} placeholder="เช่น Computer, Furniture..." className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white dark:placeholder-gray-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">รายละเอียด</label>
                  <textarea value={typeDesc} onChange={e => setTypeDesc(e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-gray-900 dark:text-white dark:placeholder-gray-500" rows={3} />
                </div>
              </div>
              <div className="p-5 bg-gray-50/50 dark:bg-gray-700/30 flex justify-end gap-2">
                <button onClick={() => setShowTypeModal(false)} className="px-5 py-2 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">ยกเลิก</button>
                <button onClick={handleSaveType} disabled={isSubmitting} className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subtype Modal */}
      <AnimatePresence>
        {showSubtypeModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSubtypeModal(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between text-gray-900 dark:text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {editingSubtype ? <Edit3 size={18} className="text-amber-500" /> : <Plus size={18} className="text-blue-500" />}
                  {editingSubtype ? "แก้ไขประเภทย่อย" : "เพิ่มประเภทย่อย"}
                </h2>
                <button onClick={() => setShowSubtypeModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">ประเภทหลัก *</label>
                  <select value={subtypeAssetTypeId} onChange={e => setSubtypeAssetTypeId(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white">
                    <option value="">-- เลือกประเภทหลัก --</option>
                    {types.map(t => <option key={t.id} value={t.id} className="dark:bg-gray-800">{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">ชื่อประเภทย่อย *</label>
                  <input value={subtypeName} onChange={e => setSubtypeName(e.target.value)} placeholder="เช่น Laptop, Desktop, Chair..." className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white dark:placeholder-gray-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">รายละเอียด</label>
                  <textarea value={subtypeDesc} onChange={e => setSubtypeDesc(e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-gray-900 dark:text-white dark:placeholder-gray-500" rows={3} />
                </div>
                <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <input type="checkbox" id="sub_active" checked={subtypeIsActive} onChange={e => setSubtypeIsActive(e.target.checked)} className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300" />
                  <label htmlFor="sub_active" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">เปิดใช้งานรายการนี้</label>
                </div>
              </div>
              <div className="p-5 bg-gray-50/50 dark:bg-gray-700/30 flex justify-end gap-2">
                <button onClick={() => setShowSubtypeModal(false)} className="px-5 py-2 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">ยกเลิก</button>
                <button onClick={handleSaveSubtype} disabled={isSubmitting} className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
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