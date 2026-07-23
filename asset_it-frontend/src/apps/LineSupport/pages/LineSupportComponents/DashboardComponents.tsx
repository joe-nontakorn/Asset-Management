// src/pages/LineSupport/LineSupportComponents/DashboardComponents.tsx
import {
  Star,
  TrendingUp,
  Calendar,
  Activity,
  Ticket,
  Bug,
  Building2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, CartesianGrid,
} from "recharts";
import {
  type Issue, type RatingItem, type TrendItem, type ActivityItem,
  RATING_COLORS, PIE_COLORS, STATUS_CHART_COLORS, DARK_TOOLTIP,
  STATUS_CONFIG, normalizeStatus, type TicketStatus,
} from "./types";

// ============ StatCard ============
interface StatCardCustomProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
}

export const StatCardCustom = ({ label, value, icon, gradient, shadow }: StatCardCustomProps) => (
  <div className={`relative rounded-2xl bg-gradient-to-br ${gradient} text-white p-3 sm:p-4 md:p-5 shadow-lg ${shadow} overflow-hidden group hover:scale-[1.03] transition-transform duration-300`}>
    <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full blur-sm group-hover:scale-125 transition-transform duration-500" />
    <div className="absolute -bottom-2 -left-2 w-10 h-10 sm:w-14 sm:h-14 bg-white/5 rounded-full" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">{icon}</div>
      </div>
      <div className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate">{value}</div>
      <div className="text-[10px] sm:text-xs text-white/80 mt-0.5 md:mt-1 font-medium truncate">{label}</div>
    </div>
  </div>
);

// ============ ResolutionPieChart ============
interface PieDataPoint {
  name: string;
  value: number;
  status: TicketStatus;
}

export const ResolutionPieChart = ({ data, rate }: { data: PieDataPoint[]; rate: string }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-500" /> อัตราการแก้ไขปัญหา
      </h3>
      <span className="text-2xl font-bold text-indigo-500">{rate}%</span>
    </div>
    <div className="flex items-center justify-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
            {data.map((item, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_CHART_COLORS[item.status]} />
            ))}
          </Pie>
          <Tooltip contentStyle={DARK_TOOLTIP} itemStyle={{ color: "#fff" }} labelStyle={{ color: "#fff", fontWeight: "bold" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_CHART_COLORS[item.status] }} />
          {item.name} ({item.value})
        </div>
      ))}
    </div>
  </div>
);

// ============ RatingBarChart ============
export const RatingBarChart = ({ ratings, averageRating }: { ratings: RatingItem[]; averageRating: string | number }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" /> ความพึงพอใจ
      </h3>
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-yellow-400 to-amber-500 text-white rounded-lg shadow-md">
        <span className="text-2xl font-bold">{averageRating}</span>
        <Star className="w-4 h-4 fill-white text-white" />
      </div>
    </div>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={ratings} layout="vertical" margin={{ left: 10, right: 20 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="rating" tickFormatter={(v) => `${"⭐".repeat(v)}`} width={80} tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={DARK_TOOLTIP} itemStyle={{ color: "#fff" }} labelStyle={{ color: "#fff" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${value} คน`, "จำนวน"]} />
        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
          {ratings.map((_, index) => <Cell key={`bar-${index}`} fill={RATING_COLORS[index % RATING_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// ============ TrendsChart ============
export const TrendsChart = ({ trends }: { trends: TrendItem[] }) => (
  <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
    <h3 className="text-base font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
      <Calendar className="w-5 h-5 text-blue-500" /> แนวโน้มเคสในรอบ 7 วัน
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={trends}>
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(val) => String(val).split("-").slice(1).reverse().join("/")} />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: "#9ca3af" }} 
          allowDecimals={false}
          tickFormatter={(val) => String(Math.floor(val))}
        />
        <Tooltip contentStyle={DARK_TOOLTIP} labelStyle={{ color: "#fff", fontWeight: "bold" }} itemStyle={{ color: "#fff" }} />
        <Area type="monotone" dataKey="count" name="เคสใหม่" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
        <Area type="monotone" dataKey="resolved" name="แก้ไขเสร็จสมบูรณ์" stroke="#10b981" strokeWidth={3} fill="transparent" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// ============ ActivityFeed ============
export const ActivityFeed = ({ activities }: { activities: ActivityItem[] }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
      <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <Activity className="w-5 h-5 text-emerald-500" /> กิจกรรมล่าสุด
      </h3>
    </div>
    <div className="flex-1 overflow-y-auto max-h-[350px] p-4 space-y-4">
      {activities.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-4">ไม่มีกิจกรรมเมื่อเร็วๆ นี้</p>
      ) : (
        activities.map((act, i) => {
          const statusNorm = normalizeStatus(act.status);
          const cfg = STATUS_CONFIG[statusNorm];
          const StatusIcon = cfg.icon;
          const isNew = act.type === "new_ticket";

          return (
            <div key={i} className="flex gap-3 relative">
              {i !== activities.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-16px] w-0.5 bg-gray-100 dark:bg-gray-700" />}
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${isNew ? "bg-blue-100 text-blue-600" : `${cfg.bgLight} ${cfg.bgDark} ${cfg.color}`}`}>
                {isNew ? <Ticket className="w-4 h-4" /> : <StatusIcon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                  {isNew ? `เคสใหม่: ${act.id}` : `อัปเดตเคส: ${act.id}`}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {isNew ? `${act.user} แจ้งปัญหา: ${act.issue}` : `${act.user} เปลี่ยนสถานะเป็น ${cfg.label}`}
                </p>
                <p className="text-[9px] text-gray-400 mt-1">{new Date(act.time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

// ============ TopIssuesTable ============
export const TopIssuesTable = ({ issues }: { issues: Issue[] }) => (
  <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
      <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <Bug className="w-5 h-5 text-rose-500" /> ปัญหาที่พบบ่อย (Top Issues)
      </h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
            <th className="text-left px-6 py-3 font-semibold">#</th>
            <th className="text-left px-6 py-3 font-semibold">ปัญหา</th>
            <th className="text-center px-6 py-3 font-semibold">จำนวน</th>
            <th className="text-center px-6 py-3 font-semibold hidden sm:table-cell">อัตราแก้ไข</th>
            <th className="text-center px-6 py-3 font-semibold hidden md:table-cell">คะแนนเฉลี่ย</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {issues.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">ไม่พบข้อมูลปัญหา</td></tr>
          ) : (
            issues.map((issue, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 text-gray-400 dark:text-gray-500 font-mono">{i + 1}</td>
                <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                  <div className="max-w-xs truncate" title={issue.issue}>{issue.issue.replace(/^ปิดเคสสำเร็จ:\s*/i, "").split("\n")[0]}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold">{issue.count}</span>
                </td>
                <td className="px-6 py-4 text-center hidden sm:table-cell">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden hidden md:block">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${parseFloat(issue.resolutionRate)}%`, backgroundColor: parseFloat(issue.resolutionRate) >= 80 ? "#10b981" : parseFloat(issue.resolutionRate) >= 50 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">{issue.resolutionRate}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center hidden md:table-cell">
                  {issue.averageRating ? (
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{issue.averageRating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-xs">N/A</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ============ DepartmentChart ============
export const DepartmentChart = ({ departments }: { departments: Array<{ department: string; count: number }> }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm overflow-hidden h-full">
    <h3 className="text-base font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
      <Building2 className="w-5 h-5 text-cyan-500" /> สัดส่วนปัญหาแยกตามแผนก
    </h3>
    <div className="flex items-center justify-center">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={departments} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="department" stroke="none">
            {departments.map((_, index) => <Cell key={`cell-dept-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={DARK_TOOLTIP} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-4 space-y-2 max-h-[150px] overflow-y-auto pr-2">
      {departments.map((dept, i) => (
        <div key={dept.department} className="flex items-center justify-between text-xs p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-gray-700 dark:text-gray-300 font-medium">{dept.department}</span>
          </div>
          <span className="font-bold text-indigo-500">{dept.count} เคส</span>
        </div>
      ))}
    </div>
  </div>
);
