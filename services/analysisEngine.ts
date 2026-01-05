
import { 
  RawDataPoint, 
  ComparisonItem, 
  MonthlyStat, 
  ChangeLogEntry, 
  ChangeType, 
  MONTH_NAMES 
} from '../types';

export const runAnalysis = (oldList: RawDataPoint[], newList: RawDataPoint[]) => {
  const compareMap: Record<string, ComparisonItem> = {};
  const activeMonths = new Set<string>();

  const processList = (list: RawDataPoint[], isOld: boolean) => {
    list.forEach(item => {
      activeMonths.add(item.month);
      if (!compareMap[item.id]) {
        compareMap[item.id] = {
          id: item.id,
          month: item.month,
          customer: item.customer,
          module: item.module,
          oldFcst: 0,
          newFcst: 0,
          oldAct: 0,
          newAct: 0
        };
      }
      if (isOld) {
        if (item.type === 'FCST') compareMap[item.id].oldFcst = item.value;
        if (item.type === 'ACT') compareMap[item.id].oldAct = item.value;
      } else {
        if (item.type === 'FCST') compareMap[item.id].newFcst = item.value;
        if (item.type === 'ACT') compareMap[item.id].newAct = item.value;
      }
    });
  };

  processList(oldList, true);
  processList(newList, false);

  const comparisonItems = Object.values(compareMap);

  // 1. Generate Monthly Stats
  const monthlyStats: MonthlyStat[] = MONTH_NAMES
    .filter(m => activeMonths.has(m))
    .map(m => {
      const itemsInMonth = comparisonItems.filter(i => i.month === m);
      const oldFcst = itemsInMonth.reduce((sum, i) => sum + i.oldFcst, 0);
      const newFcst = itemsInMonth.reduce((sum, i) => sum + i.newFcst, 0);
      const oldAct = itemsInMonth.reduce((sum, i) => sum + i.oldAct, 0);
      const newAct = itemsInMonth.reduce((sum, i) => sum + i.newAct, 0);
      return {
        month: m,
        oldFcst,
        newFcst,
        oldAct,
        newAct,
        fcstDiff: newFcst - oldFcst,
        actDiff: newAct - oldAct
      };
    })
    .filter(stat => 
      Math.abs(stat.oldFcst) > 0.1 || 
      Math.abs(stat.newFcst) > 0.1 || 
      Math.abs(stat.oldAct) > 0.1 || 
      Math.abs(stat.newAct) > 0.1
    );

  // 2. Generate Change Log with Smart Business Logic
  const logs: ChangeLogEntry[] = [];
  const removedFcstItems: ComparisonItem[] = [];
  const addedFcstItems: ComparisonItem[] = [];
  const processedIds = new Set<string>();

  comparisonItems.forEach(item => {
    const monthIndex = MONTH_NAMES.indexOf(item.month);
    
    // A. Requirement confirmed (FCST -> ACT conversion)
    // If Old version had FCST and New version has increased ACT
    if (item.oldFcst > 0.1 && item.newAct > item.oldAct) {
      logs.push({
        type: ChangeType.CONVERTED,
        month: item.month,
        customer: item.customer,
        module: item.module,
        oldValue: item.oldFcst, // The requirement
        newValue: item.newAct,  // The confirmed order
        monthIndex
      });
      processedIds.add(item.id);
    } 
    // B. Direct Order Change (ACT change without FCST involvement)
    else if (Math.abs(item.newAct - item.oldAct) > 0.1) {
      logs.push({
        type: item.oldAct === 0 ? ChangeType.ACT_ADDED : ChangeType.ACT_MODIFIED,
        month: item.month,
        customer: item.customer,
        module: item.module,
        oldValue: item.oldAct,
        newValue: item.newAct,
        monthIndex
      });
      processedIds.add(item.id);
    }

    // C. Requirement (FCST) changes (if not already handled as conversion)
    if (!processedIds.has(item.id) && Math.abs(item.newFcst - item.oldFcst) > 0.1) {
      if (item.oldFcst === 0 && item.newFcst > 0) {
        addedFcstItems.push(item);
      } else if (item.newFcst === 0 && item.oldFcst > 0) {
        removedFcstItems.push(item);
      } else {
        logs.push({
          type: ChangeType.FCST_MODIFIED,
          month: item.month,
          customer: item.customer,
          module: item.module,
          oldValue: item.oldFcst,
          newValue: item.newFcst,
          monthIndex
        });
      }
    }
  });

  // D. Smart Delay Detection for FCST
  const delayMatchedAddedIds = new Set<string>();
  removedFcstItems.forEach(rItem => {
    const rIdx = MONTH_NAMES.indexOf(rItem.month);
    const match = addedFcstItems.find(aItem => {
      const aIdx = MONTH_NAMES.indexOf(aItem.month);
      if (aIdx <= rIdx) return false;
      if (delayMatchedAddedIds.has(aItem.id)) return false;
      if (aItem.customer !== rItem.customer || aItem.module !== rItem.module) return false;
      const ratio = aItem.newFcst / rItem.oldFcst;
      return (ratio > 0.90 && ratio < 1.10);
    });

    if (match) {
      delayMatchedAddedIds.add(match.id);
      logs.push({
        type: ChangeType.DELAYED,
        month: rItem.month,
        targetMonth: match.month,
        customer: rItem.customer,
        module: rItem.module,
        oldValue: rItem.oldFcst,
        monthIndex: rIdx
      });
    } else {
      logs.push({
        type: ChangeType.FCST_REMOVED,
        month: rItem.month,
        customer: rItem.customer,
        module: rItem.module,
        oldValue: rItem.oldFcst,
        monthIndex: rIdx
      });
    }
  });

  addedFcstItems.forEach(aItem => {
    if (!delayMatchedAddedIds.has(aItem.id)) {
      logs.push({
        type: ChangeType.FCST_ADDED,
        month: aItem.month,
        customer: aItem.customer,
        module: aItem.module,
        newValue: aItem.newFcst,
        monthIndex: MONTH_NAMES.indexOf(aItem.month)
      });
    }
  });

  logs.sort((a, b) => a.monthIndex - b.monthIndex);
  return { monthlyStats, logs };
};
