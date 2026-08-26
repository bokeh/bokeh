import {Patches} from "./patches"

export namespace Polygons {
  export type Attrs = Patches.Attrs
  export type Props = Patches.Props
}

/** Polygon and MultiPolygon features supplied by a GeometryDataSource. */
export class Polygons extends Patches {}
