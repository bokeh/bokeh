""" The LaTex example was derived from: http://matplotlib.org/users/usetex.html
"""

import numpy as np

from bokeh.models import Label
from bokeh.plotting import figure, show
from bokeh.util.compiler import TypeScript

TS_CODE = """
import * as p from "core/properties"
import {Label, LabelView} from "models/annotations/label"
declare const katex: any

export class LatexLabelView extends LabelView {
  model: LatexLabel

  render(): void {
    //--- Start of copied section from ``Label.render`` implementation

    // Here because AngleSpec does units tranform and label doesn't support specs
    let angle: number
    switch (this.model.angle_units) {
      case "rad": {
        angle = -this.model.angle
        break
      }
      case "deg": {
        angle = (-this.model.angle * Math.PI) / 180.0
        break
      }
      default:
        throw new Error("unreachable code")
    }

    const panel = this.panel != null ? this.panel : this.plot_view.frame

    let sx = this.model.x_units == "data" ? this.coordinates.x_scale.compute(this.model.x) : panel.xview.compute(this.model.x)
    let sy = this.model.y_units == "data" ? this.coordinates.y_scale.compute(this.model.y) : panel.yview.compute(this.model.y)

    sx += this.model.x_offset
    sy -= this.model.y_offset

    //--- End of copied section from ``Label.render`` implementation
    // Must render as superpositioned div (not on canvas) so that KaTex
    // css can properly style the text
    this._css_text(this.layer.ctx, "", sx, sy, angle)

    // ``katex`` is loaded into the global window at runtime
    // katex.renderToString returns a html ``span`` element
    katex.render(this.model.text, this.el, {displayMode: true})
  }
}

export namespace LatexLabel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Label.Props
}

export interface LatexLabel extends LatexLabel.Attrs {}

export class LatexLabel extends Label {
  properties: LatexLabel.Props
  __view_type__: LatexLabelView

  constructor(attrs?: Partial<LatexLabel.Attrs>) {
    super(attrs)
  }

  static init_LatexLabel() {
    this.prototype.default_view = LatexLabelView
  }
}
"""


class LatexLabel(Label):
    """A subclass of the Bokeh built-in `Label` that supports rendering
    LaTex using the KaTex typesetting library.

    Only the render method of LabelView is overloaded to perform the
    text -> latex (via katex) conversion. Note: ``render_mode="canvas``
    isn't supported and certain DOM manipulation happens in the Label
    superclass implementation that requires explicitly setting
    `render_mode='css'`).
    """
    __javascript__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.js"]
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css"]
    __implementation__ = TypeScript(TS_CODE)


x = np.arange(0.0, 1.0 + 0.01, 0.01)
y = np.cos(2 * 2 * np.pi * x) + 2

p = figure(title="LaTex Demonstration", plot_width=500, plot_height=500)
p.line(x, y)

# Note: must set ``render_mode="css"``
latex = LatexLabel(
    text="f = \\sum_{n=1}^\\infty\\frac{-e^{i\\pi}}{2^n}!",
    x=40,
    y=420,
    x_units="screen",
    y_units="screen",
    render_mode="css",
    text_font_size="21px",
    background_fill_alpha=0,
)

p.add_layout(latex)

show(p)
