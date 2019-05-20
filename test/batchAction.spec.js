import { createStore, applyMiddleware } from 'redux'
import { createEpicMiddleware, ofType } from 'redux-observable'
import { map } from 'rxjs/operators'
import createSagaMiddleware from 'redux-saga'
import { put, takeEvery } from 'redux-saga/effects'

import * as reducers from './helpers/reducers'
import { addTodo, requestAddTodo } from './helpers/actionCreators'
import { DISPATCH_THROTTLE, DISPATCH_DEBOUNCE } from './helpers/dispatchTypes'
import { REQUEST_ADD_TODO } from './helpers/actionTypes'

import { ACTION_TYPE__BATCH, ACTION_META__DISPATCH_TYPE } from '../src/constants'
import { createBatchEnhancer, batchAction } from '../src'

describe('batchAction', () => {
  it('create batch action', () => {
    const action = batchAction([addTodo('Hello'), addTodo('World')], DISPATCH_THROTTLE)
    const actionKeys = Object.keys(action)

    expect(actionKeys.length).toBe(3)
    expect(action.type).toBe(ACTION_TYPE__BATCH)
    expect(action.meta).toEqual({ [ACTION_META__DISPATCH_TYPE]: DISPATCH_THROTTLE })
    expect(action.payload).toEqual([addTodo('Hello'), addTodo('World')])
  })

  it('dispatch batchAction without dispatchType', () => {
    const store = createStore(reducers.todos, createBatchEnhancer())
    expect(store.getState()).toEqual([])

    store.dispatch(batchAction([addTodo('Hello'), addTodo('World')]))
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

  it('dispatch batchAction with dispatchType', () => {
    let throttledDispatch
    const store = createStore(
      reducers.todos,
      createBatchEnhancer({
        [DISPATCH_THROTTLE]: dispatch => {
          throttledDispatch = jest.fn(dispatch)
          return throttledDispatch
        },
      }),
    )

    expect(store.getState()).toEqual([])
    expect(throttledDispatch.mock.calls.length).toBe(0)

    store.dispatch(batchAction([addTodo('Hello'), addTodo('World')], DISPATCH_THROTTLE))
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
    expect(throttledDispatch.mock.calls.length).toBe(1)
  })

  it("dispatch's dispatchType should overwrite batchAction's dispatchType", () => {
    let throttledDispatch
    let debouncedDispatch
    const store = createStore(
      reducers.todos,
      createBatchEnhancer({
        [DISPATCH_THROTTLE]: dispatch => {
          throttledDispatch = jest.fn(dispatch)
          return throttledDispatch
        },
        [DISPATCH_DEBOUNCE]: dispatch => {
          debouncedDispatch = jest.fn(dispatch)
          return debouncedDispatch
        },
      }),
    )

    expect(store.getState()).toEqual([])
    expect(throttledDispatch.mock.calls.length).toBe(0)
    expect(debouncedDispatch.mock.calls.length).toBe(0)

    store.dispatch(
      batchAction([addTodo('Hello'), addTodo('World')], DISPATCH_THROTTLE),
      DISPATCH_DEBOUNCE,
    )
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
    expect(throttledDispatch.mock.calls.length).toBe(0)
    expect(debouncedDispatch.mock.calls.length).toBe(1)
  })

  describe('action from other middleware', () => {
    it('redux-observable', done => {
      let throttledDispatch

      const rootEpic = action$ =>
        action$.pipe(
          ofType(REQUEST_ADD_TODO),
          map(() => batchAction([addTodo('Hello'), addTodo('World')], DISPATCH_THROTTLE)),
        )

      const epicMiddleware = createEpicMiddleware()

      const store = createStore(
        reducers.todos,
        createBatchEnhancer(applyMiddleware(epicMiddleware), {
          [DISPATCH_THROTTLE]: dispatch => {
            throttledDispatch = jest.fn(dispatch)
            return throttledDispatch
          },
        }),
      )

      epicMiddleware.run(rootEpic)

      function* stateCheckerGen() {
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
          expect(throttledDispatch.mock.calls.length).toBe(1)
          done()
        })()
      }

      const stateChecker = stateCheckerGen()

      store.subscribe(() => {
        stateChecker.next()
      })

      expect(store.getState()).toEqual([])
      expect(throttledDispatch.mock.calls.length).toBe(0)
      store.dispatch(requestAddTodo())
    })

    it('redux-saga', done => {
      let throttledDispatch

      function* createTodo() {
        yield put(batchAction([addTodo('Hello'), addTodo('World')], DISPATCH_THROTTLE))
      }

      function* mySaga() {
        yield takeEvery(REQUEST_ADD_TODO, createTodo)
      }

      const sagaMiddleware = createSagaMiddleware()

      const store = createStore(
        reducers.todos,
        createBatchEnhancer(applyMiddleware(sagaMiddleware), {
          [DISPATCH_THROTTLE]: dispatch => {
            throttledDispatch = jest.fn(dispatch)
            return throttledDispatch
          },
        }),
      )

      sagaMiddleware.run(mySaga)

      function* stateCheckerGen() {
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
          expect(throttledDispatch.mock.calls.length).toBe(1)
          done()
        })()
      }

      const stateChecker = stateCheckerGen()

      store.subscribe(() => {
        stateChecker.next()
      })

      expect(store.getState()).toEqual([])
      expect(throttledDispatch.mock.calls.length).toBe(0)
      store.dispatch(requestAddTodo())
    })
  })
})
