/**
 * Returns a function, that, when invoked, will only be triggered at
 * most once during a given interval of time and no more frequently
 * than the animation frame rate allows it.
 *
 * @param func [function] the function to throttle
 * @param wait [number] time in milliseconds to use for window
 * @return [function] throttled function
 */
type TimeoutID = number

export function throttle(func: () => void, wait: number): () => Promise<void> {
  let timeout: TimeoutID | null = null
  let previous = 0
  let pending = false

  return function() {
    return new Promise<void>((resolve, reject) => {
      const later = function() {
        previous = Date.now()
        timeout = null
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
        requestAnimationFrame(later)
      } else if (timeout == null && !pending) {
        timeout = setTimeout(() => requestAnimationFrame(later), remaining)
      } else {
        resolve()
      }
    })
  }
}
