import { Flow, BatchFlow } from 'pocketflow';
import { loadImageNode, applyFilterNode, saveImageNode } from './nodes';
import { SharedData, FilterType } from './type';

// Types for the image processing parameters
export type ImageProcessingParams = {
  imageName: string;
  filterType: FilterType;
};

// Connect nodes to create the processing pipeline
// Each node passes its output to the next node as input
loadImageNode.on("apply_filter", applyFilterNode);
applyFilterNode.on("save", saveImageNode);

// Create the base flow for processing a single image with a specific filter
export const imageProcessingFlow = new Flow<SharedData>(loadImageNode);

// Create the batch flow for processing multiple images with different filters
export const batchImageProcessingFlow = new BatchFlow<SharedData>(loadImageNode);

// Set batch parameters in main.ts before running
