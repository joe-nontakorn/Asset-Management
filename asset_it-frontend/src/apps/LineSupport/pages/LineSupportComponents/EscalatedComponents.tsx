// Escalated Issues sub-components
import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, AlertTriangle,
  MessageSquare, X, Loader2, History,
  FileText, Image as ImageIcon, Paperclip, Trash2,
} from "lucide-react";
import {
  type TicketStatus, type StatusHistoryEntry,
  STATUS_CONFIG, normalizeStatus,
} from "./types";

// ============ StatusBadge ============
export const StatusBadge = ({ status, isBouncedBack }: { status: TicketStatus; isBouncedBack?: boolean }) => {
  const cfg = STATUS_CONFIG[normalizeStatus(status)];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bgLight} ${cfg.bgDark} ${cfg.color} ${cfg.borderLight} ${cfg.borderDark}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label} {isBouncedBack && "(ตีกลับ)"}
    </span>
  );
};

// ============ StatusStepper ============
export const StatusStepper = ({ status }: { status: TicketStatus }) => {
  const steps: TicketStatus[] = ["pending", "in_progress", "waiting_user_confirm", "resolved"];
  const currentIdx = steps.indexOf(normalizeStatus(status));

  return (
    <div className="flex items-center w-full gap-1 py-2">
      {steps.map((step, i) => {
        const cfg = STATUS_CONFIG[step];
        const Icon = cfg.icon;
        const isActive = i <= currentIdx;
        return (
          <Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${isActive ? `${cfg.bgLight} ${cfg.bgDark} ${cfg.borderLight} ${cfg.borderDark}` : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"}`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? cfg.color : "text-gray-300 dark:text-gray-600"}`} />
              </div>
              <span className={`text-[10px] sm:text-xs font-bold tracking-tight whitespace-nowrap ${isActive ? cfg.color : "text-gray-400 dark:text-gray-500"}`}>
                {cfg.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full mb-5 mx-2 transition-colors duration-500 ${i < currentIdx ? "bg-gradient-to-r from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600" : "bg-gray-200 dark:bg-gray-700"}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

// ============ StatusTimeline ============
export const StatusTimeline = ({ history }: { history: StatusHistoryEntry[] }) => {
  if (!history || history.length === 0) return null;
  const reversedHistory = [...history].reverse();

  return (
    <div className="space-y-3">
      <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
        <History className="w-3.5 h-3.5" /> ประวัติการเปลี่ยนสถานะ
      </h5>
      <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
        {reversedHistory.map((entry, i) => {
          const toNorm = normalizeStatus(entry.status);
          const toCfg = STATUS_CONFIG[toNorm];
          const ToIcon = toCfg.icon;
          const prevEntry = reversedHistory[i + 1];
          const isBouncedBack = entry.status === "in_progress" && prevEntry?.status === "waiting_user_confirm";

          return (
            <div key={i} className="relative">
              <div className={`absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border-2 ${toCfg.bgLight} ${toCfg.bgDark} ${toCfg.borderLight} ${toCfg.borderDark}`} />
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-3 ml-2">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className={`font-semibold flex items-center gap-1 ${isBouncedBack ? "text-red-500 dark:text-red-400" : toCfg.color}`}>
                    <ToIcon className="w-3 h-3" />
                    {toCfg.label} {isBouncedBack && "(ปัญหายังไม่ได้รับการแก้ไขจาก User)"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {new Date(entry.changedAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
                {entry.comment && (
                  <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1.5 border border-gray-100 dark:border-gray-700">
                    💬 {entry.comment}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============ ResolveModal ============
export const ResolveModal = ({
  isOpen, onClose, onSubmit, isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string, files: File[]) => void;
  isSubmitting: boolean;
}) => {
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = comment.trim();
    if (!trimmed) { setError("กรุณาระบุรายละเอียดการแก้ไขก่อนปิดเคส"); return; }
    if (trimmed.length < 5) { setError("กรุณาระบุรายละเอียดอย่างน้อย 5 ตัวอักษร"); return; }
    setError("");
    onSubmit(trimmed, files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) { alert("คุณสามารถอัปโหลดไฟล์ได้สูงสุด 5 ไฟล์"); return; }
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  useEffect(() => { if (isOpen) { setComment(""); setFiles([]); setError(""); } }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">ดำเนินการแก้ไขเสร็จสิ้น</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">กรุณาระบุรายละเอียดวิธีแก้ไขเพื่อแจ้งให้ผู้ใช้งานทราบและยืนยัน</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1.5" /> รายละเอียดการแก้ไข (Resolution Comment) *
                </label>
                <textarea rows={4} value={comment} onChange={(e) => { setComment(e.target.value); if (error) setError(""); }}
                  placeholder='ระบุสิ่งที่ทำเพื่อแก้ไขปัญหานี้ เช่น "ติดตั้ง driver ใหม่ รุ่น v2.1..."'
                  className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all resize-none ${error ? "border-red-300 dark:border-red-700 focus:ring-red-500/30" : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-400"}`}
                />
                {error && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>}
                <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">ข้อมูลนี้จะถูกบันทึกลงในระบบเพื่อใช้อ้างอิงย้อนหลัง</p>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Paperclip className="w-4 h-4 inline mr-1.5" /> แนบหลักฐาน (รูปภาพ หรือ PDF)
                </label>
                <div className="relative group">
                  <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={files.length >= 5} />
                  <div className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${files.length >= 5 ? "bg-gray-50 border-gray-200 cursor-not-allowed" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 group-hover:border-emerald-400 group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-900/10"}`}>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Paperclip className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{files.length >= 5 ? "แนบไฟล์ครบจำนวนแล้ว" : "คลิก หรือ ลากไฟล์มาวางที่นี่"}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">สูงสุด 5 ไฟล์ (Image, PDF)</p>
                  </div>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {files.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-2 rounded-lg ${file.type.includes("image") ? "bg-blue-50 text-blue-500" : "bg-rose-50 text-rose-500"}`}>
                            {file.type.includes("image") ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                            <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">ยกเลิก</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>) : (<><CheckCircle className="w-4 h-4" /> ส่งให้ User ยืนยัน</>)}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
