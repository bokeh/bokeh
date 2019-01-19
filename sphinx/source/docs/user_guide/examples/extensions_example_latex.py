""" The LaTex example was derived from: http://matplotlib.org/users/usetex.html
"""

import numpy as np

from bokeh.models import Label
from bokeh.plotting import figure, show
from bokeh.util.compiler import TypeScript

TS_CODE = """
import {Label, LabelView} from "models/annotations/label"

export class LatexLabelView extends LabelView {
  model: LatexLabel

  render() {
    //--- Start of copied section from ``Label.render`` implementation

    // Here because AngleSpec does units tranform and label doesn't support specs
    let angle: number
    switch (this.model.angle_units) {
      case "rad":
        angle = -1 * this.model.angle
        break
      case "deg":
        angle = -1 * this.model.angle * Math.PI / 180.0
        break
      default:
        throw new Error("Unknowned unit")
    }
    const panel = (this.model.panel != null) ? this.model.panel : this.plot_view.frame
    const xscale = this.plot_view.frame.xscales[this.model.x_range_name]
    const yscale = this.plot_view.frame.yscales[this.model.y_range_name]

    let sx: number; let sy: number
    if (this.model.x_units == "data")
      sx = xscale.compute(this.model.x)
    else
      sx = panel.xview.compute(this.model.x)
    if (this.model.x_units == "data")
      sy = yscale.compute(this.model.y)
    else
      sy = panel.yview.compute(this.model.y)
    sx += this.model.x_offset
    sy += this.model.x_offset

    //--- End of copied section from ``Label.render`` implementation
    // Must render as superpositioned div (not on canvas) so that KaTex
    // css can properly style the text
    this._css_text(this.plot_view.canvas_view.ctx, "", sx, sy, angle)

    // ``katex`` is loaded into the global window at runtime
    // katex.renderToString returns a html ``span`` element
    return katex.render(this.model.text, this.el, {displayMode: true})
  }
}

export class LatexLabel extends Label {

  static initClass() {
    this.prototype.type = 'LatexLabel'
    this.prototype.default_view = LatexLabelView
  }
}
LatexLabel.initClass()
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
y = np.cos(2*2*np.pi*x) + 2

p = figure(title="LaTex Demonstration", plot_width=500, plot_height=500)
p.line(x, y)

# Note: must set ``render_mode="css"``
latex = LatexLabel(text="f = \sum_{n=1}^\infty\\frac{-e^{i\pi}}{2^n}!",
                   x=40, y=445, x_units='screen', y_units='screen',
                   render_mode='css', text_font_size='16pt',
                   background_fill_alpha=0)

p.add_layout(latex)

show(p)
