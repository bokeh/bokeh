""" This example displays a CartoDB Positron base world map.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.add_tile
    :refs:  :ref:`ug_specialized_geo` > :ref:`ug_interaction_tools`
    :keywords: map, geo, tiles

"""

from bokeh.plotting import figure, output_file, show

output_file("tile_source.html")

# create plot and add tools
p = figure(x_range=(-2000000, 2000000), y_range=(1000000, 7000000),
           x_axis_type="mercator", y_axis_type="mercator")
p.add_tile("CartoDB Positron", retina=True)

show(p)
