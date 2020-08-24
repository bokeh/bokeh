""" The LaTex example was derived from: http://matplotlib.org/users/usetex.html
"""
import numpy as np
from scipy.special import jv

from bokeh.models import Label
from bokeh.palettes import Spectral4
from bokeh.plotting import figure, output_file, show
from bokeh.util.compiler import TypeScript

output_file('latex_extension.html')

class LatexLabel(Label):
    """A subclass of `Label` with all of the same class attributes except
    canvas mode isn't supported and DOM manipulation happens in the TypeScript
    superclass implementation that requires setting `render_mode='css'`).

    Only the render method of LabelView is overwritten to perform the
    text -> latex (via katex) conversion
    """
    __javascript__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.js"]
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.css"]
    __implementation__ = TypeScript("""
import {Label, LabelView} from "models/annotations/label"

declare namespace katex {
  function render(expression: string, element: HTMLElement, options: {displayMode?: boolean}): void
}

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
  static init_LatexLabel(): void {
    this.prototype.default_view = LatexLabelView

    this.override({
      render_mode: "css",
    })
  }
}
""")

p = figure(title="LaTex Extension Demonstration", plot_width=800, plot_height=350,
           background_fill_color="#fafafa")
p.x_range.range_padding = 0

x = np.arange(0.0, 20.0, 0.02)

for i, n in enumerate([0, 1, 4, 7]):
    p.line(x, jv(n, x), line_width=3, color=Spectral4[i], alpha=0.8, legend_label="𝜈=%d" % n)


text = (r"\text{Bessel Functions of the First Kind: }" +
        r"J_\nu = \sum_{m=0}^{\infty}\frac{(-1)^m}{m!\ \Gamma(m+\nu+1)}" +
        r"\left(\frac{x}{2}\right)^{2m+\nu}")
latex = LatexLabel(text=text,x=4.5, y=250, x_units='data', y_units='screen',
                   render_mode='css', text_font_size='11px',
                   background_fill_color="white", border_line_color="lightgrey")

p.add_layout(latex)

show(p)
