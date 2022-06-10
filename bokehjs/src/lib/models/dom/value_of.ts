import {DOMNode, DOMNodeView} from "./dom_node"
import {HasProps} from "core/has_props"
import {empty} from "core/dom"
import {to_string} from "core/util/pretty"
import * as p from "core/properties"

export class ValueOfView extends DOMNodeView {
  override model: ValueOf
  override el: HTMLElement

  override connect_signals(): void {
    super.connect_signals()

    const {obj, attr} = this.model
    if (attr in obj.properties) {
      this.on_change(obj.properties[attr], () => this.render())
    }
  }

  render(): void {
    empty(this.el)
    this.el.style.display = "contents"

    const text = (() => {
      const {obj, attr} = this.model
      if (attr in obj.properties) {
        const value = obj.properties[attr].get_value()
        return to_string(value)
      } else
        return `<not found: ${obj.type}.${attr}>`
    })()

    this.el.textContent = text
  }
}

export namespace ValueOf {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props & {
    obj: p.Property<HasProps>
    attr: p.Property<string>
  }
}

export interface ValueOf extends ValueOf.Attrs {}

export class ValueOf extends DOMNode {
  override properties: ValueOf.Props
  override __view_type__: ValueOfView

  constructor(attrs?: Partial<ValueOf.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ValueOfView

    this.define<ValueOf.Props>(({String, Ref}) => ({
      obj: [ Ref(HasProps) ],
      attr: [ String ],
    }))
  }
}
