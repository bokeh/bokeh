declare module "flatbush" {

  class FlatBush {
    constructor(numItems: number)

    add(minX: number, minY: number, maxX: number, maxY: number): void
    search(minX: number, minY: number, maxX: number, maxY: number, filterFn?: (i: number) => boolean): number[]
    finish(): void

    minX: number
    minY: number
    maxX: number
    maxY: number
  }

  export = FlatBush
}
