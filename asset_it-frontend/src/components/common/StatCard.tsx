// src/components/common/StatCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  bgColor?: string;
  link?: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bgColor = "bg-gray-200", link }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      {/* Accent top bar */}
      <div className={`h-1 ${bgColor}`} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${bgColor} bg-opacity-15 dark:bg-opacity-20`}>
            <div className={`${bgColor.replace('bg-', 'text-').replace('400', '600').replace('500', '600')}`}>
              {icon && React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 18 })}
            </div>
          </div>
          {link && (
            <Link
              to={link}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
            >
              <ArrowUpRight size={16} />
            </Link>
          )}
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
          {value}
        </div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </div>
      </div>

      {/* View link */}
      {link && (
        <Link
          to={link}
          className="flex items-center justify-center gap-1 text-[11px] font-semibold py-2 border-t border-gray-100 dark:border-gray-700/50 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors"
        >
          ดูรายละเอียด
          <ArrowUpRight size={12} />
        </Link>
      )}
    </div>
  );
};

export default StatCard;
