import $$observable from 'symbol-observable'

export default function reduxBatchedDispatch(next) {
  let currentListeners = []
  let nextListeners = currentListeners
  let isDispatching = false

  function notifyListeners() {
    currentListeners = nextListeners
    currentListeners.forEach(listener => {
      listener()
    })
  }

  // https://github.com/reduxjs/redux/blob/344d0e2347b3fc2221e626d495f4a12ac95907f0/src/createStore.js#L73
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  // https://github.com/reduxjs/redux/blob/344d0e2347b3fc2221e626d495f4a12ac95907f0/src/createStore.js#L119
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }

    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.',
      )
    }

    let isSubscribed = true

    ensureCanMutateNextListeners()
    nextListeners.push(listener)

    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.',
        )
      }

      isSubscribed = false

      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
    }
  }

  return (...args) => {
    const store = next(...args)

    function observable() {
      const outerSubscribe = subscribe
      return {
        subscribe(observer) {
          if (typeof observer !== 'object' || observer === null) {
            throw new TypeError('Expected the observer to be an object.')
          }

          function observeState() {
            if (observer.next) {
              observer.next(store.getState())
            }
          }

          observeState()
          const unsubscribe = outerSubscribe(observeState)
          return { unsubscribe }
        },
        [$$observable]() {
          return this
        },
      }
    }

    function recursiveDispatch(action) {
      if (Array.isArray(action)) {
        return action.map(subAction => recursiveDispatch(subAction))
      }
      return store.dispatch(action)
    }

    function dispatch(action) {
      let result
      try {
        isDispatching = true
        result = recursiveDispatch(action)
      } finally {
        isDispatching = false
      }

      notifyListeners()

      return result
    }

    return {
      ...store,
      dispatch,
      subscribe,
      [$$observable]: observable,
    }
  }
}
