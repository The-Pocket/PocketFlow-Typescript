// tests/index.test.ts
import { BaseNode, Flow } from '../src/index';

// Define a shared storage type
type SharedStorage = {
  current?: number;
  [key: string]: any;
};

class NumberNode extends BaseNode<SharedStorage> {
  constructor(private number: number) {
    super();
  }

  async prep(shared: SharedStorage): Promise<void> {
    shared.current = this.number;
  }
}

class AddNode extends BaseNode<SharedStorage> {
  constructor(private number: number) {
    super();
  }

  async prep(shared: SharedStorage): Promise<void> {
    if (shared.current !== undefined) {
      shared.current += this.number;
    }
  }
}

class MultiplyNode extends BaseNode<SharedStorage> {
  constructor(private number: number) {
    super();
  }

  async prep(shared: SharedStorage): Promise<void> {
    if (shared.current !== undefined) {
      shared.current *= this.number;
    }
  }
}

class CheckPositiveNode extends BaseNode<SharedStorage> {
  async post(shared: SharedStorage): Promise<string> {
    if (shared.current !== undefined && shared.current >= 0) {
      return 'positive';
    } else {
      return 'negative';
    }
  }
}

class NoOpNode extends BaseNode<SharedStorage> {
  async prep(): Promise<void> {
    // Do nothing, just pass
  }
}

describe('PocketFlow Tests', () => {
  test('single number', async () => {
    const shared: SharedStorage = {};
    const start = new NumberNode(5);
    const pipeline = new Flow(start);
    await pipeline.run(shared);
    expect(shared.current).toBe(5);
  });

  test('sequence with chaining', async () => {
    /**
     * Test a simple linear pipeline:
     * NumberNode(5) -> AddNode(3) -> MultiplyNode(2)
     * 
     * Expected result:
     * (5 + 3) * 2 = 16
     */
    const shared: SharedStorage = {};
    const n1 = new NumberNode(5);
    const n2 = new AddNode(3);
    const n3 = new MultiplyNode(2);

    // Chain them in sequence using method chaining
    n1.next(n2).next(n3);

    const pipeline = new Flow(n1);
    await pipeline.run(shared);

    expect(shared.current).toBe(16);
  });

  test('branching positive', async () => {
    /**
     * Test a branching pipeline with positive route:
     * start = NumberNode(5)
     * check = CheckPositiveNode()
     * if 'positive' -> AddNode(10)
     * if 'negative' -> AddNode(-20)
     */
    const shared: SharedStorage = {};
    const start = new NumberNode(5);
    const check = new CheckPositiveNode();
    const addIfPositive = new AddNode(10);
    const addIfNegative = new AddNode(-20);

    // Setup with chaining
    start.next(check);
    check.next(addIfPositive, 'positive');
    check.next(addIfNegative, 'negative');
    
    const pipeline = new Flow(start);
    await pipeline.run(shared);

    expect(shared.current).toBe(15);
  });

  test('negative branch', async () => {
    /**
     * Same branching pipeline, but starting with -5.
     * Final result: (-5) + (-20) = -25.
     */
    const shared: SharedStorage = {};
    const start = new NumberNode(-5);
    const check = new CheckPositiveNode();
    const addIfPositive = new AddNode(10);
    const addIfNegative = new AddNode(-20);

    // Build the flow with chaining
    start.next(check);
    check.next(addIfPositive, 'positive');
    check.next(addIfNegative, 'negative');

    const pipeline = new Flow(start);
    await pipeline.run(shared);

    expect(shared.current).toBe(-25);
  });

  test('cycle until negative', async () => {
    /**
     * Demonstrate a cyclical pipeline:
     * Start with 10, check if positive -> subtract 3, then go back to check.
     * Repeat until the number becomes negative.
     */
    const shared: SharedStorage = {};
    const n1 = new NumberNode(10);
    const check = new CheckPositiveNode();
    const subtract3 = new AddNode(-3);
    const noOp = new NoOpNode();

    // Build the cycle with chaining
    n1.next(check);
    check.next(subtract3, 'positive').next(noOp, 'negative');
    subtract3.next(check);

    const pipeline = new Flow(n1);
    await pipeline.run(shared);

    // final result should be -2: (10 -> 7 -> 4 -> 1 -> -2)
    expect(shared.current).toBe(-2);
  });
});