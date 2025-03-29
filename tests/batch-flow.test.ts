// tests/async-batch-flow.test.ts
import { Node, BatchFlow } from '../src/index';

// Define shared storage type
type SharedStorage = {
  inputData?: Record<string, number>;
  results?: Record<string, number>;
  intermediateResults?: Record<string, number>;
};

// Parameters type
type BatchParams = {
  key: string;
  multiplier?: number;
};

class AsyncDataProcessNode extends Node<SharedStorage, BatchParams> {
  constructor(maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<number> {
    const key = this._params.key;
    const data = shared.inputData?.[key] ?? 0;

    if (!shared.results) {
      shared.results = {};
    }

    shared.results[key] = data;
    return data;
  }

  async exec(prepRes: number): Promise<number> {
    return prepRes; // Just return the prep result as-is
  }

  async post(
    shared: SharedStorage,
    prepRes: number,
    execRes: number
  ): Promise<string | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate async work
    const key = this._params.key;

    if (!shared.results) {
      shared.results = {};
    }

    shared.results[key] = execRes * 2; // Double the value
    return 'processed';
  }
}

class AsyncErrorNode extends Node<SharedStorage, BatchParams> {
  constructor(maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
  }

  async prep(shared: SharedStorage): Promise<any> {
    return undefined;
  }

  async exec(prepRes: any): Promise<any> {
    return undefined;
  }

  async post(
    shared: SharedStorage,
    prepRes: any,
    execRes: any
  ): Promise<string | undefined> {
    const key = this._params.key;
    if (key === 'errorKey') {
      throw new Error(`Async error processing key: ${key}`);
    }
    return 'processed';
  }
}

describe('BatchFlow Tests', () => {
  let processNode: AsyncDataProcessNode;

  beforeEach(() => {
    processNode = new AsyncDataProcessNode();
  });

  test('basic async batch processing', async () => {
    class SimpleTestBatchFlow extends BatchFlow<SharedStorage> {
      async prep(shared: SharedStorage): Promise<BatchParams[]> {
        return Object.keys(shared.inputData || {}).map((k) => ({ key: k }));
      }
    }

    const shared: SharedStorage = {
      inputData: {
        a: 1,
        b: 2,
        c: 3,
      },
    };

    const flow = new SimpleTestBatchFlow(processNode);
    await flow.run(shared);

    expect(shared.results).toEqual({
      a: 2, // 1 * 2
      b: 4, // 2 * 2
      c: 6, // 3 * 2
    });
  });

  test('empty async batch', async () => {
    class EmptyTestBatchFlow extends BatchFlow<SharedStorage> {
      async prep(shared: SharedStorage): Promise<BatchParams[]> {
        // Initialize results as an empty object
        if (!shared.results) {
          shared.results = {};
        }
        return Object.keys(shared.inputData || {}).map((k) => ({ key: k }));
      }

      // Ensure post is called even if batch is empty
      async post(
        shared: SharedStorage,
        prepRes: BatchParams[],
        execRes: any
      ): Promise<string | undefined> {
        if (!shared.results) {
          shared.results = {};
        }
        return undefined;
      }
    }

    const shared: SharedStorage = {
      inputData: {},
    };

    const flow = new EmptyTestBatchFlow(processNode);
    await flow.run(shared);

    expect(shared.results).toEqual({});
  });

  test('async error handling', async () => {
    class ErrorTestBatchFlow extends BatchFlow<SharedStorage> {
      async prep(shared: SharedStorage): Promise<BatchParams[]> {
        return Object.keys(shared.inputData || {}).map((k) => ({ key: k }));
      }
    }

    const shared: SharedStorage = {
      inputData: {
        normalKey: 1,
        errorKey: 2,
        anotherKey: 3,
      },
    };

    const flow = new ErrorTestBatchFlow(new AsyncErrorNode());

    await expect(async () => {
      await flow.run(shared);
    }).rejects.toThrow('Async error processing key: errorKey');
  });

  test('nested async flow', async () => {
    class AsyncInnerNode extends Node<SharedStorage, BatchParams> {
      async prep(shared: SharedStorage): Promise<any> {
        return undefined;
      }

      async exec(prepRes: any): Promise<any> {
        return undefined;
      }

      async post(
        shared: SharedStorage,
        prepRes: any,
        execRes: any
      ): Promise<string | undefined> {
        const key = this._params.key;

        if (!shared.intermediateResults) {
          shared.intermediateResults = {};
        }

        // Safely access inputData
        const inputValue = shared.inputData?.[key] ?? 0;
        shared.intermediateResults[key] = inputValue + 1;

        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'next';
      }
    }

    class AsyncOuterNode extends Node<SharedStorage, BatchParams> {
      async prep(shared: SharedStorage): Promise<any> {
        return undefined;
      }

      async exec(prepRes: any): Promise<any> {
        return undefined;
      }

      async post(
        shared: SharedStorage,
        prepRes: any,
        execRes: any
      ): Promise<string | undefined> {
        const key = this._params.key;

        if (!shared.results) {
          shared.results = {};
        }

        if (!shared.intermediateResults) {
          shared.intermediateResults = {};
        }

        shared.results[key] = shared.intermediateResults[key] * 2;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      }
    }

    class NestedBatchFlow extends BatchFlow<SharedStorage> {
      async prep(shared: SharedStorage): Promise<BatchParams[]> {
        return Object.keys(shared.inputData || {}).map((k) => ({ key: k }));
      }
    }

    // Create inner flow
    const innerNode = new AsyncInnerNode();
    const outerNode = new AsyncOuterNode();
    innerNode.on('next', outerNode);

    const shared: SharedStorage = {
      inputData: {
        x: 1,
        y: 2,
      },
    };

    const flow = new NestedBatchFlow(innerNode);
    await flow.run(shared);

    expect(shared.results).toEqual({
      x: 4, // (1 + 1) * 2
      y: 6, // (2 + 1) * 2
    });
  });

  test('custom async parameters', async () => {
    class CustomParamNode extends Node<SharedStorage, BatchParams> {
      async prep(shared: SharedStorage): Promise<any> {
        return undefined;
      }

      async exec(prepRes: any): Promise<any> {
        return undefined;
      }

      async post(
        shared: SharedStorage,
        prepRes: any,
        execRes: any
      ): Promise<string | undefined> {
        const key = this._params.key;
        const multiplier = this._params.multiplier || 1;

        await new Promise((resolve) => setTimeout(resolve, 10));

        if (!shared.results) {
          shared.results = {};
        }

        // Safely access inputData with default value
        const inputValue = shared.inputData?.[key] ?? 0;
        shared.results[key] = inputValue * multiplier;

        return 'done';
      }
    }

    class CustomParamBatchFlow extends BatchFlow<SharedStorage> {
      async prep(shared: SharedStorage): Promise<BatchParams[]> {
        return Object.keys(shared.inputData || {}).map((k, i) => ({
          key: k,
          multiplier: i + 1,
        }));
      }
    }

    const shared: SharedStorage = {
      inputData: {
        a: 1,
        b: 2,
        c: 3,
      },
    };

    const flow = new CustomParamBatchFlow(new CustomParamNode());
    await flow.run(shared);

    expect(shared.results).toEqual({
      a: 1 * 1, // first item, multiplier = 1
      b: 2 * 2, // second item, multiplier = 2
      c: 3 * 3, // third item, multiplier = 3
    });
  });
});
