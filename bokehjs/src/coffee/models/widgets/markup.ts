import * as p from "core/properties"
import {empty, div} from "core/dom"
import {extend} from "core/util/object"

import {Widget, WidgetView} from "./widget"

export class MarkupView extends WidgetView {
  model: Markup

  initialize(options: any): void {
    super.initialize(options)
    this.render()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  render(): void {
    super()
    empty(this.el)
    const style = extend({
      width: `${this.model.width}px`,
      height: `${this.model.height}px`,
    }, this.model.style)
    this.markupEl = div({style: style})
    this.el.appendChild(this.markupEl)
  }
}

export class Markup extends Widget {
}

Markup.prototype.type = "Markup"

Markup.define({
  text: [ p.String, '' ],
  style: [ p.Any, {} ],
})
