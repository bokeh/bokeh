import {CachedVariadicBox} from "core/layout/html"
import {div} from "core/dom"
import * as p from "core/properties"
import {default_provider, MathJaxProvider} from "models/text/providers"
import {Widget, WidgetView} from "./widget"

import clearfix_css, {clearfix} from "styles/clearfix.css"

export abstract class MarkupView extends WidgetView {
  override model: Markup
  override layout: CachedVariadicBox

  protected markup_el: HTMLElement

  get provider(): MathJaxProvider {
    return default_provider
  }

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started")
      await this.provider.fetch()

    if (this.provider.status == "not_started" || this.provider.status == "loading")
      this.provider.ready.connect(() => {
        if (this.contains_tex_string())
          this.rerender()
      })
  }

  override after_layout(): void {
    super.after_layout()

    if (this.provider.status === "loading")
      this._has_finished = false
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
    this.el.appendChild(this.markup_el)

    if (this.provider.status == "failed" || this.provider.status == "loaded")
      this._has_finished = true
  }

  has_math_disabled() {
    return this.model.disable_math || !this.contains_tex_string()
  }

  process_tex(): string {
    if (!this.provider.MathJax)
      return this.model.text

    const {text} = this.model
    const tex_parts = this.provider.MathJax.find_tex(text)
    const processed_text: string[] = []

    let last_index: number | undefined = 0
    for (const part of tex_parts) {
      processed_text.push(text.slice(last_index, part.start.n))
      processed_text.push(this.provider.MathJax.tex2svg(part.math, {display: part.display}).outerHTML)

      last_index = part.end.n
    }

    return processed_text.join("")
  }

  private contains_tex_string(): boolean {
    if (!this.provider.MathJax)
      return false

    return this.provider.MathJax.find_tex(this.model.text).length > 0
  };
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
