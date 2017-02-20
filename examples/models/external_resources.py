""" The LaTex example was derived from: http://matplotlib.org/users/usetex.html
"""

from bokeh.models import Label
from bokeh.plotting import output_file, figure, show

import numpy as np

output_file('external_resources.html')

class LatexLabel(Label):
    """A subclass of `Label` with all of the same class attributes except
    canvas mode isn't supported and DOM manipulation happens in the coffeescript
    superclass implementation that requires setting `render_mode='css'`).

    Only the render method of LabelView is overwritten to perform the
    text -> latex (via katex) conversion
    """
    __javascript__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.js"]
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css"]
    __implementation__ = """
import {Label, LabelView} from "models/annotations/label"

export class LatexLabelView extends LabelView
  render: () ->
    ctx = @plot_view.canvas_view.ctx

    # Here because AngleSpec does units tranform and label doesn't support specs
    switch @model.angle_units
      when "rad" then angle = -1 * @model.angle
      when "deg" then angle = -1 * @model.angle * Math.PI/180.0

    if @model.x_units == "data"
      vx = @xmapper.map_to_target(@model.x)
    else
      vx = @model.x
    sx = @canvas.vx_to_sx(vx)

    if @model.y_units == "data"
      vy = @ymapper.map_to_target(@model.y)
    else
      vy = @model.y
    sy = @canvas.vy_to_sy(vy)

    if @model.panel?
      panel_offset = @_get_panel_offset()
      sx += panel_offset.x
      sy += panel_offset.y

    @_css_text(ctx, "", sx + @model.x_offset, sy - @model.y_offset, angle)
    katex.render(@model.text, @el, {displayMode: true})

export class LatexLabel extends Label
  type: 'LatexLabel'
  default_view: LatexLabelView
"""

x = np.arange(0.0, 1.0 + 0.01, 0.01)
y = np.cos(2*2*np.pi*x) + 2

p = figure(title="LaTex Demonstration", width=500, height=500)
p.line(x, y)

latex = LatexLabel(text="f = \sum_{n=1}^\infty\\frac{-e^{i\pi}}{2^n}!",
                   x=35, y=445, x_units='screen', y_units='screen',
                   render_mode='css', text_font_size='16pt',
                   background_fill_color='#ffffff')

p.add_layout(latex)

show(p)
