import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { BatchNode, Node, ParallelBatchNode } from '../'

// Test implementation of Node
class TestNode extends Node<any> {
  async _prep(shared: any): Promise<any> {
    return shared
  }

  async _exec(prepRes: any): Promise<any> {
    if (prepRes.shouldFail) {
      throw new Error('Test error')
    }
    return prepRes.value
  }

  async _post(shared: any, prepRes: any, execRes: any): Promise<any> {
    return execRes
  }
}

// Test implementation of BatchNode
class TestBatchNode extends BatchNode<any> {
  async _prep(shared: any): Promise<any[]> {
    return shared.items
  }

  async _exec(item: any): Promise<any> {
    return item * 2
  }

  async _post(shared: any, prepRes: any, execRes: any): Promise<any> {
    return execRes
  }
}

// Test implementation of ParallelBatchNode
class TestParallelBatchNode extends ParallelBatchNode<any> {
  async _prep(shared: any): Promise<any[]> {
    return shared.items
  }

  async _exec(item: any): Promise<any> {
    return item * 2
  }

  async _post(shared: any, prepRes: any, execRes: any): Promise<any> {
    return execRes
  }
}

describe('Node', () => {
  test('should execute successfully', async () => {
    const node = new TestNode()
    const result = await node.run({ value: 42 })
    assert.strictEqual(result, 42)
  })

  test('should retry on failure', async () => {
    const node = new TestNode(3, 0.1)
    let attempts = 0

    node._exec = async (prepRes: any) => {
      attempts++
      if (attempts < 3) {
        throw new Error('Test error')
      }
      return 'success'
    }

    const result = await node.run({})
    assert.strictEqual(result, 'success')
    assert.strictEqual(attempts, 3)
  })

  test('should fail after max retries', async () => {
    const node = new TestNode(2)
    await assert.rejects(
      async () => {
        await node.run({ shouldFail: true })
      },
      { message: 'Test error' },
    )
  })
})

describe('BatchNode', () => {
  test('should process items sequentially', async () => {
    const node = new TestBatchNode()
    const result = await node.run({ items: [1, 2, 3] })
    assert.deepStrictEqual(result, [2, 4, 6])
  })
})

describe('ParallelBatchNode', () => {
  test('should process items in parallel', async () => {
    const node = new TestParallelBatchNode()
    const result = await node.run({ items: [1, 2, 3] })
    assert.deepStrictEqual(result, [2, 4, 6])
  })

  test('should handle mixed success and failures', async () => {
    const node = new TestParallelBatchNode()
    node._exec = async (item: any) => {
      if (item === 2) {
        throw new Error('Test error')
      }
      return item * 2
    }

    await assert.rejects(
      async () => {
        await node.run({ items: [1, 2, 3] })
      },
      { message: 'Test error' },
    )
  })
})
