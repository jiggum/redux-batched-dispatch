import createBatchDispatchEnhancer from './createBatchDispatchEnhancer'

export default function createBatchEnhancer(enhancer, dispatchCreatorMap) {
  if (typeof enhancer === 'object' && dispatchCreatorMap === undefined) {
    dispatchCreatorMap = enhancer
    enhancer = undefined
  }

  if (enhancer !== undefined && enhancer !== null && typeof enhancer !== 'function') {
    throw new Error('Expected the enhancer to be a function.')
  }

  return next => {
    return (...args) => {
      const { enhancer: batchDispatchEnhancer, clearActionQueue } = createBatchDispatchEnhancer(
        dispatchCreatorMap,
      )

      const createStore = (() => {
        if (typeof enhancer === 'function') {
          // why enhancers are duplicated?
          // without outer enhancer, the store can't subscribe batch action emitted from extra enhancer(ex: thunk / saga / observable)
          // similarly, without inner enhancer, the store can't subscribe batch action emitted from standard dispatch
          return batchDispatchEnhancer(enhancer(batchDispatchEnhancer(next)))
        }
        return batchDispatchEnhancer(next)
      })()

      const store = createStore(...args)

      return {
        ...store,
        clearActionQueue,
      }
    }
  }
}
