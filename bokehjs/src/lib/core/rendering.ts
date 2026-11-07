import {options} from "preact"

/**
 * A pending flush of preact's render queue, if any.
 */
let pending: Promise<void> | null = null

/**
 * Returns a promise that resolves after preact's pending renders (re-renders of
 * vDOM components, e.g. due to changes of signals) were flushed, or `null` if
 * there are no pending renders.
 *
 * Renders requested while flushing are flushed together, so the promise covers
 * them as well.
 */
export function pending_render(): Promise<void> | null {
  return pending
}

const debounce = options.debounceRendering ?? ((flush: () => void) => queueMicrotask(flush))

// Preact calls this once per flush, i.e. when the render queue becomes non-empty.
options.debounceRendering = (flush: () => void): void => {
  const promise = new Promise<void>((resolve) => {
    debounce(() => {
      try {
        flush()
      } finally {
        if (pending === promise) {
          pending = null
        }
        resolve()
      }
    })
  })
  pending = promise
}
