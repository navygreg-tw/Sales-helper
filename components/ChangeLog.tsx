
import React from 'react';
import { ChangeLogEntry, ChangeType, MONTH_NAMES, CHINESE_MONTH_NAMES } from '../types';

interface Props {
  logs: ChangeLogEntry[];
}

const ChangeLog: React.FC<Props> = ({ logs }) => {
  const getChineseMonth = (engMonth: string) => {
    const idx = MONTH_NAMES.indexOf(engMonth);
    return idx !== -1 ? CHINESE_MONTH_NAMES[idx] : engMonth;
  };

  const getLabel = (type: ChangeType) => {
    switch(type) {
      case ChangeType.FCST_ADDED: return { text: '新增需求', color: 'bg-blue-100 text-blue-700', icon: 'fa-circle-plus' };
      case ChangeType.FCST_REMOVED: return { text: '需求取消', color: 'bg-slate-100 text-slate-600', icon: 'fa-circle-xmark' };
      case ChangeType.FCST_MODIFIED: return { text: '需求變動', color: 'bg-indigo-100 text-indigo-700', icon: 'fa-pen-to-square' };
      case ChangeType.ACT_ADDED: return { text: '下單確認', color: 'bg-emerald-100 text-emerald-700', icon: 'fa-check-double' };
      case ChangeType.ACT_MODIFIED: return { text: '訂單變動', color: 'bg-teal-100 text-teal-700', icon: 'fa-file-invoice-dollar' };
      case ChangeType.CONVERTED: return { text: '轉正式訂單', color: 'bg-violet-100 text-violet-700', icon: 'fa-wand-magic-sparkles' };
      case ChangeType.DELAYED: return { text: '需求延後', color: 'bg-amber-100 text-amber-700', icon: 'fa-clock-rotate-left' };
      default: return { text: '未知變動', color: 'bg-slate-100 text-slate-700', icon: 'fa-question-circle' };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-indigo-500"></i> 客戶變動明細
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">基於需求(FCST)與訂單(ACT)之邏輯分析</p>
        </div>
        <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">{logs.length} 筆變動</span>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <i className="fa-solid fa-check-circle text-4xl opacity-20"></i>
            <p className="text-sm">未偵測到顯著變動</p>
          </div>
        ) : (
          logs.map((log, idx) => {
            const label = getLabel(log.type);
            const isAct = log.type === ChangeType.ACT_ADDED || log.type === ChangeType.ACT_MODIFIED || log.type === ChangeType.CONVERTED;
            
            return (
              <div key={idx} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${label.color}`}>
                    <i className={`fa-solid ${label.icon} text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${label.color}`}>
                        {label.text}
                      </span>
                      <span className="text-slate-400 text-xs font-mono">
                        [{getChineseMonth(log.month)}{log.targetMonth ? ` ➔ ${getChineseMonth(log.targetMonth)}` : ''}]
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <h4 className="font-bold text-slate-800 truncate">{log.customer}</h4>
                      <span className="text-slate-400 text-[11px] truncate">{log.module}</span>
                    </div>
                    <div className="mt-2 text-xs flex items-center gap-3">
                       {log.oldValue !== undefined && log.oldValue > 0 && (
                         <div className="flex flex-col">
                           <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">原數值</span>
                           <span className="line-through decoration-slate-300 text-slate-400">{isAct ? 'ACT' : 'FCST'} {log.oldValue.toLocaleString()}</span>
                         </div>
                       )}
                       <div className="flex flex-col">
                         <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">新數值</span>
                         {log.type === ChangeType.DELAYED ? (
                           <span className="font-bold text-amber-600">
                             <i className="fa-solid fa-arrow-right-long mr-1"></i> 排程延至 {getChineseMonth(log.targetMonth || '')}
                           </span>
                         ) : (
                           <span className={`font-bold ${isAct ? 'text-emerald-600' : 'text-indigo-600'}`}>
                             <i className="fa-solid fa-arrow-right-long mr-1 text-slate-200"></i> 
                             {isAct ? 'ACT' : 'FCST'} {log.newValue?.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">kW</span>
                           </span>
                         )}
                       </div>
                       {log.type === ChangeType.CONVERTED && (
                         <div className="ml-auto">
                           <span className="text-[10px] bg-violet-50 text-violet-500 px-2 py-0.5 rounded border border-violet-100 font-bold">
                             需求轉訂單完成
                           </span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChangeLog;
