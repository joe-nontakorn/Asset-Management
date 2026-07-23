// File: frontend/src/components/Sidebar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import JastelLogo from "../../assets/jastel.jpg";


interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const Sidebar = ({ className = "", onClose }: SidebarProps) => {
  const navigate = useNavigate();

  // เก็บ state ของเมนูใน localStorage
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem("sidebarOpenMenus");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // บันทึก state ลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    try {
      localStorage.setItem("sidebarOpenMenus", JSON.stringify(openMenus));
    } catch (error) {
      console.warn("Failed to save sidebar state to localStorage:", error);
    }
  }, [openMenus]);

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // ✅ สร้าง class สำหรับ NavLink
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded flex items-center gap-2 transition-all ${isActive
      ? "bg-blue-600 text-white"
      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
    }`;

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-md p-6 overflow-y-auto font-anuphan transition-colors duration-200 ${className || "w-64 h-screen fixed top-0 left-0 z-50"}`}>
      <div className="flex justify-center mb-6 cursor-pointer" onClick={() => { navigate("/dashboard"); handleLinkClick(); }}>
        <img
          className="w-40 h-auto object-contain"
          src={JastelLogo}
          alt="Jastel Logo"
        />
      </div>

      <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">IT Service Management</div>

      <nav className="flex flex-col gap-2 text-sm font-medium">
        {/* 📦 Asset Management */}
        <div>
          <button
            onClick={() => toggleMenu("assetManagement")}
            className="w-full px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-gray-700 dark:text-gray-300 transition-colors duration-200 font-bold"
          >
            <span className="flex items-center gap-2">📦 Asset Management</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${openMenus.assetManagement ? "rotate-180" : ""
                }`}
            />
          </button>
          {openMenus.assetManagement && (
            <div className="ml-4 pl-2 border-l border-gray-200 dark:border-gray-700 mt-2 flex flex-col gap-2">
              <NavLink to="/dashboard" className={linkClass} onClick={handleLinkClick}>
                🏠 Dashboard
              </NavLink>

              {/* 💼 ครุภัณฑ์ */}
              <div>
                <button
                  onClick={() => toggleMenu("assets")}
                  className="w-full px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-gray-700 dark:text-gray-300 transition-colors duration-200"
                >
                  <span className="flex items-center gap-2">💼 ครุภัณฑ์</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openMenus.assets ? "rotate-180" : ""
                      }`}
                  />
                </button>
                {openMenus.assets && (
                  <div className="ml-6 mt-1 flex flex-col gap-1">
                    <NavLink to="/AllAsset" className={linkClass} onClick={handleLinkClick}>
                      📋 รายการทรัพย์สิน
                    </NavLink>
                    <NavLink to="/AddAsset" className={linkClass} onClick={handleLinkClick}>
                      ➕ เพิ่มทรัพย์สิน
                    </NavLink>
                  </div>
                )}
              </div>

              {/* 👤 พนักงาน */}
              <div>
                <button
                  onClick={() => toggleMenu("employees")}
                  className="w-full px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-gray-700 dark:text-gray-300 transition-colors duration-200"
                >
                  <span className="flex items-center gap-2">👤 พนักงาน</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openMenus.employees ? "rotate-180" : ""
                      }`}
                  />
                </button>
                {openMenus.employees && (
                  <div className="ml-6 mt-1 flex flex-col gap-1">
                    <NavLink to="/employee/emp_list" className={linkClass} onClick={handleLinkClick}>
                      📋 รายชื่อพนักงาน
                    </NavLink>
                    <NavLink to="/employee/emp_add" className={linkClass} onClick={handleLinkClick}>
                      ➕ เพิ่มพนักงาน
                    </NavLink>
                    <NavLink to="/employee/agency" className={linkClass} onClick={handleLinkClick}>
                      🏢 หน่วยงาน
                    </NavLink>
                  </div>
                )}
              </div>

              {/* ⚙️ Setting */}
              <div>
                <button
                  onClick={() => toggleMenu("settings")}
                  className="w-full px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-gray-700 dark:text-gray-300 transition-colors duration-200"
                >
                  <span className="flex items-center gap-2">⚙️ Setting</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openMenus.settings ? "rotate-180" : ""
                      }`}
                  />
                </button>
                {openMenus.settings && (
                  <div className="ml-6 mt-1 flex flex-col gap-1">
                    <NavLink to="/setting/location" className={linkClass} onClick={handleLinkClick}>
                      Location
                    </NavLink>
                    <NavLink to="/setting/asset-type" className={linkClass} onClick={handleLinkClick}>
                      Asset Type
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <hr className="my-2 border-gray-200 dark:border-gray-700" />
      </nav>

      <nav className="flex flex-col gap-2 text-sm font-medium">
        <div>
          <button
            onClick={() => toggleMenu("lineSupport")}
            className="w-full px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-gray-700 dark:text-gray-300 transition-colors duration-200"
          >
            <span className="flex items-center gap-2">🤖 Line Support AI</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${openMenus.lineSupport ? "rotate-180" : ""
                }`}
            />
          </button>
          {openMenus.lineSupport && (
            <div className="ml-6 mt-1 flex flex-col gap-1">
              <NavLink to="/line-support/dashboard" className={linkClass} onClick={handleLinkClick}>
                📊 Dashboard
              </NavLink>
              <NavLink to="/line-support/users" className={linkClass} onClick={handleLinkClick}>
                👥 รายชื่อผู้ใช้งาน
              </NavLink>
              <NavLink to="/line-support/escalated" className={linkClass} onClick={handleLinkClick}>
                ⚠️ ปัญหาที่ส่งต่อ IT
              </NavLink>
              <NavLink to="/line-support/settings" className={linkClass} onClick={handleLinkClick}>
                ⚙️ การตั้งค่า AI
              </NavLink>
            </div>
          )}
        </div>
      </nav>

    </aside>
  );
};

export default Sidebar;
