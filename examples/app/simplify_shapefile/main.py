from __future__ import print_function

try:
    import geopandas as gpd
except ImportError:
    print('''This example requires GeoPandas
          (http://geopandas.org/)
          \n try: pip install geopandas''')

from bokeh.plotting import Figure
from bokeh.io import curdoc
from bokeh.models import (GeoJSONDataSource, Slider,
                          VBox, Button, Paragraph, HBox)

def simplify_features():
    global geo_source
    states_view['geometry'] = states.simplify(simplify_tolerance,
                                              preserve_topology=True)
    geo_source.geojson = states_view.to_json()

def save_to_shapefile():
    states_view.to_file('fout.shp')

def on_slider_change(attr, old, new):
    global simplify_tolerance
    simplify_tolerance = new
    simplify_features()

# TODO: Add description paragraph

# TODO: Ouput file paragraph

# TODO: Resize button

# load shapefile
simplify_tolerance = 0
shapefile_path = '/Users/bcollins/Downloads/states_21basic/states.shp'
states = gpd.read_file(shapefile_path)
states_view = gpd.read_file(shapefile_path)
geo_source = GeoJSONDataSource(geojson=states_view.to_json())
bounds = states.total_bounds

# let's read some shapefile metadata
crs = states.crs
simplify_slider = Slider(title='Simplify Tolerance',
                         value=0, start=0, end=1, step=.01)
simplify_slider.on_change('value', on_slider_change)

save_button = Button(label='Save')
save_button.on_click(save_to_shapefile)

p = Figure(plot_height=600, plot_width=900,
           x_range=(bounds[0], bounds[2]), y_range=(bounds[1], bounds[3]))

polys = p.patches(xs='xs', ys='ys', alpha=0.9, source=geo_source)

controls = HBox(width=p.plot_width, children=[simplify_slider, save_button])
layout = VBox(width=p.plot_width, children=[controls, p])
curdoc().add_root(layout)
