import {PlotMapping} from "./plot_mapping"
import {CoordinateTransform} from "./coordinate_transform"
import type {Scale} from "../scales/scale"
import type * as p from "core/properties"

/** Scales bound to the plot's actual source ranges and the frame's screen ranges. */
export type CartesianSource = {
  readonly x_scales: ReadonlyMap<string, Scale>
  readonly y_scales: ReadonlyMap<string, Scale>
}

export namespace CartesianMapping {
  export type Attrs = p.AttrsOf<Props>
  export type Props = PlotMapping.Props
}

export interface CartesianMapping extends CartesianMapping.Attrs {}

export class CartesianMapping extends PlotMapping {
  declare properties: CartesianMapping.Props

  get_transform(source: CartesianSource, x_name = "default", y_name = "default"): CoordinateTransform {
    const x_scale = source.x_scales.get(x_name)
    const y_scale = source.y_scales.get(y_name)
    if (x_scale == null || y_scale == null) {
      throw new Error(`Missing Cartesian ranges '${x_name}', '${y_name}'`)
    }
    return new CoordinateTransform(x_scale, y_scale)
  }
}
