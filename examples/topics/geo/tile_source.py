""" This example displays a CartoDB Positron base world map.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.add_tile
    :refs:  :ref:`ug_topics_geo`
    :keywords: map, geo, tiles

"""
from bokeh.plotting import figure, show

# range bounds supplied in web mercator coordinates
p = figure(x_range=(-2000000, 2000000), y_range=(1000000, 7000000),
           x_axis_type="mercator", y_axis_type="mercator")

p.add_tile("CartoDB Positron", retina=True)

show(p)
