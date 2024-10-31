import {DOMElement, DOMElementView} from "./dom_element"
import {HasProps} from "core/has_props"
import {to_string} from "core/util/pretty"
import type * as p from "core/properties"

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

  override render(): void {
    super.render()
    this.el.style.display = "contents"

    const text = (() => {
      const {obj, attr} = this.model
      if (attr in obj.properties) {
        const value = obj.properties[attr].get_value()
        return to_string(value)
      } else {
        return `<not found: ${obj.type}.${attr}>`
      }
    })()

    this.el.textContent = text
  }
}

export namespace ValueOf {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMElement.Props & {
    obj: p.Property<HasProps>
    attr: p.Property<string>
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

    this.define<ValueOf.Props>(({Str, Ref}) => ({
      obj: [ Ref(HasProps) ],
      attr: [ Str ],
    }))
  }
}
