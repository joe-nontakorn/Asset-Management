import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import axios from "axios";
import { BarChart3, Loader2 } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

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

interface AssetType {
  id: number;
  name: string;
}

interface ChartItem {
  name: string;
  value: number;
}

const CHART_COLORS = [
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
        <p className="font-bold mb-0.5">{label}</p>
        <p className="text-gray-300">จำนวน: <span className="text-white font-bold">{payload[0].value}</span> รายการ</p>
      </div>
    );
  }
  return null;
};

const AssetTypeLineChart = () => {
  const [data, setData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalActive, setTotalActive] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const typeRes = await axios.get(`${apiUrl}/api/assets/types-id`);
        const types: AssetType[] = typeRes.data.data;

        const promises = types.map((type) =>
          axios.get(`${apiUrl}/api/assets/search?type_id=${type.id}`)
        );

        const responses = await Promise.all(promises);

        const chartData: ChartItem[] = responses
          .map((res, idx) => {
            const allAssets: Asset[] = res.data.data;
            const filtered = allAssets.filter(asset => asset.status !== "disposed");
            return {
              name: types[idx].name,
              value: filtered.length
            };
          })
          .filter(d => d.value > 0)
          .sort((a, b) => b.value - a.value);

        setData(chartData);
        setTotalActive(chartData.reduce((sum, d) => sum + d.value, 0));
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
            <BarChart3 size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Assets by Type</h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">จำนวนทรัพย์สินแยกตามประเภท</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-extrabold text-gray-900 dark:text-white tabular-nums">{totalActive}</span>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Active Total</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <Loader2 size={24} className="animate-spin text-gray-300 dark:text-gray-600" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }} barCategoryGap="20%">
              <defs>
                {data.map((_, idx) => (
                  <linearGradient key={idx} id={`barGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-10" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={11}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={`url(#barGrad${idx})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AssetTypeLineChart;
