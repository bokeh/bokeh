""" The LaTex example was derived from: http://matplotlib.org/users/usetex.html
"""

import numpy as np

from bokeh.models import Label
from bokeh.plotting import figure, show

JS_CODE = """
import {Label, LabelView} from "models/annotations/label"

export class LatexLabelView extends LabelView
  render: () ->

    #--- Start of copied section from ``Label.render`` implementation

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

    #--- End of copied section from ``Label.render`` implementation

    # ``katex`` is loaded into the global window at runtime
    # katex.renderToString returns a html ``span`` element
    latex = katex.renderToString(@model.text, {displayMode: true})

    # Must render as superpositioned div (not on canvas) so that KaTex
    # css can properly style the text
    @_css_text(ctx, latex, sx + @model.x_offset, sy - @model.y_offset, angle)

export class LatexLabel extends Label
  type: 'LatexLabel'
  default_view: LatexLabelView
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
    __implementation__ = JS_CODE

x = np.arange(0.0, 1.0 + 0.01, 0.01)
y = np.cos(2*2*np.pi*x) + 2

p = figure(title="LaTex Demonstration", width=500, height=500)
p.line(x, y)

# Note: must set ``render_mode="css"``
latex = LatexLabel(text="f = \sum_{n=1}^\infty\\frac{-e^{i\pi}}{2^n}!",
                   x=35, y=445, x_units='screen', y_units='screen',
                   render_mode='css', text_font_size='16pt',
                   background_fill_color='#ffffff')

p.add_layout(latex)

show(p)
