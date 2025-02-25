import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`px-6 py-3 text-lg font-semibold rounded-2xl transition-all ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
