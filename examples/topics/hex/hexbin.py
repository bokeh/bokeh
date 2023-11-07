''' A automatic hexbin plot using randomly selected points. This chart shows
500 points points from a normal distribution binned into hexagonal tiles. A
hover tooltip displays information for each tile.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.hexbin
    :refs: :ref:`ug_topics_hex`
    :keywords: hex, hexbin, hover, tooltip

'''
import numpy as np

from bokeh.models import HoverTool
from bokeh.plotting import figure, show

n = 500
x = 2 + 2*np.random.standard_normal(n)
y = 2 + 2*np.random.standard_normal(n)

p = figure(title="Hexbin for 500 points", match_aspect=True,
           tools="wheel_zoom,reset", background_fill_color='#440154')
p.grid.visible = False

r, bins = p.hexbin(x, y, size=0.5, hover_color="pink", hover_alpha=0.8)

p.scatter(x, y, color="white", size=1)

p.add_tools(HoverTool(
    tooltips=[("count", "@c"), ("(q,r)", "(@q, @r)")],
    mode="mouse", point_policy="follow_mouse", renderers=[r],
))

show(p)
