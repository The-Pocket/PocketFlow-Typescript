import { RegularNode, Flow, AsyncNode, AsyncFlow } from './pocketflow';

// Define our shared store structure
interface DocumentStore {
  rawText?: string;
  wordCount?: number;
  sentiment?: string;
  summary?: string;
}

// Now using RegularNode instead of Node
class LoadDocument extends RegularNode<DocumentStore> {
  prep(shared: DocumentStore) {
    console.log("Preparing to load document...");
    return "dummy-file.txt";
  }

  exec(filename: string) {
    console.log(`Loading document ${filename}...`);
    return "This is a sample document text.";
  }

  post(shared: DocumentStore, filename: string, content: string) {
    console.log("Document loaded successfully");
    shared.rawText = content;
    return "success";
  }
}

class AnalyzeDocument extends RegularNode<DocumentStore> {
  prep(shared: DocumentStore) {
    return shared.rawText;
  }

  exec(text: string) {
    const words = text.split(/\s+/).length;
    const sentiment = text.includes("sample") ? "neutral" : "negative";
    return { words, sentiment };
  }

  post(shared: DocumentStore, text: string, analysis: { words: number, sentiment: string }) {
    shared.wordCount = analysis.words;
    shared.sentiment = analysis.sentiment;
    return "default";
  }
}

// Create and connect nodes
const loadDoc = new LoadDocument();
const analyzeDoc = new AnalyzeDocument();

// Connect with action
loadDoc.action("success").then(analyzeDoc);

// Create flow
const flow = new Flow<DocumentStore>(loadDoc);

// Run flow
const shared: DocumentStore = {};
flow.run(shared);

console.log("Results:");
console.log("Word count:", shared.wordCount);
console.log("Sentiment:", shared.sentiment);