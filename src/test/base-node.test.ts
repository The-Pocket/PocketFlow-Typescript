import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { BaseNode } from '../'

// Create a concrete implementation of BaseNode for testing
class TestNode extends BaseNode<any> {
  async run(shared: any, params?: any, lastFlowResult?: any): Promise<any> {
    return 'test-result'
  }
}

describe('BaseNode', () => {
  test('setParams should set params correctly', async () => {
    const node = new TestNode()
    const params = { test: 'value' }

    node.setParams(params)
    assert.deepStrictEqual(node.params, params)
  })

  test('next should set default successor', async () => {
    const node1 = new TestNode()
    const node2 = new TestNode()

    node1.next(node2)
    assert.strictEqual(node1.successors['default'], node2)
  })

  test('on() should set conditional successor', async () => {
    const node1 = new TestNode()
    const node2 = new TestNode()

    node1.on('condition', node2)
    assert.strictEqual(node1.successors['condition'], node2)
  })

  test('getNextNode should return correct successor', async () => {
    const node1 = new TestNode()
    const node2 = new TestNode()
    const node3 = new TestNode()

    node1.next(node2)
    node1.on('special', node3)

    assert.strictEqual(node1.getNextNode(), node2)
    assert.strictEqual(node1.getNextNode('special'), node3)
    assert.strictEqual(node1.getNextNode('nonexistent'), null)
  })

  test('clone should create a deep copy', async () => {
    const node1 = new TestNode()
    const node2 = new TestNode()

    node1.next(node2)
    node1.setParams({ test: 'value' })

    const clone = node1.clone()

    assert.notStrictEqual(clone, node1)
    assert.deepStrictEqual(clone.successors, node1.successors)
    assert.deepStrictEqual(clone.params, node1.params)
  })
})
