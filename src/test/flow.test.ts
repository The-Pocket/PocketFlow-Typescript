import assert from 'node:assert'
import { describe, test } from 'node:test'
import { Flow, Node } from '../'

// Test implementation of Node for Flow testing
class TestNode extends Node<any> {
  constructor(private readonly returnValue: any = null) {
    super()
  }

  async _prep(shared: any): Promise<any> {
    return shared
  }

  async _exec(prepRes: any): Promise<any> {
    return this.returnValue
  }

  async _post(shared: any, prepRes: any, execRes: any): Promise<any> {
    return execRes
  }
}

describe('Flow', async () => {
  test('should execute nodes in sequence', async () => {
    const flow = new Flow()
    const node1 = new TestNode()
    const node2 = new TestNode()
    const node3 = new TestNode('result3')

    flow.next(node1)
    node1.next(node2)
    node2.next(node3)

    const result = await flow.run({})
    assert.strictEqual(result, 'result3')
  })

  test('should handle conditional branching', async () => {
    const flow = new Flow()
    const node1 = new TestNode('branch-a')
    const node2 = new TestNode('result-b')
    const node3 = new TestNode('result-a')

    flow.next(node1)
    node1.on('branch-a', node3)
    node1.on('branch-b', node2)

    const result = await flow.run({})
    assert.strictEqual(result, 'result-a')
  })

  test('should throw error when no next node found', async () => {
    const flow = new Flow()

    await assert.rejects(
      async () => {
        await flow.run({})
      },
      { message: 'Flow ends: no next node found' },
    )
  })

  test('should pass params through the flow', async () => {
    const flow = new Flow()
    const captured: any = {}

    class ParamTestNode extends Node<any> {
      async _prep(shared: any): Promise<any> {
        captured.params = this.params
        return shared
      }

      async _exec(prepRes: any): Promise<any> {
        return 'next'
      }

      async _post(shared: any, prepRes: any, execRes: any): Promise<any> {
        return execRes
      }
    }

    const node = new ParamTestNode()
    flow.next(node)

    const testParams = { test: 'value' }
    await flow.run({}, testParams)

    assert.deepStrictEqual(captured.params, testParams)
  })
})
