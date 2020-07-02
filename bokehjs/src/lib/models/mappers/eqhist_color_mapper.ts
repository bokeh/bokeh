import {ScanningColorMapper} from "./scanning_color_mapper"
import {Arrayable} from "core/types"
import {min, max, bin_counts, map, interpolate} from "core/util/arrayable"
import {linspace, range, cumsum, uniq} from "core/util/array"
import * as p from "core/properties"
import {logger} from "core/logging"

export namespace EqHistColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScanningColorMapper.Props & {
    bins: p.Property<number>
  }
}

function eq_hist(data: Arrayable<number>, low: number, high: number, nbins: number, n: number): number[] {
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
  const palette_cdf = map(norm_cdf, (x) => x*(n-1))
  return (interpolate(palette_edges, palette_cdf, eq_bin_centers) as number[])
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

    // Iteratively find as many finite bins as there are colors
    const nbins = this.bins
    let finite_bins = n-1
    let binning: number[] = []
    let iterations = 0
    let guess = n*1.5
    while (finite_bins != n && iterations<10 && (finite_bins != 0)) {
      guess = Math.round(Math.max(n * guess/finite_bins, n))
      binning = eq_hist(data, low, high, nbins, guess)
      const uniq_bins = uniq(binning)
      finite_bins = uniq_bins.length-1
      iterations++
    }
	if (finite_bins == 0)
      binning = [low, high]
    else
      binning = binning.slice(binning.length-n)
      if (finite_bins != n)
        logger.warn("EqHistColorMapper warning: Histogram equalization did not converge.")
    return {min: low, max: high, binning}
  }
}
