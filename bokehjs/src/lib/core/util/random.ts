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
}

export const random = new Random(Date.now())
