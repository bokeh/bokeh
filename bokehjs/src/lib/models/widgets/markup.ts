import * as p from "core/properties"
import {empty, div} from "core/dom"

import {Widget, WidgetView} from "./widget"

export class MarkupView extends WidgetView {
  model: Markup

  protected markupEl: HTMLElement

  initialize(options: any): void {
    super.initialize(options)
    this.render()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  render(): void {
    super.render()
    empty(this.el)
    const style = {
      width: `${this.model.width}px`,
      height: `${this.model.height}px`,
      ...this.model.style,
    }
    this.markupEl = div({style: style})
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

export class Markup extends Widget {

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
  }
}

Markup.initClass()
