export function union<T>(...sets: Set<T>[]): Set<T> {
  const result = new Set<T>()
  for (const set of sets) {
    for (const item of set) {
      result.add(item)
    }
  }
  return result
}

export function intersection<T>(set: Set<T>, ...sets: Set<T>[]): Set<T> {
  const result = new Set<T>()
  top: for (const item of set) {
    for (const other of sets) {
      if (!other.has(item))
        continue top
    }
    result.add(item)
  }
  return result
}

export function difference<T>(set: Set<T>, ...sets: Set<T>[]): Set<T> {
  const result = new Set<T>(set)
  for (const item of union(...sets)) {
    result.delete(item)
  }
  return result
}
