// tests/parallel-batch-flow.test.ts
import { Node, ParallelBatchNode, Flow, ParallelBatchFlow } from '../src/index';

// Define shared storage type
type SharedStorage = {
  batches?: number[][];
  processedNumbers?: Record<number, number[]>;
  total?: number;
};

class AsyncParallelNumberProcessor extends ParallelBatchNode<
  SharedStorage,
  { batchId: number }
> {
  private delay: number;

  constructor(delay: number = 0.1, maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
    this.delay = delay;
  }

  async prep(shared: SharedStorage): Promise<number[]> {
    const batchId = this._params.batchId;
    return shared.batches?.[batchId] || [];
  }

  async exec(number: number): Promise<number> {
    // Simulate async processing
    await new Promise((resolve) => setTimeout(resolve, this.delay * 1000));
    return number * 2;
  }

  async post(
    shared: SharedStorage,
    prepRes: number[],
    execRes: number[]
  ): Promise<string | undefined> {
    if (!shared.processedNumbers) {
      shared.processedNumbers = {};
    }
    shared.processedNumbers[this._params.batchId] = execRes;
    return 'processed';
  }
}

class AsyncAggregatorNode extends Node<SharedStorage> {
  constructor(maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<number[]> {
    // Combine all batch results in order
    const allResults: number[] = [];
    const processed = shared.processedNumbers || {};

    for (let i = 0; i < Object.keys(processed).length; i++) {
      allResults.push(...processed[i]);
    }

    return allResults;
  }

  async exec(prepResult: number[]): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return prepResult.reduce((sum, val) => sum + val, 0);
  }

  async post(
    shared: SharedStorage,
    prepRes: number[],
    execRes: number
  ): Promise<string | undefined> {
    shared.total = execRes;
    return 'aggregated';
  }
}

// Custom ParallelBatchFlow that processes batches based on batchId
class TestParallelBatchFlow extends ParallelBatchFlow<SharedStorage> {
  async prep(shared: SharedStorage): Promise<Record<string, any>[]> {
    return (shared.batches || []).map((_, i) => ({ batchId: i }));
  }
}

describe('ParallelBatchFlow Tests', () => {
  test('parallel batch flow', async () => {
    /**
     * Test basic parallel batch processing flow with batch IDs
     */
    const shared: SharedStorage = {
      batches: [
        [1, 2, 3], // batchId: 0
        [4, 5, 6], // batchId: 1
        [7, 8, 9], // batchId: 2
      ],
    };

    const processor = new AsyncParallelNumberProcessor(0.1);
    const aggregator = new AsyncAggregatorNode();

    processor.on('processed', aggregator);
    const flow = new TestParallelBatchFlow(processor);

    const startTime = Date.now();
    await flow.run(shared);
    const executionTime = (Date.now() - startTime) / 1000;

    // Verify each batch was processed correctly
    const expectedBatchResults = {
      0: [2, 4, 6], // [1,2,3] * 2
      1: [8, 10, 12], // [4,5,6] * 2
      2: [14, 16, 18], // [7,8,9] * 2
    };

    expect(shared.processedNumbers).toEqual(expectedBatchResults);

    // Verify total
    const expectedTotal = shared
      .batches!.flat()
      .reduce((sum, num) => sum + num * 2, 0);
    expect(shared.total).toBe(expectedTotal);

    // Verify parallel execution
    expect(executionTime).toBeLessThan(0.2);
  });

  test('error handling', async () => {
    /**
     * Test error handling in parallel batch flow
     */
    class ErrorProcessor extends AsyncParallelNumberProcessor {
      async exec(item: number): Promise<number> {
        if (item === 2) {
          throw new Error(`Error processing item ${item}`);
        }
        return item;
      }
    }

    const shared: SharedStorage = {
      batches: [
        [1, 2, 3], // Contains error-triggering value
        [4, 5, 6],
      ],
    };

    const processor = new ErrorProcessor();
    const flow = new TestParallelBatchFlow(processor);

    await expect(async () => {
      await flow.run(shared);
    }).rejects.toThrow('Error processing item 2');
  });

  test('multiple batch sizes', async () => {
    /**
     * Test parallel batch flow with varying batch sizes
     */
    const shared: SharedStorage = {
      batches: [
        [1], // batchId: 0
        [2, 3, 4], // batchId: 1
        [5, 6], // batchId: 2
        [7, 8, 9, 10], // batchId: 3
      ],
    };

    const processor = new AsyncParallelNumberProcessor(0.05);
    const aggregator = new AsyncAggregatorNode();

    processor.on('processed', aggregator);
    const flow = new TestParallelBatchFlow(processor);

    await flow.run(shared);

    // Verify each batch was processed correctly
    const expectedBatchResults = {
      0: [2], // [1] * 2
      1: [4, 6, 8], // [2,3,4] * 2
      2: [10, 12], // [5,6] * 2
      3: [14, 16, 18, 20], // [7,8,9,10] * 2
    };

    expect(shared.processedNumbers).toEqual(expectedBatchResults);

    // Verify total
    const expectedTotal = shared
      .batches!.flat()
      .reduce((sum, num) => sum + num * 2, 0);
    expect(shared.total).toBe(expectedTotal);
  });
});
