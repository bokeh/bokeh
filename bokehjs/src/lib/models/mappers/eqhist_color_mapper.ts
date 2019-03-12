import {ScanningColorMapper} from "./scanning_color_mapper"
import {Arrayable} from "core/types"
import {min, max, bin_counts, interp, map} from "core/util/arrayable"
import {linspace, cumsum, range} from "core/util/array"
import * as p from "core/properties"

export namespace EqHistColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScanningColorMapper.Props & {
    bins: p.Property<number>
  }
}

export interface EqHistColorMapper extends EqHistColorMapper.Attrs {
  scan_result: Arrayable<number>
}

export class EqHistColorMapper extends ScanningColorMapper {
  properties: EqHistColorMapper.Props

  constructor(attrs?: Partial<EqHistColorMapper.Attrs>) {
    super(attrs)
  }

  protected scan<T>(data: Arrayable<number>, palette: Arrayable<T>): Arrayable<number> {
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)
    const span = high - low

    // Compute bin edges and histogram counts
    const nbins = this.bins
    const bin_edges = linspace(low, high, nbins+1)
    const hist = bin_counts(data, bin_edges)

    // Compute bin centers
    const lower_edges = bin_edges.slice(0, -1)
    const upper_edges = bin_edges.slice(1, undefined)
    const bin_centers = map(range(0, bin_edges.length-1), (i) => (lower_edges[i] + upper_edges[i])/2)

    // CDFs
    const cdf = cumsum(hist)
    const cdf_max = cdf[cdf.length - 1]
    const norm_cdf = map(cdf, (x) => x / cdf_max)

    // Interpolate
    const palette_range = linspace(low, high, palette.length+1)
    const norm_interp = interp(palette_range, bin_centers, norm_cdf)
    const result = map(norm_interp, (x) => low + x*span)
    this.scan_result = result
    return result
  }

  static init_EqHistColorMapper(): void {
    this.define<EqHistColorMapper.Props>({
      bins: [ p.Int, 256*256 ],
    })
  }
}
