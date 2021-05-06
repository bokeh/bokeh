import {CachedVariadicBox} from "core/layout/html"
import {div} from "core/dom"
import * as p from "core/properties"
import {Widget, WidgetView} from "./widget"

import clearfix_css, {clearfix} from "styles/clearfix.css"

export abstract class MarkupView extends WidgetView {
  override model: Markup
  override layout: CachedVariadicBox

  protected markup_el: HTMLElement

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started" || this.provider.status == "loading")
      this.provider.ready.connect(() => {
        if (this.contains_tex_string(this.model.text))
          this.rerender()
      })
  }

  has_math_disabled() {
    return this.model.disable_math || !this.contains_tex_string(this.model.text)
  }

  protected rerender() {
    this.layout.invalidate_cache()
    this.render()
    this.root.compute_layout() // XXX: invalidate_layout?
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => {
      this.rerender()
    })
  }

  override styles(): string[] {
    return [...super.styles(), clearfix_css]
  }

  override _update_layout(): void {
    this.layout = new CachedVariadicBox(this.el)
    this.layout.set_sizing(this.box_sizing())
  }

  override render(): void {
    super.render()
    const style = {...this.model.style, display: "inline-block"}
    this.markup_el = div({class: clearfix, style})
    this.shadow_el.appendChild(this.markup_el)

    if (this.provider.status == "failed" || this.provider.status == "loaded")
      this._has_finished = true
  }
}

export namespace Markup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    text: p.Property<string>
    style: p.Property<{[key: string]: string}>
    disable_math: p.Property<boolean>
  }
}

export interface Markup extends Markup.Attrs {}

export abstract class Markup extends Widget {
  override properties: Markup.Props
  override __view_type__: MarkupView

  constructor(attrs?: Partial<Markup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Markup.Props>(({Boolean, String, Dict}) => ({
      text:  [ String, "" ],
      style: [ Dict(String), {} ],
      disable_math: [ Boolean, false ],
    }))
  }
}
