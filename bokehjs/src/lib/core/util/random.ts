const MAX_INT32 = 2147483647
const {PI, log, sin, cos, sqrt} = Math

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

  normal(loc: number, scale: number, size: number): Float64Array {
    const [mu, sigma] = [loc, scale]

    const array = new Float64Array(size)
    for (let i = 0; i < size; i += 2) {
      // Box-Muller transform from uniform to normal distribution.
      const u = this.float()
      const v = this.float()
      const common = sqrt(-2.0*log(u))
      array[i] = mu + sigma*(common*cos(2.0*PI*v))
      if (i + 1 < size)
        array[i + 1] = mu + sigma*(common*sin(2.0*PI*v))
    }

    return array
  }
}

export const random = new Random(Date.now())
