declare module "flatbush" {

  class FlatBush {
    constructor(numItems: number)

    add(minX: number, minY: number, maxX: number, maxY: number): void
    finish(): void

    data: Float64Array

    _minX: number
    _minY: number
    _maxX: number
    _maxY: number
  }

  function flatbush(numItems: number): FlatBush

  export = flatbush
}
