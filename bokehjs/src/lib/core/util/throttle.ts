/**
 * Returns a function, that, when invoked, will only be triggered at
 * most once during a given interval of time and no more frequently
 * than the animation frame rate allows it.
 *
 * @param func [function] the function to throttle
 * @param wait [number] time in milliseconds to use for window
 * @return [function] throttled function
 */
type ID = number

type Resolve<T> = (value: T | PromiseLike<T>) => void

export type ThrottledFn = {
  (): Promise<void>
  stop(): void
}

export function throttle(func: () => void, wait: number): ThrottledFn {
  let timeout: ID | null = null
  let request: ID | null = null
  let previous = 0
  // Only the call that schedules work owns its cancellation resolver.
  let resolver: Resolve<void> | null = null

  const fn = function() {
    const remaining = wait - (Date.now() - previous)
    const immediate = remaining <= 0 && request == null
    const canceled_resolver = immediate ? resolver : null

    const promise = new Promise<void>((resolve, reject) => {
      const later = function() {
        previous = Date.now()
        timeout = null
        request = null
        resolver = null
        try {
          func()
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      if (immediate) {
        if (timeout != null) {
          clearTimeout(timeout)
          timeout = null
        }
        resolver = resolve
        request = requestAnimationFrame(later)
      } else if (timeout == null && request == null) {
        resolver = resolve
        timeout = setTimeout(() => {
          timeout = null
          request = requestAnimationFrame(later)
        }, remaining)
      } else {
        resolve()
      }
    })

    // The canceled call completes with the replacement paint, including any error.
    canceled_resolver?.(promise)
    return promise
  }

  fn.stop = function() {
    if (timeout != null) {
      clearTimeout(timeout)
    }

    if (request != null) {
      cancelAnimationFrame(request)
    }

    timeout = null
    request = null
    resolver?.()
    resolver = null
  }

  return fn
}
