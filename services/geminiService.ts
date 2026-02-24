
import { GoogleGenAI } from "@google/genai";
import { CharcoalBatch } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getKilnOptimizationAdvice = async (batch: CharcoalBatch) => {
  try {
    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านเตาเผาถ่านอัจฉริยะ 
      ข้อมูลเตาปัจจุบัน:
      - วัตถุดิบ: ${batch.materialInput} kg
      - สถานะ: ${batch.status}
      - อุณหภูมิสูงสุด: ${Math.max(...batch.temperatures.map(t => t.temp), 0)} C
      - เชื้อเพลิงน้ำมันที่ใช้: ${batch.fuelUsed} L

      ช่วยวิเคราะห์และให้คำแนะนำสั้นๆ 3 ข้อในการประหยัดน้ำมันหรือเพิ่มผลผลิตถ่านสำหรับรอบการเผานี้ (ภาษาไทย)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "ไม่สามารถดึงข้อมูลคำแนะนำได้ในขณะนี้";
  }
};
