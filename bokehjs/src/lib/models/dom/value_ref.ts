import {Placeholder, PlaceholderView, Formatter} from "./placeholder"
import type {Formatters} from "./placeholder"
import {CustomJS} from "../callbacks/customjs"
import {CustomJSHover} from "../tools/inspectors/customjs_hover"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {Index} from "core/util/templating"
import {_get_column_value, MISSING, DEFAULT_FORMATTERS, Skip} from "core/util/templating"
import type {SyncExecutableLike} from "core/util/callbacks"
import {execute, execute_sync} from "core/util/callbacks"
import {isArray, isBoolean} from "core/util/types"
import type * as p from "core/properties"
import type {PlainObject} from "core/types"
import {Or, Func, Ref} from "core/kinds"
import type {Model} from "../../model"

export type FilterArgs = {
  value: unknown
  field: string
  row: {[key: string]: unknown}
  data_source: ColumnarDataSource
  vars: PlainObject
}

export const FilterDef = Or(Func<[FilterArgs], boolean>(), Ref(CustomJS))
export type FilterDef = SyncExecutableLike<Model, [FilterArgs], boolean> | CustomJS

export class ValueRefView extends PlaceholderView {
  declare model: ValueRef

  override connect_signals(): void {
    super.connect_signals()

    const {filter} = this.model.properties
    this.on_change(filter, () => this._update_filter())
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._update_filter()
  }

  protected async _update_filter(): Promise<void> {
    const {filter} = this.model
    for (const fn of isArray(filter) ? filter : [filter]) {
      if (fn instanceof CustomJS) {
        await fn.compile()
      }
    }
  }

  update(data_source: ColumnarDataSource, index: Index | null, vars: PlainObject, _formatters?: Formatters): void {
    const {field, format, formatter, filter} = this.model

    const value = _get_column_value(field, data_source, index)
    const row = index != null ? data_source.get_row(index) : {}

    if (filter != null) {
      for (const fn of isArray(filter) ? filter : [filter]) {
        const args: FilterArgs = {value, field, row, data_source, vars}
        const result = (() => {
          if (fn instanceof CustomJS) {
            return fn.execute_sync(this.model, args)
          } else {
            return execute_sync(fn, this.model, args)
          }
        })()
        if (isBoolean(result) && !result) {
          throw new Skip()
        }
      }
    }

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
    filter: p.Property<FilterDef | FilterDef[] | null>
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
    this.define<ValueRef.Props>(({Str, Nullable, List, Or}) => ({
      field: [ Str ],
      format: [ Nullable(Str), null ],
      formatter: [ Formatter, "raw" ],
      filter: [ Nullable(Or(FilterDef, List(FilterDef))) as any, null ], // XXX `any` cast because of CustomJS/Func types
    }))
  }
}
