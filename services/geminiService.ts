
import { GoogleGenAI } from "@google/genai";
import { MonthlyStat, ChangeLogEntry } from "../types";

export const getAIInsights = async (stats: MonthlyStat[], logs: ChangeLogEntry[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Fix: Property 'diff' does not exist on type 'MonthlyStat'. Changed to 'fcstDiff' to reflect forecast variance.
  const statsSummary = stats.map(s => `${s.month}: Old=${s.oldFcst.toFixed(0)}, New=${s.newFcst.toFixed(0)}, Act=${s.newAct.toFixed(0)}, Diff=${s.fcstDiff.toFixed(0)}`).join('\n');
  const logsCount = logs.length;
  
  const prompt = `
    Analyze the following production/sales data comparison between an old forecast and a new updated report.
    Provide a professional, concise executive summary (3-4 bullet points) in Traditional Chinese.
    Focus on:
    1. Overall trend (growth or decline in volume).
    2. Notable delays or cancellations.
    3. Key months with significant variances.
    4. A brief recommendation.

    Monthly Stats:
    ${statsSummary}

    Change Log Count: ${logsCount} entries detected.
    
    Keep it professional and data-driven.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "無法生成 AI 智慧洞察，請檢查網路連線或稍後再試。";
  }
};
