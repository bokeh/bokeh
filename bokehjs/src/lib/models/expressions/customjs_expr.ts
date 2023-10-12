import {HasProps} from "core/has_props"
import {Expression} from "./expression"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type * as p from "core/properties"
import type {Arrayable} from "core/types"
import {GeneratorFunction} from "core/types"
import {repeat} from "core/util/array"
import {use_strict} from "core/util/string"
import {isArray, isTypedArray, isIterable} from "core/util/types"

export namespace CustomJSExpr {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Expression.Props & {
    args: p.Property<Map<string, unknown>>
    code: p.Property<string>
  }
}

export interface CustomJSExpr extends CustomJSExpr.Attrs {}

export class CustomJSExpr extends Expression {
  declare properties: CustomJSExpr.Props

  constructor(attrs?: Partial<CustomJSExpr.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomJSExpr.Props>(({Unknown, String, Dict}) => ({
      args: [ Dict(Unknown), new Map() ],
      code: [ String, "" ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()
    for (const value of this.args.values()) {
      if (value instanceof HasProps) {
        value.change.connect(() => {
          this._result.clear()
          this.change.emit()
        })
      }
    }
  }

  get names(): Iterable<string> {
    return this.args.keys()
  }

  get values(): Iterable<unknown> {
    return this.args.values()
  }

  get func(): GeneratorFunction {
    const code = use_strict(this.code)
    return new GeneratorFunction(...this.names, code)
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable<unknown> {
    const generator = this.func.call(source, ...this.values)

    let result = generator.next()
    if ((result.done ?? false) && result.value !== undefined) {
      const {value} = result
      if (isArray(value) || isTypedArray(value)) {
        return value
      } else if (isIterable(value)) {
        return [...value]
      } else {
        return repeat(value, source.length)
      }
    } else {
      const array = []

      do {
        array.push(result.value)
        result = generator.next()
      } while (!(result.done ?? false))

      return array
    }
  }
}
