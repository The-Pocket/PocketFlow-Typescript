// tests/fallback.test.ts
import { BaseNode, AsyncNode, Flow } from '../src/index';

// Define a shared storage type
type SharedStorage = {
  results?: Array<{
    attempts: number;
    result: string;
  }>;
  final_result?: any;
  [key: string]: any;
};

// Changed to extend AsyncNode instead of BaseNode
class FallbackNode extends AsyncNode<SharedStorage> {
  private should_fail: boolean;
  private attempt_count: number = 0;
  
  constructor(should_fail: boolean = true, maxRetries: number = 1) {
    super(maxRetries, 0); // Max retries and no wait time
    this.should_fail = should_fail;
  }
  
  async prep(shared: SharedStorage): Promise<null> {
    if (!shared.results) {
      shared.results = [];
    }
    return null;
  }
  
  async exec(prep_result: null): Promise<string> {
    this.attempt_count++;
    if (this.should_fail) {
      throw new Error("Intentional failure");
    }
    return "success";
  }
  
  async execFallback(prep_result: null, error: Error): Promise<string> {
    return "fallback";
  }
  
  async post(shared: SharedStorage, prep_result: null, exec_result: string): Promise<string | undefined> {
    shared.results?.push({
      attempts: this.attempt_count,
      result: exec_result
    });
    return undefined;
  }
}

class AsyncFallbackNode extends AsyncNode<SharedStorage> {
  private should_fail: boolean;
  private attempt_count: number = 0;
  
  constructor(should_fail: boolean = true, maxRetries: number = 1, wait: number = 0) {
    super(maxRetries, wait);
    this.should_fail = should_fail;
  }
  
  async prep(shared: SharedStorage): Promise<null> {
    if (!shared.results) {
      shared.results = [];
    }
    return null;
  }
  
  async exec(prep_result: null): Promise<string> {
    this.attempt_count++;
    if (this.should_fail) {
      throw new Error("Intentional async failure");
    }
    return "success";
  }
  
  async execFallback(prep_result: null, error: Error): Promise<string> {
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, 10));
    return "async_fallback";
  }
  
  async post(shared: SharedStorage, prep_result: null, exec_result: string): Promise<string | undefined> {
    shared.results?.push({
      attempts: this.attempt_count,
      result: exec_result
    });
    return undefined;
  }
}

class ResultNode extends BaseNode<SharedStorage> {
  async prep(shared: SharedStorage): Promise<any> {
    return shared.results || [];
  }
  
  async exec(prep_result: any): Promise<any> {
    return prep_result;
  }
  
  async post(shared: SharedStorage, prep_result: any, exec_result: any): Promise<string | undefined> {
    shared.final_result = exec_result;
    return undefined;
  }
}

class NoFallbackNode extends BaseNode<SharedStorage> {
  async prep(shared: SharedStorage): Promise<null> {
    if (!shared.results) {
      shared.results = [];
    }
    return null;
  }
  
  async exec(prep_result: null): Promise<string> {
    throw new Error("Test error");
  }
  
  async post(shared: SharedStorage, prep_result: null, exec_result: string): Promise<string | undefined> {
    shared.results?.push({ attempts: 1, result: exec_result });
    return exec_result;
  }
}

describe('Fallback Functionality Tests', () => {
  test('successful execution', async () => {
    // Test that execFallback is not called when execution succeeds
    const shared: SharedStorage = {};
    const node = new FallbackNode(false);
    await node.run(shared);
    
    expect(shared.results?.length).toBe(1);
    expect(shared.results?.[0].attempts).toBe(1);
    expect(shared.results?.[0].result).toBe("success");
  });

  test('fallback after failure', async () => {
    // Test that execFallback is called after all retries are exhausted
    const shared: SharedStorage = {};
    const node = new AsyncFallbackNode(true, 2);
    await node.run(shared);
    
    expect(shared.results?.length).toBe(1);
    expect(shared.results?.[0].attempts).toBe(2);
    expect(shared.results?.[0].result).toBe("async_fallback");
  });

  test('fallback in flow', async () => {
    // Test that fallback works within a Flow
    const shared: SharedStorage = {};
    const fallbackNode = new FallbackNode(true, 1);
    const resultNode = new ResultNode();
    
    fallbackNode.next(resultNode);
    
    const flow = new Flow(fallbackNode);
    await flow.run(shared);
    
    expect(shared.results?.length).toBe(1);
    expect(shared.results?.[0].result).toBe("fallback");
    expect(shared.final_result).toEqual([{ attempts: 1, result: 'fallback' }]);
  });

  test('no fallback implementation', async () => {
    // Test that default fallback behavior raises the exception
    const shared: SharedStorage = {};
    const node = new NoFallbackNode();
    
    await expect(async () => {
      await node.run(shared);
    }).rejects.toThrow("Test error");
  });

  test('retry before fallback', async () => {
    // Test that retries are attempted before calling fallback
    const shared: SharedStorage = {};
    const node = new AsyncFallbackNode(true, 3);
    await node.run(shared);
    
    expect(shared.results?.length).toBe(1);
    expect(shared.results?.[0].attempts).toBe(3);
    expect(shared.results?.[0].result).toBe("async_fallback");
  });
});