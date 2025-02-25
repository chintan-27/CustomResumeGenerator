import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div className={`p-6 bg-white shadow-lg rounded-2xl border border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
