import {ScanningColorMapper} from "./scanning_color_mapper"
import {Arrayable} from "core/types"
import {argmin, argmax, min, max, bin_counts, map, interpolate} from "core/util/arrayable"
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

    // CDFs
    const cdf = cumsum(hist)
    const cdf_max = cdf[cdf.length - 1]
    const norm_cdf = map(cdf, (x) => x / cdf_max)

    // Interpolate
    const palette_edges = linspace(0, n, n + 1)
    const palette_cdf = map(norm_cdf, (x) => x*n)
    const interpolated = interpolate(palette_edges, palette_cdf, eq_bin_edges)
    const lower = argmin(interpolated)
    const upper = argmax(interpolated)
    const binning = map(interpolated, (x) => (x || 0))
    return {min: low, max: high, binning, lower, upper}
  }
}
