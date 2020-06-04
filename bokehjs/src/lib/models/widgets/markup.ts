import {CachedVariadicBox} from "core/layout/html"
import {div} from "core/dom"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"

import {bk_clearfix} from "styles/clearfix"
import clearfix_css from "styles/clearfix.css"

export abstract class MarkupView extends WidgetView {
  model: Markup
  layout: CachedVariadicBox

  protected markup_el: HTMLElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => {
      this.layout.invalidate_cache()
      this.render()
      this.root.compute_layout() // XXX: invalidate_layout?
    })
  }

  styles(): string[] {
    return [...super.styles(), clearfix_css]
  }

  _update_layout(): void {
    this.layout = new CachedVariadicBox(this.el)
    this.layout.set_sizing(this.box_sizing())
  }

  render(): void {
    super.render()
    const style = {...this.model.style, display: "inline-block"}
    this.markup_el = div({class: bk_clearfix, style})
    this.el.appendChild(this.markup_el)
  }
}

export namespace Markup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    text: p.Property<string>
    style: p.Property<{[key: string]: string}>
  }
}

export interface Markup extends Markup.Attrs {}

export abstract class Markup extends Widget {
  properties: Markup.Props
  __view_type__: MarkupView

  constructor(attrs?: Partial<Markup.Attrs>) {
    super(attrs)
  }

  static init_Markup(): void {
    this.define<Markup.Props>({
      text:  [ p.String, '' ],
      style: [ p.Any,    {} ],
    })
  }
}
