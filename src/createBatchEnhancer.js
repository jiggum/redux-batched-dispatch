import batchActionEnhancer from './batchActionEnhancer'

export default function(enhancer, dispatchCreatorMap) {
  if (typeof enhancer === 'object' && dispatchCreatorMap === undefined) {
    dispatchCreatorMap = enhancer
    enhancer = undefined
  }

  if (enhancer !== undefined && enhancer !== null && typeof enhancer !== 'function') {
    throw new Error('Expected the enhancer to be a function.')
  }

  const actionQueueMap = {}
  const dispatchMap = {}

  return next => {
    return (...args) => {
      const createStore = (() => {
        if (typeof enhancer === 'function') {
          // why enhancers are duplicated?
          // without outer enhancer, the store can't subscribe batch action emitted from extra enhancer(ex: thunk / saga / observable)
          // similarly, without inner enhancer, the store can't subscribe batch action emitted from standard dispatch
          return batchActionEnhancer(enhancer(batchActionEnhancer(next)))
        }
        return batchActionEnhancer(next)
      })()

      const store = createStore(...args)

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
                store.dispatch(queue)
                actionQueueMap[dispatchType] = []
              }
            })
            return action => {
              actionQueueMap[dispatchType].push(action)
              rateLimitedDispatch(action)
            }
          })()
        })
      }

      function dispatch(action, dispatchType) {
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

      function clearActionQueue(dispatchType) {
        if (dispatchType === undefined) {
          Object.keys(actionQueueMap).forEach(key => {
            actionQueueMap[key] = []
          })
        } else {
          actionQueueMap[dispatchType] = []
        }
      }

      return {
        ...store,
        dispatch,
        clearActionQueue,
      }
    }
  }
}
