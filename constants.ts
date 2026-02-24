
import { BatchStatus, CharcoalBatch, MonthlySummary, Kiln } from './types';

export const MOCK_HISTORY: CharcoalBatch[] = [
  {
    id: 'B001',
    date: '2024-03-01',
    materialInput: 500,
    materialOutput: 150,
    fuelUsed: 12,
    startTime: '08:00',
    endTime: '16:00',
    status: BatchStatus.COMPLETED,
    temperatures: [
      { time: '08:00', temp: 30 },
      { time: '10:00', temp: 250 },
      { time: '12:00', temp: 600 },
      { time: '14:00', temp: 400 },
      { time: '16:00', temp: 80 }
    ]
  },
  {
    id: 'B002',
    date: '2024-03-05',
    materialInput: 450,
    materialOutput: 130,
    fuelUsed: 10,
    startTime: '09:00',
    endTime: '17:00',
    status: BatchStatus.COMPLETED,
    temperatures: [
      { time: '09:00', temp: 30 },
      { time: '11:00', temp: 300 },
      { time: '13:00', temp: 550 },
      { time: '15:00', temp: 350 },
      { time: '17:00', temp: 75 }
    ]
  }
];

export const MOCK_KILNS: Kiln[] = [
  {
    id: 'K01',
    name: 'เตาที่ 1 (เตาหลัก)',
    currentBatch: {
      id: 'B003',
      date: '2024-03-10',
      materialInput: 600,
      materialOutput: 0,
      fuelUsed: 15,
      startTime: '06:00',
      status: BatchStatus.BURNING,
      temperatures: [{ time: '06:00', temp: 32 }, { time: '08:00', temp: 350 }, { time: '10:00', temp: 580 }]
    }
  },
  {
    id: 'K02',
    name: 'เตาที่ 2 (เตาย่อย)',
    currentBatch: null,
    lastCompletedBatch: MOCK_HISTORY[0]
  },
  {
    id: 'K03',
    name: 'เตาที่ 3 (เตาสำรอง)',
    currentBatch: {
      id: 'B004',
      date: '2024-03-10',
      materialInput: 400,
      materialOutput: 120,
      fuelUsed: 8,
      startTime: '04:00',
      status: BatchStatus.COMPLETED,
      temperatures: [{ time: '04:00', temp: 30 }, { time: '08:00', temp: 400 }, { time: '12:00', temp: 70 }]
    }
  }
];

export const MOCK_MONTHLY: MonthlySummary[] = [
  { month: 'ม.ค.', totalInput: 2500, totalOutput: 720, totalFuel: 60, avgEfficiency: 28.8 },
  { month: 'ก.พ.', totalInput: 2800, totalOutput: 810, totalFuel: 72, avgEfficiency: 28.9 },
  { month: 'มี.ค.', totalInput: 1800, totalOutput: 520, totalFuel: 45, avgEfficiency: 28.8 },
  { month: 'เม.ย.', totalInput: 3100, totalOutput: 890, totalFuel: 80, avgEfficiency: 28.7 },
  { month: 'พ.ค.', totalInput: 2900, totalOutput: 850, totalFuel: 75, avgEfficiency: 29.3 },
  { month: 'มิ.ย.', totalInput: 2400, totalOutput: 690, totalFuel: 58, avgEfficiency: 28.7 },
];
