
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ChartData } from '../types';

interface SimpleBarChartProps {
  data: ChartData[];
  xAxisKey: string;
  barDataKeys: { key: string; color: string; name?: string }[];
  height?: number;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, xAxisKey, barDataKeys, height = 300 }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-10 text-slate-500">Não há dados para exibir no gráfico.</div>;
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} stroke="#6b7280" />
        <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
        <Tooltip
          contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
          labelStyle={{ color: '#333', fontWeight: 'bold' }}
        />
        <Legend wrapperStyle={{ fontSize: '14px' }} />
        {barDataKeys.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} name={bar.name || bar.key} fill={bar.color} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

interface SimplePieChartProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
}
// Note: Recharts PieChart is not explicitly used but kept for potential future.
// import { PieChart, Pie } from 'recharts';
// export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data, height = 300 }) => {
//   if (!data || data.length === 0) {
//     return <div className="text-center py-10 text-slate-500">Não há dados para exibir no gráfico.</div>;
//   }
//   return (
//     <ResponsiveContainer width="100%" height={height}>
//       <PieChart>
//         <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={Math.min(height/3, 100)} label>
//           {data.map((entry, index) => (
//             <Cell key={`cell-${index}`} fill={entry.color} />
//           ))}
//         </Pie>
//         <Tooltip />
//         <Legend />
//       </PieChart>
//     </ResponsiveContainer>
//   );
// };
