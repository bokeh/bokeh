import {range, reversed} from "./array"

export function* enumerate<T>(seq: Iterable<T>): Iterable<[T, number]> {
  let i = 0
  for (const item of seq) {
    yield [item, i++]
  }
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

// https://docs.python.org/3.8/library/itertools.html#itertools.combinations
export function* combinations<T>(seq: T[], r: number): Iterable<T[]> {
  const n = seq.length
  if (r > n)
    return
  const indices = range(r)

  yield indices.map((i) => seq[i])
  while (true) {
    let k: number | undefined
    for (const i of reversed(range(r))) {
      if (indices[i] != i + n - r) {
        k = i
        break
      }
    }
    if (k == null)
      return
    indices[k] += 1
    for (const j of range(k + 1, r)) {
      indices[j] = indices[j-1] + 1
    }
    yield indices.map((i) => seq[i])
  }
}

export function* subsets<T>(seq: T[]): Iterable<T[]> {
  for (const k of range(seq.length + 1)) {
    yield* combinations(seq, k)
  }
}
