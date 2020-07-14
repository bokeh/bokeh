import {ColorMapper} from "./color_mapper"
import {Arrayable, Color} from "core/types"
import * as p from "core/properties"

//import {ColumnDataSource} from "../sources/column_data_source"
//import {CDSView} from "../sources/cds_view"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {map, intersection} from "core/util/array"
import {isNumber, isArray} from "core/util/types"

export namespace ContinuousColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColorMapper.Props & {
    high: p.Property<number>
    low: p.Property<number>
    high_color: p.Property<Color>
    low_color: p.Property<Color>
    //domain: p.Property<[ColumnDataSource, string[], CDSView?][] | null>
    domain: p.Property<[GlyphRenderer, string | string[]][] | null>
  }
}

export interface ContinuousColorMapper extends ContinuousColorMapper.Attrs {}

export abstract class ContinuousColorMapper extends ColorMapper {
  properties: ContinuousColorMapper.Props

  constructor(attrs?: Partial<ContinuousColorMapper.Attrs>) {
    super(attrs)
  }

  static init_ContinuousColorMapper(): void {
    this.define<ContinuousColorMapper.Props>({
      high:       [ p.Number ],
      low:        [ p.Number ],
      high_color: [ p.Color  ],
      low_color:  [ p.Color  ],
      domain:     [ p.Any    ],
    })
  }

  connect_signals(): void {
    super.connect_signals()

    const {domain} = this
    if (domain != null) {
      for (const [renderer] of domain) {
        this.connect(renderer.view.change, () => this.update_data())
        this.connect(renderer.data_source.selected.change, () => this.update_data())
      }
    }
  }

  update_data(): void {
    const {domain, palette} = this
    if (domain == null) {
      throw new Error("no")
    } else {
      const all_data = [...this._collect(domain)]
      this._scan_data = this.scan(all_data, palette.length)
      this.change.emit()
    }
  }

  get metrics(): {min: number, max: number} {
    if (this._scan_data == null) {
      this.update_data()
    }

    return this._scan_data!
  }

  *_collect(domain: [GlyphRenderer, string | string[]][]) {
    for (const [renderer, fields] of domain) {
      for (const field of isArray(fields) ? fields : [fields]) {
        let array = renderer.data_source.get_column(field)!
        array = renderer.view.indices.select(array)

        const masked = renderer.view.masked
        const selected = renderer.data_source.selected.indices

        let subset: number[] | undefined
        if (masked != null && selected.length > 0)
          subset = intersection([...masked], selected)
        else if (masked != null)
          subset = [...masked]
        else if (selected.length > 0)
          subset = selected

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

  protected _v_compute<T>(data: Arrayable<number>, values: Arrayable<T>,
    palette: Arrayable<T>, colors: {nan_color: T, low_color?: T, high_color?: T}): void {

    const {nan_color} = colors
    let {low_color, high_color} = colors
    if (low_color == null)
      low_color = palette[0]
    if (high_color == null)
      high_color = palette[palette.length-1]

    const {domain} = this
    const all_data = domain != null ? [...this._collect(domain)] : data
    this._scan_data = this.scan(all_data, palette.length)

    for (let i = 0, end = data.length; i < end; i++) {
      const d = data[i]

      if (isNaN(d))
        values[i] = nan_color
      else
        values[i] = this.cmap(d, palette, low_color, high_color, this._scan_data)
    }
  }

  protected _colors<T>(conv: (c: Color) => T): {nan_color: T, low_color?: T, high_color?: T} {
    return {
      ...super._colors(conv),
      low_color: this.low_color != null ? conv(this.low_color) : undefined,
      high_color: this.high_color != null ? conv(this.high_color) : undefined,
    }
  }

  protected abstract cmap<T>(d: number, palette: Arrayable<T>, low_color: T, high_color: T, scan_data: any): T
}
