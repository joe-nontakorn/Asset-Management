import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string; // ✅ เพิ่ม prop className
}

const Card = ({ children, className = "" }: CardProps) => {
  return (
    <div className={`bg-white rounded shadow p-4 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
