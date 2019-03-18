import {ContinuousColorMapper} from "./continuous_color_mapper"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace BinnedColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousColorMapper.Props
}

export interface BinnedColorMapper extends BinnedColorMapper.Attrs {}

export abstract class BinnedColorMapper extends ContinuousColorMapper {
  properties: BinnedColorMapper.Props

  constructor(attrs?: Partial<BinnedColorMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "BinnedColorMapper"
  }

    protected cmap<T>(d : number,  palette: Arrayable<T>,  low_color: T,
                      high_color: T, edges: any) : any {
        let key = 0

        if (d < edges[0]) {
            return low_color
        }
        if (d > edges[edges.length-1]) {
            return high_color
        }
        for (let i = 0, end = (edges.length-1); i < end; i++) {
            const low_edge =  edges[i]
            const high_edge =  edges[i+1]
            key = i
            if (d < high_edge && d >=low_edge) {
                break
            }
        }
        return palette[key]
    }
}

BinnedColorMapper.initClass()
