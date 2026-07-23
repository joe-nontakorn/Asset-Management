import { useEffect, useState } from "react";
import Card from "../../../../components/common/Card";
import MainLayout from "../../../../layouts/MainLayout";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL;

interface Location {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  division_id: number;
}

interface Section {
  id: number;
  name: string;
  department_id: number;
}

const EmpAdd = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [formData, setFormData] = useState({
    emp_id: "",
    full_name: "",
    email: "",
    phone: "",
    location_id: "",
    office: "",
    division_id: "",
    department_id: "",
    section_id: "",
  });

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate("/employee/emp_list");
  };

  useEffect(() => {
    fetch(`${apiUrl}/api/assets/locations`).then(res => res.json()).then(data => setLocations(data.data));
    fetch(`${apiUrl}/api/employees/list/divisions`).then(res => res.json()).then(data => setDivisions(data));
    fetch(`${apiUrl}/api/employees/list/departments`).then(res => res.json()).then(data => setDepartments(data));
    fetch(`${apiUrl}/api/employees/list/sections`).then(res => res.json()).then(data => setSections(data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear errors when user starts typing
    setErrors([]);
    setMessage("");
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.emp_id.trim()) {
      newErrors.push("รหัสพนักงาน");
    }

    if (!formData.full_name.trim()) {
      newErrors.push("ชื่อ-นามสกุล");
    }

    if (!formData.location_id) {
      newErrors.push("สถานที่");
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setMessage(`❌ กรุณากรอกข้อมูลให้ครบถ้วน: ${validationErrors.join(", ")}`);
      return;
    }

    try {
      const cleanData = {
        ...formData,
        is_active: 1,
        location_id: formData.location_id || null,
        division_id: formData.division_id || null,
        department_id: formData.department_id || null,
        section_id: formData.section_id || null,
      };

      const response = await fetch(`${apiUrl}/api/employees/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage("✅ " + result.message);
        setErrors([]);
        setFormData({
          emp_id: "",
          full_name: "",
          email: "",
          phone: "",
          location_id: "",
          office: "",
          division_id: "",
          department_id: "",
          section_id: "",
        });
      } else {
        setMessage("❌ " + result.message);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setMessage("❌ ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  return (
    <MainLayout>
      <Card title="เพิ่มพนักงาน">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="emp_id"
            value={formData.emp_id}
            onChange={handleChange}
            required
            className={`border px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.includes("รหัสพนักงาน") ? "border-red-500" : ""}`}
            placeholder="รหัสพนักงาน *"
          />

          <input
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className={`border px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.includes("ชื่อ-นามสกุล") ? "border-red-500" : ""}`}
            placeholder="ชื่อ-นามสกุล *"
          />

          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="border px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="อีเมล"
          />

          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="border px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="เบอร์โทร"
          />

          <input
            name="office"
            value={formData.office}
            onChange={handleChange}
            className="border px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="License 365"
          />

          <select
            name="location_id"
            value={formData.location_id}
            onChange={handleChange}
            className={`border px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.includes("สถานที่") ? "border-red-500" : ""}`}
            required
          >
            <option value="">-- เลือกสถานที่ * --</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          <select
            name="division_id"
            value={formData.division_id}
            onChange={handleChange}
            className="border px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">-- ไม่ระบุส่วนงาน --</option>
            {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            className="border px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">-- ไม่ระบุฝ่าย --</option>
            {departments.filter(dep => dep.division_id.toString() === formData.division_id).map(dep => (
              <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </select>

          <select
            name="section_id"
            value={formData.section_id}
            onChange={handleChange}
            className="border px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">-- ไม่ระบุแผนก --</option>
            {sections.filter(sec => sec.department_id.toString() === formData.department_id).map(sec => (
              <option key={sec.id} value={sec.id}>{sec.name}</option>
            ))}
          </select>

          <div className="col-span-full flex justify-end gap-2 mt-4">
            <button type="button" onClick={handleCancel} className="bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 px-4 py-2 text-white rounded">ยกเลิก</button>
            <button type="submit" className="bg-blue-600 px-4 py-2 text-white rounded">บันทึก</button>
          </div>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded ${message.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-2 text-sm text-red-600">
            <p>ฟิลด์ที่จำเป็นต้องกรอก: {errors.join(", ")}</p>
          </div>
        )}
      </Card>
    </MainLayout>
  );
};

export default EmpAdd;