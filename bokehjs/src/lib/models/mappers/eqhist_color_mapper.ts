import {ScanningColorMapper} from "./scanning_color_mapper"
import {Arrayable} from "core/types"
import {min, max, bin_counts, map} from "core/util/arrayable"
import {linspace, cumsum, sum} from "core/util/array"
import * as p from "core/properties"

export namespace EqHistColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScanningColorMapper.Props & {
    bins: p.Property<number>
  }
}

export interface EqHistColorMapper extends EqHistColorMapper.Attrs {}

export class EqHistColorMapper extends ScanningColorMapper {
  properties: EqHistColorMapper.Props

  constructor(attrs?: Partial<EqHistColorMapper.Attrs>) {
    super(attrs)
  }

  static init_EqHistColorMapper(): void {
    this.define<EqHistColorMapper.Props>({
      bins: [ p.Int, 256*256 ],
    })
  }

  protected scan(data: Arrayable<number>, n: number): {min: number, max: number, binning: Arrayable<number>} {
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)
    const span = high - low

    // Compute bin edges and histogram counts
    const nbins = this.bins
    const bin_edges = linspace(low, high, nbins+1)
    const hist = bin_counts(data, bin_edges)

    const samples = data.length 
    const weighting = map(hist, (x) => x / samples)
      
    let position = low
    const new_edges = new Array(1)
    new_edges[0] = low
    const eq_diff = (high - low) / n
     
    for (let i=0; i < weighting.length; i++) {
        if (weighting[i] != 0) {
            position += eq_diff * weighting[i]
            new_edges.push(position)
        }
    }
      
    const norm_interpolated = map(new_edges, (x) => (x - min(new_edges))
                                  / (max(new_edges) - min(new_edges)))

    let diff = [];
    for (let i = 1; i < (norm_interpolated.length); i++) {
        diff.push(norm_interpolated[i] - norm_interpolated[i - 1])
    }

    let delta = 1/diff.length
    let ratio = diff.map( x  =>  x / delta)
    let inv_ratio = ratio.map( x  =>  1 / x)
    let ratio_sum = sum(ratio)
    let inv_ratio_sum = sum(inv_ratio)
    let adjusted = inv_ratio.map(x => (x / inv_ratio_sum) * ratio_sum)
    let adjusted_bins = adjusted.map((_, i) => adjusted[i] * delta)
    let adjusted_edges = [0].concat(cumsum(adjusted_bins))
      
    const result = map(adjusted_edges, (x) =>  (x-low)*span)
    return {min: low, max: high, binning: result}
  }
}
