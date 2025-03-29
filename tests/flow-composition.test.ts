// tests/flow_composition.test.ts
import { Node, Flow } from '../src/index';

// Define a shared storage type
type SharedStorage = {
  current?: number;
};

class NumberNode extends Node<SharedStorage> {
  constructor(private number: number, maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<void> {
    shared.current = this.number;
  }
}

class AddNode extends Node<SharedStorage> {
  constructor(private number: number, maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<void> {
    if (shared.current !== undefined) {
      shared.current += this.number;
    }
  }
}

class MultiplyNode extends Node<SharedStorage> {
  constructor(private number: number, maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<void> {
    if (shared.current !== undefined) {
      shared.current *= this.number;
    }
  }
}

describe('Flow Composition Tests with Node', () => {
  test('flow as node', async () => {
    /**
     * 1) Create a Flow (f1) starting with NumberNode(5), then AddNode(10), then MultiplyNode(2).
     * 2) Create a second Flow (f2) whose start is f1.
     * 3) Create a wrapper Flow (f3) that contains f2 to ensure proper execution.
     * Expected final result in shared.current: (5 + 10) * 2 = 30.
     */
    const shared: SharedStorage = {};
    
    // Inner flow f1
    const numberNode = new NumberNode(5);
    const addNode = new AddNode(10);
    const multiplyNode = new MultiplyNode(2);
    
    numberNode.next(addNode);
    addNode.next(multiplyNode);
    
    const f1 = new Flow(numberNode);
    
    // f2 starts with f1
    const f2 = new Flow(f1);
    
    // Wrapper flow f3 to ensure proper execution
    const f3 = new Flow(f2);
    await f3.run(shared);
    
    expect(shared.current).toBe(30);
  });
  
  test('nested flow', async () => {
    /**
     * Demonstrates nested flows with proper wrapping:
     * inner_flow: NumberNode(5) -> AddNode(3)
     * middle_flow: starts with inner_flow -> MultiplyNode(4)
     * wrapper_flow: contains middle_flow to ensure proper execution
     * Expected final result: (5 + 3) * 4 = 32.
     */
    const shared: SharedStorage = {};
    
    // Build the inner flow
    const numberNode = new NumberNode(5);
    const addNode = new AddNode(3);
    numberNode.next(addNode);
    const innerFlow = new Flow(numberNode);
    
    // Build the middle flow, whose start is the inner flow
    const multiplyNode = new MultiplyNode(4);
    innerFlow.next(multiplyNode);
    const middleFlow = new Flow(innerFlow);
    
    // Wrapper flow to ensure proper execution
    const wrapperFlow = new Flow(middleFlow);
    await wrapperFlow.run(shared);
    
    expect(shared.current).toBe(32);
  });
  
  test('flow chaining flows', async () => {
    /**
     * Demonstrates chaining two flows with proper wrapping:
     * flow1: NumberNode(10) -> AddNode(10) # final = 20
     * flow2: MultiplyNode(2) # final = 40
     * wrapper_flow: contains both flow1 and flow2 to ensure proper execution
     * Expected final result: (10 + 10) * 2 = 40.
     */
    const shared: SharedStorage = {};
    
    // flow1
    const numberNode = new NumberNode(10);
    const addNode = new AddNode(10);
    numberNode.next(addNode);
    const flow1 = new Flow(numberNode);
    
    // flow2
    const multiplyNode = new MultiplyNode(2);
    const flow2 = new Flow(multiplyNode);
    
    // Chain flow1 to flow2
    flow1.next(flow2);
    
    // Wrapper flow to ensure proper execution
    const wrapperFlow = new Flow(flow1);
    await wrapperFlow.run(shared);
    
    expect(shared.current).toBe(40);
  });
  
  test('flow with retry handling', async () => {
    /**
     * Demonstrates retry capabilities in flow composition:
     * Using nodes with retry logic in a flow structure
     */
    const shared: SharedStorage = {};
    
    // Create a faulty NumberNode that will fail once before succeeding
    class FaultyNumberNode extends Node<SharedStorage> {
      private attempts = 0;
      
      constructor(private number: number, maxRetries: number = 2, wait: number = 0.01) {
        super(maxRetries, wait);
      }
      
      async prep(shared: SharedStorage): Promise<number> {
        return this.number;
      }
      
      async exec(number: number): Promise<number> {
        this.attempts++;
        if (this.attempts === 1) {
          throw new Error("Simulated failure on first attempt");
        }
        return number;
      }
      
      async post(shared: SharedStorage, prepRes: any, execRes: any): Promise<string> {
        shared.current = execRes;
        return "default";
      }
    }
    
    // Create a flow with the faulty node followed by standard nodes
    const faultyNumberNode = new FaultyNumberNode(5);
    const addNode = new AddNode(10);
    const multiplyNode = new MultiplyNode(2);
    
    faultyNumberNode.next(addNode);
    addNode.next(multiplyNode);
    
    const flow = new Flow(faultyNumberNode);
    await flow.run(shared);
    
    // Despite the initial failure, the retry mechanism should allow
    // the flow to complete successfully: (5 + 10) * 2 = 30
    expect(shared.current).toBe(30);
  });
  
  test('nested flows with mixed retry configurations', async () => {
    /**
     * Demonstrates nesting flows with different retry configurations
     */
    const shared: SharedStorage = {};
    
    // Inner flow with a node that has high retry count
    const numberNode = new NumberNode(5, 5, 0.01); // 5 retries
    const addNode = new AddNode(3, 2, 0.01);      // 2 retries
    numberNode.next(addNode);
    const innerFlow = new Flow(numberNode);
    
    // Middle flow with a node that has medium retry count
    const multiplyNode = new MultiplyNode(4, 3, 0.01); // 3 retries
    innerFlow.next(multiplyNode);
    const middleFlow = new Flow(innerFlow);
    
    // Wrapper flow
    const wrapperFlow = new Flow(middleFlow);
    await wrapperFlow.run(shared);
    
    // The result should be the same: (5 + 3) * 4 = 32
    expect(shared.current).toBe(32);
  });
});