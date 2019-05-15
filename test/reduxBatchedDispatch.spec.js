import { createStore, applyMiddleware } from 'redux'
import { from } from 'rxjs'
import { map, concatMap } from 'rxjs/operators'
import { TestScheduler } from 'rxjs/testing'
import $$observable from 'symbol-observable'
import thunk from 'redux-thunk'
import { createEpicMiddleware, ofType } from 'redux-observable'
import createSagaMiddleware from 'redux-saga'
import { call, put, takeEvery } from 'redux-saga/effects'

import { REQUEST_ADD_TODO, DISPATCH_IN_OBSERVABLE } from './helpers/actionTypes'
import {
  requestAddTodo,
  addTodo,
  unknownActions,
} from './helpers/actionCreators'
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
        return mockFetch({ response: 'Actions' }).then(response =>
          dispatch(addTodo(response)),
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
        return mockFetch({ response: ['Hello', 'World'] }).then(response =>
          dispatch(response.map(todo => addTodo(todo))),
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

  describe('redux-observable', () => {
    it('dispatch batched actions before epic', () => {
      const testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected)
      })

      testScheduler.run(({ hot, cold, expectObservable }) => {
        const rootEpic = action$ =>
          action$.pipe(
            ofType(REQUEST_ADD_TODO),
            concatMap(() => cold('--a', { a: addTodo('Actions') })),
          )

        const epicMiddleware = createEpicMiddleware()

        const store = createStore(
          reducers.todos,
          reduxBatchedDispatch(applyMiddleware(epicMiddleware)),
        )

        epicMiddleware.run(rootEpic)

        const store$ = from(store)

        const action$ = hot('--a', {
          a: [requestAddTodo(), addTodo('Hello'), addTodo('Batched')],
        }).pipe(
          map(action => {
            store.dispatch(action)
            return DISPATCH_IN_OBSERVABLE
          }),
        )

        expectObservable(action$).toBe('--d', {
          d: DISPATCH_IN_OBSERVABLE,
        })
        expectObservable(store$).toBe('0-1-2', {
          0: [],
          1: [{ id: 1, text: 'Hello' }, { id: 2, text: 'Batched' }],
          2: [
            { id: 1, text: 'Hello' },
            { id: 2, text: 'Batched' },
            { id: 3, text: 'Actions' },
          ],
        })
      })
    })

    it('dispatch batched actions after epic', () => {
      const testScheduler = new TestScheduler((actual, expected) => {
        expect(actual).toEqual(expected)
      })

      testScheduler.run(({ hot, cold, expectObservable }) => {
        const rootEpic = action$ =>
          action$.pipe(
            ofType(REQUEST_ADD_TODO),
            concatMap(() =>
              cold('--a', { a: [addTodo('Hello'), addTodo('World')] }),
            ),
          )

        const epicMiddleware = createEpicMiddleware()

        const store = createStore(
          reducers.todos,
          reduxBatchedDispatch(applyMiddleware(epicMiddleware)),
        )

        epicMiddleware.run(rootEpic)

        const store$ = from(store)

        const action$ = hot('--a', {
          a: requestAddTodo(),
        }).pipe(
          map(action => {
            store.dispatch(action)
            return DISPATCH_IN_OBSERVABLE
          }),
        )

        expectObservable(action$).toBe('--d', {
          d: DISPATCH_IN_OBSERVABLE,
        })
        expectObservable(store$).toBe('0-1-2', {
          0: [],
          1: [],
          2: [{ id: 1, text: 'Hello' }, { id: 2, text: 'World' }],
        })
      })
    })
  })

  describe('redux-saga', () => {
    it('dispatch batched actions before saga', async done => {
      function* createTodo() {
        yield put(addTodo('Hello'))
        const response = yield call(mockFetch, { response: 'Actions' })
        yield put(addTodo(response))
      }

      function* mySaga() {
        yield takeEvery(REQUEST_ADD_TODO, createTodo)
      }

      const sagaMiddleware = createSagaMiddleware()

      const store = createStore(
        reducers.todos,
        reduxBatchedDispatch(applyMiddleware(sagaMiddleware)),
      )

      sagaMiddleware.run(mySaga)

      function* stateCheckerGen() {
        yield expect(store.getState()).toEqual([
          {
            id: 1,
            text: 'Hello',
          },
          {
            id: 2,
            text: 'Batched',
          },
        ])

        yield (() => {
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
          done()
        })()
      }

      const stateChecker = stateCheckerGen()

      store.subscribe(() => {
        stateChecker.next()
      })
      expect(store.getState()).toEqual([])
      store.dispatch([requestAddTodo(), addTodo('Batched')])
    })

    it('dispatch batched actions after thunk', async done => {
      function* createTodo() {
        const response = yield call(mockFetch, { response: ['Hello', 'World'] })
        yield put(response.map(todo => addTodo(todo)))
      }

      function* mySaga() {
        yield takeEvery(REQUEST_ADD_TODO, createTodo)
      }

      const sagaMiddleware = createSagaMiddleware()

      const store = createStore(
        reducers.todos,
        reduxBatchedDispatch(applyMiddleware(sagaMiddleware)),
      )

      sagaMiddleware.run(mySaga)

      function* stateCheckerGen() {
        yield expect(store.getState()).toEqual([])
        yield (() => {
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
          done()
        })()
      }

      const stateChecker = stateCheckerGen()

      store.subscribe(() => {
        stateChecker.next()
      })
      expect(store.getState()).toEqual([])
      store.dispatch(requestAddTodo())
    })
  })
})
