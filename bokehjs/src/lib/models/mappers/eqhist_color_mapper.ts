import {ScanningColorMapper} from "./scanning_color_mapper"
import {Range1d} from "../ranges/range1d"
import {VectorTransform} from "core/vectorization"
import {Arrayable} from "core/types"
import {map, min, max, bin_counts, interpolate, norm} from "core/util/arrayable"
import {linspace, cumsum, range} from "core/util/array"
import * as p from "core/properties"

export namespace EqHistColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScanningColorMapper.Props & {
    bins: p.Property<number>
  }

  export type ScanData = {
    low: number
    high: number
    edges: Arrayable<number>
  }
}

export interface EqHistColorMapper extends EqHistColorMapper.Attrs {}

export class EqHistColorMapper extends ScanningColorMapper {
  properties: EqHistColorMapper.Props

  constructor(attrs?: Partial<EqHistColorMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "EqHistColorMapper"

    this.define<EqHistColorMapper.Props>({
       bins: [ p.Int, 256*256 ],
    })
  }

  protected scan<T>(data: Arrayable<number>, palette: Arrayable<T>): EqHistColorMapper.ScanData {
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)
    const span = high - low

    // Compute bin edges and histogram counts
    const {bins} = this
    const bin_edges = linspace(low, high, bins+1)
    const hist = bin_counts(data, bin_edges)

    // Compute bin centers
    const lower_edges = bin_edges.slice(0, -1)
    const upper_edges = bin_edges.slice(1, undefined)
    const bin_centers = range(0, bin_edges.length-1).map(i => (lower_edges[i] + upper_edges[i])/2)

    // CDFs
    const cdf = cumsum(hist)
    const cdf_max = cdf[cdf.length - 1]
    const norm_cdf = map(cdf, x => x / cdf_max)

    // Interpolate
    const palette_range = linspace(low, high, palette.length+1)
    const norm_interp = interpolate(palette_range, bin_centers, norm_cdf)
    const edges = map(norm_interp, x => low + x*span)

    return {low, high, edges}
  }

  get_scale(target_range: Range1d): VectorTransform<number> {
    const mapper = this
    return {
      v_compute(xs: Arrayable<number>): Arrayable<number> {
        const {low, high, edges} = mapper.scan(xs, mapper.palette)

        const norm_xs = norm(xs, low, high)
        const edges_norm = linspace(0, 1, edges.length)
        const interpolated = interpolate(norm_xs, edges_norm, edges)
        const norm_interp = norm(interpolated, low, high)

        const {start, end} = target_range
        return map(norm_interp, x => start + x*(end - start))
      }
    }
  }
}
EqHistColorMapper.initClass()
