import {ScanningColorMapper, ScanningScanData} from "./scanning_color_mapper"
import {Arrayable} from "core/types"
import {min, max, bin_counts, interpolate} from "core/util/arrayable"
import {linspace, cumsum} from "core/util/array"
import * as p from "core/properties"

export namespace EqHistColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScanningColorMapper.Props & {
    bins: p.Property<number>
    rescale_discrete_levels: p.Property<boolean>
  }
}

export interface EqHistColorMapper extends EqHistColorMapper.Attrs {}

export class EqHistColorMapper extends ScanningColorMapper {
  override properties: EqHistColorMapper.Props

  constructor(attrs?: Partial<EqHistColorMapper.Attrs>) {
    super(attrs)
  }

  static {
    this.define<EqHistColorMapper.Props>(({Boolean, Int}) => ({
      bins:                    [ Int, 256*256 ],
      rescale_discrete_levels: [ Boolean, false ],
    }))
  }

  // Public for unit tests
  /*protected*/ scan(data: Arrayable<number>, n: number): ScanningScanData {
    let low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)

    const nbins = this.bins
    const eq_bin_edges = linspace(low, high, nbins+1)
    const full_hist = bin_counts(data, eq_bin_edges)

    // Remove empty bins from histogram to make interpolation more accurate and faster
    // 1) Count non-zeros
    let nhist = 0
    for (let i = 0; i < nbins; i++) {
      if (full_hist[i] != 0)
        nhist++
    }

    // 2) Remove zeros, leaving extra element at beginning for rescale_discrete_levels
    const hist = new Array(nhist+1)
    const eq_bin_centers = new Array(nhist+1)
    for (let i = 0, j = 1; i < nbins; i++) {
      if (full_hist[i] != 0) {
        hist[j] = full_hist[i]
        eq_bin_centers[j] = (eq_bin_edges[i] + eq_bin_edges[i+1])/2
        j++
      }
    }
    hist[0] = 0
    eq_bin_centers[0] = 2*eq_bin_centers[1] - eq_bin_centers[nhist]

    // CDF scaled from 0 to 1 except for first value
    const cdf = cumsum(hist)
    const lo = cdf[1]
    const diff = cdf[nhist] - lo
    for (let i = 1; i <= nhist; i++)
      cdf[i] = (cdf[i] - lo) / diff
    cdf[0] = -1.0

    let lower_span = 0
    if (this.rescale_discrete_levels) {
      const discrete_levels = nhist

      // Straight line y = mx + c through (2, 1.5) and (100, 1) where
      // x is number of discrete_levels and y is lower span limit.
      const m = -0.5/98.0  // (y[1] - y[0]) / (x[1] - x[0])
      const c = 1.5 - 2*m  // y[0] - m*x[0]
      const multiple = m*discrete_levels + c

      if (multiple > 1)
        lower_span = 1 - multiple
    }

    // Color bin boundaries are equally spaced in CDF
    const cdf_bins = linspace(lower_span, 1, n+1)
    const binning = interpolate(cdf_bins, cdf, eq_bin_centers)

    // Extend limits to low and high values
    if (this.rescale_discrete_levels)
      low = binning[0]
    else
      binning[0] = low
    binning[binning.length-1] = high

    return {min: low, max: high, binning}
  }
}
