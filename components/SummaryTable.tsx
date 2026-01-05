
import React from 'react';
import { MonthlyStat, MONTH_NAMES, CHINESE_MONTH_NAMES } from '../types';

interface Props {
  stats: MonthlyStat[];
}

const SummaryTable: React.FC<Props> = ({ stats }) => {
  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm text-slate-400">
        <i className="fa-solid fa-triangle-exclamation text-3xl mb-3"></i>
        <p>未在檔案中偵測到月份數據塊，請確認標題列包含「FCST/ACT/客戶」等關鍵字。</p>
      </div>
    );
  }

  const getChineseMonth = (engMonth: string) => {
    const idx = MONTH_NAMES.indexOf(engMonth);
    return idx !== -1 ? CHINESE_MONTH_NAMES[idx] : engMonth;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-table-list text-indigo-500"></i> 每月產銷數據概況
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">單位: kW</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <th className="px-6 py-4 text-left sticky left-0 bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">數據項目 / 月份</th>
              {stats.map(s => (
                <th key={s.month} className="px-6 py-4 text-center min-w-[120px]">{getChineseMonth(s.month)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {/* FCST Section */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                FCST 期初 (舊需求)
              </td>
              {stats.map(s => (
                <td key={s.month} className="px-6 py-4 text-center text-slate-500 font-mono">
                  {s.oldFcst.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-indigo-600 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                FCST 本期 (新需求)
              </td>
              {stats.map(s => (
                <td key={s.month} className="px-6 py-4 text-center text-indigo-600 font-bold font-mono">
                  {s.newFcst.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50/30">
              <td className="px-6 py-4 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                FCST 需求差異
              </td>
              {stats.map(s => {
                const isPos = s.fcstDiff > 0.1;
                const isNeg = s.fcstDiff < -0.1;
                return (
                  <td 
                    key={s.month} 
                    className={`px-6 py-4 text-center font-bold font-mono ${isPos ? 'text-emerald-500' : isNeg ? 'text-rose-500' : 'text-slate-300'}`}
                  >
                    {Math.abs(s.fcstDiff) < 0.1 ? "-" : (isPos ? "+" : "") + s.fcstDiff.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                );
              })}
            </tr>

            {/* ACT Section */}
            <tr className="hover:bg-slate-50 transition-colors border-t-2 border-slate-100">
              <td className="px-6 py-4 font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                ACT 期初 (舊訂單)
              </td>
              {stats.map(s => (
                <td key={s.month} className="px-6 py-4 text-center text-slate-500 font-mono">
                  {s.oldAct.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-emerald-600 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                ACT 本期 (新訂單)
              </td>
              {stats.map(s => (
                <td key={s.month} className="px-6 py-4 text-center text-emerald-600 font-bold font-mono">
                  {s.newAct.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50/30">
              <td className="px-6 py-4 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                ACT 訂單差異
              </td>
              {stats.map(s => {
                const isPos = s.actDiff > 0.1;
                const isNeg = s.actDiff < -0.1;
                return (
                  <td 
                    key={s.month} 
                    className={`px-6 py-4 text-center font-bold font-mono ${isPos ? 'text-emerald-500' : isNeg ? 'text-rose-500' : 'text-slate-300'}`}
                  >
                    {Math.abs(s.actDiff) < 0.1 ? "-" : (isPos ? "+" : "") + s.actDiff.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryTable;
