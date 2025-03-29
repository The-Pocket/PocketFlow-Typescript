// tests/qa-pattern.test.ts
import { Node, Flow } from '../src/index';

// Mock the prompt function since we're in a test environment
const mockUserInput = "What is PocketFlow?";
global.prompt = jest.fn().mockImplementation(() => mockUserInput);

// Mock utility function for LLM calls
async function callLlm(question: string): Promise<string> {
  // Simple mock LLM call that returns a predefined answer based on the question
  if (question.includes("PocketFlow")) {
    return "PocketFlow is a TypeScript library for building reliable AI pipelines with a focus on composition and reusability.";
  }
  return "I don't know the answer to that question.";
}

// Define the shared store type as shown in the guide
interface QASharedStore {
  question?: string;
  answer?: string;
  [key: string]: unknown;
}

// Implement the GetQuestionNode from the guide
class GetQuestionNode extends Node<QASharedStore> {
  async exec(_: unknown): Promise<string> {
    // Get question directly from user input
    const userQuestion = prompt("Enter your question: ") || "";
    return userQuestion;
  }

  async post(
    shared: QASharedStore,
    _: unknown,
    execRes: string
  ): Promise<string | undefined> {
    // Store the user's question
    shared.question = execRes;
    return "default"; // Go to the next node
  }
}

// Implement the AnswerNode from the guide
class AnswerNode extends Node<QASharedStore> {
  async prep(shared: QASharedStore): Promise<string> {
    // Read question from shared
    return shared.question || "";
  }

  async exec(question: string): Promise<string> {
    // Call LLM to get the answer
    return await callLlm(question);
  }

  async post(
    shared: QASharedStore,
    _: unknown,
    execRes: string
  ): Promise<string | undefined> {
    // Store the answer in shared
    shared.answer = execRes;
    return undefined;
  }
}

// Create a function to set up the QA flow
function createQaFlow(): Flow {
  // Create nodes
  const getQuestionNode = new GetQuestionNode();
  const answerNode = new AnswerNode();

  // Connect nodes in sequence
  getQuestionNode.next(answerNode);

  // Create flow starting with input node
  return new Flow(getQuestionNode);
}

// Tests for the QA pattern
describe('QA Pattern Tests', () => {
  // Test the basic QA flow
  test('Basic QA Flow with mocked user input', async () => {
    // Create shared store
    const shared: QASharedStore = {
      question: undefined,
      answer: undefined,
    };
    
    // Create and run the flow
    const qaFlow = createQaFlow();
    await qaFlow.run(shared);
    
    // Verify results
    expect(shared.question).toBe(mockUserInput);
    expect(shared.answer).toBe("PocketFlow is a TypeScript library for building reliable AI pipelines with a focus on composition and reusability.");
  });
  
  // Test with a different question (simulating a different user input)
  test('QA Flow with unknown question', async () => {
    // Change the mock implementation for this test
    global.prompt = jest.fn().mockImplementation(() => "What is the meaning of life?");
    
    const shared: QASharedStore = {
      question: undefined,
      answer: undefined,
    };
    
    const qaFlow = createQaFlow();
    await qaFlow.run(shared);
    
    expect(shared.question).toBe("What is the meaning of life?");
    expect(shared.answer).toBe("I don't know the answer to that question.");
  });
  
  // Test error handling (missing question)
  test('QA Flow with missing question', async () => {
    // Mock a null or empty response
    global.prompt = jest.fn().mockImplementation(() => "");
    
    const shared: QASharedStore = {
      question: undefined,
      answer: undefined,
    };
    
    const qaFlow = createQaFlow();
    await qaFlow.run(shared);
    
    expect(shared.question).toBe("");
    expect(shared.answer).toBe("I don't know the answer to that question.");
  });
}); 