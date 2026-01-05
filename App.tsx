
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { parseExcelFile } from './services/excelParser';
import { runAnalysis } from './services/analysisEngine';
import { MonthlyStat, ChangeLogEntry, RawDataPoint, ChangeType, MONTH_NAMES, CHINESE_MONTH_NAMES } from './types';
import SummaryTable from './components/SummaryTable';
import ChangeLog from './components/ChangeLog';
import DashboardCharts from './components/DashboardCharts';

const App: React.FC = () => {
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ stats: MonthlyStat[], logs: ChangeLogEntry[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'visuals' | 'logs'>('summary');

  const getChineseMonth = (engMonth: string) => {
    const idx = MONTH_NAMES.indexOf(engMonth);
    return idx !== -1 ? CHINESE_MONTH_NAMES[idx] : engMonth;
  };

  const handleComparison = async () => {
    if (!oldFile || !newFile) {
      alert("請選擇舊版與新版兩個檔案！");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const oldData = await parseExcelFile(oldFile, 'Old');
      const newData = await parseExcelFile(newFile, 'New');

      if (oldData.length === 0 && newData.length === 0) {
        alert("無法從檔案中提取有效數據，請檢查檔案格式是否正確。");
        setLoading(false);
        return;
      }

      const { monthlyStats, logs } = runAnalysis(oldData, newData);
      setResults({ stats: monthlyStats, logs });

    } catch (error: any) {
      alert("分析發生錯誤：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    setLoading(true);
    setTimeout(() => {
      const demoOld: RawDataPoint[] = [
        { id: 'January_CustA_ModX', month: 'January', customer: '台積電', module: 'Mod-X', type: 'FCST', value: 5000, version: 'Old' },
        { id: 'January_CustB_ModY', month: 'January', customer: '鴻海', module: 'Mod-Y', type: 'FCST', value: 3200, version: 'Old' },
        { id: 'February_CustA_ModX', month: 'February', customer: '台積電', module: 'Mod-X', type: 'FCST', value: 5200, version: 'Old' },
        { id: 'March_CustC_ModZ', month: 'March', customer: '聯發科', module: 'Mod-Z', type: 'FCST', value: 1500, version: 'Old' },
      ];
      const demoNew: RawDataPoint[] = [
        { id: 'January_CustA_ModX', month: 'January', customer: '台積電', module: 'Mod-X', type: 'FCST', value: 4800, version: 'New' },
        { id: 'January_CustA_ModX', month: 'January', customer: '台積電', module: 'Mod-X', type: 'ACT', value: 4750, version: 'New' },
        { id: 'January_CustB_ModY', month: 'January', customer: '鴻海', module: 'Mod-Y', type: 'FCST', value: 3200, version: 'New' },
        { id: 'February_CustA_ModX', month: 'February', customer: '台積電', module: 'Mod-X', type: 'FCST', value: 0, version: 'New' },
        { id: 'March_CustA_ModX', month: 'March', customer: '台積電', module: 'Mod-X', type: 'FCST', value: 5150, version: 'New' },
        { id: 'March_CustC_ModZ', month: 'March', customer: '聯發科', module: 'Mod-Z', type: 'FCST', value: 1800, version: 'New' },
        { id: 'March_CustD_ModW', month: 'March', customer: '廣達', module: 'Mod-W', type: 'FCST', value: 900, version: 'New' },
      ];

      const { monthlyStats, logs } = runAnalysis(demoOld, demoNew);
      setResults({ stats: monthlyStats, logs });
      setLoading(false);
    }, 800);
  };

  const handleExportXLSX = () => {
    if (!results) return;

    const wb = XLSX.utils.book_new();

    // 1. 變動明細分頁
    const typeMap: Record<string, string> = {
      [ChangeType.FCST_ADDED]: '新增需求',
      [ChangeType.FCST_REMOVED]: '需求取消',
      [ChangeType.FCST_MODIFIED]: '需求變動',
      [ChangeType.ACT_ADDED]: '下單確認',
      [ChangeType.ACT_MODIFIED]: '訂單變動',
      [ChangeType.CONVERTED]: '轉正式訂單',
      [ChangeType.DELAYED]: '需求延後'
    };

    const logData = results.logs.map(log => ({
      '變動類型': typeMap[log.type] || log.type,
      '發生月份': getChineseMonth(log.month),
      '客戶名稱': log.customer,
      '模組型號': log.module,
      '原數值 (kW)': log.oldValue || 0,
      '新數值 (kW)': log.newValue || 0,
      '調整後月份': log.targetMonth ? getChineseMonth(log.targetMonth) : ''
    }));

    const wsLogs = XLSX.utils.json_to_sheet(logData);
    XLSX.utils.book_append_sheet(wb, wsLogs, "1. 變動明細");

    // 2. 每月數據總覽 (表格形式)
    const summaryHeader = ["數據項目", ...results.stats.map(s => getChineseMonth(s.month))];
    const summaryRows = [
      ["FCST 期初 (舊)", ...results.stats.map(s => s.oldFcst)],
      ["FCST 本期 (新)", ...results.stats.map(s => s.newFcst)],
      ["FCST 差異值", ...results.stats.map(s => s.fcstDiff)],
      ["ACT 期初 (舊)", ...results.stats.map(s => s.oldAct)],
      ["ACT 本期 (新)", ...results.stats.map(s => s.newAct)],
      ["ACT 差異值", ...results.stats.map(s => s.actDiff)]
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryRows]);
    XLSX.utils.book_append_sheet(wb, wsSummary, "2. 每月數據總覽");

    // 3. 圖表數據分頁 (方便在 Excel 繪圖的格式)
    const chartData = results.stats.map(s => ({
      '月份': getChineseMonth(s.month),
      '舊需求(FCST Old)': s.oldFcst,
      '新需求(FCST New)': s.newFcst,
      '實際訂單(ACT New)': s.newAct,
      '需求變動': s.fcstDiff,
      '訂單變動': s.actDiff
    }));

    const wsChart = XLSX.utils.json_to_sheet(chartData);
    XLSX.utils.book_append_sheet(wb, wsChart, "3. 趨勢圖表數據庫");

    // 匯出檔案
    XLSX.writeFile(wb, `產銷比對完整報表_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">產銷智慧比對系統 <span className="text-indigo-600">V3.0</span></h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Intelligent Supply-Demand Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {results && (
               <button 
                onClick={handleExportXLSX}
                className="text-xs font-semibold px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center gap-2"
               >
                 <i className="fa-solid fa-file-excel"></i> 匯出完整 Excel 報表
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative group overflow-hidden">
            <label className="block space-y-3 cursor-pointer">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <i className="fa-solid fa-history text-indigo-500"></i> 舊版基準檔案 (Base Report)
              </span>
              <input 
                type="file" 
                onChange={(e) => setOldFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
              />
              <p className="text-[10px] text-slate-400">支援 .xlsx, .xls (含中文標題與月份)</p>
            </label>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative group overflow-hidden">
            <label className="block space-y-3 cursor-pointer">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <i className="fa-solid fa-rocket text-emerald-500"></i> 新版更新檔案 (Target Report)
              </span>
              <input 
                type="file" 
                onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all"
              />
              <p className="text-[10px] text-slate-400">支援 .xlsx, .xls (含中文標題與月份)</p>
            </label>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button 
            onClick={handleComparison}
            disabled={loading}
            className="group relative px-12 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:shadow-indigo-200 hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center gap-3">
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i> 引擎分析中...
                </>
              ) : (
                <>
                  執行智慧比對分析 <i className="fa-solid fa-bolt group-hover:translate-x-1 transition-transform"></i>
                </>
              )}
            </span>
          </button>
          {!results && !loading && (
            <button 
              onClick={loadDemoData}
              className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors underline underline-offset-4"
            >
              使用範例數據測試功能
            </button>
          )}
        </div>

        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
              <button 
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                概況總表
              </button>
              <button 
                onClick={() => setActiveTab('visuals')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'visuals' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                趨勢圖表
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                變動明細 ({results.logs.length})
              </button>
            </div>

            <div className="transition-all duration-300">
              {activeTab === 'summary' && <SummaryTable stats={results.stats} />}
              {activeTab === 'visuals' && <DashboardCharts stats={results.stats} />}
              {activeTab === 'logs' && <ChangeLog logs={results.logs} />}
            </div>
          </div>
        )}

        {!results && !loading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
            <i className="fa-solid fa-folder-open text-6xl opacity-40"></i>
            <p className="font-medium text-lg">請上傳含有「FCST/ACT/客戶/模組」之 Excel 檔案</p>
            <p className="text-xs text-slate-400">系統將自動分析並識別月份數據塊</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-6 text-center">
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
           &copy; 2024 Intelligent Supply-Demand Analytics System V3.0 • Confidential
         </p>
      </footer>
    </div>
  );
};

export default App;
