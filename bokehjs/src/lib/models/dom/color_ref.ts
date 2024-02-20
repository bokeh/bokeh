import {ValueRef, ValueRefView} from "./value_ref"
import type {Formatters} from "./placeholder"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {Index} from "core/util/templating"
import {_get_column_value} from "core/util/templating"
import {span} from "core/dom"
import type {PlainObject} from "core/types"
import type * as p from "core/properties"
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

  override update(source: ColumnarDataSource, i: Index | null, _vars: PlainObject, _formatters?: Formatters): void {
    const value = _get_column_value(this.model.field, source, i)
    const text = value == null ? "???" : `${value}`
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
    this.define<ColorRef.Props>(({Bool}) => ({
      hex: [ Bool, true ],
      swatch: [ Bool, true ],
    }))
  }
}
