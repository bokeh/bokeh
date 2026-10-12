''' Inherited arrowhead visuals on Line and Bezier paths.

.. bokeh-example-metadata::
    :apis: bokeh.models.NormalHead, bokeh.plotting.figure.line, bokeh.plotting.figure.bezier
    :refs: :ref:`ug_basic_annotations_arrows`
    :keywords: arrows, decorations, inheritance, line, bezier

'''
from bokeh.layouts import column
from bokeh.models import CustomJS, NormalHead, Slider
from bokeh.plotting import figure, show

p = figure(width=750, height=400, x_range=(0, 6), y_range=(0, 4),
           title="Arrowheads inherit color and alpha, with a thin outline", tools="")
# Keep filled heads crisp when the shaft grows thicker.
head = NormalHead(size=18, line_width=1,
                  inherit_visuals=["line_color", "line_alpha", "fill_color", "fill_alpha"])

line = p.line([0.5, 2, 3, 5.5], [3, 3.5, 2.6, 3], line_color="#0072B2", line_width=3)
line.add_decoration("end", head, inset=10)
curve = p.bezier(x0=0.5, y0=1, x1=5.5, y1=1, cx0=2, cy0=3, cx1=4, cy1=-1,
                 line_color="#009E73", line_width=3)
curve.add_decoration("start", head, inset=10)
curve.add_decoration("end", head, inset=10)

width = Slider(title="Shaft width (head outline stays at 1 px)", start=1, end=8, value=3, step=1, width=750, name="shaft-width")
width.js_on_change("value", CustomJS(args=dict(line=line.glyph, curve=curve.glyph), code="""
    line.line_width = cb_obj.value
    curve.line_width = cb_obj.value
"""))
layout = column(width, p)
show(layout)
