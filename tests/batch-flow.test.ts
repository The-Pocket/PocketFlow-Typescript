// tests/async-batch-flow.test.ts
import { Node, BatchFlow } from '../src/index';

// Define shared storage type
type SharedStorage = {
  input_data?: Record<string, number>;
  results?: Record<string, number>;
  intermediate_results?: Record<string, number>;
  [key: string]: any;
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
    const key = this.params.key;
    const data = shared.input_data?.[key] ?? 0;
    
    if (!shared.results) {
      shared.results = {};
    }
    
    shared.results[key] = data;
    return data;
  }
  
  async exec(prepRes: number): Promise<number> {
    return prepRes;  // Just return the prep result as-is
  }

  async post(shared: SharedStorage, prepRes: number, execRes: number): Promise<string | undefined> {
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async work
    const key = this.params.key;
    
    if (!shared.results) {
      shared.results = {};
    }
    
    shared.results[key] = execRes * 2; // Double the value
    return "processed";
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

  async post(shared: SharedStorage, prepRes: any, execRes: any): Promise<string | undefined> {
    const key = this.params.key;
    if (key === 'error_key') {
      throw new Error(`Async error processing key: ${key}`);
    }
    return "processed";
  }
}

describe('BatchFlow Tests', () => {
  let processNode: AsyncDataProcessNode;

  beforeEach(() => {
    processNode = new AsyncDataProcessNode();
  });

  test('basic async batch processing', async () => {
    class SimpleTestBatchFlow extends BatchFlow<SharedStorage, BatchParams> {
      async prep(shared: SharedStorage): Promise<BatchParams[]> {
        return Object.keys(shared.input_data || {}).map(k => ({ key: k }));
      }
    }

    const shared: SharedStorage = {
      input_data: {
        'a': 1,
        'b': 2,
        'c': 3
      }
    };

    const flow = new SimpleTestBatchFlow(processNode);
    await flow.run(shared);

    expect(shared.results).toEqual({
      'a': 2,  // 1 * 2
      'b': 4,  // 2 * 2
      'c': 6   // 3 * 2
    });
  });

  test('empty async batch', async () => {
    class EmptyTestBatchFlow extends BatchFlow<SharedStorage, BatchParams> {
      async prep(shared: SharedStorage): Promise<BatchParams[]> {
        // Initialize results as an empty object
        if (!shared.results) {
          shared.results = {};
        }
        return Object.keys(shared.input_data || {}).map(k => ({ key: k }));
      }
      
      // Ensure post is called even if batch is empty
      async post(shared: SharedStorage, prepRes: BatchParams[], execRes: any): Promise<string | undefined> {
        if (!shared.results) {
          shared.results = {};
        }
        return undefined;
      }
    }

    const shared: SharedStorage = {
      input_data: {}
    };

    const flow = new EmptyTestBatchFlow(processNode);
    await flow.run(shared);

    expect(shared.results).toEqual({});
  });

  test('async error handling', async () => {
    class ErrorTestBatchFlow extends BatchFlow<SharedStorage, BatchParams> {
      async prep(shared: SharedStorage): Promise<BatchParams[]> {
        return Object.keys(shared.input_data || {}).map(k => ({ key: k }));
      }
    }

    const shared: SharedStorage = {
      input_data: {
        'normal_key': 1,
        'error_key': 2,
        'another_key': 3
      }
    };

    const flow = new ErrorTestBatchFlow(new AsyncErrorNode());
    
    await expect(async () => {
      await flow.run(shared);
    }).rejects.toThrow("Async error processing key: error_key");
  });

  test('nested async flow', async () => {
    class AsyncInnerNode extends Node<SharedStorage, BatchParams> {
      async prep(shared: SharedStorage): Promise<any> {
        return undefined;
      }
      
      async exec(prepRes: any): Promise<any> {
        return undefined;
      }

      async post(shared: SharedStorage, prepRes: any, execRes: any): Promise<string | undefined> {
        const key = this.params.key;
        
        if (!shared.intermediate_results) {
          shared.intermediate_results = {};
        }
        
        // Safely access input_data
        const inputValue = shared.input_data?.[key] ?? 0;
        shared.intermediate_results[key] = inputValue + 1;
        
        await new Promise(resolve => setTimeout(resolve, 10));
        return "next";
      }
    }

    class AsyncOuterNode extends Node<SharedStorage, BatchParams> {
      async prep(shared: SharedStorage): Promise<any> {
        return undefined;
      }
      
      async exec(prepRes: any): Promise<any> {
        return undefined;
      }

      async post(shared: SharedStorage, prepRes: any, execRes: any): Promise<string | undefined> {
        const key = this.params.key;
        
        if (!shared.results) {
          shared.results = {};
        }
        
        if (!shared.intermediate_results) {
          shared.intermediate_results = {};
        }
        
        shared.results[key] = shared.intermediate_results[key] * 2;
        await new Promise(resolve => setTimeout(resolve, 10));
        return "done";
      }
    }

    class NestedBatchFlow extends BatchFlow<SharedStorage, BatchParams> {
      async prep(shared: SharedStorage): Promise<BatchParams[]> {
        return Object.keys(shared.input_data || {}).map(k => ({ key: k }));
      }
    }

    // Create inner flow
    const innerNode = new AsyncInnerNode();
    const outerNode = new AsyncOuterNode();
    innerNode.next(outerNode, "next");

    const shared: SharedStorage = {
      input_data: {
        'x': 1,
        'y': 2
      }
    };

    const flow = new NestedBatchFlow(innerNode);
    await flow.run(shared);

    expect(shared.results).toEqual({
      'x': 4,  // (1 + 1) * 2
      'y': 6   // (2 + 1) * 2
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

      async post(shared: SharedStorage, prepRes: any, execRes: any): Promise<string | undefined> {
        const key = this.params.key;
        const multiplier = this.params.multiplier || 1;
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        if (!shared.results) {
          shared.results = {};
        }
        
        // Safely access input_data with default value
        const inputValue = shared.input_data?.[key] ?? 0;
        shared.results[key] = inputValue * multiplier;
        
        return "done";
      }
    }

    class CustomParamBatchFlow extends BatchFlow<SharedStorage, BatchParams> {
      async prep(shared: SharedStorage): Promise<BatchParams[]> {
        return Object.keys(shared.input_data || {}).map((k, i) => ({
          key: k,
          multiplier: i + 1
        }));
      }
    }

    const shared: SharedStorage = {
      input_data: {
        'a': 1,
        'b': 2,
        'c': 3
      }
    };

    const flow = new CustomParamBatchFlow(new CustomParamNode());
    await flow.run(shared);

    expect(shared.results).toEqual({
      'a': 1 * 1,  // first item, multiplier = 1
      'b': 2 * 2,  // second item, multiplier = 2
      'c': 3 * 3   // third item, multiplier = 3
    });
  });
});