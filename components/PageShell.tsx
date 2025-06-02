
import React from 'react';

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode; // Optional slot for buttons like "Add New" or "Export"
}

export const PageShell: React.FC<PageShellProps> = ({ title, children, actions }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      <div className="bg-white shadow-xl rounded-lg p-6">
        {children}
      </div>
    </div>
  );
};
