import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../../../layouts/MainLayout";
import Card from "../../components/CarsAssetUpdate";

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

interface AssetType {
  id: number;
  name: string;
}

interface AssetSubtype {
  id: number;
  type_id: number;
  name: string;
}

interface Asset {
  id: number;
  asset_no: string;
  serial_no: string;
  // name: string;          // ❌ เอาออก
  brand: string;
  model: string;
  description: string;      // ✅ เพิ่ม
  type_id: number | null;
  subtype_id?: number | null;
  status: string;
  emp_id: string | null;
  type_name: string;
  employee_name?: string;
  location_id: number | null;
  location_name?: string;
  location_abbreviation?: string;
  warranty_expiry?: string;
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
      const selectedOption = options.find(opt => String(opt.value) === String(value));
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
          className="border px-3 py-2 w-full pr-8 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder={placeholder}
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
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
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 transition-colors duration-200 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">ไม่พบข้อมูล</div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-sm dark:text-white"
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

const UpdateAsset = () => {
  const { serial_no } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [subtypes, setSubtypes] = useState<AssetSubtype[]>([]);

  const fetchSubtypes = async (type_id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/settings/asset-subtype?asset_type_id=${type_id}`);
      const data = await res.json();
      setSubtypes(data.data || []);
    } catch (err) {
      console.error("Error fetching subtypes", err);
    }
  };

  const fetchData = async (serial_no: string) => {
    try {
      const [assetRes, employeesRes, locationsRes, typesRes] = await Promise.all([
        fetch(`${apiUrl}/api/assets/search?serial_no=${serial_no}`),
        fetch(`${apiUrl}/api/employees/list`),
        fetch(`${apiUrl}/api/assets/locations`),
        fetch(`${apiUrl}/api/assets/types-id`)
      ]);

      if (!assetRes.ok) throw new Error("Asset API error");
      if (!employeesRes.ok) throw new Error("Employees API error");
      if (!locationsRes.ok) throw new Error("Locations API error");
      if (!typesRes.ok) throw new Error("Asset Types API error");

      const assetData = await assetRes.json();
      const employeesData = await employeesRes.json();
      const locationsData = await locationsRes.json();
      const typesData = await typesRes.json();

      if (assetData?.data?.length > 0) {
        const item = assetData.data[0];
        setAsset({
          id: item.id,
          asset_no: item.asset_no,
          serial_no: item.serial_no,
          // name: item.name ?? "",          // ❌ เอาออก
          brand: item.brand ?? "",
          model: item.model ?? "",
          description: item.description ?? "", // ✅ ใช้ description จาก DB
          type_id: item.type_id ?? null,
          subtype_id: item.subtype_id ?? null,
          status: item.status ?? "available",
          emp_id: item.emp_id ? String(item.emp_id) : null,
          type_name: item.type_name ?? "",
          employee_name: item.employee_name ?? "",
          location_id: item.location_id ?? null,
          location_name: item.location_name ?? "",
          location_abbreviation: item.location_abbreviation ?? "",
          warranty_expiry: item.warranty_expiry ?? ""
        });

        if (item.type_id) fetchSubtypes(item.type_id);
      } else {
        throw new Error("Asset not found");
      }

      setEmployees(employeesData.data || []);
      setLocations(locationsData.data || []);
      setAssetTypes(typesData.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("โหลดข้อมูลล้มเหลว: " + error);
    }
  };

  const handleUpdate = async () => {
    if (!asset) return;
    // ❌ ไม่ส่ง name แล้ว
    const assetToSend = {
      brand: asset.brand,
      model: asset.model,
      description: asset.description || null, // ✅ ส่ง description ไป backend
      type_id: asset.type_id ?? null,
      subtype_id: asset.subtype_id ?? null,
      status: asset.status,
      emp_id: asset.emp_id ?? null,
      location_id: asset.location_id ?? null
    };

    try {
      const res = await fetch(`${apiUrl}/api/assets/update/${asset.serial_no}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetToSend)
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      if (result?.success) {
        alert("อัปเดตข้อมูลสำเร็จ");
        if (asset.status === 'disposed') {
          navigate(`/disposed-asset?${searchParams.toString()}`);
        } else {
          navigate(`/AllAsset?${searchParams.toString()}`);
        }
      } else {
        alert("เกิดข้อผิดพลาด: " + (result?.message || JSON.stringify(result)));
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("ไม่สามารถอัปเดตข้อมูลได้: " + error);
    }
  };

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

  useEffect(() => {
    if (serial_no) fetchData(serial_no);
  }, [serial_no]);

  if (!asset) return <MainLayout><p>กำลังโหลดข้อมูล...</p></MainLayout>;

  return (
    <MainLayout>
      <div className="flex justify-center bg-gray-100 dark:bg-gray-800 py-12">
        <Card className="w-full max-w-7xl p-8 shadow-lg bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 rounded-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center">แก้ไขข้อมูลทรัพย์สิน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div>
              <label>Serial No</label>
              <input className="border rounded w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600" value={asset.serial_no} readOnly />
            </div>

            {/* ❌ เอาชื่อทรัพย์สินออก
            <div>
              <label>ชื่อทรัพย์สิน</label>
              <input className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600" value={asset.name} onChange={(e) => setAsset({ ...asset, name: e.target.value })} />
            </div> */}
            <br />
            <div>
              <label>ยี่ห้อ</label>
              <input
                className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={asset.brand}
                onChange={(e) => setAsset({ ...asset, brand: e.target.value })}
              />
            </div>

            <div>
              <label>รุ่น</label>
              <input
                className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={asset.model}
                onChange={(e) => setAsset({ ...asset, model: e.target.value })}
              />
            </div>

            <div>
              <label>Description</label>
              <input
                className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={asset.description}
                onChange={(e) => setAsset({ ...asset, description: e.target.value })}
                placeholder="รายละเอียด/สเปค"
              />
            </div>

            <div>
              <label>ประเภททรัพย์สิน</label>
              <select
                className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={asset.type_id ?? ""}
                onChange={(e) => {
                  const typeId = parseInt(e.target.value);
                  setAsset({ ...asset, type_id: isNaN(typeId) ? null : typeId, subtype_id: null });
                  if (!isNaN(typeId)) fetchSubtypes(typeId);
                }}
              >
                <option value="">{asset.type_name || "เลือกประเภท"}</option>
                {assetTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>ชนิดย่อย</label>
              <select
                className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={asset.subtype_id ?? ""}
                onChange={(e) => setAsset({ ...asset, subtype_id: e.target.value ? parseInt(e.target.value) : null })}
              >
                <option value="">เลือกชนิดย่อย</option>
                {subtypes.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>สถานะ</label>
              <select
                className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={asset.status}
                onChange={(e) => setAsset({ ...asset, status: e.target.value })}
              >
                <option value="available">สำรอง</option>
                <option value="in_use">ใช้งานอยู่</option>
                <option value="under_repair">กำลังซ่อม</option>
                <option value="broken">เสีย</option>
                <option value="retired">รอจำหน่อย</option>
                <option value="disposed">จำหน่าย</option>
              </select>
            </div>

            <div>
              <label>ผู้ใช้งาน</label>
              <SearchableSelect
                options={employeeOptions}
                placeholder="เลือกผู้ใช้งาน"
                value={asset.emp_id}
                onChange={(value) => setAsset({ ...asset, emp_id: value ? String(value) : null })}
              />
            </div>

            <div>
              <label>สถานที่</label>
              <SearchableSelect
                options={locationOptions}
                placeholder="เลือกสถานที่"
                value={asset.location_id}
                onChange={(value) => setAsset({ ...asset, location_id: value ? Number(value) : null })}
              />
            </div>

            <div className="flex gap-4 mt-4 col-span-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleUpdate}>
                บันทึกการเปลี่ยนแปลง
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => navigate(-1)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default UpdateAsset;
