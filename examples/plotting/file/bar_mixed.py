''' A combined bar and line chart using simple Python lists. This example
demonstrates mixing nested categorical factors with top-level categorical
factors.

.. bokeh-example-metadata::
    :apis: bokeh.models.ranges.FactorRange, bokeh.plotting.Figure.line, bokeh.plotting.Figure.vbar
    :refs: :ref:`userguide_categorical` > :ref:`userguide_categorical_bars` > :ref:`userguide_categorical_bars_mixed`
    :keywords: bar, line, vbar

'''
from bokeh.models import FactorRange
from bokeh.plotting import figure, show

factors = [
    ("Q1", "jan"), ("Q1", "feb"), ("Q1", "mar"),
    ("Q2", "apr"), ("Q2", "may"), ("Q2", "jun"),
    ("Q3", "jul"), ("Q3", "aug"), ("Q3", "sep"),
    ("Q4", "oct"), ("Q4", "nov"), ("Q4", "dec"),
]

p = figure(x_range=FactorRange(*factors), height=350,
           toolbar_location=None, tools="")

x = [ 10, 12, 16, 9, 10, 8, 12, 13, 14, 14, 12, 16 ]
p.vbar(x=factors, top=x, width=0.9, alpha=0.5)

p.line(x=["Q1", "Q2", "Q3", "Q4"], y=[12, 9, 13, 14], color="red", line_width=2)

p.y_range.start = 0
p.x_range.range_padding = 0.1
p.xaxis.major_label_orientation = 1
p.xgrid.grid_line_color = None

show(p)
