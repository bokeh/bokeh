import {Widget, WidgetView} from "./widget"
import type * as p from "core/properties"
import {div} from "core/dom"

import {Marked} from "marked"
import Purify from "dompurify"

export class MarkdownPanelView extends WidgetView {
  declare model: MarkdownPanel

  protected readonly _markdown = new Marked()

  readonly contents = div({style: {display: "contents"}})

  override connect_signals(): void {
    super.connect_signals()
    const {text, disable_math} = this.model.properties
    this.on_change([text, disable_math], () => this._render_markdown(this.model.text))
  }

  protected _render_markdown(text: string): void {
    const html = this._markdown.parse(text, {async: false})
    const html_with_math = this.has_math_disabled ? html : this.process_tex(html)
    this.contents.innerHTML = Purify.sanitize(html_with_math)
  }

  override render(): void {
    super.render()
    this.shadow_el.append(this.contents)
    this._render_markdown(this.model.text)
  }

  get has_math_disabled(): boolean {
    return this.model.disable_math || !this.contains_tex_string(this.model.text)
  }
}

export namespace MarkdownPanel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    text: p.Property<string>
    disable_math: p.Property<boolean>
  }
}

export interface MarkdownPanel extends MarkdownPanel.Attrs {}

export class MarkdownPanel extends Widget {
  declare properties: MarkdownPanel.Props
  declare __view_type__: MarkdownPanelView

  constructor(attrs?: Partial<MarkdownPanel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MarkdownPanelView

    this.define<MarkdownPanel.Props>(({Str, Bool}) => ({
      text: [ Str, "" ],
      disable_math: [ Bool, false ],
    }))
  }
}
