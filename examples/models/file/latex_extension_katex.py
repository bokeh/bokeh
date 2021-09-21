""" The LaTex example was derived from: http://matplotlib.org/users/usetex.html
"""
import numpy as np
from scipy.special import jv

from bokeh.models import HTMLLabel
from bokeh.palettes import Spectral4
from bokeh.plotting import figure, show
from bokeh.util.compiler import TypeScript


class LatexLabel(HTMLLabel):
    """A subclass of `HTMLLabel` with all of the same class attributes except
    canvas mode isn't supported and DOM manipulation happens in the TypeScript
    superclass implementation that requires setting).

    Only the render method of HTMLLabelView is overwritten to perform the
    text -> latex (via katex) conversion
    """
    __javascript__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.js"]
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.css"]
    __implementation__ = TypeScript("""
import {HTMLLabel, HTMLLabelView} from "models/annotations/html/label"
import * as p from "core/properties"

declare namespace katex {
  function render(expression: string, element: HTMLElement, options: {displayMode?: boolean}): void
}

export class LatexLabelView extends HTMLLabelView {
  model: LatexLabel

  protected override _render(): void {
    super._render()
    katex.render(this.model.text, this.el, {displayMode: true})
  }
}

export namespace LatexLabel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HTMLLabel.Props
}

export interface LatexLabel extends LatexLabel.Attrs {}

export class LatexLabel extends HTMLLabel {
  properties: LatexLabel.Props
  __view_type__: LatexLabelView

  static {
    this.prototype.default_view = LatexLabelView
  }
}
""")

p = figure(title="LaTex Extension Demonstration",
           width=800, height=350,
           background_fill_color="#fafafa")
p.x_range.range_padding = 0

x = np.arange(0.0, 20.0, 0.02)

for i, n in enumerate([0, 1, 4, 7]):
    p.line(x, jv(n, x), line_width=3, color=Spectral4[i], alpha=0.8, legend_label=f"𝜈={n}")

text = r"""
\text{Bessel Functions of the First Kind: }
J_\nu = \sum_{m=0}^{\infty}\frac{(-1)^m}{m!\ \Gamma(m+\nu+1)}
\left(\frac{x}{2}\right)^{2m+\nu}
"""

latex = LatexLabel(
    text=text,
    x=4.5, y=250,
    x_units="data", y_units="screen",
    text_font_size="11px",
    background_fill_color="white", border_line_color="lightgrey",
)
p.add_layout(latex)

show(p)
