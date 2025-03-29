import fs from 'fs';
import path from 'path';
import { batchImageProcessingFlow, ImageProcessingParams } from './flow';
import { SharedData } from './type';

async function main() {
  // Get all image files from the images directory
  const imageDir = path.join(__dirname, 'images');
  const imageFiles = fs.readdirSync(imageDir)
    .filter(file => /\.(jpg|jpeg|png)$/i.test(file));

  console.log('PocketFlow BatchFlow Example - Image Processor');
  console.log('==============================================');
  
  // Define the filter types to use
  const filterTypes: Array<'grayscale' | 'blur' | 'sepia'> = ['grayscale', 'blur', 'sepia'];
  
  // Create a list of parameters for batch processing
  const batchParams: ImageProcessingParams[] = [];
  
  // Create combinations of images and filters
  for (const image of imageFiles) {
    for (const filter of filterTypes) {
      batchParams.push({
        imageName: image,
        filterType: filter
      });
    }
  }
  
  console.log(`\nProcessing ${imageFiles.length} images with ${filterTypes.length} filters...`);
  console.log(`Total operations: ${batchParams.length}\n`);
  
  try {
    // Define the prep method for the BatchFlow to return our batch parameters
    const originalPrep = batchImageProcessingFlow.prep;
    batchImageProcessingFlow.prep = async () => {
      return batchParams;
    };

    // Create shared context - can be used to track progress or share data between runs
    const sharedContext: SharedData = {};

    // Execute the batch flow with the shared context
    console.time('Batch processing time');
    await batchImageProcessingFlow.run(sharedContext);
    console.timeEnd('Batch processing time');
    
    // Restore original prep method
    batchImageProcessingFlow.prep = originalPrep;
    
    console.log('\nAll images processed successfully!');
    console.log('Check the \'output\' directory for results.');
    
    // Output summary of results
    console.log('\nProcessed images:');
    batchParams.forEach((params) => {
      console.log(`- ${params.imageName} with ${params.filterType} filter`);
    });
  } catch (error) {
    console.error('Error processing images:', error);
  }
}

// Run the main function
main().catch(console.error);
