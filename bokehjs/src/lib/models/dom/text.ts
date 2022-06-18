import {DOMNode, DOMNodeView} from "./dom_node"
import * as p from "core/properties"

export class TextView extends DOMNodeView {
  override model: Text
  override el: globalThis.Text

  override render(): void {
    this.el.textContent = this.model.content
  }

  protected override _createElement(): globalThis.Text {
    return document.createTextNode("")
  }
}

export namespace Text {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props & {
    content: p.Property<string>
  }
}

export interface Text extends Text.Attrs {}

export class Text extends DOMNode {
  override properties: Text.Props
  override __view_type__: TextView

  constructor(attrs?: Partial<Text.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TextView

    this.define<Text.Props>(({String}) => ({
      content: [ String, "" ],
    }))
  }
}
