''' Fill a single polygon using its ordered vertices.

.. bokeh-example-metadata::
    :title: Patch single
    :keywords: patch single, basic plotting, areas
    :apis: bokeh.plotting.figure.patch
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400)

# add a patch renderer with an alpha and line width
p.patch([1, 2, 3, 4, 5], [6, 7, 8, 7, 3], alpha=0.5, line_width=2)

show(p)
