import { Node, Flow, AsyncNode, AsyncFlow } from './pocketflow';

// Define our shared store structure
interface DocumentStore {
  rawText?: string;
  wordCount?: number;
  sentiment?: string;
  summary?: string;
  error?: string;
}

// Now we can just specify the shared store type directly!
class LoadDocument extends Node<DocumentStore> {
  prep(shared: DocumentStore) {
    console.log("Preparing to load document...");
    return "dummy-file.txt"; // Filename to load
  }

  exec(filename: string) {
    console.log(`Loading document ${filename}...`);
    // Simulate loading a document
    return "This is a sample document. It contains some text that we will analyze.";
  }

  post(shared: DocumentStore, filename: string, content: string) {
    console.log("Document loaded successfully");
    shared.rawText = content;
    return "success"; // Action to take
  }
}

// Same with other nodes - just specify the shared store type
class AnalyzeDocument extends Node<DocumentStore> {
  prep(shared: DocumentStore) {
    console.log("Preparing to analyze document...");
    return shared.rawText;
  }

  exec(text: string) {
    console.log("Analyzing document...");
    // Simple analysis
    const words = text.split(/\s+/).length;
    const sentiment = text.includes("sample") ? "neutral" : "negative";
    
    return { words, sentiment };
  }

  post(shared: DocumentStore, text: string, analysis: { words: number, sentiment: string }) {
    console.log("Document analyzed");
    shared.wordCount = analysis.words;
    shared.sentiment = analysis.sentiment;
    return "default";
  }
}

class SummarizeDocument extends Node<DocumentStore> {
  prep(shared: DocumentStore) {
    console.log("Preparing to summarize document...");
    return shared.rawText;
  }

  exec(text: string) {
    console.log("Summarizing document...");
    // Very simple summary for demo
    return text.split('.')[0] + ".";
  }

  post(shared: DocumentStore, text: string, summary: string) {
    console.log("Document summarized");
    shared.summary = summary;
    return "default";
  }
}

// Also for async nodes
class AsyncLoadDocument extends AsyncNode<DocumentStore> {
  async prepAsync(shared: DocumentStore) {
    console.log("Async: Preparing to load document...");
    return "dummy-file.txt";
  }

  async execAsync(filename: string) {
    console.log(`Async: Loading document ${filename}...`);
    // Simulate loading a document asynchronously
    return new Promise<string>(resolve => {
      setTimeout(() => {
        resolve("This is a sample document loaded asynchronously.");
      }, 1000);
    });
  }

  async postAsync(shared: DocumentStore, filename: string, content: string) {
    console.log("Async: Document loaded successfully");
    shared.rawText = content;
    return "success";
  }
}

// Example usage
async function runExample() {
  // Synchronous flow
  const loadNode = new LoadDocument();
  const analyzeNode = new AnalyzeDocument();
  const summarizeNode = new SummarizeDocument();
  
  loadNode.action("success").then(analyzeNode);
  analyzeNode.then(summarizeNode);
  
  const flow = new Flow<DocumentStore>(loadNode);
  const shared: DocumentStore = {};
  
  console.log("Starting synchronous document flow...");
  flow.run(shared);
  
  console.log("\nResults:");
  console.log("Word count:", shared.wordCount);
  console.log("Sentiment:", shared.sentiment);
  console.log("Summary:", shared.summary);
  
  // Asynchronous flow
  const asyncLoadNode = new AsyncLoadDocument();
  asyncLoadNode.then(analyzeNode);
  
  const asyncFlow = new AsyncFlow<DocumentStore>(asyncLoadNode);
  const asyncShared: DocumentStore = {};
  
  console.log("\nStarting asynchronous document flow...");
  await asyncFlow.runAsync(asyncShared);
  
  console.log("\nAsync Results:");
  console.log("Word count:", asyncShared.wordCount);
  console.log("Sentiment:", asyncShared.sentiment);
}

runExample();