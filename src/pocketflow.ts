// Type definitions
type Action = string;

// Base Node class with generic types - S (shared) first, P (params) second
class BaseNode<S = any, P = any> {
  params: P = {} as P;
  successors: Map<Action, BaseNode<any, any>> = new Map();

  setParams(params: P): void {
    this.params = params;
  }

  addSuccessor(node: BaseNode<any, any>, action: Action = "default"): BaseNode<any, any> {
    if (this.successors.has(action)) {
      console.warn(`Overwriting successor for action '${action}'`);
    }
    this.successors.set(action, node);
    return node;
  }

  prep(shared: S): any {
    return undefined;
  }

  exec(prepRes: any): any {
    return undefined;
  }

  post(shared: S, prepRes: any, execRes: any): Action | undefined {
    return undefined;
  }

  _exec(prepRes: any): any {
    return this.exec(prepRes);
  }

  _run(shared: S): Action | undefined {
    const p = this.prep(shared);
    const e = this._exec(p);
    return this.post(shared, p, e);
  }

  run(shared: S): Action | undefined {
    if (this.successors.size > 0) {
      console.warn("Node won't run successors. Use Flow.");
    }
    return this._run(shared);
  }

  // Operator overloading equivalent
  then(node: BaseNode<any, any>): BaseNode<any, any> {
    return this.addSuccessor(node);
  }

  action(actionName: Action): ConditionalTransition {
    if (typeof actionName === 'string') {
      return new ConditionalTransition(this, actionName);
    }
    throw new TypeError("Action must be a string");
  }
}

// Helper class for conditional transitions
class ConditionalTransition {
  constructor(private src: BaseNode<any, any>, private action: Action) {}

  then(target: BaseNode<any, any>): BaseNode<any, any> {
    return this.src.addSuccessor(target, this.action);
  }
}

// Regular Node with retry capability
class Node<S = any, P = any> extends BaseNode<S, P> {
  maxRetries: number;
  wait: number;
  currentRetry: number = 0;

  constructor(maxRetries: number = 1, wait: number = 0) {
    super();
    this.maxRetries = maxRetries;
    this.wait = wait;
  }

  execFallback(prepRes: any, error: Error): any {
    throw error;
  }

  _exec(prepRes: any): any {
    for (this.currentRetry = 0; this.currentRetry < this.maxRetries; this.currentRetry++) {
      try {
        return this.exec(prepRes);
      } catch (e) {
        if (this.currentRetry === this.maxRetries - 1) {
          return this.execFallback(prepRes, e as Error);
        }
        if (this.wait > 0) {
          // In JavaScript, we can't block like in Python, but for simplicity
          // I'm using a sync sleep - in real code use async/await
          const now = Date.now();
          while (Date.now() - now < this.wait * 1000) {
            // busy wait
          }
        }
      }
    }
  }
}

// BatchNode for handling iterable inputs
class BatchNode<S = any, P = any> extends Node<S, P> {
  _exec(items: any[]): any[] {
    return (items || []).map(item => super._exec(item));
  }
}

// Flow for orchestrating nodes
class Flow<S = any, P = any> extends BaseNode<S, P> {
  start: BaseNode<any, any>;

  constructor(start: BaseNode<any, any>) {
    super();
    this.start = start;
  }

  getNextNode(current: BaseNode<any, any>, action?: Action): BaseNode<any, any> | undefined {
    const nextAction = action || "default";
    const next = current.successors.get(nextAction);
    if (!next && current.successors.size > 0) {
      console.warn(`Flow ends: '${nextAction}' not found in [${Array.from(current.successors.keys())}]`);
    }
    return next;
  }

  _orchestrate(shared: S, params?: P): void {
    let current: BaseNode<any, any> | undefined = this.cloneNode(this.start);
    const p = params || this.params;

    while (current) {
      current.setParams(p);
      const action = current._run(shared);
      current = this.getNextNode(current, action);
      if (current) {
        current = this.cloneNode(current);
      }
    }
  }

  _run(shared: S): Action | undefined {
    const pr = this.prep(shared);
    this._orchestrate(shared);
    return this.post(shared, pr, undefined);
  }

  exec(prepRes: any): any {
    throw new Error("Flow can't exec.");
  }

  // Helper method to clone nodes
  private cloneNode(node: BaseNode<any, any>): BaseNode<any, any> {
    // In TypeScript, we can't easily deep clone objects with methods
    // This is a simplified approach - in a real implementation, you would need
    // a more sophisticated cloning strategy
    const clonedNode = Object.create(Object.getPrototypeOf(node));
    Object.assign(clonedNode, node);
    clonedNode.params = { ...node.params };
    clonedNode.successors = new Map(node.successors);
    return clonedNode;
  }
}

// BatchFlow for running flows with different parameters
// Using P for batch item type and defining params as P
class BatchFlow<S = any, P = Record<string, any>> extends Flow<S, P> {
  _run(shared: S): Action | undefined {
    // In BatchFlow, prep() should return an array of parameter objects
    const batchParams = this.prep(shared) as P[] || [];
    
    for (const bp of batchParams) {
      // Merge flow params with batch params, matching Python's {**self.params, **bp}
      const mergedParams = { ...this.params, ...bp } as P;
      this._orchestrate(shared, mergedParams);
    }
    
    return this.post(shared, batchParams, undefined);
  }
}

// AsyncNode for asynchronous operations
class AsyncNode<S = any, P = any> extends Node<S, P> {
  prep(shared: S): any {
    throw new Error("Use prepAsync.");
  }

  exec(prepRes: any): any {
    throw new Error("Use execAsync.");
  }

  post(shared: S, prepRes: any, execRes: any): Action | undefined {
    throw new Error("Use postAsync.");
  }

  execFallback(prepRes: any, error: Error): any {
    throw new Error("Use execFallbackAsync.");
  }

  _run(shared: S): Action | undefined {
    throw new Error("Use runAsync.");
  }

  async prepAsync(shared: S): Promise<any> {
    return undefined;
  }

  async execAsync(prepRes: any): Promise<any> {
    return undefined;
  }

  async execFallbackAsync(prepRes: any, error: Error): Promise<any> {
    throw error;
  }

  async postAsync(shared: S, prepRes: any, execRes: any): Promise<Action | undefined> {
    return undefined;
  }

  async _execAsync(prepRes: any): Promise<any> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await this.execAsync(prepRes);
      } catch (e) {
        if (i === this.maxRetries - 1) {
          return await this.execFallbackAsync(prepRes, e as Error);
        }
        if (this.wait > 0) {
          await new Promise(resolve => setTimeout(resolve, this.wait * 1000));
        }
      }
    }
  }

  async runAsync(shared: S): Promise<Action | undefined> {
    if (this.successors.size > 0) {
      console.warn("Node won't run successors. Use AsyncFlow.");
    }
    return await this._runAsync(shared);
  }

  async _runAsync(shared: S): Promise<Action | undefined> {
    const p = await this.prepAsync(shared);
    const e = await this._execAsync(p);
    return await this.postAsync(shared, p, e);
  }
}

// AsyncBatchNode for batch processing with async operations
class AsyncBatchNode<S = any, P = any> extends AsyncNode<S, P> {
  async _execAsync(items: any[]): Promise<any[]> {
    const results = [];
    for (const item of items || []) {
      results.push(await super._execAsync(item));
    }
    return results;
  }
}

// AsyncParallelBatchNode for parallel batch processing
class AsyncParallelBatchNode<S = any, P = any> extends AsyncNode<S, P> {
  async _execAsync(items: any[]): Promise<any[]> {
    return await Promise.all((items || []).map(item => super._execAsync(item)));
  }
}

// AsyncFlow for orchestrating async nodes
class AsyncFlow<S = any, P = any> extends AsyncNode<S, P> {
  start: BaseNode<any, any>;

  constructor(start: BaseNode<any, any>) {
    super();
    this.start = start;
  }

  getNextNode(current: BaseNode<any, any>, action?: Action): BaseNode<any, any> | undefined {
    const nextAction = action || "default";
    const next = current.successors.get(nextAction);
    if (!next && current.successors.size > 0) {
      console.warn(`Flow ends: '${nextAction}' not found in [${Array.from(current.successors.keys())}]`);
    }
    return next;
  }

  async _orchestrateAsync(shared: S, params?: P): Promise<void> {
    let current: BaseNode<any, any> | undefined = this.cloneNode(this.start);
    const p = params || this.params;

    while (current) {
      current.setParams(p);
      let action;
      
      if (current instanceof AsyncNode) {
        action = await current._runAsync(shared);
      } else {
        action = current._run(shared);
      }
      
      current = this.getNextNode(current, action);
      if (current) {
        current = this.cloneNode(current);
      }
    }
  }

  async _runAsync(shared: S): Promise<Action | undefined> {
    const p = await this.prepAsync(shared);
    await this._orchestrateAsync(shared);
    return await this.postAsync(shared, p, undefined);
  }

  // Helper method to clone nodes
  private cloneNode(node: BaseNode<any, any>): BaseNode<any, any> {
    const clonedNode = Object.create(Object.getPrototypeOf(node));
    Object.assign(clonedNode, node);
    clonedNode.params = { ...node.params };
    clonedNode.successors = new Map(node.successors);
    return clonedNode;
  }
}

// AsyncBatchFlow for running async flows with different parameters
class AsyncBatchFlow<S = any, P = Record<string, any>> extends AsyncFlow<S, P> {
  async _runAsync(shared: S): Promise<Action | undefined> {
    const batchParams = await this.prepAsync(shared) as P[] || [];
    
    for (const bp of batchParams) {
      // Merge flow params with batch params
      const mergedParams = { ...this.params, ...bp } as P;
      await this._orchestrateAsync(shared, mergedParams);
    }
    
    return await this.postAsync(shared, batchParams, undefined);
  }
}

// AsyncParallelBatchFlow for running async flows in parallel
class AsyncParallelBatchFlow<S = any, P = Record<string, any>> extends AsyncFlow<S, P> {
  async _runAsync(shared: S): Promise<Action | undefined> {
    const batchParams = await this.prepAsync(shared) as P[] || [];
    
    // Run all batch parameters in parallel
    await Promise.all(batchParams.map(bp => {
      // Merge flow params with batch params
      const mergedParams = { ...this.params, ...bp } as P;
      return this._orchestrateAsync(shared, mergedParams);
    }));
    
    return await this.postAsync(shared, batchParams, undefined);
  }
}

// Export all classes
export {
  BaseNode,
  Node,
  BatchNode,
  Flow,
  BatchFlow,
  AsyncNode,
  AsyncBatchNode,
  AsyncParallelBatchNode,
  AsyncFlow,
  AsyncBatchFlow,
  AsyncParallelBatchFlow
};