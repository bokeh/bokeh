import {ScanningColorMapper} from "./scanning_color_mapper"
import {Arrayable} from "core/types"
import {min, max, bin_counts, map, interpolate} from "core/util/arrayable"
import {linspace, range, cumsum} from "core/util/array"
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

  protected scan(data: Arrayable<number>, n: number): {min: number, max: number, lower: number, upper: number, binning: Arrayable<number>} {
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)

    // Compute bin edges and histogram counts
    const nbins = this.bins
    const eq_bin_edges = linspace(low, high, nbins+1)
    const hist = bin_counts(data, eq_bin_edges)

    const eq_bin_centers = new Array(nbins)
    for (let i = 0, length = eq_bin_edges.length; i < (length-1); i++) {
      const left = eq_bin_edges[i]
      const right = eq_bin_edges[i+1]
      eq_bin_centers[i] = (left+right)/2
    }

    // CDFs
    const cdf = cumsum(hist)
    const cdf_max = cdf[cdf.length - 1]
    const norm_cdf = map(cdf, (x) => x / cdf_max)

    // Interpolate
    const palette_edges = range(0, n)
    const palette_cdf = map(norm_cdf, (x) => x*n)
    const binning = interpolate(palette_edges, palette_cdf, eq_bin_centers)

    let minimum = binning[0]
    let maximum = binning[0];
    let lower: number = 0
	let upper: number = binning.length
    for (let i = 0, length = binning.length; i < length; i++) {
      const value = binning[i]
      if (isNaN(value))
        continue
	  if (value <= minimum) {
        minimum = value
        lower = i
      }
	  if (value >= maximum) {
        maximum = value
        upper = i
      }
    }
    return {min: low, max: high, binning, lower: lower, upper}
  }
}
