import { createStore } from 'redux'
import $$observable from 'symbol-observable'

import * as reducers from './helpers/reducers'
import { addTodo, unknownActions } from './helpers/actionCreators'

import { createBatchEnhancer } from '../src'

describe('batchActionEnhancer', () => {
  it('dispatch with batched actions', () => {
    const store = createStore(reducers.todos, createBatchEnhancer())
    expect(store.getState()).toEqual([])

    store.dispatch([addTodo('Hello'), addTodo('World')])
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello',
      },
      {
        id: 2,
        text: 'World',
      },
    ])
  })

  describe('subscribe', () => {
    it('liteners must call once when dispatch batched actions', () => {
      const store = createStore(reducers.todos, createBatchEnhancer())
      const listenerA = jest.fn()
      const listenerB = jest.fn()

      store.subscribe(listenerA)
      store.dispatch(unknownActions())
      expect(listenerA.mock.calls.length).toBe(1)
      expect(listenerB.mock.calls.length).toBe(0)

      store.subscribe(listenerB)
      store.dispatch(unknownActions())
      expect(listenerA.mock.calls.length).toBe(2)
      expect(listenerB.mock.calls.length).toBe(1)
    })
  })

  describe('Symbol.observable', () => {
    it('liteners must call once when dispatch batched actions', () => {
      const store = createStore(reducers.todos, createBatchEnhancer())
      const observable = store[$$observable]()
      const listenerA = jest.fn()
      const listenerB = jest.fn()

      expect(listenerA.mock.calls.length).toBe(0)
      observable.subscribe({ next: listenerA })
      expect(listenerA.mock.calls.length).toBe(1)
      store.dispatch(unknownActions())
      expect(listenerA.mock.calls.length).toBe(2)
      expect(listenerB.mock.calls.length).toBe(0)

      observable.subscribe({ next: listenerB })
      expect(listenerB.mock.calls.length).toBe(1)
      store.dispatch(unknownActions())
      expect(listenerA.mock.calls.length).toBe(3)
      expect(listenerB.mock.calls.length).toBe(2)
    })
  })
})
