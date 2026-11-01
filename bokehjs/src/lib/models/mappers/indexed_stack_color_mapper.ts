import {ContinuousColorMapper} from "./continuous_color_mapper"
import {StackColorMapper} from "./stack_color_mapper"
import type * as p from "core/properties"
import type {Arrayable, Color, uint32} from "core/types"
import {assert} from "core/util/assert"

type ScanData = {min: number, max: number}

export namespace IndexedStackColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StackColorMapper.Props & {
    single_color_mapper: p.Property<ContinuousColorMapper>
    index: p.Property<number>
    scan_all: p.Property<boolean>
  }
}

export interface IndexedStackColorMapper extends IndexedStackColorMapper.Attrs {}

export class IndexedStackColorMapper extends StackColorMapper {
  declare properties: IndexedStackColorMapper.Props

  static {
    this.define<IndexedStackColorMapper.Props>(({Bool, Int, NonNegative, Ref}) => ({
      single_color_mapper: [ Ref(ContinuousColorMapper) ],
      index:               [ NonNegative(Int), 0 ],
      scan_all:            [ Bool, false ],
    }))
  }

  // Scans of `single_color_mapper` per data array, keyed by stack index, or by
  // "all" for the whole stack when `scan_all` is set. Changing `index` or
  // `scan_all` reuses them; `data_changed()` drops those of the arrays it's
  // given, and a change to `single_color_mapper` drops them all.
  protected _scans: WeakMap<Arrayable<number>, Map<number | "all", ScanData>> = new WeakMap()

  override connect_signals(): void {
    super.connect_signals()

    const mapper_changed = () => {
      this._scans = new WeakMap()
      this.change.emit()
    }

    const metrics_changed = () => this.metrics_change.emit()

    let mapper = this.single_color_mapper
    this.connect(mapper.change, mapper_changed)
    this.connect(mapper.metrics_change, metrics_changed)

    this.on_change(this.properties.single_color_mapper, () => {
      this.disconnect(mapper.change, mapper_changed)
      this.disconnect(mapper.metrics_change, metrics_changed)
      mapper = this.single_color_mapper
      this.connect(mapper.change, mapper_changed)
      this.connect(mapper.metrics_change, metrics_changed)
      this._scans = new WeakMap()
      this.palette_mapper_change.emit()
    })
  }

  override get palette_mapper(): ContinuousColorMapper {
    return this.single_color_mapper
  }

  override data_changed(images: Iterable<Arrayable<number>>): void {
    for (const image of images) {
      this._scans.delete(image)
    }
  }

  protected _palette(): Color[] {
    return this.single_color_mapper.palette
  }

  protected _colors<T>(conv: (c: Color) => T): {nan_color: T, low_color?: T, high_color?: T} {
    const {nan_color, low_color, high_color} = this.single_color_mapper
    return {
      nan_color: conv(nan_color),
      low_color: low_color != null ? conv(low_color) : undefined,
      high_color: high_color != null ? conv(high_color) : undefined,
    }
  }

  protected _v_compute(data: Arrayable<number>, values: Arrayable<uint32>,
      palette: Arrayable<uint32>, colors: {nan_color: uint32, low_color?: uint32, high_color?: uint32}): void {
    const {index, scan_all, single_color_mapper} = this
    const n = values.length
    const nstack = data.length / n
    assert(0 <= index && index < nstack, `Expected index in the range [0, ${nstack}), got ${index}`)

    const slice = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      slice[i] = data[i*nstack + index]
    }

    let scans = this._scans.get(data)
    if (scans == null) {
      scans = new Map()
      this._scans.set(data, scans)
    }

    const key = scan_all ? "all" : index
    let scan_data = scans.get(key)
    if (scan_data == null) {
      scan_data = single_color_mapper._v_scan(scan_all ? data : slice, palette.length)
      scans.set(key, scan_data)
    }

    single_color_mapper._v_map(slice, values, palette, colors, scan_data)
  }
}
