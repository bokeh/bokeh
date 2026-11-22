''' Style major and minor axis tick lines separately.

.. bokeh-example-metadata::
    :title: Tick lines
    :keywords: tick, lines
    :apis: bokeh.plotting.figure.scatter
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.scatter([1,2,3,4,5], [2,5,8,2,7], size=10)

p.xaxis.major_tick_line_color = "firebrick"
p.xaxis.major_tick_line_width = 3
p.xaxis.minor_tick_line_color = "orange"

p.yaxis.minor_tick_line_color = None

p.axis.major_tick_out = 10
p.axis.minor_tick_in = -3
p.axis.minor_tick_out = 8

show(p)
