import {Placeholder, PlaceholderView, Formatter} from "./placeholder"
import type {Formatters} from "./placeholder"
import {CustomJS} from "../callbacks/customjs"
import {CustomJSHover} from "../tools/inspectors/customjs_hover"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {Index} from "core/util/templating"
import {_get_column_value, MISSING, DEFAULT_FORMATTERS} from "core/util/templating"
import {execute} from "core/util/callbacks"
import {isArray} from "core/util/types"
import type * as p from "core/properties"
import type {PlainObject} from "core/types"

export class ValueRefView extends PlaceholderView {
  declare model: ValueRef

  update(source: ColumnarDataSource, i: Index | null, vars: PlainObject, _formatters?: Formatters): void {
    const {field, format, formatter} = this.model
    const value = _get_column_value(field, source, i)

    const render = (output: unknown) => {
      if (output == null) {
        this.el.textContent = MISSING
      } else if (output instanceof Node) {
        this.el.replaceChildren(output)
      } else if (isArray(output)) {
        this.el.replaceChildren(...output.map((item) => item instanceof Node ? item : `${item}`))
      } else {
        this.el.textContent = `${output}`
      }
    }

    if (formatter instanceof CustomJS) {
      void (async () => {
        const output = await execute(formatter, this.model, {value, format, vars})
        render(output)
      })()
    } else {
      const output = (() => {
        if (format == null) {
          return DEFAULT_FORMATTERS.basic(value, "", vars)
        } else {
          if (formatter instanceof CustomJSHover) {
            return formatter.format(value, format, vars)
          } else {
            return DEFAULT_FORMATTERS[formatter](value, format, vars)
          }
        }
      })()
      render(output)
    }
  }
}

export namespace ValueRef {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Placeholder.Props & {
    field: p.Property<string>
    format: p.Property<string | null>
    formatter: p.Property<Formatter>
  }
}

export interface ValueRef extends ValueRef.Attrs {}

export class ValueRef extends Placeholder {
  declare properties: ValueRef.Props
  declare __view_type__: ValueRefView

  constructor(attrs?: Partial<ValueRef.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ValueRefView
    this.define<ValueRef.Props>(({Str, Nullable}) => ({
      field: [ Str ],
      format: [ Nullable(Str), null ],
      formatter: [ Formatter, "raw" ],
    }))
  }
}
