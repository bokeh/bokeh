export class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  float(): number {
    this.state = (1664525*this.state + 1013904223) >>> 0
    return this.state/0x1_0000_0000
  }

  int(stop: number): number {
    return Math.floor(this.float()*stop)
  }

  values(length: number): number[] {
    return Array.from({length}, () => this.float())
  }
}
