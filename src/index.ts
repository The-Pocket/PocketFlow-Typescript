type NonIterableObject = Record<string, unknown> & { [Symbol.iterator]?: never }
type Action = string;
class BaseNode<S = unknown, P extends NonIterableObject = NonIterableObject> {
  params: P = {} as P; successors: Map<Action, BaseNode> = new Map();
  setParams(params: P): this { this.params = params; return this; }
  next(node: BaseNode, action: Action = "default"): BaseNode {
    if (this.successors.has(action)) console.warn(`Overwriting successor for action '${action}'`);
    this.successors.set(action, node); return node;
  }
  async prep(shared: S): Promise<unknown> { return undefined; }
  async exec(prepRes: unknown): Promise<unknown> { return undefined; }
  async post(shared: S, prepRes: unknown, execRes: unknown): Promise<Action | undefined> { return undefined; }
  async _exec(prepRes: unknown): Promise<unknown> { return await this.exec(prepRes); }
  async _run(shared: S): Promise<Action | undefined> {
    const p = await this.prep(shared), e = await this._exec(p); return await this.post(shared, p, e);
  }
  async run(shared: S): Promise<Action | undefined> {
    if (this.successors.size > 0) console.warn("Node won't run successors. Use Flow.");
    return await this._run(shared);
  }
}
class Node<S = unknown, P extends NonIterableObject = NonIterableObject> extends BaseNode<S, P> {
  maxRetries: number; wait: number; currentRetry: number = 0;
  constructor(maxRetries: number = 1, wait: number = 0) {
    super(); this.maxRetries = maxRetries; this.wait = wait;
  }
  async execFallback(prepRes: unknown, error: Error): Promise<unknown> { throw error; }
  async _exec(prepRes: unknown): Promise<unknown> {
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
class BatchNode<S = unknown, P extends NonIterableObject = NonIterableObject> extends Node<S, P> {
  async _exec(items: unknown[]): Promise<unknown[]> {
    if (!items || !Array.isArray(items)) return [];
    const results = []; for (const item of items) results.push(await super._exec(item)); return results;
  }
}
class ParallelBatchNode<
  S = unknown,
  P extends NonIterableObject = NonIterableObject
> extends Node<S, P> {
  async _exec(items: unknown[]): Promise<unknown[]> {
    if (!items || !Array.isArray(items)) return []
    return Promise.all(items.map((item) => super._exec(item)))
  }
}
class Flow<S = unknown, P extends NonIterableObject = NonIterableObject> extends BaseNode<S, P> {
  start: BaseNode;
  constructor(start: BaseNode) { super(); this.start = start; }
  getNextNode(current: BaseNode, action?: Action): BaseNode | undefined {
    const nextAction = action || "default", next = current.successors.get(nextAction);
    if (!next && current.successors.size > 0)
      console.warn(`Flow ends: '${nextAction}' not found in [${Array.from(current.successors.keys())}]`);
    return next;
  }
  async _orchestrate(shared: S, params?: P): Promise<void> {
    let current: BaseNode | undefined = this.cloneNode(this.start);
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
  async exec(prepRes: unknown): Promise<unknown> { throw new Error("Flow can't exec."); }
  private cloneNode(node: BaseNode): BaseNode {
    const clonedNode = Object.create(Object.getPrototypeOf(node));
    Object.assign(clonedNode, node);
    clonedNode.params = { ...node.params }; clonedNode.successors = new Map(node.successors);
    return clonedNode;
  }
}
class BatchFlow<S = unknown, P extends NonIterableObject = NonIterableObject, NP extends NonIterableObject[] = NonIterableObject[]> extends Flow<S, P> {
  async prep(shared: S): Promise<NP> { const empty: readonly NonIterableObject[] = []; return empty as NP; }
  async _run(shared: S): Promise<Action | undefined> {
    const batchParams = await this.prep(shared);
    for (const bp of batchParams) {
      const mergedParams = { ...this.params, ...bp };
      await this._orchestrate(shared, mergedParams);
    }
    return await this.post(shared, batchParams, undefined);
  }
}
class ParallelBatchFlow<S = unknown, P extends NonIterableObject = NonIterableObject, NP extends NonIterableObject[] = NonIterableObject[]> extends BatchFlow<S, P, NP> {
  async _run(shared: S): Promise<Action | undefined> {
    const batchParams = await this.prep(shared) as NP || [];
    await Promise.all(batchParams.map(bp => {
      const mergedParams = { ...this.params, ...bp } as P;
      return this._orchestrate(shared, mergedParams);
    }));
    return await this.post(shared, batchParams, undefined);
  }
}
export { BaseNode, Node, BatchNode, ParallelBatchNode, Flow, BatchFlow, ParallelBatchFlow };