import React from 'react';
import { motion } from 'motion/react';

interface MacroRingProps {
  percentage: number;
  color: string;
  label: string;
  value: number;
  unit: string;
  size?: number;
}

export const MacroRing: React.FC<MacroRingProps> = ({ 
  percentage, 
  color, 
  label, 
  value, 
  unit,
  size = 120 
}) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-slate-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <motion.circle
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
            stroke={color}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{value}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">{unit}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
};
