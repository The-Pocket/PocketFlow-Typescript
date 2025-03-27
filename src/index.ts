type Action = string;
class BaseNode<S = any, P = any> {
  params: P = {} as P; successors: Map<Action, BaseNode<any, any>> = new Map();
  setParams(params: P): this { this.params = params; return this; }
  next(node: BaseNode<any, any>, action: Action = "default"): BaseNode<any, any> {
    if (this.successors.has(action)) console.warn(`Overwriting successor for action '${action}'`);
    this.successors.set(action, node); return node;
  }
  async prep(shared: S): Promise<any> { return undefined; }
  async exec(prepRes: any): Promise<any> { return undefined; }
  async post(shared: S, prepRes: any, execRes: any): Promise<Action | undefined> { return undefined; }
  async _exec(prepRes: any): Promise<any> { return await this.exec(prepRes); }
  async _run(shared: S): Promise<Action | undefined> {
    const p = await this.prep(shared), e = await this._exec(p); return await this.post(shared, p, e);
  }
  async run(shared: S): Promise<Action | undefined> {
    if (this.successors.size > 0) console.warn("Node won't run successors. Use Flow.");
    return await this._run(shared);
  }
}
class AsyncNode<S = any, P = any> extends BaseNode<S, P> {
  maxRetries: number; wait: number; currentRetry: number = 0;
  constructor(maxRetries: number = 1, wait: number = 0) {
    super(); this.maxRetries = maxRetries; this.wait = wait;
  }
  async execFallback(prepRes: any, error: Error): Promise<any> { throw error; }
  async _exec(prepRes: any): Promise<any> {
    for (this.currentRetry = 0; this.currentRetry < this.maxRetries; this.currentRetry++) {
      try { return await this.exec(prepRes); } 
      catch (e) {
        if (this.currentRetry === this.maxRetries - 1) return await this.execFallback(prepRes, e as Error);
        if (this.wait > 0) await new Promise(resolve => setTimeout(resolve, this.wait * 1000));
      }
    }
    return undefined;
  }
}
class BatchNode<S = any, P = any> extends AsyncNode<S, P> {
  async _exec(items: any[]): Promise<any[]> {
    if (!items || !Array.isArray(items)) return [];
    const results = []; for (const item of items) results.push(await super._exec(item)); return results;
  }
}
class ParallelBatchNode<S = any, P = any> extends AsyncNode<S, P> {
  async _exec(items: any[]): Promise<any[]> {
    if (!items || !Array.isArray(items)) return [];
    return Promise.all(items.map(item => super._exec(item)));
  }
}
class Flow<S = any, P = any> extends BaseNode<S, P> {
  start: BaseNode<any, any>;
  constructor(start: BaseNode<any, any>) { super(); this.start = start; }
  getNextNode(current: BaseNode<any, any>, action?: Action): BaseNode<any, any> | undefined {
    const nextAction = action || "default", next = current.successors.get(nextAction);
    if (!next && current.successors.size > 0)
      console.warn(`Flow ends: '${nextAction}' not found in [${Array.from(current.successors.keys())}]`);
    return next;
  }
  async _orchestrate(shared: S, params?: P): Promise<void> {
    let current: BaseNode<any, any> | undefined = this.cloneNode(this.start);
    const p = params || this.params;
    while (current) {
      current.setParams(p); const action = await current._run(shared);
      current = this.getNextNode(current, action); if (current) current = this.cloneNode(current);
    }
  }
  async _run(shared: S): Promise<Action | undefined> {
    const pr = await this.prep(shared);
    await this._orchestrate(shared);
    return await this.post(shared, pr, undefined);
  }
  async exec(prepRes: any): Promise<any> { throw new Error("Flow can't exec."); }
  private cloneNode(node: BaseNode<any, any>): BaseNode<any, any> {
    const clonedNode = Object.create(Object.getPrototypeOf(node));
    Object.assign(clonedNode, node);
    clonedNode.params = { ...node.params }; clonedNode.successors = new Map(node.successors);
    return clonedNode;
  }
}
class BatchFlow<S = any, P = any> extends Flow<S, P> {
  async _run(shared: S): Promise<Action | undefined> {
    const batchParams = await this.prep(shared) as P[] || [];
    for (const bp of batchParams) {
      const mergedParams = { ...this.params, ...bp } as P;
      await this._orchestrate(shared, mergedParams);
    }
    return await this.post(shared, batchParams, undefined);
  }
}
class ParallelBatchFlow<S = any, P = any> extends Flow<S, P> {
  async _run(shared: S): Promise<Action | undefined> {
    const batchParams = await this.prep(shared) as P[] || [];
    await Promise.all(batchParams.map(bp => {
      const mergedParams = { ...this.params, ...bp } as P;
      return this._orchestrate(shared, mergedParams);
    }));
    return await this.post(shared, batchParams, undefined);
  }
}
export { BaseNode, AsyncNode, BatchNode, ParallelBatchNode, Flow, BatchFlow, ParallelBatchFlow };