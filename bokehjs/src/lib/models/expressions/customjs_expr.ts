import {HasProps} from "core/has_props"
import {Expression} from "./expression"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import * as p from "core/properties"
import {Arrayable} from "core/types"
import {repeat} from "core/util/array"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"
import {isArray, isTypedArray, isIterable} from "core/util/types"

const GeneratorFunction = Object.getPrototypeOf(function*() {}).constructor

export namespace CustomJSExpr {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Expression.Props & {
    args: p.Property<{[key: string]: unknown}>
    code: p.Property<string>
  }
}

export interface CustomJSExpr extends CustomJSExpr.Attrs {}

export class CustomJSExpr extends Expression {
  properties: CustomJSExpr.Props

  constructor(attrs?: Partial<CustomJSExpr.Attrs>) {
    super(attrs)
  }

  static init_CustomJSExpr(): void {
    this.define<CustomJSExpr.Props>(({Unknown, String, Dict}) => ({
      args: [ Dict(Unknown), {} ],
      code: [ String, "" ],
    }))
  }

  connect_signals(): void {
    super.connect_signals()
    for (const value of values(this.args)) {
      if (value instanceof HasProps) {
        value.change.connect(() => {
          this._result.clear()
          this.change.emit()
        })
      }
    }
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): unknown[] {
    return values(this.args)
  }

  get func(): GeneratorFunction {
    const code = use_strict(this.code)
    return new GeneratorFunction(...this.names, code)
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable<unknown> {
    const generator = this.func.apply(source, this.values)

    let result = generator.next()
    if (result.done && result.value !== undefined) {
      const {value} = result
      if (isArray(value) || isTypedArray(value))
        return value
      else if (isIterable(value))
        return [...value]
      else
        return repeat(value, source.length)
    } else {
      const array = []

      do {
        array.push(result.value)
        result = generator.next()
      } while (!result.done)

      return array
    }
  }
}
