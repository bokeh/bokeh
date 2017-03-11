//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

export function delay(func: () => void, wait: number): number {
  return setTimeout(func, wait)
}

export function defer(func: () => void): number {
  return delay(func, 1)
}

export function throttle<T>(func: () => T, wait: number, options?: {leading?: boolean, trailing?: boolean}) {
  let context: any, args: any, result: T
  let timeout: number = null
  let previous = 0
  if (!options) options = {}
  const later = function() {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) context = args = null
  }
  return function() {
    const now = Date.now()
    if (!previous && options.leading === false) previous = now
    const remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) context = args = null
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
}

export function once<T>(func: () => T): () => T {
  let done = false
  let memo: T
  return function() {
    if (!done) {
      done = true
      memo = func()
    }
    return memo
  }
}
