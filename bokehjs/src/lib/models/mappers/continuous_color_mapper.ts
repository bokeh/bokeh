import {ColorMapper} from "./color_mapper"
import type {Arrayable, Color} from "core/types"
import type * as p from "core/properties"

import {GlyphRenderer} from "../renderers/glyph_renderer"
import {map, intersection, is_empty} from "core/util/array"
import {isNumber, isArray} from "core/util/types"

export namespace ContinuousColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColorMapper.Props & {
    high: p.Property<number | null>
    low: p.Property<number | null>
    high_color: p.Property<Color | null>
    low_color: p.Property<Color | null>
    domain: p.Property<[GlyphRenderer, string | string[]][]>
  }
}

export interface ContinuousColorMapper extends ContinuousColorMapper.Attrs {}

export abstract class ContinuousColorMapper extends ColorMapper {
  declare properties: ContinuousColorMapper.Props

  constructor(attrs?: Partial<ContinuousColorMapper.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ContinuousColorMapper.Props>(({Float, Str, Ref, Color, Or, Tuple, List, Nullable}) => {
      return {
        high:       [ Nullable(Float), null ],
        low:        [ Nullable(Float), null ],
        high_color: [ Nullable(Color), null ],
        low_color:  [ Nullable(Color), null ],
        domain:     [ List(Tuple(Ref(GlyphRenderer), Or(Str, List(Str)))), [] ],
      }
    })
  }

  override connect_signals(): void {
    super.connect_signals()

    const connect_renderers = () => {
      // TODO: if already connected this will bail. However, it won't remove old connections.
      for (const [renderer] of this.domain) {
        this.connect(renderer.view.change, () => this.update_data())
        this.connect(renderer.data_source.selected.change, () => this.update_data())
      }
    }

    const {high, low, high_color, low_color, palette, nan_color} = this.properties
    this.on_change([high, low, high_color, low_color, palette, nan_color], () => this.update_data())

    this.connect(this.properties.domain.change, () => connect_renderers())
    connect_renderers()
  }

  update_data(): void {
    const {domain, palette} = this
    const all_data = [...this._collect(domain)]
    this._scan_data = this.scan(all_data, palette.length)
    this.metrics_change.emit()
    this.change.emit()
  }

  MatricsType: {min: number, max: number}

  get metrics(): this["MatricsType"] {
    if (this._scan_data == null) {
      this.update_data()
    }
    return this._scan_data!
  }

  protected *_collect(domain: [GlyphRenderer, string | string[]][]) {
    for (const [renderer, fields] of domain) {
      for (const field of isArray(fields) ? fields : [fields]) {
        if (renderer.view.properties.indices.is_unset) {
          continue
        }

        const column = renderer.data_source.get_column(field)
        if (column == null) {
          continue
        }

        let array = renderer.view.indices.select(column)

        const masked = renderer.view.masked
        const selected = renderer.data_source.selected.indices

        let subset: Arrayable<number> | undefined
        if (masked != null && selected.length > 0) {
          subset = intersection([...masked], selected)
        } else if (masked != null) {
          subset = [...masked]
        } else if (selected.length > 0) {
          subset = selected
        }

        if (subset != null) {
          array = map(subset, (i) => array[i])
        }

        if (array.length > 0 && !isNumber(array[0])) {
          for (const subarray of array) {
            yield* subarray
          }
        } else {
          yield* array
        }
      }
    }
  }

  protected _scan_data: {min: number, max: number} | null = null

  protected abstract scan(data: Arrayable<number>, n: number): {min: number, max: number}

  public _v_compute<T>(data: Arrayable<number>, values: Arrayable<T>,
      palette: Arrayable<T>, colors: {nan_color: T, low_color?: T, high_color?: T}): void {

    const {nan_color} = colors
    let {low_color, high_color} = colors
    if (low_color == null) {
      low_color = palette[0]
    }
    if (high_color == null) {
      high_color = palette[palette.length-1]
    }

    const {domain} = this
    const all_data = !is_empty(domain) ? [...this._collect(domain)] : data
    this._scan_data = this.scan(all_data, palette.length)
    this.metrics_change.emit()

    for (let i = 0, end = data.length; i < end; i++) {
      const d = data[i]

      if (isNaN(d)) {
        values[i] = nan_color
      } else {
        values[i] = this.cmap(d, palette, low_color, high_color)
      }
    }
  }

  protected override _colors<T>(conv: (c: Color) => T): {nan_color: T, low_color?: T, high_color?: T} {
    return {
      ...super._colors(conv),
      low_color: this.low_color != null ? conv(this.low_color) : undefined,
      high_color: this.high_color != null ? conv(this.high_color) : undefined,
    }
  }

  protected cmap<T>(value: number, palette: Arrayable<T>, low_color: T, high_color: T): T {
    const index = this.value_to_index(value, palette.length)
    if (index < 0) {
      return low_color
    } else if (index >= palette.length) {
      return high_color
    } else {
      return palette[index]
    }
  }

  abstract index_to_value(index: number): number

  // Return index corresponding to specified value in the range -1 to palette.length.
  // -1 means below the bottom of the palette, palette.length means above the top.
  abstract value_to_index(value: number, palette_length: number): number
}
