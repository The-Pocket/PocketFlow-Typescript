// Define the structure of a sales record from the CSV
export interface SalesRecord {
  date: string;
  product: string;
  amount: string;
}

// Define the analysis result for a single chunk
export interface ChunkResult {
  totalSales: number;
  totalTransactions: number;
  sumForAverage: number;
}

// Define the shared data structure for our flow
export interface SharedData {
  filePath?: string;
  batchResults?: ChunkResult[];
  finalStats?: {
    totalSales: number;
    averageSale: number;
    totalTransactions: number;
  };
} 