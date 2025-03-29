import path from 'path';
import { csvProcessingFlow } from './flow';
import { SharedData } from './types';
import { csvProcessorNode } from './nodes';

async function main() {
  console.log('PocketFlow BatchNode Example - CSV Processor');
  console.log('=============================================');
  
  const filePath = path.join(__dirname, '../data/sales.csv');
  console.log(`\nProcessing ${path.basename(filePath)} in chunks...`);
  
  try {
    // Create shared context with the file path
    const sharedContext: SharedData = {
      filePath
    };

    // Set parameters for the CSV processor node
    csvProcessorNode.setParams({
      filePath,
      chunkSize: 5 // Process 5 records at a time
    });

    // Execute the flow with the shared context
    console.time('Processing time');
    await csvProcessingFlow.run(sharedContext);
    console.timeEnd('Processing time');
    
    console.log('\nProcessing completed successfully!');
  } catch (error) {
    console.error('Error processing CSV:', error);
  }
}

// Run the main function
main().catch(console.error); 