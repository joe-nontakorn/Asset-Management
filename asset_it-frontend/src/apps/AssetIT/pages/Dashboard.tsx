// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import MainLayout from "../../../layouts/MainLayout";
import StatCard from "../../../components/common/StatCard";
import {
  Package,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Laptop,
} from "lucide-react";
import AssetsStatusType from "../components/Dashboard/AssetsStatusType";
import AssetLocation from "../components/Dashboard/AssetLocation";
import RecentActivity from "../components/Dashboard/RecentActivity";
import WarrantyAlert from "../components/Dashboard/RepairOverview";
import WarrantyExpiring from "../components/Dashboard/WarrantyExpiring";
import { motion, type Variants } from "framer-motion";

const apiUrl = import.meta.env.VITE_API_URL;

// ✅ ประกาศ type เพื่อหลีกเลี่ยงการใช้ any
interface Asset {
  id: number;
  asset_no: string;
  serial_no: string;
  name: string;
  brand: string;
  model: string;
  type_id: number;
  status: string;
  emp_id: number | null;
  type_name: string;
  employee_name: string | null;
  location_name: string;
  location_id: number;
  warranty_expiry: string;
}

const Dashboard = () => {
  const [totalAssets, setTotalAssets] = useState<number | null>(null);
  const [inUseAssets, setInUseAssets] = useState<number | null>(null);
  const [availableAssets, setAvailableAssets] = useState<number | null>(null);
  const [brokenAssets, setBrokenAssets] = useState<number | null>(null);
  const [laptopAssets, setLaptopAssets] = useState<number | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // ✅ ดึงข้อมูลทั้งหมด
        const resTotal = await fetch(`${apiUrl}/api/assets/search`);
        const jsonTotal = await resTotal.json();

        const allAssets: Asset[] = jsonTotal.data;
        const filteredTotal = allAssets.filter(asset => asset.status !== "disposed");
        setTotalAssets(filteredTotal.length);

        // ✅ ดึง in_use
        const resInUse = await fetch(`${apiUrl}/api/assets/search?status=in_use`);
        const jsonInUse = await resInUse.json();
        setInUseAssets(jsonInUse.results);

        // ✅ ดึง available
        const resAvailable = await fetch(`${apiUrl}/api/assets/search?status=available`);
        const jsonAvailable = await resAvailable.json();
        setAvailableAssets(jsonAvailable.results);

        // ✅ ดึง broken
        const resBroken = await fetch(`${apiUrl}/api/assets/search?status=broken`);
        const jsonBroken = await resBroken.json();
        setBrokenAssets(jsonBroken.results);

        // ✅ ดึง laptop available
        const resLaptop = await fetch(`${apiUrl}/api/assets/search?status=available&type_id=2`);
        const jsonLaptop = await resLaptop.json();
        setLaptopAssets(jsonLaptop.results);
      } catch (err) {
        console.error("Error fetching asset data:", err);
      }
    };

    fetchCounts();
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-2"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Asset Management 📦
            </h1>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          <motion.div variants={itemVariants}>
            <StatCard
              title="Assets"
              value={totalAssets ?? "-"}
              icon={<Package />}
              bgColor="bg-orange-400"
              link="/AllAsset"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="In Use"
              value={inUseAssets ?? "-"}
              icon={<Monitor />}
              bgColor="bg-blue-500"
              link="/AllAsset?status=in_use"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Available"
              value={availableAssets ?? "-"}
              icon={<CheckCircle2 />}
              bgColor="bg-emerald-500"
              link="/AllAsset?status=available"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Broken"
              value={brokenAssets ?? "-"}
              icon={<AlertTriangle />}
              bgColor="bg-rose-500"
              link="/AllAsset?status=broken"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Laptop Available"
              value={laptopAssets ?? "-"}
              icon={<Laptop />}
              bgColor="bg-violet-500"
              link="/AllAsset?status=available&type_id=2&type=2"
            />
          </motion.div>
        </motion.div>

        {/* Row 2: Recent Activity + Warranty Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <RecentActivity />
          <WarrantyAlert />
        </motion.div>

        {/* Row 3: Chart + Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
        >
          <div className="lg:col-span-8">
            <AssetsStatusType />
          </div>
          <div className="lg:col-span-4 relative min-h-[400px] lg:min-h-0">
            <div className="lg:absolute lg:inset-0 h-full">
              <AssetLocation />
            </div>
          </div>
        </motion.div>

        {/* Row 4: Warranty Detail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <WarrantyExpiring />
        </motion.div>

      </div>
    </MainLayout>
  );
};

export default Dashboard;
