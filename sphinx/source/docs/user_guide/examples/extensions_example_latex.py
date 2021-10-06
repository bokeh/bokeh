""" The LaTex example was derived from: http://matplotlib.org/users/usetex.html
"""

import numpy as np

from bokeh.models import HTMLLabel
from bokeh.plotting import figure, show
from bokeh.util.compiler import TypeScript

TS_CODE = """
import * as p from "core/properties"
import {HTMLLabel, HTMLLabelView} from "models/annotations/html/label"
declare const katex: any

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

  constructor(attrs?: Partial<LatexLabel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LatexLabelView
  }
}
"""


class LatexLabel(HTMLLabel):
    """A subclass of the Bokeh built-in `HTMLLabel` that supports rendering
    LaTex using the KaTex typesetting library.

    Only the render method of HTMLLabelView is overloaded to perform the
    text -> latex (via katex) conversion.
    """
    __javascript__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.js"]
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css"]
    __implementation__ = TypeScript(TS_CODE)


x = np.arange(0.0, 1.0 + 0.01, 0.01)
y = np.cos(2 * 2 * np.pi * x) + 2

p = figure(title="LaTex Demonstration", width=500, height=500)
p.line(x, y)

latex = LatexLabel(
    text="f = \\sum_{n=1}^\\infty\\frac{-e^{i\\pi}}{2^n}!",
    x=40,
    y=420,
    x_units="screen",
    y_units="screen",
    text_font_size="21px",
    background_fill_alpha=0,
)

p.add_layout(latex)

show(p)
