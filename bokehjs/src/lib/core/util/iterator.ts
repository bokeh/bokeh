import {range as arange} from "./array"
import {assert} from "./assert"

const {abs, ceil, max} = Math

export function* range(start: number, stop?: number, step: number = 1): Iterable<number> {
  assert(step > 0)

  if (stop == null) {
    stop = start
    start = 0
  }

  const delta = start <= stop ? step : -step
  const length = max(ceil(abs(stop - start) / step), 0)

  for (let i = 0; i < length; i++, start += delta) {
    yield start
  }
}

export function* reverse<T>(array: T[]): Iterable<T> {
  const n = array.length

  for (let i = 0; i < n; i++) {
    yield array[n - i - 1]
  }
}

export function* enumerate<T>(seq: Iterable<T>): Iterable<[T, number]> {
  let i = 0
  for (const item of seq) {
    yield [item, i++]
  }
}

export function* take<T>(seq: Iterable<T>, n: number): Iterable<T> {
  assert(n >= 0)
  let i = 0
  for (const item of seq) {
    if (i++ < n)
      yield item
    else
      break
  }
}

export function* skip<T>(seq: Iterable<T>, n: number): Iterable<T> {
  assert(n >= 0)

  for (const value of seq) {
    if (n == 0)
      yield value
    else
      n -= 1
  }
}

export function* tail<T>(seq: Iterable<T>): Iterable<T> {
  yield* skip(seq, 1)
}

export function* join<T>(seq: Iterable<Iterable<T>>, separator?: () => T): Iterable<T> {
  let first = true
  for (const entry of seq) {
    if (first)
      first = false
    else if (separator != null)
      yield separator()

    yield* entry
  }
}

export function* zip<T0, T1>(iterable0: Iterable<T0>, iterable1: Iterable<T1>): Iterable<[T0, T1]> {
  const it0 = iterable0[Symbol.iterator]()
  const it1 = iterable1[Symbol.iterator]()

  do {
    const r0 = it0.next()
    const r1 = it1.next()
    if (r0.done === true || r1.done === true)
      break
    else
      yield [r0.value, r1.value]
  } while (true)
}

export function* interleave<T>(seq: Iterable<T>, separator: () => T): Iterable<T> {
  let first = true
  for (const entry of seq) {
    if (first)
      first = false
    else
      yield separator()

    yield entry
  }
}

export function* map<T, U>(iterable: Iterable<T>, fn: (item: T, i: number) => U): Iterable<U> {
  let i = 0
  for (const item of iterable) {
    yield fn(item, i++)
  }
}

export function* flat_map<T, U>(iterable: Iterable<T>, fn: (item: T, i: number) => Iterable<U>): Iterable<U> {
  let i = 0
  for (const item of iterable) {
    yield* fn(item, i++)
  }
}

export function every<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): boolean {
  for (const item of iterable) {
    if (!predicate(item))
      return false
  }
  return true
}

export function some<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): boolean {
  for (const item of iterable) {
    if (predicate(item))
      return true
  }
  return false
}

// https://docs.python.org/3.8/library/itertools.html#itertools.combinations
export function* combinations<T>(seq: T[], r: number): Iterable<T[]> {
  const n = seq.length
  if (r > n)
    return
  const indices = arange(r)

  yield indices.map((i) => seq[i])
  while (true) {
    let k: number | undefined
    for (const i of reverse(arange(r))) {
      if (indices[i] != i + n - r) {
        k = i
        break
      }
    }
    if (k == null)
      return
    indices[k] += 1
    for (const j of arange(k + 1, r)) {
      indices[j] = indices[j-1] + 1
    }
    yield indices.map((i) => seq[i])
  }
}

export function* subsets<T>(seq: T[]): Iterable<T[]> {
  for (const k of arange(seq.length + 1)) {
    yield* combinations(seq, k)
  }
}
