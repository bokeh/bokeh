''' Draw a single polygon using the nested coordinate format for multi-polygons.

.. bokeh-example-metadata::
    :title: Multipolygon simple
    :keywords: multipolygon, simple
    :apis: bokeh.plotting.figure.multi_polygons
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.multi_polygons(xs=[[[[1, 1, 2, 2]]]],
                 ys=[[[[3, 4, 4, 3]]]])

show(p)
