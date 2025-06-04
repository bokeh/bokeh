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
  let pending = false
  let resolver: Resolve<void>

  const fn = function() {
    return new Promise<void>((resolve, reject) => {
      resolver = resolve

      const later = function() {
        previous = Date.now()
        timeout = null
        request = null
        pending = false
        try {
          func()
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      const now = Date.now()
      const remaining = wait - (now - previous)
      if (remaining <= 0 && !pending) {
        if (timeout != null) {
          clearTimeout(timeout)
        }
        pending = true
        request = requestAnimationFrame(later)
      } else if (timeout == null && !pending) {
        timeout = setTimeout(() => request = requestAnimationFrame(later), remaining)
      } else {
        resolve()
      }
    })
  }

  fn.stop = function() {
    if (timeout != null) {
      clearTimeout(timeout)
    }

    if (request != null) {
      cancelAnimationFrame(request)
    }

    resolver()
  }

  return fn
}
