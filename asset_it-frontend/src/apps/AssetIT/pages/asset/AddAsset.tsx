// src/pages/asset/AddAsset.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../../../layouts/MainLayout";
import Card from "../../../../components/common/Card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const apiUrl = import.meta.env.VITE_API_URL;

interface Employee {
  id: number;
  emp_id: string;
  full_name: string;
}

interface Location {
  id: number;
  name: string;
}

// interface AssetSubtype {
//   id: number;
//   type_id: number;
//   name: string;
// }

interface AssetType {
  id: number;
  name: string;
}

interface AssetInput {
  serial_no: string;
  // name: string;
  brand: string;
  model: string;
  description: string;
  type_id: number;
  subtype_id?: number | null;
  status: string;
  emp_id: string | null;
  id: number | null;
  purchase_date: string;
  warranty_expiry: string;
}

// Searchable Select Component
interface SearchableSelectProps {
  options: { value: string | number; label: string }[];
  placeholder: string;
  value: string | number | null;
  onChange: (value: string | number | null) => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  placeholder,
  value,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const selectedOption = options.find(opt => opt.value === value);
      setDisplayValue(selectedOption ? selectedOption.label : "");
    } else {
      setDisplayValue("");
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm("");
  };

  const handleOptionSelect = (option: { value: string | number; label: string }) => {
    onChange(option.value);
    setDisplayValue(option.label);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setDisplayValue("");
    setSearchTerm("");
    setIsOpen(false);
  };



  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="border px-2 py-1.5 w-full pr-6 rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          placeholder={placeholder}
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          autoComplete="off"
        />
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 text-xs"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 text-xs"
          >
            {isOpen ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 transition-colors duration-200 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-48 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-1 text-gray-500 dark:text-gray-400 text-sm">ไม่พบข้อมูล</div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className="px-2 py-1 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-sm dark:text-white"
                onClick={() => handleOptionSelect(option)}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const AddAsset = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [subtypesByType, setSubtypesByType] = useState<{ [key: number]: { id: number; name: string }[] }>({});
  const [assetList, setAssetList] = useState<AssetInput[]>([{
    serial_no: "",
    // name: "",
    brand: "",
    model: "",
    description: "",
    type_id: 0,
    subtype_id: null,
    status: "available",
    emp_id: null,
    id: null,
    purchase_date: "",
    warranty_expiry: ""
  }]);

  const fetchSubtypes = async (typeId: number) => {
    if (!typeId || subtypesByType[typeId]) return;

    try {
      const res = await fetch(`${apiUrl}/api/settings/asset-subtype?asset_type_id=${typeId}`);
      const json = await res.json();
      if (json.success) {
        setSubtypesByType((prev) => ({ ...prev, [typeId]: json.data }));
      }
    } catch (err) {
      console.error("Error loading subtypes:", err);
    }
  };

  useEffect(() => {
    fetch(`${apiUrl}/api/employees/list`)
      .then(res => res.json())
      .then(data => setEmployees(data.data || []))
      .catch(err => console.error("Error fetching employees:", err));

    fetch(`${apiUrl}/api/assets/locations`)
      .then(res => res.json())
      .then(data => {
        console.log("API Response locations:", data);
        setLocations(data.data || []);
      })

    fetch(`${apiUrl}/api/assets/types-id`)
      .then(res => res.json())
      .then(data => setTypes(data.data || []))
      .catch(err => console.error("Error fetching asset types:", err));
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newAssetList = [...assetList];
    newAssetList[index] = { ...newAssetList[index], [name]: value };
    setAssetList(newAssetList);
  };

  const handleTypeChange = (index: number, typeId: number) => {
    const newAssetList = [...assetList];
    newAssetList[index] = {
      ...newAssetList[index],
      type_id: typeId,
      subtype_id: null // รีเซ็ต subtype เมื่อเปลี่ยนประเภทหลัก
    };
    setAssetList(newAssetList);

    if (typeId) {
      fetchSubtypes(typeId);
    }
  };

  const handleSubtypeChange = (index: number, subtypeId: number | null) => {
    const newAssetList = [...assetList];
    newAssetList[index] = { ...newAssetList[index], subtype_id: subtypeId };
    setAssetList(newAssetList);
  };

  const handleEmployeeChange = (index: number, value: string | number | null) => {
    const newAssetList = [...assetList];
    newAssetList[index] = { ...newAssetList[index], emp_id: value as string | null };
    setAssetList(newAssetList);
  };

  const handleLocationChange = (index: number, value: string | number | null) => {
    const newAssetList = [...assetList];
    newAssetList[index] = { ...newAssetList[index], id: value as number | null };
    setAssetList(newAssetList);
  };

  const addNewAsset = () => {
    setAssetList([...assetList, {
      serial_no: "",
      // name: "",
      brand: "",
      model: "",
      description: "",
      type_id: 0,
      subtype_id: null,
      status: "available",
      emp_id: null,
      id: null,
      purchase_date: "",
      warranty_expiry: ""
    }]);
  };

  const removeAsset = (index: number) => {
    if (assetList.length > 1) {
      const newAssetList = assetList.filter((_, i) => i !== index);
      setAssetList(newAssetList);
    }
  };

  const duplicateAsset = (index: number) => {
    const assetToDuplicate = { ...assetList[index] };
    assetToDuplicate.serial_no = "";
    const newAssetList = [...assetList];
    newAssetList.splice(index + 1, 0, assetToDuplicate);
    setAssetList(newAssetList);
  };

  // ---------- ช่วยตรวจ Serial ซ้ำ ----------
  const normalizeSerial = (s: string) => (s || "").trim();

  const findLocalDuplicates = (list: AssetInput[]) => {
    // คืนค่ารายการ { sn, rows: number[] } สำหรับ serial ที่ซ้ำกันเองในฟอร์ม
    const map = new Map<string, number[]>(); // sn -> rows
    list.forEach((a, i) => {
      const sn = normalizeSerial(a.serial_no);
      if (!sn) return;
      const rows = map.get(sn) ?? [];
      rows.push(i + 1); // เก็บเป็นเลขแถว (เริ่ม 1)
      map.set(sn, rows);
    });
    return [...map.entries()]
      .filter(([, rows]) => rows.length > 1)
      .map(([sn, rows]) => ({ sn, rows }));
  };

  const checkRemoteDuplicates = async (serials: string[]) => {
    // เรียก API ตรวจว่า serial ไหน “มีอยู่แล้วใน DB”
    const unique = Array.from(new Set(serials.map(normalizeSerial))).filter(Boolean);
    if (unique.length === 0) return [];

    const checks = await Promise.all(
      unique.map(async (sn) => {
        try {
          const res = await fetch(`${apiUrl}/api/assets/search?serial_no=${encodeURIComponent(sn)}`);
          const json = await res.json();
          const exists = Array.isArray(json?.data) && json.data.length > 0;
          // ดึงข้อมูลบางส่วนไว้แสดงผลเตือน
          const item = exists ? json.data[0] : null;
          return { sn, exists, item };
        } catch {
          // ถ้าเช็คไม่ได้ ถือว่าไม่ซ้ำ (หรือจะให้ขึ้นเตือนให้ลองใหม่ก็ได้)
          return { sn, exists: false, item: null };
        }
      })
    );

    return checks.filter(c => c.exists);
  };


  const handleSubmit = async () => {
    // 1) บังคับให้มี Serial No
    const invalidAssets = assetList.filter(asset => !normalizeSerial(asset.serial_no));
    if (invalidAssets.length > 0) {
      alert("กรุณากรอก Serial No ให้ครบ");
      return;
    }

    // 2) เช็คซ้ำกันเองในฟอร์ม
    const localDup = findLocalDuplicates(assetList);
    if (localDup.length > 0) {
      const msg = [
        "Serial No ซ้ำกันเองในฟอร์ม:",
        ...localDup.map(d => `- ${d.sn}: แถว #${d.rows.join(", #")}`)
      ].join("\n");
      alert(msg);
      return;
    }

    // 3) เช็คซ้ำกับฐานข้อมูล (เรียก API ขนาน)
    const serials = assetList.map(a => normalizeSerial(a.serial_no));
    const remoteDup = await checkRemoteDuplicates(serials);
    if (remoteDup.length > 0) {
      const msg = [
        "Serial No ซ้ำกับข้อมูลในระบบ:",
        ...remoteDup.map(d => {
          const info = d.item
            ? ` (asset_no: ${d.item.asset_no ?? "-"}, brand: ${d.item.brand ?? "-"}, model: ${d.item.model ?? "-"})`
            : "";
          return `- ${d.sn}${info}`;
        })
      ].join("\n");
      alert(msg);
      return;
    }

    // 4) ไม่ซ้ำ → ส่งบันทึกได้
    const payload = assetList.map(asset => ({
      serial_no: normalizeSerial(asset.serial_no),
      brand: asset.brand || null,
      model: asset.model || null,
      description: asset.description || null,
      type_id: asset.type_id ? Number(asset.type_id) : null,
      subtype_id: asset.subtype_id ?? null,
      status: asset.status,
      emp_id: asset.emp_id || null,
      location_id: asset.id ?? null,
      purchase_date: asset.purchase_date || null,
      warranty_expiry: asset.warranty_expiry || null
    }));

    console.log("payload =>", payload);

    try {
      const res = await fetch(`${apiUrl}/api/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        alert(`เพิ่มทรัพย์สิน ${result.inserted} รายการสำเร็จ`);
        navigate("/AllAsset");
      } else {
        const detail = result.error?.sqlMessage || result.error?.message || result.message;
        alert("เกิดข้อผิดพลาด: " + detail);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("ไม่สามารถเพิ่มข้อมูลได้: " + err);
    }
  };


  const handleCancel = () => {
    navigate("/AllAsset");
  };

  // Prepare options for searchable selects
  const employeeOptions = employees
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map(emp => ({
      value: emp.id,
      label: emp.full_name
    }));

  const locationOptions = locations
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(loc => ({
      value: loc.id,
      label: loc.name
    }));

  return (
    <MainLayout>
      <Card title={`เพิ่มทรัพย์สินใหม่ (${assetList.length} รายการ)`}>
        <div className="space-y-6">
          {/* Add/Remove buttons */}
          <div className="flex gap-2">
            <button
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              onClick={addNewAsset}
            >
              + เพิ่ม
            </button>
          </div>

          {assetList.map((asset, index) => (
            <div key={index} className="border rounded-sm p-3 bg-gray-50 dark:bg-gray-700">
              {/* Asset header */}
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  #{index + 1}
                </h3>
                <div className="flex gap-1">
                  <button
                    className="bg-blue-500 text-white px-2 py-0.5 rounded-sm text-xs hover:bg-blue-600 transition-colors"
                    onClick={() => duplicateAsset(index)}
                    title="คัดลอก"
                  >
                    คัดลอก
                  </button>
                  {assetList.length > 1 && (
                    <button
                      className="bg-red-500 text-white px-2 py-0.5 rounded-sm text-xs hover:bg-red-600 transition-colors"
                      onClick={() => removeAsset(index)}
                      title="ลบ"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              </div>

              {/* Asset form - Compact minimal layout */}
              <div className="space-y-">
                {/* Row 1: ข้อมูลพื้นฐาน */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Serial No *</label>
                    <input
                      name="serial_no"
                      placeholder="Serial No"
                      className="border px-2 py-1.5 w-full rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={asset.serial_no}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div>

                  {/* <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">ชื่อทรัพย์สิน *</label>
                    <input
                      name="name"
                      placeholder="ชื่อทรัพย์สิน"
                      className="border px-2 py-1.5 w-full rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                      value={asset.name}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div> */}

                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">ยี่ห้อ</label>
                    <input
                      name="brand"
                      placeholder="ยี่ห้อ"
                      className="border px-2 py-1.5 w-full rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={asset.brand}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">รุ่น</label>
                    <input
                      name="model"
                      placeholder="รุ่น"
                      className="border px-2 py-1.5 w-full rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={asset.model}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Description</label>
                    <input
                      name="description"
                      placeholder="Description"
                      className="border px-2 py-1.5 w-full rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={asset.description ?? ""}
                      onChange={(e) => handleChange(index, e)}
                    />

                  </div>


                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">ประเภท *</label>
                    <select
                      name="type_id"
                      className="border px-2 py-1.5 w-full rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={asset.type_id || ""}
                      onChange={(e) => handleTypeChange(index, Number(e.target.value))}
                    >
                      <option value="">เลือกประเภท</option>
                      {types
                        .filter(type => type.id !== undefined && type.id !== null)
                        .map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      ประเภทย่อย
                      {asset.type_id <= 0 && (
                        <span className="text-gray-400 text-xs"> (เลือกประเภทก่อน)</span>
                      )}
                    </label>
                    <select
                      name="subtype_id"
                      className="border px-2 py-1.5 w-full rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400"
                      value={asset.subtype_id || ""}
                      disabled={asset.type_id <= 0}
                      onChange={(e) => handleSubtypeChange(index, e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">เลือกประเภทย่อย</option>
                      {(subtypesByType[asset.type_id] || []).map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: สถานะและการใช้งาน */}
                {/* สถานะ, ผู้ใช้งาน, สถานที่, วันที่ซื้อ, วันหมดประกัน อยู่ในแถวเดียวกัน */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {/* สถานะ */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">สถานะ</label>
                    <select
                      name="status"
                      className="border px-2 py-1.5 w-full rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      value={asset.status}
                      onChange={(e) => handleChange(index, e)}
                    >
                      <option value="available">สำรอง</option>
                      <option value="in_use">ใช้งานอยู่</option>
                      <option value="broken">เสีย</option>
                      <option value="retired">รอจำหน่อย</option>
                      <option value="disposed">จำหน่าย</option>
                    </select>
                  </div>
                  {/* ผู้ใช้งาน */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">ผู้ใช้งาน</label>
                    <SearchableSelect
                      options={employeeOptions}
                      placeholder="เลือกผู้ใช้งาน"
                      value={asset.emp_id}
                      onChange={(value) => handleEmployeeChange(index, value)}
                    />
                  </div>

                  {/* สถานที่ */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">สถานที่</label>
                    <SearchableSelect
                      options={locationOptions}
                      placeholder="เลือกสถานที่"
                      value={asset.id}
                      onChange={(value) => handleLocationChange(index, value)}
                    />
                  </div>

                  {/* วันที่ซื้อ */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">วันที่ซื้อ *</label>
                    <DatePicker
                      selected={asset.purchase_date ? new Date(asset.purchase_date) : null}
                      onChange={(date: Date | null) => {
                        handleChange(index, {
                          target: {
                            name: "purchase_date",
                            value: date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0] : ""
                          }
                        } as React.ChangeEvent<HTMLInputElement>);
                      }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="เลือกวันที่ซื้อ"
                      className="border px-2 py-1.5 w-full rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      wrapperClassName="w-full"
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                    />
                  </div>

                  {/* วันหมดประกัน */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">วันหมดประกัน</label>
                    <DatePicker
                      selected={asset.warranty_expiry ? new Date(asset.warranty_expiry) : null}
                      onChange={(date: Date | null) => {
                        handleChange(index, {
                          target: {
                            name: "warranty_expiry",
                            value: date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0] : ""
                          }
                        } as React.ChangeEvent<HTMLInputElement>);
                      }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="เลือกวันหมดประกัน"
                      className="border px-2 py-1.5 w-full rounded-sm text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      wrapperClassName="w-full"
                      isClearable
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                    />
                  </div>
                </div>

              </div>
            </div>
          ))}

          {/* Submit buttons */}
          <div className="flex gap-3 pt-3 border-t">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 font-medium"
              onClick={handleSubmit}
            >
              บันทึก ({assetList.length})
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded text-sm hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors0 font-medium"
              onClick={handleCancel}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </Card>
    </MainLayout>
  );
};

export default AddAsset;