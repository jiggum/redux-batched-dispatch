import { createStore, applyMiddleware } from 'redux'
import $$observable from 'symbol-observable'
import thunk from 'redux-thunk'

import { addTodo, unknownActions } from './helpers/actionCreators'
import * as reducers from './helpers/reducers'
import mockFetch from './helpers/mockFetch'

import reduxBatchedDispatch from '../src'

describe('reduxBatchedDispatch', () => {
  it('dispatch with batched actions', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
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
      const store = createStore(reducers.todos, reduxBatchedDispatch())
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

  describe('subscribe', () => {
    it('liteners must call once when dispatch batched actions', () => {
      const store = createStore(reducers.todos, reduxBatchedDispatch())
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
      const store = createStore(reducers.todos, reduxBatchedDispatch())
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

  describe('redux-thunk', () => {
    it('dispatch batched actions before thunk', async () => {
      const store = createStore(
        reducers.todos,
        reduxBatchedDispatch(applyMiddleware(thunk)),
      )

      const thunkAction = dispatch => {
        dispatch(addTodo('Hello'))
        return mockFetch({ response: 'Actions' }).then(
          response => dispatch(addTodo(response)),
          error => dispatch(addTodo(error)),
        )
      }

      expect(store.getState()).toEqual([])
      const [thunkPromise] = store.dispatch([thunkAction, addTodo('Batched')])
      expect(store.getState()).toEqual([
        {
          id: 1,
          text: 'Hello',
        },
        {
          id: 2,
          text: 'Batched',
        },
      ])
      await thunkPromise
      expect(store.getState()).toEqual([
        {
          id: 1,
          text: 'Hello',
        },
        {
          id: 2,
          text: 'Batched',
        },
        {
          id: 3,
          text: 'Actions',
        },
      ])
    })

    it('dispatch batched actions after thunk', async () => {
      const store = createStore(
        reducers.todos,
        reduxBatchedDispatch(applyMiddleware(thunk)),
      )

      const thunkAction = dispatch => {
        return mockFetch({ response: ['Hello', 'World'] }).then(
          response => dispatch(response.map(todo => addTodo(todo))),
          error => dispatch(addTodo(error)),
        )
      }

      expect(store.getState()).toEqual([])
      await store.dispatch(thunkAction)
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
  })
})
