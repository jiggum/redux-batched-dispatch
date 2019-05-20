import { ACTION_TYPE__BATCH, ACTION_META__DISPATCH_TYPE } from './constants'

export default function batchAction(action, dispatchType) {
  return {
    type: ACTION_TYPE__BATCH,
    meta: {
      [ACTION_META__DISPATCH_TYPE]: dispatchType,
    },
    payload: action,
  }
}
