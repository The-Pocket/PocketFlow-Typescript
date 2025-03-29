// tests/flow_basic.test.ts
import { Node, Flow } from '../src/index';

// Define a shared storage type
type SharedStorage = {
  current?: number;
  execResult?: any;
};

class NumberNode extends Node<SharedStorage, Record<string, unknown>> {
  constructor(
    private number: number,
    maxRetries: number = 1,
    wait: number = 0
  ) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<void> {
    shared.current = this.number;
  }
}

class AddNode extends Node<SharedStorage> {
  constructor(
    private number: number,
    maxRetries: number = 1,
    wait: number = 0
  ) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<void> {
    if (shared.current !== undefined) {
      shared.current += this.number;
    }
  }
}

class MultiplyNode extends Node<SharedStorage> {
  constructor(
    private number: number,
    maxRetries: number = 1,
    wait: number = 0
  ) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<void> {
    if (shared.current !== undefined) {
      shared.current *= this.number;
    }
  }
}

class CheckPositiveNode extends Node<SharedStorage> {
  constructor(maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
  }

  async post(shared: SharedStorage): Promise<string> {
    if (shared.current !== undefined && shared.current >= 0) {
      return 'positive';
    } else {
      return 'negative';
    }
  }
}

class NoOpNode extends Node<SharedStorage> {
  constructor(maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
  }

  async prep(): Promise<void> {
    // Do nothing, just pass
  }
}

// New class to demonstrate Node's retry capabilities
class FlakyNode extends Node<SharedStorage> {
  private attemptCount = 0;

  constructor(
    private failUntilAttempt: number,
    maxRetries: number = 3,
    wait: number = 0.1
  ) {
    super(maxRetries, wait);
  }

  async exec(): Promise<any> {
    this.attemptCount++;

    if (this.attemptCount < this.failUntilAttempt) {
      throw new Error(`Attempt ${this.attemptCount} failed`);
    }

    return `Success on attempt ${this.attemptCount}`;
  }

  async post(
    shared: SharedStorage,
    prepRes: any,
    execRes: any
  ): Promise<string> {
    shared.execResult = execRes;
    return 'default';
  }
}

// New class to demonstrate using exec method more explicitly
class ExecNode extends Node<SharedStorage> {
  constructor(
    private operation: string,
    maxRetries: number = 1,
    wait: number = 0
  ) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<number> {
    // Return the current value for processing in exec
    return shared.current || 0;
  }

  async exec(currentValue: number): Promise<number> {
    switch (this.operation) {
      case 'square':
        return currentValue * currentValue;
      case 'double':
        return currentValue * 2;
      case 'negate':
        return -currentValue;
      default:
        return currentValue;
    }
  }

  async post(
    shared: SharedStorage,
    prepRes: any,
    execRes: any
  ): Promise<string> {
    shared.current = execRes;
    return 'default';
  }
}

describe('Pocket Flow Tests with Node', () => {
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
    start
      .next(check)
      .on('positive', addIfPositive)
      .on('negative', addIfNegative);

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
    start
      .next(check)
      .on('positive', addIfPositive)
      .on('negative', addIfNegative);

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
    n1.next(check).on('positive', subtract3).on('negative', noOp);

    subtract3.next(check);

    const pipeline = new Flow(n1);
    await pipeline.run(shared);

    // final result should be -2: (10 -> 7 -> 4 -> 1 -> -2)
    expect(shared.current).toBe(-2);
  });

  // New tests demonstrating Node features

  test('retry functionality', async () => {
    const shared: SharedStorage = {};

    // This node will fail on the first attempt but succeed on the second
    const flakyNode = new FlakyNode(2, 3, 0.01);

    const pipeline = new Flow(flakyNode);
    await pipeline.run(shared);

    // Check that we got a success message indicating it was the second attempt
    expect(shared.execResult).toBe('Success on attempt 2');
  });

  test('retry with fallback', async () => {
    const shared: SharedStorage = {};

    // This node will always fail (requires 5 attempts, but we only allow 2)
    const flakyNode = new FlakyNode(5, 2, 0.01);

    // Override the execFallback method to handle the failure
    flakyNode.execFallback = async (
      prepRes: any,
      error: Error
    ): Promise<any> => {
      return 'Fallback executed due to failure';
    };

    const pipeline = new Flow(flakyNode);
    await pipeline.run(shared);

    // Check that we got the fallback result
    expect(shared.execResult).toBe('Fallback executed due to failure');
  });

  test('exec method processing', async () => {
    const shared: SharedStorage = { current: 5 };

    const squareNode = new ExecNode('square');
    const doubleNode = new ExecNode('double');
    const negateNode = new ExecNode('negate');

    squareNode.next(doubleNode).next(negateNode);

    const pipeline = new Flow(squareNode);
    await pipeline.run(shared);

    // 5 → square → 25 → double → 50 → negate → -50
    expect(shared.current).toBe(-50);
  });
});
