''' A combined bar and line chart using simple Python lists. This example
demonstrates mixing nested categorical factors with top-level categorical
factors.

.. bokeh-example-metadata::
    :apis: bokeh.models.FactorRange, bokeh.plotting.figure.line, bokeh.plotting.figure.vbar
    :refs: :ref:`ug_basic_bars_mixed`
    :keywords: bar, line, vbar

'''
from bokeh.models import FactorRange
from bokeh.palettes import TolPRGn4
from bokeh.plotting import figure, show

quarters =("Q1", "Q2", "Q3", "Q4")

months = (
    ("Q1", "jan"), ("Q1", "feb"), ("Q1", "mar"),
    ("Q2", "apr"), ("Q2", "may"), ("Q2", "jun"),
    ("Q3", "jul"), ("Q3", "aug"), ("Q3", "sep"),
    ("Q4", "oct"), ("Q4", "nov"), ("Q4", "dec"),
)

fill_color, line_color = TolPRGn4[2:]

p = figure(x_range=FactorRange(*months), height=500, tools="",
           background_fill_color="#fafafa", toolbar_location=None)

monthly = [10, 13, 16, 9, 10, 8, 12, 13, 14, 14, 12, 16]
p.vbar(x=months, top=monthly, width=0.8,
       fill_color=fill_color, fill_alpha=0.8, line_color=line_color, line_width=1.2)

quarterly = [13, 9, 13, 14]
p.line(x=quarters, y=quarterly, color=line_color, line_width=3)
p.scatter(x=quarters, y=quarterly, size=10,
          line_color=line_color, fill_color="white", line_width=3)

p.y_range.start = 0
p.x_range.range_padding = 0.1
p.xaxis.major_label_orientation = 1
p.xgrid.grid_line_color = None

show(p)
