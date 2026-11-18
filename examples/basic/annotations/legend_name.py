''' Route line glyphs to different legends by legend name.

.. bokeh-example-metadata::
    :title: Legend name
    :keywords: legend name, basic plotting, annotations
    :apis: bokeh.models.Legend, bokeh.models.LinearAxis, bokeh.models.Range1d, bokeh.plotting.figure.add_layout, bokeh.plotting.figure.line
'''

from bokeh.models import Legend, LinearAxis, Range1d
from bokeh.plotting import figure, show

p = figure(y_range=Range1d(0.9, 3.1), toolbar_location="above")

p.add_layout(Legend(click_policy="hide", location="left"), "below")
p.add_layout(Legend(click_policy="hide", location="right", name="right"), "below")

p.extra_y_ranges = {"foo": Range1d(-3.1, 0.1)}
p.add_layout(LinearAxis(y_range_name="foo"), 'right')

p.line([1, 2, 3], [1, 2, 3], color='blue', legend_label="blue line")
p.line([1, 2, 3], [0, -2, -3], color='red', legend_label="red line", legend_name="right", y_range_name="foo")

show(p)
