import React from 'react';
import type { SVGProps } from 'react'; // Import SVGProps

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<SVGProps<SVGSVGElement>>; // Use more specific type for icon
  colorClass?: string; // e.g., 'text-emerald-500' or 'text-red-500'
  footer?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, colorClass = 'text-sky-600', footer }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-500 uppercase">{title}</h3>
        <div className={`p-2 rounded-full bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>
            {React.cloneElement(icon, { className: `w-6 h-6 ${colorClass}` })}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      {footer && <p className="text-xs text-slate-400">{footer}</p>}
    </div>
  );
};