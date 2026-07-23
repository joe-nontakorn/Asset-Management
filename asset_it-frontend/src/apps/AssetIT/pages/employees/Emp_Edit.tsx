// File: frontend/src/pages/employees/Emp_Edit.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Card from "../../../../components/common/Card";
import MainLayout from "../../../../layouts/MainLayout";

const apiUrl = import.meta.env.VITE_API_URL;

// ✅ Interface ที่ครบถ้วนตาม API
interface Employee {
    emp_id: string;
    full_name: string;
    email: string;
    phone: string;
    office: string;
    location_id: number; // ✅ ตรงนี้เป็น required
    division_id: number;
    department_id: number;
    section_id: number;
    is_active: boolean;
}


// Interface สำหรับ dropdown options
interface DropdownOption {
    id: number;
    name: string;
    division_id?: number;
    department_id?: number;
}


interface Location {
    id: number;
    name: string;
}


const EmpEdit = () => {
    const { emp_id } = useParams();
    const navigate = useNavigate();
    const [emp, setEmp] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string>("");

    const [divisions, setDivisions] = useState<DropdownOption[]>([]);
    const [departments, setDepartments] = useState<DropdownOption[]>([]);
    const [sections, setSections] = useState<DropdownOption[]>([]);

    const [locations, setLocations] = useState<Location[]>([]);

    // โหลดข้อมูล location ทั้งหมด
    useEffect(() => {
        fetch(`${apiUrl}/api/assets/locations`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setLocations(data.data);
                }
            });
    }, []);


    // โหลดข้อมูลพนักงาน
    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${apiUrl}/api/employees/${emp_id}`);
                const data = await res.json();

                if (data.success) {
                    // ปรับข้อมูลให้ตรงกับ interface
                    const empData = {
                        emp_id: data.data.emp_id,
                        full_name: data.data.full_name,
                        email: data.data.email || "",
                        phone: data.data.phone || "",
                        office: data.data.office || "",
                        location_id: data.data.location_id || 0,  // ✅ เพิ่มบรรทัดนี้
                        division_id: data.data.division_id || 0,
                        department_id: data.data.department_id || 0,
                        section_id: data.data.section_id || 0,
                        is_active: data.data.is_active !== undefined ? data.data.is_active : true


                    };



                    setEmp(empData);
                } else {
                    setError(data.message || "ไม่สามารถโหลดข้อมูลพนักงานได้");
                }
            } catch (err) {
                console.error(err);
                setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
            } finally {
                setLoading(false);
            }

        };

        if (emp_id) {
            fetchEmployee();
        }
    }, [emp_id]);



    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [divRes, depRes, secRes] = await Promise.all([
                    fetch(`${apiUrl}/api/employees/list/divisions`),
                    fetch(`${apiUrl}/api/employees/list/departments`),
                    fetch(`${apiUrl}/api/employees/list/sections`)
                ]);

                const divData = await divRes.json();
                const depData = await depRes.json();
                const secData = await secRes.json();

                setDivisions(divData);
                setDepartments(depData);
                setSections(secData);
            } catch (err) {
                console.error("เกิดข้อผิดพลาดในการโหลด dropdown", err);
            }
        };

        fetchDropdowns();
    }, []);



    // ฟังก์ชันอัพเดทข้อมูล
    const handleUpdate = async () => {
        if (!emp) return;

        // Validation
        if (!emp.full_name) {
            setError("กรุณากรอกชื่อ-นามสกุล");
            return;
        }


        try {
            setUpdating(true);
            setError("");

            const res = await fetch(`${apiUrl}/api/employees/update/${emp_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: emp.full_name.trim(),
                    email: emp.email.trim() || null,
                    phone: emp.phone.trim() || null,
                    office: emp.office.trim() || null,
                    location_id: emp.location_id || null, // ✅ เพิ่มบรรทัดนี้
                    division_id: emp.division_id || null,
                    department_id: emp.department_id || null,
                    section_id: emp.section_id || null,
                    is_active: emp.is_active
                }),

            });


            const result = await res.json();

            if (result.success) {
                alert("อัปเดตข้อมูลสำเร็จ");
                navigate("/employee/emp_list");
            } else {
                setError(result.message || "เกิดข้อผิดพลาดในการอัปเดต");
            }
        } catch (err) {
            console.error(err);
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setUpdating(false);
        }
    };

    // แสดง loading
    if (loading) {
        return (
            <MainLayout>
                <Card title="แก้ไขข้อมูลพนักงาน">
                    <div className="flex justify-center items-center h-32">
                        <p>กำลังโหลดข้อมูล...</p>
                    </div>
                </Card>
            </MainLayout>
        );
    }

    // แสดง error
    if (error && !emp) {
        return (
            <MainLayout>
                <Card title="แก้ไขข้อมูลพนักงาน">
                    <div className="text-red-500 text-center">
                        <p>{error}</p>
                        <button
                            onClick={() => navigate("/employee/emp_list")}
                            className="mt-4 bg-gray-300 px-4 py-2 rounded"
                        >
                            กลับไปหน้ารายการ
                        </button>
                    </div>
                </Card>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Card title="แก้ไขข้อมูลพนักงาน">
                {emp && (
                    <div className="space-y-4">
                        {/* แสดง error message */}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* รหัสพนักงาน */}
                            <div>
                                <label className="block text-sm font-medium mb-1">รหัสพนักงาน</label>
                                <input
                                    value={emp.emp_id}
                                    disabled
                                    className="border w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                                />
                            </div>

                            {/* ชื่อ-นามสกุล */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={emp.full_name}
                                    onChange={e => setEmp({ ...emp, full_name: e.target.value })}
                                    className="border w-full px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="กรอกชื่อ-นามสกุล"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={emp.email || ""}
                                    onChange={e => setEmp({ ...emp, email: e.target.value })}
                                    className="border w-full px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="กรอกอีเมล"
                                />
                            </div>

                            {/* เบอร์โทร */}
                            <div>
                                <label className="block text-sm font-medium mb-1">เบอร์โทร</label>
                                <input
                                    type="tel"
                                    value={emp.phone || ""}
                                    onChange={e => setEmp({ ...emp, phone: e.target.value })}
                                    className="border w-full px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="กรอกเบอร์โทร"
                                />
                            </div>

                            {/* location */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Location</label>
                                <select
                                    value={emp.location_id || ""}
                                    onChange={e => setEmp({ ...emp, location_id: Number(e.target.value) })}
                                    className="border w-full px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- เลือก Location --</option>
                                    {locations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            {/* License office */}
                            <div>
                                <label className="block text-sm font-medium mb-1">License office</label>
                                <input
                                    value={emp.office || ""}
                                    onChange={e => setEmp({ ...emp, office: e.target.value })}
                                    className="border w-full px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="License office"
                                />
                            </div>

                            {/* ส่วนงาน */}
                            {/* ส่วนงาน */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    ส่วนงาน
                                </label>
                                <select
                                    value={emp.division_id || ""}
                                    onChange={(e) => {
                                        const value = e.target.value ? Number(e.target.value) : 0;
                                        setEmp({
                                            ...emp,
                                            division_id: value,
                                            department_id: 0, // reset ฝ่าย
                                            section_id: 0     // reset แผนก
                                        });
                                    }}
                                    className="border w-full px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- ไม่ระบุส่วนงาน --</option>
                                    {divisions.map((division) => (
                                        <option key={division.id} value={division.id}>
                                            {division.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* ฝ่าย */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    ฝ่าย
                                </label>
                                <select
                                    value={emp.department_id || ""}
                                    onChange={(e) => {
                                        const value = e.target.value ? Number(e.target.value) : 0;
                                        setEmp({
                                            ...emp,
                                            department_id: value,
                                            section_id: 0 // reset แผนก
                                        });
                                    }}
                                    className="border w-full px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- ไม่ระบุฝ่าย --</option>
                                    {departments
                                        .filter((d) => d.division_id === emp.division_id)
                                        .map((department) => (
                                            <option key={department.id} value={department.id}>
                                                {department.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* แผนก */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    แผนก
                                </label>
                                <select
                                    value={emp.section_id || ""}
                                    onChange={(e) =>
                                        setEmp({
                                            ...emp,
                                            section_id: e.target.value ? Number(e.target.value) : 0,
                                        })
                                    }
                                    className="border w-full px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- ไม่ระบุแผนก --</option>
                                    {sections
                                        .filter((s) => s.department_id === emp.department_id)
                                        .map((section) => (
                                            <option key={section.id} value={section.id}>
                                                {section.name}
                                            </option>
                                        ))}
                                </select>
                            </div>


                            {/* สถานะ */}
                            <div>
                                <label className="block text-sm font-medium mb-1">สถานะ</label>
                                <select
                                    value={emp.is_active ? "true" : "false"}
                                    onChange={e => setEmp({ ...emp, is_active: e.target.value === "true" })}
                                    className="border w-full px-3 py-2 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="true">ทำงานอยู่</option>
                                    <option value="false">ลาออก</option>
                                </select>
                            </div>
                        </div>

                        {/* ปุ่มดำเนินการ */}
                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={handleUpdate}
                                disabled={updating}
                                className={`px-6 py-2 rounded text-white font-medium ${updating
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600"
                                    }`}
                            >
                                {updating ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                            <button
                                onClick={() => navigate("/employee/emp_list")}
                                disabled={updating}
                                className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded font-medium"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </MainLayout>
    );
};

export default EmpEdit;