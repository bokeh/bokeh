import {DOMElement, DOMElementView} from "./dom_element"
import {HasProps} from "core/has_props"
import {CustomJS} from "../callbacks/customjs"
import {DEFAULT_FORMATTERS} from "core/util/templating"
import {execute} from "core/util/callbacks"
import {isArray} from "core/util/types"
import type * as p from "core/properties"
import {BuiltinFormatter} from "core/enums"
import {Or, Ref} from "core/kinds"

const Formatter = Or(BuiltinFormatter, Ref(CustomJS))
type Formatter = typeof Formatter["__type__"]

export class ValueOfView extends DOMElementView {
  declare model: ValueOf

  override connect_signals(): void {
    super.connect_signals()

    const fn = () => this.render()
    let prop: p.Property<unknown> | null = null

    const reconnect = () => {
      if (prop != null) {
        this.disconnect(prop.change, fn)
      }

      const {obj, attr} = this.model
      if (attr in obj.properties) {
        prop = obj.properties[attr]
        this.connect(prop.change, fn)
      } else {
        prop = null
      }
    }

    reconnect()

    const {obj, attr} = this.model.properties
    this.on_change([obj, attr], () => reconnect())
  }

  protected _render_value(value: unknown): void {
    const {format, formatter} = this.model
    const vars = {}

    const render = (contents: unknown): void => {
      if (contents instanceof Node) {
        this.el.append(contents)
      } else if (isArray(contents)) {
        this.el.append(...contents.map((item) => item instanceof Node ? item : `${item}`))
      } else {
        this.el.textContent = `${contents}`
      }
    }

    if (formatter instanceof CustomJS) {
      const promise = (async () => {
        const contents = await execute(formatter, this.model, {value, format, vars})
        render(contents)
      })()
      this._await_ready(promise)
    } else {
      const contents = DEFAULT_FORMATTERS[formatter](value, format ?? "", vars)
      render(contents)
    }
  }

  override render(): void {
    super.render()
    this.el.style.display = "contents"

    const {obj, attr} = this.model
    if (attr in obj.properties) {
      const value = obj.properties[attr].get_value()
      this._render_value(value)
    } else {
      this.el.textContent = `<not found: ${obj.type}.${attr}>`
    }
  }
}

export namespace ValueOf {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMElement.Props & {
    obj: p.Property<HasProps>
    attr: p.Property<string>
    format: p.Property<string | null>
    formatter: p.Property<Formatter>
  }
}

export interface ValueOf extends ValueOf.Attrs {}

export class ValueOf extends DOMElement {
  declare properties: ValueOf.Props
  declare __view_type__: ValueOfView

  constructor(attrs?: Partial<ValueOf.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ValueOfView

    this.define<ValueOf.Props>(({Str, Ref, Nullable}) => ({
      obj: [ Ref(HasProps) ],
      attr: [ Str ],
      format: [ Nullable(Str), null ],
      formatter: [ Formatter, "raw" ],
    }))
  }
}
