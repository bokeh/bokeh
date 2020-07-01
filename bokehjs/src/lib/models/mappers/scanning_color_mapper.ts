import {ContinuousColorMapper} from "./continuous_color_mapper"
import {Arrayable} from "core/types"
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

    let key = 0
    for (let i = 0, end = edges.binning.length-2; i < end; i++) {
      const low_edge = edges.binning[i]
      const high_edge = edges.binning[i+1]
      key = i
      if ((d >= low_edge) && (d < high_edge))
        break
    }

    // Adjust for non-finite bins
	const n = palette.length-1
    const span = (n-edges.lower)
    const index = Math.floor(((key-edges.lower) / span) * n)
	return palette[Math.max(index, 0)]
  }
}
