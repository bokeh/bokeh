import {Label, LabelView} from "@bokehjs/models/annotations/label"

declare namespace katex {
  function render(expression: string, element: HTMLElement, options: {displayMode?: boolean}): void
}

export class LatexLabelView extends LabelView {
  model: LatexLabel

  render(): void {
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

    const xscale = this.plot_view.frame.xscales[this.model.x_range_name]
    const yscale = this.plot_view.frame.yscales[this.model.y_range_name]

    const {x, y} = this.model
    let sx = this.model.x_units == "data" ? xscale.compute(x) : panel.xview.compute(x)
    let sy = this.model.y_units == "data" ? yscale.compute(y) : panel.yview.compute(y)

    sx += this.model.x_offset
    sy -= this.model.y_offset

    this._css_text(this.plot_view.canvas_view.ctx, "", sx, sy, angle)
    katex.render(this.model.text, this.el, {displayMode: true})
  }
}

export class LatexLabel extends Label {
  static __module__ = "latex_label"

  static init_LatexLabel(): void {
    this.prototype.default_view = LatexLabelView
  }
}
