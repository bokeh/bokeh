import type {StyleSheetLike} from "core/dom"
import {div} from "core/dom"
import type * as p from "core/properties"
import {Widget, WidgetView} from "./widget"

import clearfix_css, {clearfix} from "styles/clearfix.css"

export abstract class MarkupView extends WidgetView {
  declare model: Markup

  protected markup_el: HTMLElement

  protected override readonly _auto_width = "fit-content"
  protected override readonly _auto_height = "auto"

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started" || this.provider.status == "loading") {
      this.provider.ready.connect(() => {
        if (this.contains_tex_string(this.model.text)) {
          this.rerender()
        }
      })
    }
  }

  has_math_disabled() {
    return this.model.disable_math || !this.contains_tex_string(this.model.text)
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => {
      this.rerender()
    })
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), clearfix_css, "p { margin: 0; }"]
  }

  override render(): void {
    super.render()
    this.markup_el = div({class: clearfix, style: {display: "inline-block"}})
    this.shadow_el.appendChild(this.markup_el)

    if (this.provider.status == "failed" || this.provider.status == "loaded") {
      this._has_finished = true
    }
  }
}

export namespace Markup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    text: p.Property<string>
    disable_math: p.Property<boolean>
  }
}

export interface Markup extends Markup.Attrs {}

export abstract class Markup extends Widget {
  declare properties: Markup.Props
  declare __view_type__: MarkupView

  constructor(attrs?: Partial<Markup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Markup.Props>(({Bool, Str}) => ({
      text:  [ Str, "" ],
      disable_math: [ Bool, false ],
    }))
  }
}
