import {ContinuousColorMapper} from "./continuous_color_mapper"
import {Arrayable} from "core/types"
import {left_edge_index} from "core/util/arrayable"
import * as p from "core/properties"

export namespace ScanningColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousColorMapper.Props
}

export interface ScanningColorMapper extends ScanningColorMapper.Attrs {}

export abstract class ScanningColorMapper extends ContinuousColorMapper {
  properties: ScanningColorMapper.Props

  constructor(attrs?: Partial<ScanningColorMapper.Attrs>) {
    super(attrs)
  }

  metrics: {min: number, max: number, binning: Arrayable<number>}

  protected cmap<T>(d: number, palette: Arrayable<T>, low_color: T, high_color: T, edges: any): T {
    if (d < edges.binning[0])
      return low_color
    if (d > edges.binning[edges.binning.length-1])
      return high_color

    const key = left_edge_index(d, edges.binning)
    return palette[key]
  }
}
