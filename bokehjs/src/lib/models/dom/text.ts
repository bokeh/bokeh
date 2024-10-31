import {DOMNode, DOMNodeView} from "./dom_node"
import type * as p from "core/properties"

export class TextView extends DOMNodeView {
  declare model: Text
  declare el: globalThis.Text

  override connect_signals(): void {
    super.connect_signals()

    const {content} = this.model.properties
    this.on_change(content, () => this.render())
  }

  override render(): void {
    this.el.textContent = this.model.content
  }

  // TODO This shouldn't be here.
  override after_render(): void {
    this.finish()
  }

  protected override _create_element(): globalThis.Text {
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
  declare properties: Text.Props
  declare __view_type__: TextView

  constructor(attrs?: Partial<Text.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TextView

    this.define<Text.Props>(({Str}) => ({
      content: [ Str, "" ],
    }))
  }
}
