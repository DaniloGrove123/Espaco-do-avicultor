
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Transaction, EggProductionRecord, DataContextType, FinancialSummary, EggProductionSummary, BusinessDetails, PaymentMethod, CommercialPackagingSetting } from '../types';
import { LOCAL_STORAGE_KEYS, EGG_PACKAGING_OPTIONS, COLLECTION_TIME_OPTIONS } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialBusinessDetails: BusinessDetails = {
  farmName: '',
  shedCount: 0,
  chickenCount: 0,
  currentBatchAge: '',
  commercialPackagingSettings: EGG_PACKAGING_OPTIONS.map(opt => ({ 
    packagingId: opt.id,
    isCommercialized: false,
    price: 0,
  })),
  defaultFreightCost: 0,
};

const sortEggProductionRecords = (records: EggProductionRecord[]): EggProductionRecord[] => {
  return [...records].sort((a, b) => {
    const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateComparison !== 0) return dateComparison;
    
    const orderA = COLLECTION_TIME_OPTIONS.find(opt => opt.id === a.collectionTimeOfDayId)?.order || 99;
    const orderB = COLLECTION_TIME_OPTIONS.find(opt => opt.id === b.collectionTimeOfDayId)?.order || 99;
    return orderA - orderB;
  });
};


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
  const [eggProduction, setEggProduction] = useLocalStorage<EggProductionRecord[]>(LOCAL_STORAGE_KEYS.EGG_PRODUCTION, []);
  const [businessDetails, setBusinessDetails] = useLocalStorage<BusinessDetails>(
    LOCAL_STORAGE_KEYS.BUSINESS_DETAILS, 
    () => { 
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.BUSINESS_DETAILS);
      if (stored) {
        const parsed = JSON.parse(stored) as BusinessDetails;
        
        if (!parsed.commercialPackagingSettings || parsed.commercialPackagingSettings.length !== EGG_PACKAGING_OPTIONS.length) {
          parsed.commercialPackagingSettings = EGG_PACKAGING_OPTIONS.map(opt => {
            const existingSetting = parsed.commercialPackagingSettings?.find(s => s.packagingId === opt.id);
            return existingSetting || { packagingId: opt.id, isCommercialized: false, price: 0 };
          });
        }
        if (typeof parsed.defaultFreightCost === 'undefined') {
            parsed.defaultFreightCost = 0;
        }
        if (typeof parsed.chickenCount === 'undefined') { 
            parsed.chickenCount = 0;
        }
        return parsed;
      }
      return initialBusinessDetails;
    }
  );
  const [loading, setLoading] = useState(false); 

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...transaction, id: Date.now().toString() }].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [setTransactions]);

  const addEggProductionRecord = useCallback((record: Omit<EggProductionRecord, 'id'>) => {
    setEggProduction(prev => sortEggProductionRecords([...prev, { ...record, id: Date.now().toString() }]));
  }, [setEggProduction]);

  const updateEggProductionRecord = useCallback((updatedRecord: EggProductionRecord) => {
    setEggProduction(prev => sortEggProductionRecords(
        prev.map(record => record.id === updatedRecord.id ? updatedRecord : record)
    ));
  }, [setEggProduction]);

  const deleteEggProductionRecord = useCallback((recordId: string) => {
    setEggProduction(prev => sortEggProductionRecords(
        prev.filter(record => record.id !== recordId)
    ));
  }, [setEggProduction]);

  const updateBusinessDetails = useCallback((details: BusinessDetails) => {
    const updatedSettings = EGG_PACKAGING_OPTIONS.map(opt => {
        const existingSetting = details.commercialPackagingSettings?.find(s => s.packagingId === opt.id);
        return existingSetting || { packagingId: opt.id, isCommercialized: false, price: 0 };
    });
    setBusinessDetails({ ...details, commercialPackagingSettings: updatedSettings });
  }, [setBusinessDetails]);

  const getFinancialSummary = useCallback((): FinancialSummary => {
    const totalRevenue = transactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses };
  }, [transactions]);

  const getEggProductionSummary = useCallback((): EggProductionSummary => {
    const todayObj = new Date();
    const todayYear = todayObj.getFullYear();
    const todayMonth = (todayObj.getMonth() + 1).toString().padStart(2, '0');
    const todayDay = todayObj.getDate().toString().padStart(2, '0');
    
    const today = `${todayYear}-${todayMonth}-${todayDay}`;
    const currentMonth = `${todayYear}-${todayMonth}`; 
    const currentYear = `${todayYear}`; 

    const todayEggs = eggProduction
      .filter(r => r.date === today)
      .reduce((sum, r) => sum + r.quantity, 0);
    const currentMonthEggs = eggProduction
      .filter(r => r.date.startsWith(currentMonth))
      .reduce((sum, r) => sum + r.quantity, 0);
    const currentYearEggs = eggProduction
      .filter(r => r.date.startsWith(currentYear))
      .reduce((sum, r) => sum + r.quantity, 0);
      
    return { today: todayEggs, currentMonth: currentMonthEggs, currentYear: currentYearEggs };
  }, [eggProduction]);

  const getAvailableEggStock = useCallback((): number => {
    const totalProduced = eggProduction.reduce((sum, record) => sum + record.quantity, 0);
    const totalSold = transactions.reduce((sum, transaction) => {
      if (transaction.eggSaleDetails) {
        return sum + transaction.eggSaleDetails.totalEggsSold;
      }
      return sum;
    }, 0);
    return totalProduced - totalSold;
  }, [eggProduction, transactions]);

  const getMonthlyFinancialData = useCallback((year: number) => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    });
    
    return months.map(monthStr => {
      const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));
      const revenue = monthTransactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      // Ensure month string is treated as local for toLocaleString
      const dateForMonth = new Date(year, parseInt(monthStr.split('-')[1]) - 1, 1);
      return { month: dateForMonth.toLocaleString('default', { month: 'short' }), revenue, expenses };
    });
  }, [transactions]);

  const getMonthlyEggProductionData = useCallback((year: number) => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    });

    return months.map(monthStr => {
      const quantity = eggProduction
        .filter(r => r.date.startsWith(monthStr))
        .reduce((sum, r) => sum + r.quantity, 0);
      // Ensure month string is treated as local for toLocaleString
      const dateForMonth = new Date(year, parseInt(monthStr.split('-')[1]) - 1, 1);
      return { month: dateForMonth.toLocaleString('default', { month: 'short' }), quantity };
    });
  }, [eggProduction]);

  const getDailyEggProductionData = useCallback((days: number) => {
    const todayObj = new Date(); // Base para iteração, hora local
    const dailyData: { date: string; quantity: number }[] = [];

    for (let i = 0; i < days; i++) {
      // Criar data para o dia da iteração, com hora 00:00:00 local
      const iterationDay = new Date(
        todayObj.getFullYear(),
        todayObj.getMonth(),
        todayObj.getDate() - i // Subtrai 'i' dias do dia atual
      );

      const year = iterationDay.getFullYear();
      const month = (iterationDay.getMonth() + 1).toString().padStart(2, '0');
      const day = iterationDay.getDate().toString().padStart(2, '0');
      const localDateStrForFilter = `${year}-${month}-${day}`; // Formato YYYY-MM-DD

      const quantity = eggProduction
        .filter(r => r.date === localDateStrForFilter)
        .reduce((sum, r) => sum + r.quantity, 0);
      
      const displayDateOnChart = `${day}/${month}`; // Formato DD/MM

      dailyData.push({ date: displayDateOnChart, quantity }); 
    }
    return dailyData.reverse(); // Ordem cronológica
  }, [eggProduction]);

  const getDailyPosturePercentageData = useCallback((days: number): { date: string; percentage: number }[] => {
    const activeHens = businessDetails.chickenCount;
    const todayObj = new Date(); // Base para iteração, hora local

    if (!activeHens || activeHens <= 0) {
      const dailyPercentages: { date: string; percentage: number }[] = [];
      for (let i = 0; i < days; i++) {
        const iterationDay = new Date(
          todayObj.getFullYear(),
          todayObj.getMonth(),
          todayObj.getDate() - i
        );
        const dayStr = iterationDay.getDate().toString().padStart(2, '0');
        const monthStr = (iterationDay.getMonth() + 1).toString().padStart(2, '0');
        const displayDate = `${dayStr}/${monthStr}`;
        dailyPercentages.push({ date: displayDate, percentage: 0 });
      }
      return dailyPercentages.reverse();
    }

    // Aggregate egg production by local DD/MM string
    const dailyProductionMap = eggProduction.reduce<Record<string, number>>((acc, record) => {
        const [year, month, day] = record.date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day); // Objeto Date local
        
        const dayStr = dateObj.getDate().toString().padStart(2, '0');
        const monthStr = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const displayDate = `${dayStr}/${monthStr}`;

        acc[displayDate] = (acc[displayDate] || 0) + record.quantity;
        return acc;
    }, {});


    const dailyPercentages: { date: string; percentage: number }[] = [];
    for (let i = 0; i < days; i++) {
        const iterationDay = new Date(
          todayObj.getFullYear(),
          todayObj.getMonth(),
          todayObj.getDate() - i
        );

        const dayStr = iterationDay.getDate().toString().padStart(2, '0');
        const monthStr = (iterationDay.getMonth() + 1).toString().padStart(2, '0');
        const displayDate = `${dayStr}/${monthStr}`; // Chave DD/MM para o mapa
        
        const quantityForDay = dailyProductionMap[displayDate] || 0;
        const percentage = parseFloat(((quantityForDay / activeHens) * 100).toFixed(1));
        dailyPercentages.push({ date: displayDate, percentage });
    }
    return dailyPercentages.reverse();

  }, [eggProduction, businessDetails.chickenCount]);


  const exportDataToCSV = useCallback((type: 'financial' | 'production') => {
    let dataToExport: any[] = [];
    let filename = '';
    let preferredOrder: string[] = [];

    if (type === 'financial') {
      dataToExport = transactions.map(t => { 
        const { eggSaleDetails, ...rest } = t;
        const flatTransaction: any = { ...rest };
        if (eggSaleDetails) {
          flatTransaction.packagingId = eggSaleDetails.packagingId;
          flatTransaction.packagingLabel = eggSaleDetails.packagingLabel;
          flatTransaction.unitsSold = eggSaleDetails.unitsSold;
          flatTransaction.totalEggsSold = eggSaleDetails.totalEggsSold;
        }
        if (typeof t.freightCostApplied !== 'undefined') {
            flatTransaction.freightCostApplied = t.freightCostApplied;
        }
        return flatTransaction;
      });
      filename = 'transacoes_financeiras.csv';
      preferredOrder = ['id', 'date', 'type', 'description', 'category', 'amount', 'paymentMethod', 'packagingId', 'packagingLabel', 'unitsSold', 'totalEggsSold', 'freightCostApplied'];
    } else if (type === 'production') {
      dataToExport = eggProduction.map(ep => ({
        ...ep,
        collectionTimeOfDayLabel: COLLECTION_TIME_OPTIONS.find(opt => opt.id === ep.collectionTimeOfDayId)?.label || ep.collectionTimeOfDayId
      }));
      filename = 'producao_ovos.csv';
      preferredOrder = ['id', 'date', 'collectionTimeOfDayId', 'collectionTimeOfDayLabel', 'quantity'];
    }

    if (dataToExport.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }
    
    const headerKeys = Array.from(new Set(dataToExport.flatMap(obj => Object.keys(obj))));
    const sortedHeaderKeys = headerKeys.sort((a, b) => {
        const indexA = preferredOrder.indexOf(a);
        const indexB = preferredOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });


    const headers = sortedHeaderKeys.join(',');
    const csvRows = dataToExport.map(row =>
        sortedHeaderKeys.map(header => {
            const value = row[header];
            if (value === undefined || value === null) return '';
            const stringValue = String(value);
            return (stringValue.includes(',')) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
        }).join(',')
    );

    const csvString = [headers, ...csvRows].join('\n');
    
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [transactions, eggProduction]); 
  
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300); 
    return () => clearTimeout(timer);
  }, []);


  return (
    <DataContext.Provider value={{ 
      transactions, 
      addTransaction, 
      eggProduction, 
      addEggProductionRecord, 
      updateEggProductionRecord, 
      deleteEggProductionRecord, 
      getFinancialSummary, 
      getEggProductionSummary,
      getMonthlyFinancialData,
      getMonthlyEggProductionData,
      getDailyEggProductionData,
      getDailyPosturePercentageData,
      exportDataToCSV,
      loading,
      businessDetails,
      updateBusinessDetails,
      getAvailableEggStock,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
