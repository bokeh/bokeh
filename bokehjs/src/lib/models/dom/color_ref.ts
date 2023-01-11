import {ValueRef, ValueRefView} from "./value_ref"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Index as DataIndex, _get_column_value} from "core/util/templating"
import {span} from "core/dom"
import * as p from "core/properties"
import * as styles from "styles/tooltips.css"

export class ColorRefView extends ValueRefView {
  declare model: ColorRef

  value_el?: HTMLElement
  swatch_el?: HTMLElement

  override render(): void {
    super.render()

    this.value_el = span()
    this.swatch_el = span({class: styles.tooltip_color_block}, " ")

    this.el.appendChild(this.value_el)
    this.el.appendChild(this.swatch_el)
  }

  override update(source: ColumnarDataSource, i: DataIndex | null, _vars: object/*, formatters?: Formatters*/): void {
    const value = _get_column_value(this.model.field, source, i)
    const text = value == null ? "???" : `${value}` //.toString()
    this.el.textContent = text
  }
}

export namespace ColorRef {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ValueRef.Props & {
    hex: p.Property<boolean>
    swatch: p.Property<boolean>
  }
}

export interface ColorRef extends ColorRef.Attrs {}

export class ColorRef extends ValueRef {
  declare properties: ColorRef.Props
  declare __view_type__: ColorRefView

  constructor(attrs?: Partial<ColorRef.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ColorRefView
    this.define<ColorRef.Props>(({Boolean}) => ({
      hex: [ Boolean, true ],
      swatch: [ Boolean, true ],
    }))
  }
}
