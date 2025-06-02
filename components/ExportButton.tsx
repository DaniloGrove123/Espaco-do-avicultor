
import React from 'react';
import { useData } from '../contexts/DataContext';
import { ArrowDownTrayIcon } from '../constants';

interface ExportButtonProps {
  dataType: 'financial' | 'production';
  label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ dataType, label }) => {
  const { exportDataToCSV } = useData();

  const handleExport = () => {
    exportDataToCSV(dataType);
  };

  const defaultLabel = dataType === 'financial' ? 'Exportar Financeiro (CSV)' : 'Exportar Produção (CSV)';

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition duration-150 flex items-center text-sm"
    >
      <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
      {label || defaultLabel}
    </button>
  );
};
