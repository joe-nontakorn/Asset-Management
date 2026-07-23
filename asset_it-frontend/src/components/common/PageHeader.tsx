import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, icon, description, actions }: PageHeaderProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl dark:bg-blue-500/20 dark:text-blue-400">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {actions}
      </div>
    </motion.div>
  );
};

export default PageHeader;
