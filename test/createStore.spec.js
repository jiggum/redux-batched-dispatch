// Extended from https://github.com/reduxjs/redux/blob/a58aa4eba546429c3e48dedc2368e4c1083b5ca4/src/createStore.js

import { createStore, combineReducers } from 'redux'
import { from } from 'rxjs'
import { map } from 'rxjs/operators'
import $$observable from 'symbol-observable'

import {
  addTodo,
  dispatchInMiddle,
  getStateInMiddle,
  subscribeInMiddle,
  unsubscribeInMiddle,
  throwError,
  unknownAction,
  unknownActions,
} from './helpers/actionCreators'
import * as reducers from './helpers/reducers'

import reduxBatchedDispatch from '../src'

describe('createStore', () => {
  it('exposes the public API', () => {
    const store = createStore(combineReducers(reducers), reduxBatchedDispatch())
    const methods = Object.keys(store)

    expect(methods.length).toBe(5)
    expect(methods).toContain('subscribe')
    expect(methods).toContain('dispatch')
    expect(methods).toContain('getState')
    expect(methods).toContain('replaceReducer')
    expect(methods).toContain('clearActionQueue')
  })

  it('passes the initial state', () => {
    const store = createStore(
      reducers.todos,
      [
        {
          id: 1,
          text: 'Hello',
        },
      ],
      reduxBatchedDispatch(),
    )
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello',
      },
    ])
  })

  it('applies the reducer to the previous state', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    expect(store.getState()).toEqual([])

    store.dispatch(unknownAction())
    expect(store.getState()).toEqual([])

    store.dispatch(addTodo('Hello'))
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello',
      },
    ])

    store.dispatch(addTodo('World'))
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

  it('applies the reducer to the initial state', () => {
    const store = createStore(
      reducers.todos,
      [
        {
          id: 1,
          text: 'Hello',
        },
      ],
      reduxBatchedDispatch(),
    )
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello',
      },
    ])

    store.dispatch(unknownAction())
    expect(store.getState()).toEqual([
      {
        id: 1,
        text: 'Hello',
      },
    ])

    store.dispatch(addTodo('World'))
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

  it('preserves the state when replacing a reducer', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    store.dispatch(addTodo('Hello'))
    store.dispatch(addTodo('World'))
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

    store.replaceReducer(reducers.todosReverse)
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

    store.dispatch(addTodo('Perhaps'))
    expect(store.getState()).toEqual([
      {
        id: 3,
        text: 'Perhaps',
      },
      {
        id: 1,
        text: 'Hello',
      },
      {
        id: 2,
        text: 'World',
      },
    ])

    store.replaceReducer(reducers.todos)
    expect(store.getState()).toEqual([
      {
        id: 3,
        text: 'Perhaps',
      },
      {
        id: 1,
        text: 'Hello',
      },
      {
        id: 2,
        text: 'World',
      },
    ])

    store.dispatch(addTodo('Surely'))
    expect(store.getState()).toEqual([
      {
        id: 3,
        text: 'Perhaps',
      },
      {
        id: 1,
        text: 'Hello',
      },
      {
        id: 2,
        text: 'World',
      },
      {
        id: 4,
        text: 'Surely',
      },
    ])
  })

  it('supports multiple subscriptions', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    const listenerA = jest.fn()
    const listenerB = jest.fn()

    const unsubscribeA = store.subscribe(listenerA)
    store.dispatch(unknownAction())
    expect(listenerA.mock.calls.length).toBe(1)
    expect(listenerB.mock.calls.length).toBe(0)

    store.dispatch(unknownAction())
    expect(listenerA.mock.calls.length).toBe(2)
    expect(listenerB.mock.calls.length).toBe(0)

    const unsubscribeB = store.subscribe(listenerB)
    expect(listenerA.mock.calls.length).toBe(2)
    expect(listenerB.mock.calls.length).toBe(0)

    store.dispatch(unknownAction())
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(1)

    unsubscribeA()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(1)

    store.dispatch(unknownAction())
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    unsubscribeB()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    store.dispatch(unknownAction())
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    store.subscribe(listenerA)
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    store.dispatch(unknownAction())
    expect(listenerA.mock.calls.length).toBe(4)
    expect(listenerB.mock.calls.length).toBe(2)
  })

  it('only removes listener once when unsubscribe is called', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    const listenerA = jest.fn()
    const listenerB = jest.fn()

    const unsubscribeA = store.subscribe(listenerA)
    store.subscribe(listenerB)

    unsubscribeA()
    unsubscribeA()

    store.dispatch(unknownAction())
    expect(listenerA.mock.calls.length).toBe(0)
    expect(listenerB.mock.calls.length).toBe(1)
  })

  it('only removes relevant listener when unsubscribe is called', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    const listener = jest.fn()

    store.subscribe(listener)
    const unsubscribeSecond = store.subscribe(listener)

    unsubscribeSecond()
    unsubscribeSecond()

    store.dispatch(unknownAction())
    expect(listener.mock.calls.length).toBe(1)
  })

  it('supports removing a subscription within a subscription', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    const listenerA = jest.fn()
    const listenerB = jest.fn()
    const listenerC = jest.fn()

    store.subscribe(listenerA)
    const unSubB = store.subscribe(() => {
      listenerB()
      unSubB()
    })
    store.subscribe(listenerC)

    store.dispatch(unknownAction())
    store.dispatch(unknownAction())

    expect(listenerA.mock.calls.length).toBe(2)
    expect(listenerB.mock.calls.length).toBe(1)
    expect(listenerC.mock.calls.length).toBe(2)
  })

  it('notifies all subscribers about current dispatch regardless if any of them gets unsubscribed in the process', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())

    const unsubscribeHandles = []
    const doUnsubscribeAll = () => unsubscribeHandles.forEach(unsubscribe => unsubscribe())

    const listener1 = jest.fn()
    const listener2 = jest.fn()
    const listener3 = jest.fn()

    unsubscribeHandles.push(store.subscribe(() => listener1()))
    unsubscribeHandles.push(
      store.subscribe(() => {
        listener2()
        doUnsubscribeAll()
      }),
    )
    unsubscribeHandles.push(store.subscribe(() => listener3()))

    store.dispatch(unknownAction())
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(1)
    expect(listener3.mock.calls.length).toBe(1)

    store.dispatch(unknownAction())
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(1)
    expect(listener3.mock.calls.length).toBe(1)
  })

  it('notifies only subscribers active at the moment of current dispatch', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())

    const listener1 = jest.fn()
    const listener2 = jest.fn()
    const listener3 = jest.fn()

    let listener3Added = false
    const maybeAddThirdListener = () => {
      if (!listener3Added) {
        listener3Added = true
        store.subscribe(() => listener3())
      }
    }

    store.subscribe(() => listener1())
    store.subscribe(() => {
      listener2()
      maybeAddThirdListener()
    })

    store.dispatch(unknownAction())
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(1)
    expect(listener3.mock.calls.length).toBe(0)

    store.dispatch(unknownAction())
    expect(listener1.mock.calls.length).toBe(2)
    expect(listener2.mock.calls.length).toBe(2)
    expect(listener3.mock.calls.length).toBe(1)
  })

  it('uses the last snapshot of subscribers during nested dispatch', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())

    const listener1 = jest.fn()
    const listener2 = jest.fn()
    const listener3 = jest.fn()
    const listener4 = jest.fn()

    let unsubscribe4
    const unsubscribe1 = store.subscribe(() => {
      listener1()
      expect(listener1.mock.calls.length).toBe(1)
      expect(listener2.mock.calls.length).toBe(0)
      expect(listener3.mock.calls.length).toBe(0)
      expect(listener4.mock.calls.length).toBe(0)

      unsubscribe1()
      unsubscribe4 = store.subscribe(listener4)
      store.dispatch(unknownAction())

      expect(listener1.mock.calls.length).toBe(1)
      expect(listener2.mock.calls.length).toBe(1)
      expect(listener3.mock.calls.length).toBe(1)
      expect(listener4.mock.calls.length).toBe(1)
    })
    store.subscribe(listener2)
    store.subscribe(listener3)

    store.dispatch(unknownAction())
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(2)
    expect(listener3.mock.calls.length).toBe(2)
    expect(listener4.mock.calls.length).toBe(1)

    unsubscribe4()
    store.dispatch(unknownAction())
    expect(listener1.mock.calls.length).toBe(1)
    expect(listener2.mock.calls.length).toBe(3)
    expect(listener3.mock.calls.length).toBe(3)
    expect(listener4.mock.calls.length).toBe(1)
  })

  it('provides an up-to-date state when a subscriber is notified', done => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    store.subscribe(() => {
      expect(store.getState()).toEqual([
        {
          id: 1,
          text: 'Hello',
        },
      ])
      done()
    })
    store.dispatch(addTodo('Hello'))
  })

  it('does not leak private listeners array', done => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    store.subscribe(() => {
      expect(this).toBe(undefined)
      done()
    })
    store.dispatch(addTodo('Hello'))
  })

  it('only accepts plain object and array of actions', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    expect(() => store.dispatch(unknownAction())).not.toThrow()
    expect(() => store.dispatch(unknownActions())).not.toThrow()

    function AwesomeMap() {}

    const throwCandidates = [null, undefined, 42, 'hey', new AwesomeMap()]

    throwCandidates.forEach(nonObject => expect(() => store.dispatch(nonObject)).toThrow(/plain/))
  })

  it('handles nested dispatches gracefully', () => {
    function foo(state = 0, action) {
      return action.type === 'foo' ? 1 : state
    }

    function bar(state = 0, action) {
      return action.type === 'bar' ? 2 : state
    }

    const store = createStore(combineReducers({ foo, bar }), reduxBatchedDispatch())

    store.subscribe(function kindaComponentDidUpdate() {
      const state = store.getState()
      if (state.bar === 0) {
        store.dispatch({ type: 'bar' })
      }
    })

    store.dispatch({ type: 'foo' })
    expect(store.getState()).toEqual({
      foo: 1,
      bar: 2,
    })
  })

  it('does not allow dispatch() from within a reducer', () => {
    const store = createStore(reducers.dispatchInTheMiddleOfReducer, reduxBatchedDispatch())

    expect(() =>
      store.dispatch(dispatchInMiddle(store.dispatch.bind(store, unknownAction()))),
    ).toThrow(/may not dispatch/)
  })

  it('does not allow getState() from within a reducer', () => {
    const store = createStore(reducers.getStateInTheMiddleOfReducer, reduxBatchedDispatch())

    expect(() => store.dispatch(getStateInMiddle(store.getState.bind(store)))).toThrow(
      /You may not call store.getState()/,
    )
  })

  it('does not allow subscribe() from within a reducer', () => {
    const store = createStore(reducers.subscribeInTheMiddleOfReducer, reduxBatchedDispatch())

    expect(() => store.dispatch(subscribeInMiddle(store.subscribe.bind(store, () => {})))).toThrow(
      /You may not call store.subscribe()/,
    )
  })

  it('does not allow unsubscribe from subscribe() from within a reducer', () => {
    const store = createStore(reducers.unsubscribeInTheMiddleOfReducer, reduxBatchedDispatch())
    const unsubscribe = store.subscribe(() => {})

    expect(() => store.dispatch(unsubscribeInMiddle(unsubscribe.bind(store)))).toThrow(
      /You may not unsubscribe from a store/,
    )
  })

  it('recovers from an error within a reducer', () => {
    const store = createStore(reducers.errorThrowingReducer, reduxBatchedDispatch())
    expect(() => store.dispatch(throwError())).toThrow()

    expect(() => store.dispatch(unknownAction())).not.toThrow()
  })

  it('throws if action type is missing', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    expect(() => store.dispatch({})).toThrow(/Actions may not have an undefined "type" property/)
  })

  it('throws if action type is undefined', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    expect(() => store.dispatch({ type: undefined })).toThrow(
      /Actions may not have an undefined "type" property/,
    )
  })

  it('does not throw if action type is falsy', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())
    expect(() => store.dispatch({ type: false })).not.toThrow()
    expect(() => store.dispatch({ type: 0 })).not.toThrow()
    expect(() => store.dispatch({ type: null })).not.toThrow()
    expect(() => store.dispatch({ type: '' })).not.toThrow()
  })

  it('throws if listener is not a function', () => {
    const store = createStore(reducers.todos, reduxBatchedDispatch())

    expect(() => store.subscribe()).toThrow()

    expect(() => store.subscribe('')).toThrow()

    expect(() => store.subscribe(null)).toThrow()

    expect(() => store.subscribe(undefined)).toThrow()
  })

  describe('Symbol.observable interop point', () => {
    it('should exist', () => {
      const store = createStore(() => {}, reduxBatchedDispatch())
      expect(typeof store[$$observable]).toBe('function')
    })

    describe('returned value', () => {
      it('should be subscribable', () => {
        const store = createStore(() => {}, reduxBatchedDispatch())
        const obs = store[$$observable]()
        expect(typeof obs.subscribe).toBe('function')
      })

      it('should throw a TypeError if an observer object is not supplied to subscribe', () => {
        const store = createStore(() => {}, reduxBatchedDispatch())
        const obs = store[$$observable]()

        expect(() => {
          obs.subscribe()
        }).toThrowError(new TypeError('Expected the observer to be an object.'))

        expect(() => {
          obs.subscribe(null)
        }).toThrowError(new TypeError('Expected the observer to be an object.'))

        expect(() => {
          obs.subscribe(() => {})
        }).toThrowError(new TypeError('Expected the observer to be an object.'))

        expect(() => {
          obs.subscribe({})
        }).not.toThrow()
      })

      it('should return a subscription object when subscribed', () => {
        const store = createStore(() => {}, reduxBatchedDispatch())
        const obs = store[$$observable]()
        const sub = obs.subscribe({})
        expect(typeof sub.unsubscribe).toBe('function')
      })
    })

    it('should pass an integration test with no unsubscribe', () => {
      function foo(state = 0, action) {
        return action.type === 'foo' ? 1 : state
      }

      function bar(state = 0, action) {
        return action.type === 'bar' ? 2 : state
      }

      const store = createStore(combineReducers({ foo, bar }), reduxBatchedDispatch())
      const observable = store[$$observable]()
      const results = []

      observable.subscribe({
        next(state) {
          results.push(state)
        },
      })

      store.dispatch({ type: 'foo' })
      store.dispatch({ type: 'bar' })

      expect(results).toEqual([{ foo: 0, bar: 0 }, { foo: 1, bar: 0 }, { foo: 1, bar: 2 }])
    })

    it('should pass an integration test with an unsubscribe', () => {
      function foo(state = 0, action) {
        return action.type === 'foo' ? 1 : state
      }

      function bar(state = 0, action) {
        return action.type === 'bar' ? 2 : state
      }

      const store = createStore(combineReducers({ foo, bar }), reduxBatchedDispatch())
      const observable = store[$$observable]()
      const results = []

      const sub = observable.subscribe({
        next(state) {
          results.push(state)
        },
      })

      store.dispatch({ type: 'foo' })
      sub.unsubscribe()
      store.dispatch({ type: 'bar' })

      expect(results).toEqual([{ foo: 0, bar: 0 }, { foo: 1, bar: 0 }])
    })

    it('should pass an integration test with a common library (RxJS)', () => {
      function foo(state = 0, action) {
        return action.type === 'foo' ? 1 : state
      }

      function bar(state = 0, action) {
        return action.type === 'bar' ? 2 : state
      }

      const store = createStore(combineReducers({ foo, bar }), reduxBatchedDispatch())
      const observable = from(store)
      const results = []

      const sub = observable
        .pipe(map(state => ({ fromRx: true, ...state })))
        .subscribe(state => results.push(state))

      store.dispatch({ type: 'foo' })
      sub.unsubscribe()
      store.dispatch({ type: 'bar' })

      expect(results).toEqual([{ foo: 0, bar: 0, fromRx: true }, { foo: 1, bar: 0, fromRx: true }])
    })
  })

  it('does not log an error if parts of the current state will be ignored by a nextReducer using combineReducers', () => {
    /* eslint-disable no-console */
    const originalConsoleError = console.error
    console.error = jest.fn()

    const store = createStore(
      combineReducers({
        x: (s = 0) => s,
        y: combineReducers({
          z: (s = 0) => s,
          w: (s = 0) => s,
        }),
      }),
      reduxBatchedDispatch(),
    )

    store.replaceReducer(
      combineReducers({
        y: combineReducers({
          z: (s = 0) => s,
        }),
      }),
    )

    expect(console.error.mock.calls.length).toBe(0)
    console.error = originalConsoleError
    /* eslint-enable no-console */
  })
})
