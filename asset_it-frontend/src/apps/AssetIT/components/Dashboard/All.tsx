// File: frontend/src/pages/asset/allAsset.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import Card from "../Card";
// import iconLaptop from "../../assets/icon/icons8-laptop-50.png";
// import iconMonitor from "../../assets/icon/icons8-monitor.png";
// import iconCctv from "../../assets/icon/icons8-cctv-50.png";
// import iconPC from "../../assets/icon/pc.png";

const apiUrl = import.meta.env.VITE_API_URL;

interface Asset {
    id: number;
    asset_no: string;
    serial_no: string;
    asset_name: string;
    name: string;
    model: string;
    status: string;
    emp_id: string | null;
    employee_name: string | null;
    type_name: string;
    location_name: string;
    location_abbreviation: string;
    warranty_expiry?: string;
}

interface AssetType {
    type_id: number;
    name: string;
}

// const typeIcons: { [key: string]: string } = {
//     "Laptop": iconLaptop,
//     "Desktop": iconPC,
//     "CCTV": iconCctv,
//     "Monitor": iconMonitor,

// };


const All = () => {
    const navigate = useNavigate(); // ✅ สร้างฟังก์ชัน navigate

    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    // State สำหรับควบคุมค่าใน Filter
    const [filterType,] = useState("");
    const [filterStatus,] = useState("");
    const [filterLocation,] = useState("");

    // State สำหรับเก็บรายการตัวเลือกใน Filter (ไม่ควรเปลี่ยนแปลงหลัง fetch ครั้งแรก)
    const [, setAssetTypes] = useState<AssetType[]>([]);
    const [, setLocations] = useState<string[]>([]);

    // const [searchTerm, setSearchTerm] = useState("");


    // FIX 1: แก้ไขการสร้าง URL ให้ถูกต้อง
    const fetchAssets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token"); // ดึง token จากที่ที่คุณเก็บไว้
            let url = `${apiUrl}/api/assets/search`;
            const params = new URLSearchParams();
            if (filterType) params.append("type_id", filterType);
            if (filterStatus) params.append("status", filterStatus);
            if (filterLocation) params.append("location_name", filterLocation); // ✅ แก้ตรงนี้

            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // ✅ แนบ Token ไปด้วย
                }
            }); const data = await res.json();
            setAssets(data.data || []);
        } catch (error) {
            console.error("Error loading assets:", error);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    };


    // ดึงข้อมูลสำหรับใช้ใน Filter Dropdown แค่ครั้งเดียวตอนเริ่ม
    const fetchFilterOptions = async () => {
        try {
            // Fetch Asset Types
            const typeRes = await fetch(`${apiUrl}/api/assets/types-id`);
            const typeData = await typeRes.json();
            setAssetTypes(typeData.data || []);

            // FIX 2: Fetch ข้อมูลทั้งหมดเพื่อดึง Unique Locations
            // ดึงข้อมูลทั้งหมดโดยไม่ติด filter เพื่อสร้าง list ของ location ทั้งหมด
            const allAssetsRes = await fetch(`${apiUrl}/api/assets/search`);
            const allAssetsData = await allAssetsRes.json();
            if (allAssetsData.data) {
                const uniqueLocations = [...new Set(allAssetsData.data.map((a: Asset) => a.location_name).filter(Boolean))];
                setLocations(uniqueLocations as string[]);
            }

        } catch (error) {
            console.error("Error loading filter options:", error);
        }
    };


    // const formatThaiDate = (dateStr?: string) => {
    //     if (!dateStr) return "-";
    //     const date = new Date(dateStr);
    //     const day = String(date.getDate()).padStart(2, "0");
    //     const month = String(date.getMonth() + 1).padStart(2, "0");
    //     const year = date.getFullYear() + 543;
    //     return `${day}/${month}/${year}`;
    // };

    // const calculateRemainingWarranty = (expiry?: string): string => {
    //     if (!expiry) return "-";
    //     const today = new Date();
    //     const expDate = new Date(expiry);
    //     const diffTime = expDate.getTime() - today.getTime();
    //     if (diffTime < 0) return "หมดประกัน";

    //     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    //     const years = Math.floor(diffDays / 365);
    //     const months = Math.floor((diffDays % 365) / 30);

    //     let result = "";
    //     if (years > 0) result += `${years} ปี `;
    //     if (months > 0) result += `${months} เดือน`;

    //     return result.trim() || "น้อยกว่า 1 เดือน";
    // };

    // Effect นี้จะทำงานครั้งเดียวเพื่อดึงข้อมูลสำหรับสร้าง Filter
    useEffect(() => {
        fetchFilterOptions();
    }, []);

    // Effect นี้จะทำงานเมื่อค่า filter เปลี่ยนแปลง เพื่อดึงข้อมูลสินทรัพย์ใหม่
    useEffect(() => {
        fetchAssets();
    }, [filterType, filterStatus, filterLocation]);

    // Helper function สำหรับกำหนดสีของ status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-800';
            case 'in_use':
                return 'bg-blue-100 text-blue-800';
            case 'broken':
                return 'bg-red-100 text-red-800';
            case 'retired':
                return 'bg-gray-100 text-gray-800';
            case 'disposed':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Helper function สำหรับแปลงสถานะเป็นภาษาไทย
    const getStatusText = (status: string) => {
        switch (status) {
            case 'available':
                return 'สำรอง';
            case 'in_use':
                return 'ใช้งานอยู่';
            case 'broken':
                return 'เสีย';
            case 'retired':
                return 'รอจำหน่อย';
            case 'disposed':
                return 'จำหน่าย';
            default:
                return status;
        }
    };

    ;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg h-[650px] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายการทรัพย์สินทั้งหมด</h2>

            </div>
            {loading ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">กำลังโหลดข้อมูลทรัพย์สิน...</p>
                </div>
            ) : assets.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">ไม่พบข้อมูลทรัพย์สิน</p>
                </div>
            ) : (
                <div className="overflow-y-auto max-h-[500px]">
                    <table className="min-w-full table-auto text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                {/* <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">#</th> */}
                                {/* <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">ประเภท</th> */}
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Asset No</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Serial No</th>
                                <th className="ppx-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">ชื่ออุปกรณ์</th>
                                <th className="ppx-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">สถานะ</th>
                                <th className="ppx-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">ผู้ใช้งาน</th>
                                <th className="ppx-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">สถานที่</th>
                                {/* <th className="ppx-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">วันหมดประกัน</th> */}
                                {/* <th className="ppx-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">เหลือเวลา</th> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {assets.map((asset) => (

                                <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                                    {/* <td className="px-6 py-4 text-sm text-gray-900 text-center align-middle">{index + 1}</td> */}
                                    {/* <td className="ppx-6 py-4 text-sm text-gray-900 text-center align-middle">
                                        <div className="flex flex-col items-center justify-center">
                                            {typeIcons[asset.type_name] && (
                                                <img src={typeIcons[asset.type_name]} alt={asset.type_name} className="w-8 h-8 mb-1" />
                                            )}
                                            <span className="text-xs text-gray-600">{asset.type_name}</span>
                                        </div>
                                    </td> */}
                                    <td className="px-6 py-4 text-sm text-gray-900 text-center align-middle">{asset.asset_no}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-center align-middle">{asset.serial_no}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-center align-middle">
                                        <div className="font-medium">{asset.asset_name}</div>
                                        {asset.name && <div className="text-gray-500">{asset.name}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-center align-middle">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                                            {getStatusText(asset.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-center align-middle">{asset.employee_name || "-"}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-center align-middle">
                                        {asset.location_abbreviation || "-"}
                                    </td>

                                    {/* <td className="px-6 py-4 text-sm text-gray-900 text-center align-middle">{formatThaiDate(asset.warranty_expiry)}</td> */}
                                    {/* <td className="px-6 py-4 text-sm text-gray-900 text-center align-middle">{calculateRemainingWarranty(asset.warranty_expiry)}</td> */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            )}
            <div className="text-center mt-4">
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => navigate("/AllAsset")}
                >
                    View All
                </button>
            </div>
        </div>
    );
};

export default All;