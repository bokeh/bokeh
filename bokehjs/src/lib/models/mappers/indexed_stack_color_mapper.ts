import {ContinuousColorMapper} from "./continuous_color_mapper"
import {StackColorMapper} from "./stack_color_mapper"
import type * as p from "core/properties"
import {logger} from "core/logging"
import type {Arrayable, Color, uint32} from "core/types"
import {is_empty} from "core/util/array"

type ScanData = {min: number, max: number}

export namespace IndexedStackColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StackColorMapper.Props & {
    slice_color_mapper: p.Property<ContinuousColorMapper>
    index: p.Property<number>
    scan_together: p.Property<boolean>
  }
}

export interface IndexedStackColorMapper extends IndexedStackColorMapper.Attrs {}

export class IndexedStackColorMapper extends StackColorMapper {
  declare properties: IndexedStackColorMapper.Props

  static {
    this.define<IndexedStackColorMapper.Props>(({Bool, Int, NonNegative, Ref}) => ({
      slice_color_mapper: [ Ref(ContinuousColorMapper) ],
      index:              [ NonNegative(Int), 0 ],
      scan_together:      [ Bool, false ],
    }))
  }

  // Scans of `slice_color_mapper` per data array, keyed by stack index, or by
  // "together" for the whole stack when `scan_together` is set. Changing `index`
  // or `scan_together` reuses them; `data_changed()` drops those of the arrays
  // it's given, and a change to `slice_color_mapper` drops them all. Nothing is
  // cached when `slice_color_mapper` has a `domain`.
  protected _scans: WeakMap<Arrayable<number>, Map<number | "together", ScanData>> = new WeakMap()

  override connect_signals(): void {
    super.connect_signals()

    const mapper_changed = () => {
      this._scans = new WeakMap()
      this.change.emit()
    }

    const metrics_changed = () => this.metrics_change.emit()

    // It's required, but may be unset until this mapper is used.
    let mapper = this.properties.slice_color_mapper.is_unset ? null : this.slice_color_mapper
    if (mapper != null) {
      this.connect(mapper.change, mapper_changed)
      this.connect(mapper.metrics_change, metrics_changed)
    }

    this.on_change(this.properties.slice_color_mapper, () => {
      if (mapper != null) {
        this.disconnect(mapper.change, mapper_changed)
        this.disconnect(mapper.metrics_change, metrics_changed)
      }
      mapper = this.slice_color_mapper
      this.connect(mapper.change, mapper_changed)
      this.connect(mapper.metrics_change, metrics_changed)
      this._scans = new WeakMap()
      this.display_mapper_change.emit()
    })
  }

  override get display_mapper(): ContinuousColorMapper {
    return this.slice_color_mapper
  }

  override data_changed(images: Iterable<Arrayable<number>>): void {
    for (const image of images) {
      this._scans.delete(image)
    }
  }

  protected _palette(): Color[] {
    return this.slice_color_mapper.palette
  }

  protected _colors<T>(conv: (c: Color) => T): {nan_color: T, low_color?: T, high_color?: T} {
    const {nan_color, low_color, high_color} = this.slice_color_mapper
    return {
      nan_color: conv(nan_color),
      low_color: low_color != null ? conv(low_color) : undefined,
      high_color: high_color != null ? conv(high_color) : undefined,
    }
  }

  protected _scan(data: Arrayable<number>, slice: Arrayable<number>, n: number): ScanData {
    const {index, scan_together, slice_color_mapper} = this

    // `domain` overrides what is scanned, so `data` and `index` can't identify
    // the result, and nothing here is told when a domain renderer's data changes.
    if (!is_empty(slice_color_mapper.domain)) {
      return slice_color_mapper._v_scan(data, n)
    }

    let scans = this._scans.get(data)
    if (scans == null) {
      scans = new Map()
      this._scans.set(data, scans)
    }

    const key = scan_together ? "together" : index
    let scan_data = scans.get(key)
    if (scan_data == null) {
      scan_data = slice_color_mapper._v_scan(scan_together ? data : slice, n)
      scans.set(key, scan_data)
    }
    return scan_data
  }

  protected _v_compute(data: Arrayable<number>, values: Arrayable<uint32>,
      palette: Arrayable<uint32>, colors: {nan_color: uint32, low_color?: uint32, high_color?: uint32}): void {
    const {index, slice_color_mapper} = this
    const n = values.length
    const nstack = data.length / n

    // This image has no such slice, but that shouldn't stop the rest of the
    // render. It doesn't scan either, so a color bar keeps its current range.
    if (index >= nstack) {
      logger.error(`${this}: expected index in the range [0, ${nstack}), got ${index}`)
      for (let i = 0; i < n; i++) {
        values[i] = colors.nan_color
      }
      return
    }

    const slice = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      slice[i] = data[i*nstack + index]
    }

    const scan_data = this._scan(data, slice, palette.length)
    slice_color_mapper._v_map(slice, values, palette, colors, scan_data)
  }
}
