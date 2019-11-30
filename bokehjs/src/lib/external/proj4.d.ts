declare module "proj4/lib/core" {
  import Projection from "proj4/lib/Proj"

  export default function proj4(fromProj: Projection, toProj: Projection): {
    forward: (coords: [number, number]) => [number, number]
    inverse: (coords: [number, number]) => [number, number]
  }
}

declare module "proj4/lib/Proj" {
  export default class Projection {
    constructor(srsCode: string)
  }
}
