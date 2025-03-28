// tests/batch-node.test.ts
import { Node, BatchNode, Flow } from '../src/index';

// Define shared storage type
type SharedStorage = {
  input_array?: number[];
  chunk_results?: number[];
  total?: number;
  [key: string]: any;
};

class AsyncArrayChunkNode extends BatchNode<SharedStorage> {
  private chunk_size: number;

  constructor(
    chunk_size: number = 10,
    maxRetries: number = 1,
    wait: number = 0
  ) {
    super(maxRetries, wait);
    this.chunk_size = chunk_size;
  }

  async prep(shared: SharedStorage): Promise<number[][]> {
    // Get array from shared storage and split into chunks
    const array = shared.input_array || [];
    const chunks: number[][] = [];

    for (let start = 0; start < array.length; start += this.chunk_size) {
      const end = Math.min(start + this.chunk_size, array.length);
      chunks.push(array.slice(start, end));
    }

    return chunks;
  }

  async exec(chunk: number[]): Promise<number> {
    // Simulate async processing of each chunk
    await new Promise((resolve) => setTimeout(resolve, 10));
    return chunk.reduce((sum, value) => sum + value, 0);
  }

  async post(
    shared: SharedStorage,
    prepRes: number[][],
    execRes: number[]
  ): Promise<string | undefined> {
    // Store chunk results in shared storage
    shared.chunk_results = execRes;
    return 'processed';
  }
}

class AsyncSumReduceNode extends Node<SharedStorage> {
  constructor(maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<number[]> {
    // Get chunk results from shared storage
    return shared.chunk_results || [];
  }

  async exec(chunkResults: number[]): Promise<number> {
    // Simulate async processing
    await new Promise((resolve) => setTimeout(resolve, 10));
    return chunkResults.reduce((sum, value) => sum + value, 0);
  }

  async post(
    shared: SharedStorage,
    prepRes: number[],
    execRes: number
  ): Promise<string | undefined> {
    // Store the total in shared storage
    shared.total = execRes;
    return 'reduced';
  }
}

// Create an error-throwing node for testing error handling
class ErrorBatchNode extends BatchNode<SharedStorage> {
  constructor(maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<number[]> {
    return shared.input_array || [];
  }

  async exec(item: number): Promise<number> {
    if (item === 2) {
      throw new Error('Error processing item 2');
    }
    return item;
  }
}

describe('BatchNode Tests', () => {
  test('array chunking', async () => {
    // Test that the array is correctly split into chunks and processed asynchronously
    const shared: SharedStorage = {
      input_array: Array.from({ length: 25 }, (_, i) => i), // [0,1,2,...,24]
    };

    const chunkNode = new AsyncArrayChunkNode(10);
    await chunkNode.run(shared);

    expect(shared.chunk_results).toEqual([45, 145, 110]); // Sum of chunks [0-9], [10-19], [20-24]
  });

  test('async map-reduce sum', async () => {
    // Test a complete async map-reduce pipeline that sums a large array
    const array = Array.from({ length: 100 }, (_, i) => i);
    const expectedSum = array.reduce((sum, val) => sum + val, 0); // 4950

    const shared: SharedStorage = {
      input_array: array,
    };

    // Create nodes
    const chunkNode = new AsyncArrayChunkNode(10);
    const reduceNode = new AsyncSumReduceNode();

    // Connect nodes
    chunkNode.on('processed', reduceNode);

    // Create and run pipeline
    const pipeline = new Flow(chunkNode);
    await pipeline.run(shared);

    expect(shared.total).toBe(expectedSum);
  });

  test('uneven chunks', async () => {
    // Test that the async map-reduce works correctly with array lengths
    // that don't divide evenly by chunk_size
    const array = Array.from({ length: 25 }, (_, i) => i);
    const expectedSum = array.reduce((sum, val) => sum + val, 0); // 300

    const shared: SharedStorage = {
      input_array: array,
    };

    const chunkNode = new AsyncArrayChunkNode(10);
    const reduceNode = new AsyncSumReduceNode();

    chunkNode.on('processed', reduceNode);
    const pipeline = new Flow(chunkNode);
    await pipeline.run(shared);

    expect(shared.total).toBe(expectedSum);
  });

  test('custom chunk size', async () => {
    // Test that the async map-reduce works with different chunk sizes
    const array = Array.from({ length: 100 }, (_, i) => i);
    const expectedSum = array.reduce((sum, val) => sum + val, 0);

    const shared: SharedStorage = {
      input_array: array,
    };

    // Use chunk_size=15 instead of default 10
    const chunkNode = new AsyncArrayChunkNode(15);
    const reduceNode = new AsyncSumReduceNode();

    chunkNode.on('processed', reduceNode);
    const pipeline = new Flow(chunkNode);
    await pipeline.run(shared);

    expect(shared.total).toBe(expectedSum);
  });

  test('single element chunks', async () => {
    // Test extreme case where chunk_size=1
    const array = Array.from({ length: 5 }, (_, i) => i);
    const expectedSum = array.reduce((sum, val) => sum + val, 0);

    const shared: SharedStorage = {
      input_array: array,
    };

    const chunkNode = new AsyncArrayChunkNode(1);
    const reduceNode = new AsyncSumReduceNode();

    chunkNode.on('processed', reduceNode);
    const pipeline = new Flow(chunkNode);
    await pipeline.run(shared);

    expect(shared.total).toBe(expectedSum);
  });

  test('empty array', async () => {
    // Test edge case of empty input array
    const shared: SharedStorage = {
      input_array: [],
    };

    const chunkNode = new AsyncArrayChunkNode(10);
    const reduceNode = new AsyncSumReduceNode();

    chunkNode.on('processed', reduceNode);
    const pipeline = new Flow(chunkNode);
    await pipeline.run(shared);

    expect(shared.total).toBe(0);
  });

  test('error handling', async () => {
    // Test error handling in async batch processing
    const shared: SharedStorage = {
      input_array: [1, 2, 3],
    };

    const errorNode = new ErrorBatchNode();

    await expect(async () => {
      await errorNode.run(shared);
    }).rejects.toThrow('Error processing item 2');
  });

  test('retry mechanism', async () => {
    // Test the retry mechanism with a node that fails intermittently
    let attempts = 0;

    class RetryTestNode extends BatchNode<SharedStorage> {
      constructor() {
        super(3, 0.01); // 3 retries with 10ms wait time
      }

      async prep(shared: SharedStorage): Promise<number[]> {
        return [1];
      }

      async exec(item: number): Promise<string> {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Failure on attempt ${attempts}`);
        }
        return `Success on attempt ${attempts}`;
      }

      async post(
        shared: SharedStorage,
        prepRes: number[],
        execRes: string[]
      ): Promise<string | undefined> {
        shared.result = execRes[0];
        return undefined;
      }
    }

    const shared: SharedStorage = {};
    const retryNode = new RetryTestNode();

    await retryNode.run(shared);

    expect(attempts).toBe(3);
    expect(shared.result).toBe('Success on attempt 3');
  });

  test('parallel batch processing', async () => {
    // Test that ParallelBatchNode processes items in parallel
    let completed: number[] = [];

    // Import ParallelBatchNode
    const { ParallelBatchNode } = require('../src/index');

    class ParallelProcessingNode extends ParallelBatchNode<SharedStorage> {
      constructor() {
        super(1, 0);
      }

      async prep(shared: SharedStorage): Promise<number[]> {
        return [1, 2, 3, 4, 5];
      }

      async exec(item: number): Promise<number> {
        // Items with higher values will complete first
        const delay = 100 - item * 20;
        await new Promise((resolve) => setTimeout(resolve, delay));
        completed.push(item);
        return item;
      }

      async post(
        shared: SharedStorage,
        prepRes: number[],
        execRes: number[]
      ): Promise<string | undefined> {
        shared.parallel_results = execRes;
        shared.completion_order = [...completed];
        return undefined;
      }
    }

    const shared: SharedStorage = {};
    const parallelNode = new ParallelProcessingNode();

    await parallelNode.run(shared);

    // Check that results contain all processed items
    expect(shared.parallel_results?.sort()).toEqual([1, 2, 3, 4, 5]);

    // Check that items were not necessarily processed in order
    // Higher numbered items should complete before lower ones due to the delay logic
    expect(shared.completion_order).not.toEqual([1, 2, 3, 4, 5]);
  });
});
