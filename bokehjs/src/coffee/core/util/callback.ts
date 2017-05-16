//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

export function delay(func: () => void, wait: number): number {
  return setTimeout(func, wait)
}

const _defer = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setImmediate

export function defer(func: () => void): number {
  return _defer(func)
}

export interface ThrottleOptions {
  leading?: boolean
  trailing?: boolean
}

export function throttle<T>(func: () => T, wait: number, options: ThrottleOptions = {}) {
  let context: any, args: any, result: T
  let timeout: number | null = null
  let previous = 0
  const later = function() {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) context = args = null
  }
  return function(this: any) {
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
