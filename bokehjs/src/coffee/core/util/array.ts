export function zip<A, B>(As: Array<A>, Bs: Array<B>): Array<[A, B]> {
  const ABs: Array<[A, B]> = []
  for (let i = 0; i < As.length && i < Bs.length; i++) {
    ABs.push([As[i], Bs[i]])
  }
  return ABs
}

export function unzip<A, B>(ABs: Array<[A, B]>): [Array<A>, Array<B>] {
  const As: Array<A> = []
  const Bs: Array<B> = []
  for (const [a, b] of ABs) {
    As.push(a)
    Bs.push(b)
  }
  return [As, Bs]
}

export function range(start: number, stop?: number, step: number = 1): Array<number> {
  if (stop == null) {
    stop = start
    start = 0
  }

  const length = Math.max(Math.ceil((stop - start) / step), 0)
  const range = Array(length)

  for (let i = 0; i < length; i++, start += step) {
    range[i] = start
  }

  return range
}

export function sum(array: Array<number>): number {
  return array.reduce((a, b) => a + b, 0)
}

export function cumsum(array: Array<number>): Array<number> {
  const result = []
  array.reduce((a, b, i) => result[i] = a + b, 0)
  return result
}

export function min(array: Array<number>): number {
  let value: number
  let result = Infinity

  for (let i = 0, length = array.length; i < length; i++) {
    value = array[i]
    if (value < result) {
      result = value
    }
  }

  return result
}

export function minBy<T>(array: Array<T>, key: (T) => number): T {
  let value: T
  let result: T
  let computed: number
  let resultComputed = Infinity

  for (let i = 0, length = array.length; i < length; i++) {
    value = array[i]
    computed = key(value)
    if (computed < resultComputed) {
      result = value
      resultComputed = computed
    }
  }

  return result
}

export function max(array: Array<number>): number {
  let value: number
  let result = -Infinity

  for (let i = 0, length = array.length; i < length; i++) {
    value = array[i]
    if (value > result) {
      result = value
    }
  }

  return result
}

export function maxBy<T>(array: Array<T>, key: (T) => number): T {
  let value: T
  let result: T
  let computed: number
  let resultComputed = -Infinity

  for (let i = 0, length = array.length; i < length; i++) {
    value = array[i]
    computed = key(value)
    if (computed > resultComputed) {
      result = value
      resultComputed = computed
    }
  }

  return result
}

export function argmin(array: Array<number>): number {
  return minBy(range(array.length), (i) => array[i])
}

export function argmax(array: Array<number>): number {
  return maxBy(range(array.length), (i) => array[i])
}
