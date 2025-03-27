type Action = string
type Params = Record<string, any>
type Successors = Record<Action, BaseNode>

const DEFAULT_ACTION = 'default'

export class BaseNode {
  params: Params = {}
  successors: Successors = {}
  curRetry = 0

  setParams(params: Params): this {
    this.params = params
    return this
  }

  next(node: BaseNode, action: Action = DEFAULT_ACTION): BaseNode {
    if (action in this.successors) {
      console.warn(`Overwriting successor for action '${action}'`)
    }
    this.successors[action] = node
    return node
  }

  on(action: string): ConditionalTransition {
    if (typeof action !== 'string') {
      throw new TypeError('Action must be a string')
    }

    return new ConditionalTransition(this, action)
  }

  prep(shared: any): any {}
  exec(prepRes: any): any {}
  post(shared: any, prepRes: any, execRes: any): Action | void {}

  protected _exec(prepRes: any): any {
    return this.exec(prepRes)
  }

  _run(shared: any): any {
    const p = this.prep(shared)
    const e = this._exec(p)
    return this.post(shared, p, e)
  }

  run(shared: any): any {
    if (Object.keys(this.successors).length > 0) {
      console.warn("Node won't run successors. Use Flow.")
    }
    return this._run(shared)
  }
}

class ConditionalTransition {
  constructor(
    private src: BaseNode,
    private action: string,
  ) {}

  next(tgt: BaseNode): BaseNode {
    return this.src.next(tgt, this.action)
  }
}

export class Node extends BaseNode {
  constructor(
    public maxRetries = 1,
    public wait = 0,
  ) {
    super()
  }

  execFallback(prepRes: any, exc: Error): any {
    throw exc
  }

  protected _exec(prepRes: any): any {
    for (this.curRetry = 0; this.curRetry < this.maxRetries; this.curRetry++) {
      try {
        return this.exec(prepRes)
      } catch (e) {
        if (this.curRetry === this.maxRetries - 1) {
          return this.execFallback(prepRes, e as Error)
        }
        if (this.wait > 0) {
          // Sleep synchronously - in real TypeScript this would be handled differently
          // but we're matching the Python behavior
          const start = new Date().getTime()
          while (new Date().getTime() - start < this.wait * 1000) {
            // Empty block for synchronous wait
          }
        }
      }
    }
    // This should never be reached, but TypeScript requires a return value
    return null
  }
}

export class BatchNode extends Node {
  protected _exec(items: any[]): any[] {
    return (items || []).map((i) => super._exec(i))
  }
}

export class Flow extends BaseNode {
  constructor(public start: BaseNode) {
    super()
  }

  getNextNode(curr: BaseNode, action?: Action): BaseNode | null {
    const next = curr.successors[action || DEFAULT_ACTION]
    if (!next && Object.keys(curr.successors).length > 0) {
      console.warn(`Flow ends: '${action}' not found in ${Object.keys(curr.successors)}`)
    }
    return next || null
  }

  protected _orch(shared: any, params?: Params): any {
    let curr: BaseNode | null = this.start
    let p = { ...this.params, ...(params || {}) }
    let lastResult: any

    while (curr) {
      // Properly clone node while preserving methods
      const node = Object.create(Object.getPrototypeOf(curr))
      Object.assign(node, curr)
      node.params = { ...curr.params }
      node.successors = { ...curr.successors }

      node.setParams(p)
      lastResult = node._run(shared)
      curr = this.getNextNode(curr, lastResult)
    }

    return lastResult
  }

  _run(shared: any): any {
    const pr = this.prep(shared)
    const result = this._orch(shared)
    return this.post(shared, pr, result)
  }

  exec(prepRes: any): never {
    throw new Error("Flow can't exec.")
  }
}

export class BatchFlow extends Flow {
  _run(shared: any): any {
    const pr = this.prep(shared) || []
    let result = null
    for (const bp of pr) {
      result = this._orch(shared, { ...this.params, ...bp })
    }
    return this.post(shared, pr, result)
  }
}

// Async variants
export class AsyncNode extends Node {
  prep(shared: any): never {
    throw new Error('Use prepAsync.')
  }
  exec(prepRes: any): never {
    throw new Error('Use execAsync.')
  }
  post(shared: any, prepRes: any, execRes: any): never {
    throw new Error('Use postAsync.')
  }
  execFallback(prepRes: any, exc: Error): never {
    throw new Error('Use execFallbackAsync.')
  }
  _run(shared: any): never {
    throw new Error('Use runAsync.')
  }

  async prepAsync(shared: any): Promise<any> {}
  async execAsync(prepRes: any): Promise<any> {}
  async execFallbackAsync(prepRes: any, exc: Error): Promise<any> {
    throw exc
  }
  async postAsync(shared: any, prepRes: any, execRes: any): Promise<any> {}

  protected async _exec(prepRes: any): Promise<any> {
    for (this.curRetry = 0; this.curRetry < this.maxRetries; this.curRetry++) {
      try {
        return await this.execAsync(prepRes)
      } catch (e) {
        if (this.curRetry === this.maxRetries - 1) {
          return await this.execFallbackAsync(prepRes, e as Error)
        }
        if (this.wait > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.wait * 1000))
        }
      }
    }
    // This should never be reached, but TypeScript requires a return value
    return null
  }

  async runAsync(shared: any): Promise<any> {
    if (Object.keys(this.successors).length > 0) {
      console.warn("Node won't run successors. Use AsyncFlow.")
    }
    return this._runAsync(shared)
  }

  async _runAsync(shared: any): Promise<any> {
    const p = await this.prepAsync(shared)
    const e = await this._exec(p)
    return this.postAsync(shared, p, e)
  }
}

// In TypeScript, we can't directly inherit from multiple classes like in Python
// So we implement the BatchNode functionality in AsyncBatchNode
export class AsyncBatchNode extends AsyncNode {
  async prepAsync(shared: any): Promise<any[]> {
    return super.prepAsync(shared)
  }

  async postAsync(shared: any, prepRes: any, execRes: any): Promise<any> {
    return super.postAsync(shared, prepRes, execRes)
  }

  protected async _exec(items: any[]): Promise<any[]> {
    // Process items sequentially like BatchNode but with async handling
    if (!items || !items.length) return []

    // Apply retry logic to each item individually
    const results: any[] = []
    for (const item of items) {
      // Use super._exec to apply retry logic from AsyncNode
      results.push(await super._exec(item))
    }
    return results
  }
}

export class AsyncParallelBatchNode extends AsyncNode {
  async prepAsync(shared: any): Promise<any[]> {
    return super.prepAsync(shared)
  }

  async postAsync(shared: any, prepRes: any, execRes: any): Promise<any> {
    return super.postAsync(shared, prepRes, execRes)
  }

  protected async _exec(items: any[]): Promise<any[]> {
    // Process all items in parallel using Promise.all
    // This is equivalent to asyncio.gather in Python
    if (!items || !items.length) return []

    // Map each item to a promise that applies retry logic
    const promises = (items || []).map((i) => super._exec(i))

    // Promise.all will reject if any promise rejects
    return await Promise.all(promises)
  }
}

export class AsyncFlow extends Flow {
  prep(shared: any): never {
    throw new Error('Use prepAsync.')
  }
  exec(prepRes: any): never {
    throw new Error("Flow can't exec.")
  }
  post(shared: any, prepRes: any, execRes: any): never {
    throw new Error('Use postAsync.')
  }
  _run(shared: any): never {
    throw new Error('Use runAsync.')
  }

  execFallback(prepRes: any, exc: Error): never {
    throw new Error('Use execFallbackAsync.')
  }

  async execAsync(prepRes: any): Promise<any> {
    throw new Error("AsyncFlow can't execAsync.")
  }

  async execFallbackAsync(prepRes: any, exc: Error): Promise<any> {
    throw exc
  }

  async runAsync(shared: any): Promise<any> {
    if (Object.keys(this.successors).length > 0) {
      console.warn("AsyncFlow won't run successors.")
    }
    return this._runAsync(shared)
  }
  async prepAsync(shared: any): Promise<any> {}
  async postAsync(shared: any, prepRes: any, execRes: any): Promise<any> {}
  protected async _orchAsync(shared: any, params?: Params): Promise<any> {
    let curr: BaseNode | null = this.start
    let p = { ...this.params, ...(params || {}) }
    let lastResult: any

    while (curr) {
      // Properly clone node while preserving methods
      const node = Object.create(Object.getPrototypeOf(curr))
      Object.assign(node, curr)
      node.params = { ...curr.params }
      node.successors = { ...curr.successors }

      node.setParams(p)
      lastResult = node instanceof AsyncNode ? await node._runAsync(shared) : node._run(shared)
      curr = this.getNextNode(curr, lastResult)
    }

    return lastResult
  }

  protected async _runAsync(shared: any): Promise<any> {
    const p = await this.prepAsync(shared)
    await this._orchAsync(shared)
    return await this.postAsync(shared, p, null)
  }
}

export class AsyncBatchFlow extends AsyncFlow {
  async prepAsync(shared: any): Promise<any> {}
  async postAsync(shared: any, prepRes: any, execRes: any): Promise<any> {}
  protected async _runAsync(shared: any): Promise<any> {
    const pr = (await this.prepAsync(shared)) || []
    let result = null
    for (const bp of pr) {
      result = await this._orchAsync(shared, { ...this.params, ...bp })
    }
    return await this.postAsync(shared, pr, result)
  }
}

export class AsyncParallelBatchFlow extends AsyncFlow {
  async prepAsync(shared: any): Promise<any[]> {
    return []
  }

  async postAsync(shared: any, prepRes: any, execRes: any): Promise<any> {}

  protected async _runAsync(shared: any): Promise<any> {
    const pr = (await this.prepAsync(shared)) || []

    // Process all batch items in parallel
    const results = await Promise.all(
      pr.map((bp: any) => this._orchAsync(shared, { ...this.params, ...bp })),
    )

    // Use the last result if available
    const lastResult = results.length > 0 ? results[results.length - 1] : null
    return await this.postAsync(shared, pr, lastResult)
  }
}
