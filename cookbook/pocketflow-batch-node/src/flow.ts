import { Flow } from 'pocketflow';
import { csvProcessorNode, displayResultsNode } from './nodes';
import { SharedData } from './types';

// Connect nodes to create the processing pipeline
csvProcessorNode.on("display_results", displayResultsNode);

// Create and export the flow
export const csvProcessingFlow = new Flow<SharedData>(csvProcessorNode); 