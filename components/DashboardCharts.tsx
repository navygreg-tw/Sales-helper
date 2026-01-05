
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Line
} from 'recharts';
import { MonthlyStat, MONTH_NAMES, CHINESE_MONTH_NAMES } from '../types';

interface Props {
  stats: MonthlyStat[];
}

const DashboardCharts: React.FC<Props> = ({ stats }) => {
  if (stats.length === 0) return null;

  const getChineseMonth = (engMonth: string) => {
    const idx = MONTH_NAMES.indexOf(engMonth);
    return idx !== -1 ? CHINESE_MONTH_NAMES[idx] : engMonth;
  };

  const chartData = stats.map(s => ({
    ...s,
    monthDisplay: getChineseMonth(s.month)
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Forecast Comparison Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-chart-bar text-indigo-500"></i> 需求變動趨勢 (舊 FCST vs 新 FCST)
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="monthDisplay" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                padding={{ left: 10, right: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
                formatter={(value: any) => [`${Number(value).toLocaleString()} kW`]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Bar name="舊需求 (Old FCST)" dataKey="oldFcst" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar name="新需求 (New FCST)" dataKey="newFcst" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confirmation Rate Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-chart-line text-emerald-500"></i> 需求與訂單轉換 (新 FCST vs 新 ACT)
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="monthDisplay" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                padding={{ left: 10, right: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`${Number(value).toLocaleString()} kW`]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Area type="monotone" name="新訂單 (New ACT)" dataKey="newAct" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAct)" />
              <Line type="monotone" name="新需求 (New FCST)" dataKey="newFcst" stroke="#6366f1" strokeDasharray="5 5" dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
