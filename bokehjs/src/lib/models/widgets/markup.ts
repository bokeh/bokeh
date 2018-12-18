import * as p from "core/properties"
import {div} from "core/dom"

import {Widget, WidgetView} from "./widget"

export abstract class MarkupView extends WidgetView {
  model: Markup

  protected markupEl: HTMLElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  render(): void {
    super.render()
    this.markupEl = div({class: "bk-clearfix", style: this.model.style})
    this.el.appendChild(this.markupEl)
  }
}

export namespace Markup {
  export interface Attrs extends Widget.Attrs {
    text: string
    style: {[key: string]: string}
  }

  export interface Props extends Widget.Props {}
}

export interface Markup extends Markup.Attrs {}

export abstract class Markup extends Widget {
  properties: Markup.Props

  constructor(attrs?: Partial<Markup.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Markup"

    this.define({
      text:  [ p.String, '' ],
      style: [ p.Any,    {} ],
    })

    this.override({
      width: 300,
    })
  }
}
Markup.initClass()
