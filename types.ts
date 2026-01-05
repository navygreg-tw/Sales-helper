
export enum DataType {
  FCST = 'FCST',
  ACT = 'ACT',
  CUSTOMER = 'Customer',
  MODULE = 'Module'
}

export interface RawDataPoint {
  id: string;
  month: string;
  customer: string;
  module: string;
  type: 'FCST' | 'ACT';
  value: number;
  version: 'Old' | 'New';
}

export interface ComparisonItem {
  id: string;
  month: string;
  customer: string;
  module: string;
  oldFcst: number;
  newFcst: number;
  oldAct: number;
  newAct: number;
}

export interface MonthlyStat {
  month: string;
  oldFcst: number;
  newFcst: number;
  oldAct: number;
  newAct: number;
  fcstDiff: number;
  actDiff: number;
}

export enum ChangeType {
  FCST_ADDED = 'FCST_ADDED',     // 新增需求
  FCST_REMOVED = 'FCST_REMOVED', // 需求取消
  FCST_MODIFIED = 'FCST_MODIFIED', // 需求變動
  ACT_ADDED = 'ACT_ADDED',       // 下單確認
  ACT_MODIFIED = 'ACT_MODIFIED', // 訂單變動
  CONVERTED = 'CONVERTED',       // 需求轉訂單
  DELAYED = 'DELAYED'            // 需求延後
}

export interface ChangeLogEntry {
  type: ChangeType;
  month: string;
  targetMonth?: string;
  customer: string;
  module: string;
  oldValue?: number;
  newValue?: number;
  monthIndex: number;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export const CHINESE_MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月", 
  "7月", "8月", "9月", "10月", "11月", "12月"
];
