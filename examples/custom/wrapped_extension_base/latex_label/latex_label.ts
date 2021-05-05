import {Label, LabelView} from "@bokehjs/models/annotations/label"
import * as p from "@bokehjs/core/properties"

import css from "./styles/latex_label.css"

declare namespace katex {
  function render(expression: string, element: HTMLElement, options: {displayMode?: boolean}): void
}

export class LatexLabelView extends LabelView {
  override model: LatexLabel

  override styles(): string[] {
    return [...super.styles(), css]
  }

  protected override _render(): void {
    this.el?.classList.add("label-style")

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

    const panel = this.layout ?? this.plot_view.layout.center_panel

    const {x, y} = this.model
    let sx = this.model.x_units == "data" ? this.coordinates.x_scale.compute(x) : panel.xview.compute(x)
    let sy = this.model.y_units == "data" ? this.coordinates.y_scale.compute(y) : panel.yview.compute(y)

    sx += this.model.x_offset
    sy -= this.model.y_offset

    this._css_text(this.layer.ctx, "", sx, sy, angle)
    katex.render(this.model.text, this.el!, {displayMode: true})
  }
}

export namespace LatexLabel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Label.Props
}

export interface LatexLabel extends LatexLabel.Attrs {}

export class LatexLabel extends Label {
  override properties: LatexLabel.Props
  override __view_type__: LatexLabelView

  static override __module__ = "latex_label"

  static init_LatexLabel(): void {
    this.prototype.default_view = LatexLabelView

    this.override<LatexLabel.Props>({
      render_mode: "css",
    })
  }
}
