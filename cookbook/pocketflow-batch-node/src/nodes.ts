import fs from 'fs';
import path from 'path';
import { BatchNode, Node } from 'pocketflow';
import csv from 'csv-parser';
import { SalesRecord, ChunkResult, SharedData } from './types';

// Number of records per chunk
const CHUNK_SIZE = 5;

// Define parameters type for the CSV processor with index signature
type CsvProcessorParams = {
  filePath: string;
  chunkSize?: number;
}

// Node to process CSV file in batches
export class CsvProcessorNode extends BatchNode<SharedData, CsvProcessorParams> {
  async prep(shared: SharedData): Promise<SalesRecord[][]> {
    // Use filePath from params or shared context
    const filePath = this._params?.filePath || shared.filePath;
    // Use chunkSize from params or default
    const chunkSize = this._params?.chunkSize || CHUNK_SIZE;
    
    console.log(`Reading CSV file: ${filePath}`);
    
    // Read the entire CSV file
    const allRecords: SalesRecord[] = [];
    
    // Return a promise that resolves when the CSV is fully read
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath || '')
        .pipe(csv())
        .on('data', (data: SalesRecord) => {
          allRecords.push(data);
        })
        .on('end', () => {
          console.log(`Total records loaded: ${allRecords.length}`);
          
          // Split all records into chunks of specified size
          const chunks: SalesRecord[][] = [];
          for (let i = 0; i < allRecords.length; i += chunkSize) {
            chunks.push(allRecords.slice(i, i + chunkSize));
          }
          
          console.log(`Split into ${chunks.length} chunks of ~${chunkSize} records each`);
          resolve(chunks);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async exec(chunk: SalesRecord[]): Promise<ChunkResult> {
    console.log(`Processing chunk with ${chunk.length} records...`);
    
    let totalSales = 0;
    let sumForAverage = 0;
    const totalTransactions = chunk.length;
    
    // Calculate statistics for this chunk
    for (const record of chunk) {
      const saleAmount = parseFloat(record.amount);
      
      totalSales += saleAmount;
      sumForAverage += saleAmount;
    }
    
    return {
      totalSales,
      totalTransactions,
      sumForAverage
    };
  }

  async post(shared: SharedData, chunks: SalesRecord[][], results: ChunkResult[]): Promise<string> {
    console.log(`Combining results from ${results.length} chunks...`);
    
    // Store batch results in shared data
    shared.batchResults = results;
    
    // Aggregate final statistics
    const totalSales = results.reduce((sum, chunk) => sum + chunk.totalSales, 0);
    const totalTransactions = results.reduce((sum, chunk) => sum + chunk.totalTransactions, 0);
    const sumForAverage = results.reduce((sum, chunk) => sum + chunk.sumForAverage, 0);
    const averageSale = sumForAverage / totalTransactions;
    
    // Store final statistics in shared data
    shared.finalStats = {
      totalSales,
      averageSale,
      totalTransactions
    };
    
    return "display_results";
  }
}

// Node to display the final results
export class DisplayResultsNode extends Node<SharedData> {

  async prep(shared: SharedData): Promise<SharedData['finalStats']> {
    return shared.finalStats;
  }

  async exec(finalStats: SharedData['finalStats']): Promise<void> {
    // Check if finalStats exists to avoid errors
    if (!finalStats) {
      console.error("Error: Final statistics not available");
      return;
    }
    
    console.log("\nFinal Statistics:");
    console.log(`- Total Sales: $${finalStats.totalSales.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`);
    console.log(`- Average Sale: $${finalStats.averageSale.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`);
    console.log(`- Total Transactions: ${finalStats.totalTransactions.toLocaleString()}`);
  }
}

// Create instances of the nodes
export const csvProcessorNode = new CsvProcessorNode();
export const displayResultsNode = new DisplayResultsNode(); 