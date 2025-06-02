
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { PageShell } from '../components/PageShell';
import { Modal } from '../components/Modal';
import { ExportButton } from '../components/ExportButton';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { SummaryCard } from '../components/SummaryCard';
import { EggProductionRecord } from '../types';
import { PlusCircleIcon, COLLECTION_TIME_OPTIONS, CalendarDaysIcon, BeakerIcon, ChartBarIcon, PencilIcon, TrashIcon } from '../constants';

interface EggCollectionFormProps {
  onSave: (record: EggProductionRecord) => void;
  onClose: () => void;
  existingRecord?: EggProductionRecord | null;
}

const EggCollectionForm: React.FC<EggCollectionFormProps> = ({ onSave, onClose, existingRecord }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectionTimeOfDayId, setCollectionTimeOfDayId] = useState<string>(COLLECTION_TIME_OPTIONS[0]?.id || '');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (existingRecord) {
      setDate(existingRecord.date);
      setCollectionTimeOfDayId(existingRecord.collectionTimeOfDayId);
      setQuantity(existingRecord.quantity.toString());
    } else {
      // Reset for new record
      setDate(new Date().toISOString().split('T')[0]);
      setCollectionTimeOfDayId(COLLECTION_TIME_OPTIONS[0]?.id || '');
      setQuantity('');
    }
  }, [existingRecord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !date || !collectionTimeOfDayId) {
      alert('Por favor, preencha todos os campos: Data, Parte do Dia e Quantidade.');
      return;
    }
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity < 0) {
        alert('Por favor, insira uma quantidade válida (número igual ou maior que zero).');
        return;
    }
    
    const recordToSave: EggProductionRecord = {
        id: existingRecord?.id || Date.now().toString(), // Use existing ID or generate new
        date,
        collectionTimeOfDayId,
        quantity: numQuantity,
    };
    onSave(recordToSave);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-slate-700">Data da Coleta <span className="text-red-500">*</span></label>
        <input 
          type="date" 
          id="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          required 
          className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
        />
      </div>
      <div>
        <label htmlFor="collectionTimeOfDayId" className="block text-sm font-medium text-slate-700">Parte do Dia <span className="text-red-500">*</span></label>
        <select
          id="collectionTimeOfDayId"
          value={collectionTimeOfDayId}
          onChange={(e) => setCollectionTimeOfDayId(e.target.value)}
          required
          className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="" disabled>Selecione...</option>
          {COLLECTION_TIME_OPTIONS.map(option => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Quantidade de Ovos <span className="text-red-500">*</span></label>
        <input 
          type="number" 
          id="quantity" 
          value={quantity} 
          onChange={(e) => setQuantity(e.target.value)} 
          required 
          placeholder="Ex: 150" 
          min="0" 
          className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
        />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md">
          {existingRecord ? 'Salvar Alterações' : 'Salvar Coleta'}
        </button>
      </div>
    </form>
  );
};

export const ProductionPage: React.FC = () => {
  const { 
    eggProduction, 
    addEggProductionRecord, 
    updateEggProductionRecord,
    deleteEggProductionRecord,
    getDailyEggProductionData, 
    getDailyPosturePercentageData,
    getEggProductionSummary, 
    businessDetails,
    loading 
  } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EggProductionRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const eggSummary = useMemo(() => getEggProductionSummary(), [getEggProductionSummary, eggProduction]); // Added eggProduction dependency

  const sortedProduction = useMemo(() => {
    return [...eggProduction].sort((a, b) => {
      const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      const orderA = COLLECTION_TIME_OPTIONS.find(opt => opt.id === a.collectionTimeOfDayId)?.order || 99;
      const orderB = COLLECTION_TIME_OPTIONS.find(opt => opt.id === b.collectionTimeOfDayId)?.order || 99;
      return orderA - orderB;
    });
  }, [eggProduction]);
  
  const currentYear = new Date().getFullYear();
  const dailyQuantityChartData = useMemo(() => getDailyEggProductionData(30), [getDailyEggProductionData, eggProduction]); // Added eggProduction
  const dailyPosturePercentageChartData = useMemo(() => getDailyPosturePercentageData(30), [getDailyPosturePercentageData, eggProduction, businessDetails.chickenCount]); // Added eggProduction and chickenCount


  if (loading && eggProduction.length === 0) {
    return <PageShell title="Controle de Coleta de Ovos"><div className="text-center p-10">Carregando dados...</div></PageShell>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); 
    return date.toLocaleDateString('pt-BR');
  };

  const getCollectionTimeLabel = (id: string) => {
    return COLLECTION_TIME_OPTIONS.find(opt => opt.id === id)?.label || id;
  };

  const handleOpenModalForNew = () => {
    setEditingRecord(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (record: EggProductionRecord) => {
    setEditingRecord(record);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSaveCollection = (record: EggProductionRecord) => {
    if (isEditMode) {
      updateEggProductionRecord(record);
    } else {
      // For new records, the ID is generated by the form or context
      const { id, ...newRecordData } = record; // If ID is already there, it's fine. If not, context will add.
      addEggProductionRecord(newRecordData);
    }
    setIsModalOpen(false);
    setEditingRecord(null);
    setIsEditMode(false);
  };

  const handleDeleteCollection = (recordId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta coleta? Esta ação não pode ser desfeita.")) {
      deleteEggProductionRecord(recordId);
    }
  };

  return (
    <PageShell 
      title="Controle de Coleta de Ovos"
      actions={
        <>
          <button
            onClick={handleOpenModalForNew}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-150 flex items-center text-sm"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Nova Coleta
          </button>
          <ExportButton dataType="production" label="Exportar Coletas (CSV)" />
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
         <SummaryCard 
          title="Ovos Coletados Hoje" 
          value={eggSummary.today.toLocaleString('pt-BR')}
          icon={<BeakerIcon />} 
          colorClass="text-sky-500"
          footer={formatDate(new Date().toISOString().split('T')[0])}
        />
        <SummaryCard 
          title="Total no Mês Atual" 
          value={eggSummary.currentMonth.toLocaleString('pt-BR')}
          icon={<CalendarDaysIcon />}
          colorClass="text-sky-600"
          footer={`Em ${new Date().toLocaleString('pt-BR', { month: 'long' })} de ${currentYear}`}
        />
         <SummaryCard 
          title="Total no Ano" 
          value={eggSummary.currentYear.toLocaleString('pt-BR')}
          icon={<CalendarDaysIcon />}
          colorClass="text-sky-700"
          footer={`Em ${currentYear}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Coletas Diárias (Últimos 30 dias)</h3>
          <p className="text-xs text-slate-500 mb-4">Quantidade de ovos coletados por dia.</p>
          <SimpleBarChart 
            data={dailyQuantityChartData}
            xAxisKey="date" 
            barDataKeys={[{ key: 'quantity', color: '#38bdf8', name: 'Ovos' }]}
          />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Porcentagem de Postura Diária (%)</h3>
           <p className="text-xs text-slate-500 mb-4">
            Últimos 30 dias. Calculado com base em {businessDetails.chickenCount > 0 ? businessDetails.chickenCount.toLocaleString('pt-BR') : 'N/A'} galinhas totais.
          </p>
          <SimpleBarChart 
            data={dailyPosturePercentageChartData}
            xAxisKey="date" 
            barDataKeys={[{ key: 'percentage', color: '#22c55e', name: '% Postura' }]}
          />
           {businessDetails.chickenCount <= 0 && (
            <p className="text-xs text-orange-600 mt-2 text-center">
              A porcentagem de postura não pode ser calculada pois o "Número Total de Galinhas" não foi definido em "Dados da Granja".
            </p>
          )}
        </div>
      </div>

      {sortedProduction.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
         <p className="text-slate-500 text-center py-8">Nenhuma coleta registrada. Clique em "Nova Coleta" para adicionar.</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto mt-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Histórico Detalhado de Coletas</h3>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Parte do Dia</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Quantidade</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {sortedProduction.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{formatDate(record.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{getCollectionTimeLabel(record.collectionTimeOfDayId)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right font-medium">{record.quantity.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-2">
                    <button 
                        onClick={() => handleOpenModalForEdit(record)}
                        className="text-sky-600 hover:text-sky-800 transition-colors p-1"
                        title="Editar Coleta"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleDeleteCollection(record.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Excluir Coleta"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
            setIsModalOpen(false); 
            setEditingRecord(null); 
            setIsEditMode(false);
        }} 
        title={isEditMode ? "Editar Coleta de Ovos" : "Nova Coleta de Ovos"}
      >
        {isModalOpen && <EggCollectionForm 
            onSave={handleSaveCollection} 
            onClose={() => {
                setIsModalOpen(false); 
                setEditingRecord(null);
                setIsEditMode(false);
            }} 
            existingRecord={editingRecord} 
        />}
      </Modal>
    </PageShell>
  );
};
