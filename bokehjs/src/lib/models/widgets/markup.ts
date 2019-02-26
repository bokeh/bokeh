import {VariadicBox} from "core/layout"
import {div} from "core/dom"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"

export abstract class MarkupView extends WidgetView {
  model: Markup

  protected markup_el: HTMLElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => {
      this.render()
      this.root.compute_layout() // XXX: invalidate_layout?
    })
  }

  _update_layout(): void {
    this.layout = new VariadicBox(this.el)
    this.layout.set_sizing(this.box_sizing())
  }

  render(): void {
    super.render()
    const style = {...this.model.style, display: "inline-block"}
    this.markup_el = div({class: "bk-clearfix", style})
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

  constructor(attrs?: Partial<Markup.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Markup"

    this.define<Markup.Props>({
      text:  [ p.String, '' ],
      style: [ p.Any,    {} ],
    })

    this.override({
      width: 300,
    })
  }
}
Markup.initClass()
