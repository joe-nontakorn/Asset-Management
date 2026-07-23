import type { ReactNode } from "react";
import { motion } from "framer-motion";

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

const Card = ({ title, children, className = "" }: CardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`bg-white dark:bg-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none rounded-2xl p-6 dark:text-gray-100 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-300/50 dark:hover:border-gray-600 ${className}`}
  >
    {title && (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
          {title}
        </h2>
      </div>
    )}
    {children}
  </motion.div>
);

export default Card;

