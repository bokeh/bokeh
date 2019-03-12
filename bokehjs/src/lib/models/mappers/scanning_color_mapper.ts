import {ContinuousColorMapper} from "./continuous_color_mapper"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {assert} from "core/util/assert"

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

  protected cmap<T>(d: number, palette: Arrayable<T>, low_color: T, high_color: T, edges: Arrayable<number>): T {
    assert(edges.length > 0)

    if (d < edges[0]) {
      return low_color
    }
    if (d > edges[edges.length-1]) {
      return high_color
    }

    let key = 0
    for (let i = 0, end = edges.length-1; i < end; i++) {
      const low_edge = edges[i]
      const high_edge = edges[i+1]
      key = i
      if (d < high_edge && d >= low_edge) {
        break
      }
    }
    return palette[key]
  }
}
