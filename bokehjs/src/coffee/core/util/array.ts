const {min, max, ceil} = Math

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

  const length = max(ceil((stop - start) / step), 0)
  const range = Array(length)

  for (let i = 0; i < length; i++, start += step) {
    range[i] = start
  }

  return range
}
