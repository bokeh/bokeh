''' A demonstration of configuring different arrow types.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.circle, bokeh.plotting.figure.add_layout
    :refs: :ref:`ug_basic_annotations_arrows`
    :keywords: arrows

'''
from bokeh.models import Arrow, NormalHead, OpenHead, VeeHead
from bokeh.palettes import Muted3 as color
from bokeh.plotting import figure, show

p = figure(tools="", toolbar_location=None, background_fill_color="#efefef")
p.grid.grid_line_color = None

p.circle(x=(0, 1, 0.5), y=(0, 0, 0.7), radius=0.1, color="#fafafa")

vh = VeeHead(size=35, fill_color=color[0])
p.add_layout(Arrow(end=vh, x_start=0.5, y_start=0.7, x_end=0, y_end=0))

nh = NormalHead(fill_color=color[1], fill_alpha=0.5, line_color=color[1])
p.add_layout(Arrow(end=nh, line_color=color[1], line_dash=[15, 5],
                   x_start=1, y_start=0, x_end=0.5, y_end=0.7))

oh = OpenHead(line_color=color[2], line_width=5)
p.add_layout(Arrow(end=oh, line_color=color[2], line_width=5,
                   x_start=0, y_start=0, x_end=1, y_end=0))

show(p)
