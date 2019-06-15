import batchActionEnhancer from './batchActionEnhancer'
import { ACTION_META__DISPATCH_TYPE, ACTION_TYPE__BATCH } from './constants'

export default function createBatchDispatchEnhancer(dispatchCreatorMap) {
  const actionQueueMap = {}
  const dispatchMap = {}
  let lastStoreDispatch

  if (dispatchCreatorMap) {
    Object.keys(dispatchCreatorMap).forEach(dispatchType => {
      if (typeof dispatchCreatorMap[dispatchType] !== 'function') {
        throw new Error('Expected the dispatch creator to be a function.')
      }

      actionQueueMap[dispatchType] = []
      dispatchMap[dispatchType] = (() => {
        const rateLimitedDispatch = dispatchCreatorMap[dispatchType](() => {
          const queue = actionQueueMap[dispatchType]
          if (queue.length > 0) {
            lastStoreDispatch(queue)
            actionQueueMap[dispatchType].length = 0
          }
        })
        return action => {
          actionQueueMap[dispatchType].push(action)
          rateLimitedDispatch(action)
        }
      })()
    })
  }

  function getActionQueue(dispatchType) {
    if (dispatchType === undefined) {
      throw new Error('Expected first argument to be string of dispatchType')
    }

    return actionQueueMap[dispatchType]
  }

  function enhancer(next) {
    return (...args) => {
      const store = batchActionEnhancer(next)(...args)

      lastStoreDispatch = store.dispatch

      function dispatch(action, dispatchType) {
        if (action !== undefined && action !== null && action.type === ACTION_TYPE__BATCH) {
          if (dispatchType === undefined) {
            dispatchType = action.meta[ACTION_META__DISPATCH_TYPE]
          }
          action = action.payload
        }
        if (dispatchType === undefined) {
          return store.dispatch(action)
        }

        if (!Object.hasOwnProperty.call(dispatchCreatorMap, dispatchType)) {
          throw new Error(
            `Invalid dispatch type '${dispatchType}'. You have to declare dispatch creator with key of '${dispatchType}'`,
          )
        }

        return dispatchMap[dispatchType](action)
      }

      return {
        ...store,
        dispatch,
      }
    }
  }

  return {
    enhancer,
    getActionQueue,
  }
}
