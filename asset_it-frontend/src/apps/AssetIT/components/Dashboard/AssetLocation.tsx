import { useEffect, useState } from "react";
import axios from "axios";
import { MapPin, Package, Users, Loader2 } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

interface LocationSummary {
    location_name: string;
    asset_count: number;
    employee_count: number;
}

const AssetLocation = () => {
    const [data, setData] = useState<LocationSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${apiUrl}/api/dashboard/location/asset-location`);
                setData(res.data.data);
            } catch (err) {
                console.error("Failed to fetch:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const totalAssets = data.reduce((sum, loc) => sum + loc.asset_count, 0);
    const maxAssets = Math.max(...data.map((d) => d.asset_count), 1);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm transition-colors duration-200 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10">
                        <MapPin size={18} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Locations</h2>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">สรุปตามสถานที่</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-lg font-extrabold text-gray-900 dark:text-white tabular-nums">{data.length}</span>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">สาขา</p>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-gray-300 dark:text-gray-600" />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {data.map((loc, index) => {
                        const widthPercent = (loc.asset_count / maxAssets) * 100;

                        return (
                            <div
                                key={index}
                                className="group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                        {loc.location_name}
                                    </span>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                        <span className="flex items-center gap-1">
                                            <Package size={10} />
                                            {loc.asset_count}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users size={10} />
                                            {loc.employee_count}
                                        </span>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500"
                                        style={{ width: `${widthPercent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {/* Footer Summary */}
                    <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700/50 px-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">ทรัพย์สินรวม</span>
                            <span className="font-extrabold text-gray-900 dark:text-white tabular-nums">{totalAssets}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetLocation;
