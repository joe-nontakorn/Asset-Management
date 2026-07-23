import { useEffect, useState } from "react";
import Card from "../../../../components/common/Card";
import MainLayout from "../../../../layouts/MainLayout";
// import PageHeader from "../../components/PageHeader";
import {
    UserPlus,
    Search,
    Download,
    Users as UsersIcon,
    Edit3,
    Eye,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

interface Employee {
    id: number;
    emp_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    location_name: string;
    location_abbreviation: string;
    office: string | null;
    division_name: string;
    department_name: string | null;
    section_name: string | null;
    is_active: boolean;
}

interface SelectedEmployee {
    emp_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    office: string | null;
    location_name: string;
    division_name: string;
    department_name: string | null;
    section_name: string | null;
    is_active: boolean;
}

const EmpList = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [selectedEmp, setSelectedEmp] = useState<SelectedEmployee | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetch(`${apiUrl}/api/employees/list`)
            .then(res => res.json() as Promise<ApiResponse<Employee[]>>)
            .then(data => {
                if (data.success) {
                    setEmployees(data.data);
                }
            })
            .catch(err => {
                console.error("Error loading employees:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const fetchEmployeeDetail = async (emp_id: string) => {
        try {
            const res = await fetch(`${apiUrl}/api/employees/${emp_id}`);
            const data: ApiResponse<SelectedEmployee> = await res.json();
            if (data.success) {
                setSelectedEmp(data.data);
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error("Error fetching employee detail:", err);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.office?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.location_abbreviation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.division_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.section_name?.toLowerCase().includes(searchTerm.toLowerCase());

        if (statusFilter === "active") return matchesSearch && emp.is_active;
        if (statusFilter === "resigned") return matchesSearch && !emp.is_active;
        return matchesSearch;
    }).sort((a, b) => a.full_name.localeCompare(b.full_name, 'th-TH'));

    const handleExportCSV = () => {
        if (filteredEmployees.length === 0) return;

        const csvRows: string[] = [];

        // Header
        const headers = [
            "รหัสพนักงาน",
            "ชื่อ-นามสกุล",
            "อีเมล",
            "เบอร์โทร",
            "สถานที่",
            "ตัวย่อสถานที่",
            "License Office",
            "ส่วนงาน",
            "ฝ่าย",
            "แผนก",
            "สถานะ"
        ];
        csvRows.push(headers.join(","));

        // Rows
        for (const emp of filteredEmployees) {
            csvRows.push([
                emp.emp_id,
                emp.full_name,
                emp.email || "-",
                emp.phone || "-",
                emp.location_name || "-",
                emp.location_abbreviation || "-",
                emp.office || "-",
                emp.division_name || "-",
                emp.department_name || "-",
                emp.section_name || "-",
                emp.is_active ? "ทำงานอยู่" : "ลาออก"
            ].map(value => `"${value}"`).join(","));
        }

        const BOM = "\uFEFF";
        const csvString = BOM + csvRows.join("\n");

        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "employees.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                                    <UsersIcon size={20} />
                                </div>
                                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">รายชื่อพนักงาน</h1>
                            </div>

                            <NavLink
                                to="/employee/emp_add"
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                            >
                                <UserPlus size={16} />
                                เพิ่มพนักงาน
                            </NavLink>
                        </div>

                        {/* Bottom Row: Filters, Search and Export */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                    <Search size={14} className="text-gray-400 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาพนักงาน..."
                                        className="bg-transparent border-none outline-none text-[11px] w-48 md:w-64"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-[11px] font-medium shadow-sm outline-none cursor-pointer"
                                >
                                    <option value="all">สถานะ: ทั้งหมด</option>
                                    <option value="active">สถานะ: ทำงานอยู่</option>
                                    <option value="resigned">สถานะ: ลาออก</option>
                                </select>
                            </div>

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

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">กำลังโหลดข้อมูลพนักงาน...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 text-gray-400">
                            <UsersIcon size={32} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">ไม่พบข้อมูลพนักงาน</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-700/30 text-left">
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">#</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">รหัสพนักงาน</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">ชื่อ-นามสกุล</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Station</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">License 365</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">ส่วนงาน</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">ฝ่าย</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">แผนก</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">สถานะ</th>
                                    <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredEmployees.map((emp, index) => (
                                    <tr key={emp.emp_id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                        <td className="px-4 py-2 text-xs font-medium text-gray-400 text-center">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => !loading && fetchEmployeeDetail(emp.emp_id)}
                                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                            >
                                                {emp.emp_id}
                                                <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{emp.full_name}</span>
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{emp.email || "-"}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{emp.location_abbreviation || '-'}</span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-lg uppercase tracking-wider font-mono shadow-sm">{emp.office || '-'}</span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{emp.division_name || '-'}</span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">{emp.department_name || '-'}</span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">{emp.section_name || '-'}</span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${emp.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                                                {emp.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                {emp.is_active ? 'Active' : 'Resigned'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => navigate(`/employee/emp_edit/${emp.emp_id}`)}
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
                )}
            </Card>

            {isModalOpen && selectedEmp && (
                <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 w-full max-w-2xl p-6 rounded-lg shadow-xl relative overflow-y-auto max-h-[90vh]">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 text-xl font-bold"
                        >
                            ✖
                        </button>
                        <h2 className="text-lg font-semibold mb-4">รายละเอียดพนักงาน</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div><strong>รหัสพนักงาน:</strong> {selectedEmp.emp_id}</div>
                            <div><strong>ชื่อ-นามสกุล:</strong> {selectedEmp.full_name}</div>
                            <div><strong>Email:</strong> {selectedEmp.email || '-'}</div>
                            <div><strong>เบอร์โทร:</strong> {selectedEmp.phone || '-'}</div>
                            <div><strong>License:</strong> {selectedEmp.office || '-'}</div>
                            <div><strong>Location:</strong> {selectedEmp.location_name}</div>
                            <div><strong>ส่วนงาน:</strong> {selectedEmp.division_name}</div>
                            <div><strong>ฝ่าย:</strong> {selectedEmp.department_name || '-'}</div>
                            <div><strong>แผนก:</strong> {selectedEmp.section_name || '-'}</div>
                            <div>
                                <strong>สถานะ:</strong>{' '}
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedEmp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {selectedEmp.is_active ? "ทำงานอยู่" : "ลาออก"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default EmpList;