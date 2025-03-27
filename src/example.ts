import { Node, Flow, BatchNode, ParallelBatchNode } from './pocketflow';

// Define our shared store structure
interface DocumentStore {
  rawText?: string;
  wordCount?: number;
  sentiment?: string;
  summary?: string;
  searchResults?: string[];
}

// Simple document processing nodes - now all async
class LoadDocument extends Node<DocumentStore> {
  async prep(shared: DocumentStore) {
    console.log("Preparing to load document...");
    return "dummy-file.txt";
  }

  async exec(filename: string) {
    console.log(`Loading document ${filename}...`);
    // Simulate file loading with a slight delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return "This is a sample document text that contains multiple words for analysis.";
  }

  async post(shared: DocumentStore, filename: string, content: string) {
    console.log("Document loaded successfully");
    shared.rawText = content;
    return "success";
  }
}

class AnalyzeDocument extends Node<DocumentStore> {
  async prep(shared: DocumentStore) {
    return shared.rawText;
  }

  async exec(text: string) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 200));
    const words = text.split(/\s+/).length;
    const sentiment = text.includes("sample") ? "neutral" : "negative";
    return { words, sentiment };
  }

  async post(shared: DocumentStore, text: string, analysis: { words: number, sentiment: string }) {
    shared.wordCount = analysis.words;
    shared.sentiment = analysis.sentiment;
    return "default";
  }
}

class SummarizeDocument extends Node<DocumentStore> {
  async prep(shared: DocumentStore) {
    return shared.rawText;
  }

  async exec(text: string) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 300));
    return "This is a summary of the document.";
  }

  async post(shared: DocumentStore, text: string, summary: string) {
    shared.summary = summary;
    return "complete";
  }
}

class BatchSearchTerms extends ParallelBatchNode<DocumentStore> {
  async prep(shared: DocumentStore) {
    // Extract search terms from text
    const text = shared.rawText || "";
    return text.split(/\s+/).filter(word => word.length > 4); // Only search for words with >4 chars
  }

  async exec(term: string) {
    console.log(`Searching for: ${term}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    return `Results for ${term}`;
  }

  async post(shared: DocumentStore, terms: string[], results: string[]) {
    console.log(`Got ${results.length} search results`);
    shared.searchResults = results;
    return "default";
  }
}

async function main() {
  // Create nodes
  const loadDoc = new LoadDocument();
  const analyzeDoc = new AnalyzeDocument();
  const summarizeDoc = new SummarizeDocument();
  const searchTerms = new BatchSearchTerms(2, 0.5); // 2 retries, 0.5s wait between retries

  // Build the flow
  loadDoc
    .next(analyzeDoc, "success")
    .next(summarizeDoc)
    .next(searchTerms, "complete");

  // Create and run the flow
  const flow = new Flow<DocumentStore>(loadDoc);
  const shared: DocumentStore = {};
  
  console.time("Flow execution");
  await flow.run(shared);
  console.timeEnd("Flow execution");

  // Output results
  console.log("\nResults:");
  console.log("Word count:", shared.wordCount);
  console.log("Sentiment:", shared.sentiment);
  console.log("Summary:", shared.summary);
  console.log("Search results:", shared.searchResults);
}

// Run the async example
main().catch(console.error);