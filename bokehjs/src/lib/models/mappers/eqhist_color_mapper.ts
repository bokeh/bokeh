import {ScanningColorMapper} from "./scanning_color_mapper"
import {Arrayable} from "core/types"
import {min, max, bin_counts, interpolate} from "core/util/arrayable"
import {linspace, cumsum} from "core/util/array"
import * as p from "core/properties"

export namespace EqHistColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScanningColorMapper.Props & {
    bins: p.Property<number>
  }
}

export interface EqHistColorMapper extends EqHistColorMapper.Attrs {}

export class EqHistColorMapper extends ScanningColorMapper {
  override properties: EqHistColorMapper.Props

  constructor(attrs?: Partial<EqHistColorMapper.Attrs>) {
    super(attrs)
  }

  static {
    this.define<EqHistColorMapper.Props>(({Int}) => ({
      bins: [ Int, 256*256 ],
    }))
  }

  // Public for unit tests
  /*protected*/ scan(data: Arrayable<number>, n: number): {min: number, max: number, binning: Arrayable<number>} {
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)

    const nbins = this.bins
    const eq_bin_edges = linspace(low, high, nbins+1)
    const hist = bin_counts(data, eq_bin_edges)

    const eq_bin_centers = new Array(nbins)
    for (let i = 0, length = eq_bin_edges.length; i < length-1; i++) {
      const left = eq_bin_edges[i]
      const right = eq_bin_edges[i+1]
      eq_bin_centers[i] = (left+right)/2
    }

    // CDF
    const cdf = cumsum(hist)

    // Color bin boundaries are equally spaced in CDF
    const cdf_bins = linspace(cdf[0], cdf[nbins-1], n+1)
    const binning = interpolate(cdf_bins, cdf, eq_bin_centers)

    // Extend bin limits to low and high values
    binning[0] = low
    binning[binning.length-1] = high

    return {min: low, max: high, binning}
  }
}
