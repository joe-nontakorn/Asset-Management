import { useEffect, useState } from "react";
import MainLayout from "../../../../../layouts/MainLayout";

const apiUrl = import.meta.env.VITE_API_URL;

// Interfaces
interface Division {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
    division_id: number;
    division_name: string;
}

interface Section {
    id: number;
    name: string;
    department_id: number;
    department_name: string;
    division_id: number;
    division_name: string;
}


export default function AgencyManager() {
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [sections, setSections] = useState<Section[]>([]);

    const [selectedDivision, setSelectedDivision] = useState<number | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);

    const [newDivision, setNewDivision] = useState("");
    const [newDepartment, setNewDepartment] = useState("");
    const [newSection, setNewSection] = useState("");

    const [activeTab, setActiveTab] = useState<'add' | 'view'>('view');

    useEffect(() => {
        fetchDivisions();
        fetchDepartments();
        fetchSections();
    }, []);

    const fetchDivisions = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/employees/list/divisions`);
            const data: Division[] = await res.json();
            setDivisions(data);
        } catch (error) {
            console.error('Error fetching divisions:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/employees/list/departments`);
            const data: Department[] = await res.json();
            setDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchSections = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/employees/list/sections`);
            const data: Section[] = await res.json();
            setSections(data);
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    };

    const handleAddDivision = async () => {
        if (!newDivision.trim()) return alert("กรุณากรอกชื่อส่วนงาน");
        try {
            const res = await fetch(`${apiUrl}/api/employees/agency/add/division`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newDivision }),
            });
            if (res.ok) {
                setNewDivision("");
                fetchDivisions();
                alert("เพิ่มส่วนงานเรียบร้อย");
            }
        } catch (error) {
            console.error('Error adding division:', error);
        }
    };

    const handleAddDepartment = async () => {
        if (!selectedDivision) return alert("กรุณาเลือกส่วนงาน");
        if (!newDepartment.trim()) return alert("กรุณากรอกชื่อฝ่าย");
        try {
            const res = await fetch(`${apiUrl}/api/employees/agency/add/department`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newDepartment, division_id: selectedDivision }),
            });
            if (res.ok) {
                setNewDepartment("");
                fetchDepartments();
                alert("เพิ่มฝ่ายเรียบร้อย");
            }
        } catch (error) {
            console.error('Error adding department:', error);
        }
    };

    const handleAddSection = async () => {
        if (!selectedDepartment) return alert("กรุณาเลือกฝ่าย");
        if (!newSection.trim()) return alert("กรุณากรอกชื่อแผนก");
        try {
            const res = await fetch(`${apiUrl}/api/employees/agency/add/section`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newSection, department_id: selectedDepartment }),
            });
            if (res.ok) {
                setNewSection("");
                fetchSections();
                alert("เพิ่มแผนกเรียบร้อย");
            }
        } catch (error) {
            console.error('Error adding section:', error);
        }
    };

    return (
        <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-transparent dark:bg-transparent p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 rounded-lg shadow-sm mb-6 p-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="text-blue-600">🏢</span>
                        จัดการส่วนงาน
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">จัดการโครงสร้างองค์กร: ส่วนงาน, ฝ่าย, และแผนก</p>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 rounded-lg shadow-sm mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('view')}
                            className={`px-6 py-4 font-medium transition-colors ${activeTab === 'view'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200'
                                }`}
                        >
                            📋 ดูข้อมูลทั้งหมด
                        </button>
                        <button
                            onClick={() => setActiveTab('add')}
                            className={`px-6 py-4 font-medium transition-colors ${activeTab === 'add'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200'
                                }`}
                        >
                            ➕ เพิ่มข้อมูล
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'view' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* All Divisions */}
                        <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <span className="text-blue-600">🏛️</span>
                                ส่วนงานทั้งหมด ({divisions.length})
                            </h2>
                            <div className="space-y-3">
                                {divisions.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">ไม่มีข้อมูลส่วนงาน</p>
                                ) : (
                                    divisions.map((division) => (
                                        <div key={division.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="font-medium text-blue-800">{division.name}</div>
                                            <div className="text-sm text-blue-600 mt-1">
                                                ฝ่าย: {departments.filter(d => d.division_id === division.id).length} ฝ่าย
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* All Departments */}
                        <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <span className="text-green-600">🏢</span>
                                ฝ่ายทั้งหมด ({departments.length})
                            </h2>
                            <div className="space-y-3">
                                {departments.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">ไม่มีข้อมูลฝ่าย</p>
                                ) : (
                                    departments.map((department) => (
                                        <div key={department.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                            <div className="font-medium text-green-800">{department.name}</div>
                                            <div className="text-sm text-green-600 mt-1">
                                                ส่วนงาน: {department.division_name}
                                            </div>

                                            <div className="text-sm text-green-600">
                                                แผนก: {sections.filter(s => s.department_id === department.id).length} แผนก
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* All Sections */}
                        <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <span className="text-purple-600">🏪</span>
                                แผนกทั้งหมด ({sections.length})
                            </h2>
                            <div className="space-y-3">
                                {sections.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">ไม่มีข้อมูลแผนก</p>
                                ) : (
                                    sections.map((section) => (
                                        <div key={section.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                            <div className="font-medium text-purple-800">{section.name}</div>
                                            <div className="text-sm text-purple-600 mt-1">
                                                ฝ่าย: {section.department_name}
                                            </div>

                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'add' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Add Division */}
                        <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <span className="text-blue-600">➕</span>
                                เพิ่มส่วนงาน
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        ชื่อส่วนงาน
                                    </label>
                                    <input
                                        type="text"
                                        value={newDivision}
                                        onChange={(e) => setNewDivision(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="กรอกชื่อส่วนงาน"
                                    />
                                </div>
                                <button
                                    onClick={handleAddDivision}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                                >
                                    เพิ่มส่วนงาน
                                </button>
                            </div>
                        </div>

                        {/* Add Department */}
                        <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <span className="text-green-600">➕</span>
                                เพิ่มฝ่าย
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        เลือกส่วนงาน
                                    </label>
                                    <select
                                        value={selectedDivision ?? ""}
                                        onChange={(e) => setSelectedDivision(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="">-- เลือกส่วนงาน --</option>
                                        {divisions.map((division) => (
                                            <option key={division.id} value={division.id}>
                                                {division.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        ชื่อฝ่าย
                                    </label>
                                    <input
                                        type="text"
                                        value={newDepartment}
                                        onChange={(e) => setNewDepartment(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="กรอกชื่อฝ่าย"
                                    />
                                </div>
                                <button
                                    onClick={handleAddDepartment}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
                                >
                                    เพิ่มฝ่าย
                                </button>
                            </div>
                        </div>

                        {/* Add Section */}
                        <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <span className="text-purple-600">➕</span>
                                เพิ่มแผนก
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        เลือกฝ่าย
                                    </label>
                                    <select
                                        value={selectedDepartment ?? ""}
                                        onChange={(e) => setSelectedDepartment(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">-- เลือกฝ่าย --</option>
                                        {departments.map((department) => (
                                            <option key={department.id} value={department.id}>
                                                {department.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        ชื่อแผนก
                                    </label>
                                    <input
                                        type="text"
                                        value={newSection}
                                        onChange={(e) => setNewSection(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="กรอกชื่อแผนก"
                                    />
                                </div>
                                <button
                                    onClick={handleAddSection}
                                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium"
                                >
                                    เพิ่มแผนก
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="bg-white dark:bg-gray-800 dark:text-gray-100 transition-colors duration-200 rounded-lg shadow-sm p-6 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">📊 สรุปข้อมูล</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{divisions.length}</div>
                            <div className="text-sm text-blue-800">ส่วนงาน</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{departments.length}</div>
                            <div className="text-sm text-green-800">ฝ่าย</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{sections.length}</div>
                            <div className="text-sm text-purple-800">แผนก</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </MainLayout>
    );
}