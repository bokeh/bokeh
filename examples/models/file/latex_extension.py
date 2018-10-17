""" The LaTex example was derived from: http://matplotlib.org/users/usetex.html
"""

from bokeh.models import Label
from bokeh.palettes import Spectral4
from bokeh.plotting import output_file, figure, show

import numpy as np
from scipy.special import jv

output_file('external_resources.html')

class LatexLabel(Label):
    """A subclass of `Label` with all of the same class attributes except
    canvas mode isn't supported and DOM manipulation happens in the coffeescript
    superclass implementation that requires setting `render_mode='css'`).

    Only the render method of LabelView is overwritten to perform the
    text -> latex (via katex) conversion
    """
    __javascript__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.9.0/katex.min.js"]
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.9.0/katex.min.css"]
    __implementation__ = """
import {Label, LabelView} from "models/annotations/label"

export class LatexLabelView extends LabelView
  render: () ->
    # Here because AngleSpec does units tranform and label doesn't support specs
    switch @model.angle_units
      when "rad" then angle = -1 * @model.angle
      when "deg" then angle = -1 * @model.angle * Math.PI/180.0

    panel = @model.panel ? @plot_view.frame

    xscale = @plot_view.frame.xscales[@model.x_range_name]
    yscale = @plot_view.frame.yscales[@model.y_range_name]

    sx = if @model.x_units == "data" then xscale.compute(@model.x) else panel.xview.compute(@model.x)
    sy = if @model.y_units == "data" then yscale.compute(@model.y) else panel.yview.compute(@model.y)

    sx += @model.x_offset
    sy -= @model.y_offset

    @_css_text(@plot_view.canvas_view.ctx, "", sx, sy, angle)
    katex.render(@model.text, @el, {displayMode: true})

export class LatexLabel extends Label
  type: 'LatexLabel'
  default_view: LatexLabelView
"""

p = figure(title="LaTex Extension Demonstration", plot_width=800, plot_height=350,
           background_fill_color="#fafafa")
p.x_range.range_padding = 0

x = np.arange(0.0, 20.0, 0.02)

for i, n in enumerate([0, 1, 4, 7]):
    p.line(x, jv(n, x), line_width=3, color=Spectral4[i], alpha=0.8, legend="𝜈=%d" % n)


text = (r"\text{Bessel Functions of the First Kind: }" +
        r"J_\nu = \sum_{m=0}^{\infty}\frac{(-1)^m}{m!\ \Gamma(m+\nu+1)}" +
        r"\left(\frac{x}{2}\right)^{2m+\nu}")
latex = LatexLabel(text=text,x=4.5, y=250, x_units='data', y_units='screen',
                   render_mode='css', text_font_size='8pt',
                   background_fill_color="white", border_line_color="lightgrey")

p.add_layout(latex)

show(p)
