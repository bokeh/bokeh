''' This example demonstrates how a circle with a data-space radius appears
when plotted with different aspect scales specified.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure, bokeh.plotting.show, bokeh.layouts.layout
    :refs: :ref:`ug_basic_layouts`
    :keywords: rect, circle, layout, aspect, scale
'''

from bokeh.layouts import layout
from bokeh.plotting import figure, show

p1 = figure(match_aspect=True, title="Circle touches all 4 sides of square")
p1.rect(0, 0, 300, 300, line_color='black')
p1.circle(x=0, y=0, radius=150, line_color='black', fill_color='grey',
          radius_units='data')

def draw_test_figure(aspect_scale=1, width=300, height=300):
    p = figure(
        width=width,
        height=height,
        match_aspect=True,
        aspect_scale=aspect_scale,
        title=f"Aspect scale = {aspect_scale}",
        toolbar_location=None)
    p.scatter([-1, +1, +1, -1], [-1, -1, +1, +1])
    return p

aspect_scales = [0.25, 0.5, 1, 2, 4]
p2s = [draw_test_figure(aspect_scale=i) for i in aspect_scales]

sizes = [(100, 400), (200, 400), (400, 200), (400, 100)]
p3s = [draw_test_figure(width=a, height=b) for (a, b) in sizes]

layout = layout(children=[[p1], p2s, p3s])

show(layout)
