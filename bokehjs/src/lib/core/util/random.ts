const MAX_INT32 = 2147483647

// Park-Miller LCG
export class Random {
  private seed: number

  constructor(seed: number) {
    this.seed = seed % MAX_INT32
    if (this.seed <= 0)
      this.seed += MAX_INT32 - 1
  }

  integer(): number {
    this.seed = (48271*this.seed) % MAX_INT32
    return this.seed
  }

  float(): number {
    return (this.integer() - 1) / (MAX_INT32 - 1)
  }

  floats(n: number, a: number = 0, b: number = 1): number[] {
    const result: number[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = a + this.float()*(b - a)
    }
    return result
  }

  choices<T>(n: number, items: ArrayLike<T>): T[] {
    const k = items.length

    const result: T[] = new Array(n)
    for (let i = 0; i < n; i++) {
      result[i] = items[this.integer() % k]
    }
    return result
  }
}

export const random = new Random(Date.now())
