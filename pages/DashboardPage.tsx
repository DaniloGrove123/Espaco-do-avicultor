import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { PageShell } from '../components/PageShell';
import { SummaryCard } from '../components/SummaryCard';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { CurrencyDollarIcon, BeakerIcon, ChartBarIcon, ArchiveBoxIcon, CalendarDaysIcon } from '../constants'; 

export const DashboardPage: React.FC = () => {
  const { 
    getFinancialSummary, 
    getEggProductionSummary, 
    getMonthlyFinancialData, 
    getMonthlyEggProductionData, 
    getAvailableEggStock,
    loading 
  } = useData();

  const financialSummary = useMemo(() => getFinancialSummary(), [getFinancialSummary]);
  const eggProductionSummary = useMemo(() => getEggProductionSummary(), [getEggProductionSummary]);
  const availableEggStock = useMemo(() => getAvailableEggStock(), [getAvailableEggStock]);
  
  const currentYear = new Date().getFullYear();
  const monthlyFinancialChartData = useMemo(() => getMonthlyFinancialData(currentYear), [getMonthlyFinancialData, currentYear]);
  const monthlyEggProductionChartData = useMemo(() => getMonthlyEggProductionData(currentYear), [getMonthlyEggProductionData, currentYear]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return <PageShell title="Dashboard"><div className="text-center p-10">Carregando dados...</div></PageShell>;
  }

  return (
    <PageShell title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <SummaryCard 
          title="Receita Total" 
          value={financialSummary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          icon={<CurrencyDollarIcon />}
          colorClass="text-emerald-500"
          footer="Desde o início"
        />
        <SummaryCard 
          title="Despesa Total" 
          value={financialSummary.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          icon={<CurrencyDollarIcon />}
          colorClass="text-red-500"
          footer="Desde o início"
        />
        <SummaryCard 
          title="Lucro Líquido" 
          value={financialSummary.netProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          icon={<ChartBarIcon />}
          colorClass={financialSummary.netProfit >= 0 ? "text-emerald-500" : "text-red-500"}
          footer="Receitas - Despesas"
        />
        <SummaryCard 
          title="Ovos Coletados Hoje" 
          value={eggProductionSummary.today.toLocaleString('pt-BR')}
          icon={<BeakerIcon />}
          colorClass="text-sky-500"
          footer={formatDate(new Date().toISOString().split('T')[0])}
        />
        <SummaryCard 
          title="Estoque de Ovos" 
          value={availableEggStock.toLocaleString('pt-BR')}
          icon={<ArchiveBoxIcon />} 
          colorClass={availableEggStock >= 0 ? "text-blue-500" : "text-orange-500"} 
          footer="Disponível para venda"
        />
         <SummaryCard 
          title="Ovos Coletados (Mês)" 
          value={eggProductionSummary.currentMonth.toLocaleString('pt-BR')}
          icon={<CalendarDaysIcon />}
          colorClass="text-sky-600"
          footer={`Total em ${new Date().toLocaleString('pt-BR', { month: 'long' })}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Financeiro Mensal ({currentYear})</h3>
          <SimpleBarChart 
            data={monthlyFinancialChartData}
            xAxisKey="month"
            barDataKeys={[
              { key: 'revenue', color: '#10b981', name: 'Receita' },
              { key: 'expenses', color: '#ef4444', name: 'Despesa' }
            ]}
          />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Produção Mensal de Ovos ({currentYear})</h3>
           <SimpleBarChart 
            data={monthlyEggProductionChartData}
            xAxisKey="month"
            barDataKeys={[
              { key: 'quantity', color: '#0ea5e9', name: 'Quantidade de Ovos Coletados' }
            ]}
          />
        </div>
      </div>
    </PageShell>
  );
};