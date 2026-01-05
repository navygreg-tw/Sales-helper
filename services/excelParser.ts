
import * as XLSX from 'xlsx';
import { RawDataPoint, MONTH_NAMES, CHINESE_MONTH_NAMES } from '../types';

export const parseExcelFile = async (file: File, version: 'Old' | 'New'): Promise<RawDataPoint[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
        
        const parsed = extractDataFromRows(rows, version);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("檔案讀取失敗"));
    reader.readAsArrayBuffer(file);
  });
};

const extractDataFromRows = (rows: any[][], version: 'Old' | 'New'): RawDataPoint[] => {
  const extracted: RawDataPoint[] = [];
  
  // Find indices of rows containing month names (start of blocks)
  const blockIndices: number[] = [];
  rows.forEach((row, idx) => {
    if (Array.isArray(row)) {
      const rowStr = row.join(" ").toLowerCase();
      // Stricter check: Month name should be a major part of the row, not just in a "Created date"
      const matchesEng = MONTH_NAMES.some(m => rowStr.includes(m.toLowerCase()));
      const matchesChi = CHINESE_MONTH_NAMES.some(m => rowStr.includes(m));
      
      // Heuristic: Month headers usually don't have too many other words like "printed" or "report date"
      const isSystemRow = rowStr.includes("printed") || rowStr.includes("created") || rowStr.includes("report date");

      if ((matchesEng || matchesChi) && !isSystemRow) {
        blockIndices.push(idx);
      }
    }
  });

  if (blockIndices.length === 0 && rows.length > 0) {
    blockIndices.push(0);
  }

  for (let i = 0; i < blockIndices.length; i++) {
    const startRowIdx = blockIndices[i];
    const endRowIdx = (i + 1 < blockIndices.length) ? blockIndices[i + 1] : rows.length;
    
    const monthRow = rows[startRowIdx];
    const headerRow = rows[startRowIdx + 1] || [];

    const colMap: { type: string | null; month: string }[] = [];
    let currentMonth = "Unknown Month";

    // 1. Map columns to data types and months
    for (let c = 0; c < Math.max(monthRow.length, headerRow.length); c++) {
      const cellVal = (monthRow[c] || "").toString().trim();
      const foundEngMonth = MONTH_NAMES.find(m => cellVal.toLowerCase().includes(m.toLowerCase()));
      const foundChiMonth = CHINESE_MONTH_NAMES.find(m => cellVal.includes(m));
      
      if (foundEngMonth) currentMonth = foundEngMonth;
      else if (foundChiMonth) {
        const idx = CHINESE_MONTH_NAMES.indexOf(foundChiMonth);
        currentMonth = MONTH_NAMES[idx];
      }
      
      const headerVal = (headerRow[c] || "").toString().trim().toUpperCase();
      let type: string | null = null;
      
      if (headerVal.includes("FCST") || headerVal.includes("預測") || headerVal.includes("預估")) type = "FCST";
      else if (headerVal.includes("ACT") || headerVal.includes("實績") || headerVal.includes("實際") || headerVal.includes("出貨")) type = "ACT";
      else if (headerVal.includes("CUSTOMER") || headerVal.includes("客戶") || headerVal.includes("公司")) type = "Customer";
      else if (headerVal.includes("MODULE") || headerVal.includes("模組") || headerVal.includes("品項") || headerVal.includes("型號")) type = "Module";

      colMap[c] = { type, month: currentMonth };
    }

    // 2. Extract values from data rows
    // Only process rows if we actually found a valid Month in this block
    if (currentMonth !== "Unknown Month") {
      for (let r = startRowIdx + 2; r < endRowIdx; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        for (let c = 0; c < row.length; c++) {
          const map = colMap[c];
          if (!map || (map.type !== 'FCST' && map.type !== 'ACT')) continue;

          const valStr = (row[c] || "").toString().replace(/,/g, '').trim();
          const val = parseFloat(valStr);
          
          if (!isNaN(val) && val !== 0) {
            let cust = "Unknown";
            let mod = "Unknown";

            for (let back = c - 1; back >= 0; back--) {
              const backMap = colMap[back];
              if (!backMap) continue;
              const cellData = (row[back] || "").toString().trim();
              if (!cellData) continue;
              
              if (backMap.type === 'Module' && mod === "Unknown") mod = cellData;
              if (backMap.type === 'Customer' && cust === "Unknown") cust = cellData;
            }

            // Exclude "Total" or summary rows
            const isTotalRow = cust.includes("Total") || cust.includes("合計") || cust.includes("小計");

            if (cust !== "Unknown" && cust !== "" && !isTotalRow) {
              extracted.push({
                id: `${map.month}_${cust}_${mod}`,
                month: map.month,
                customer: cust,
                module: mod,
                type: map.type as 'FCST' | 'ACT',
                value: val,
                version: version
              });
            }
          }
        }
      }
    }
  }
  return extracted;
};
