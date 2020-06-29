import {ScanningColorMapper} from "./scanning_color_mapper"
import {Arrayable} from "core/types"
import {min, max, bin_counts, interpolate, map, filter} from "core/util/arrayable"
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
    const eq_bin_edges = linspace(low, high, nbins+1)
    const raw_hist = bin_counts(data, eq_bin_edges)

    const bin_edges = new Array(1)
    bin_edges[0] = eq_bin_edges[0]; 
    const hist = new Array() // Could also zero-filter hist in a pass 
    // Dropping edges/bins zero zero count hist to avoid flat sections of CDF
    for (let i = 0; i < nbins; i++) {
        if (raw_hist[i] != 0) {
            bin_edges.push(eq_bin_edges[i+1])
            hist.push(raw_hist[i])
        }
    }   

    // Compute bin centers
    const bin_centers = new Array(bin_edges.length - 1)
    for (let i = 0; i < (bin_edges.length - 1); i++) {
      bin_centers[i] = (bin_edges[i] + bin_edges[i + 1])/2
    }      
      
    // CDFs
    const cdf = cumsum(hist)
    const cdf_max = cdf[cdf.length - 1]
    const norm_cdf = map(cdf, (x) => x / cdf_max)

    // Interpolate
    const palette_edges = linspace(low, high, n + 1)

    // Compute bin centers
    const palette_centers = new Array(palette_edges.length - 1)
      for (let i = 0; i < (palette_edges.length - 1); i++) {
        palette_centers[i] = (palette_edges[i] + palette_edges[i + 1])/2
      }

    const interpolated = interpolate(palette_centers, bin_centers, norm_cdf)
    const min_interp = min(interpolated)
    const interp_span = max(interpolated) - min_interp
    const rescaled_interpolated = map(interpolated, (x) => (x - min_interp)/interp_span)
    // This is currently the most suspect step due to the magic 0.999 number
    // The problem is that edge values greater than 1 are problematic
    const norm_interpolated = filter(rescaled_interpolated, (x) => x < 0.999)

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
