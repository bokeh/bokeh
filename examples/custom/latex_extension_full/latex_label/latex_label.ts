import {Label, LabelView} from "@bokehjs/models/annotations/label"

import * as katex from "katex"

//"https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.js"
//"https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.css"

export class LatexLabelView extends LabelView {
  model: LatexLabel

  protected _render(): void {
    // Here because AngleSpec does units tranform and label doesn't support specs
    let angle: number
    switch (this.model.angle_units) {
      case "rad": {
        angle = -1 * this.model.angle
        break
      }
      case "deg": {
        angle = -1 * this.model.angle * Math.PI/180.0
        break
      }
      default:
        throw new Error("unreachable")
    }

    const panel = this.panel || this.plot_view.frame

    const {x, y} = this.model
    let sx = this.model.x_units == "data" ? this.coordinates.x_scale.compute(x) : panel.xview.compute(x)
    let sy = this.model.y_units == "data" ? this.coordinates.y_scale.compute(y) : panel.yview.compute(y)

    sx += this.model.x_offset
    sy -= this.model.y_offset

    this._css_text(this.layer.ctx, "", sx, sy, angle)
    katex.render(this.model.text, this.el!, {displayMode: true})
  }
}

export class LatexLabel extends Label {
  static __module__ = "latex_label"

  static init_LatexLabel(): void {
    this.prototype.default_view = LatexLabelView

    this.override({
      render_mode: "css",
    })
  }
}
