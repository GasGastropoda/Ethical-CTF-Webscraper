export interface Competition {
  name: string;
  dates: string;
  fees: string;
  requirements: string;
  notes: string;
  type: string;
  ageGroup: string;
  location: string;
  url: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: string;
}

export interface Stats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}
