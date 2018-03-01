declare module "proj4/lib/core" {
  import Projection = require("proj4/lib/Proj")

  function proj4(fromProj: Projection, toProj: Projection): {
    forward: (coords: [number, number]) => [number, number]
    inverse: (coords: [number, number]) => [number, number]
  }
  export = proj4
}

declare module "proj4/lib/Proj" {
  class Projection {
    constructor(srsCode: string)
  }
  export = Projection
}
