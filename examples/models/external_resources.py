""" The LaTex example was derived from: http://matplotlib.org/users/usetex.html
"""

from bokeh.core.properties import Override
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
Label = require "models/annotations/label"

class LatexLabelView extends Label.View
  render: () ->
    ctx = @plot_view.canvas_view.ctx

    # Here because AngleSpec does units tranform and label doesn't support specs
    switch @mget('angle_units')
      when "rad" then angle = -1 * @mget('angle')
      when "deg" then angle = -1 * @mget('angle') * Math.PI/180.0

    if @mget('x_units') == "data"
      vx = @xmapper.map_to_target(@mget('x'))
    else
      vx = @mget('x')
    sx = @canvas.vx_to_sx(vx)

    if @mget('y_units') == "data"
      vy = @ymapper.map_to_target(@mget('y'))
    else
      vy = @mget('y')
    sy = @canvas.vy_to_sy(vy)

    if @model.panel?
      panel_offset = @_get_panel_offset()
      sx += panel_offset.x
      sy += panel_offset.y

    latex = katex.renderToString(@mget('text'), {displayMode: true})

    @_css_text(ctx, latex, sx + @mget('x_offset'), sy - @mget('y_offset'), angle)

class LatexLabel extends Label.Model
  type: 'LatexLabel'
  default_view: LatexLabelView

module.exports =
  Model: LatexLabel
  View: LatexLabelView
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
