
export enum BatchStatus {
  IDLE = 'IDLE',
  HEATING = 'HEATING',
  BURNING = 'BURNING',
  COOLING = 'COOLING',
  COMPLETED = 'COMPLETED'
}

export interface TemperatureReading {
  time: string;
  temp: number;
}

export interface CharcoalBatch {
  id: string;
  date: string;
  materialInput: number; // in kg
  materialOutput: number; // in kg
  fuelUsed: number; // in liters
  startTime: string;
  endTime?: string;
  status: BatchStatus;
  temperatures: TemperatureReading[];
}

export interface Kiln {
  id: string;
  name: string;
  currentBatch: CharcoalBatch | null;
  lastCompletedBatch?: CharcoalBatch;
}

export interface MonthlySummary {
  month: string;
  totalInput: number;
  totalOutput: number;
  totalFuel: number;
  avgEfficiency: number;
}
