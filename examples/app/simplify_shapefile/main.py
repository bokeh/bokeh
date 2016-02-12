from __future__ import print_function

import geopandas as gpd

from bokeh.plotting import Figure
from bokeh.io import curdoc
from bokeh.models import GeoJSONDataSource, Slider, VBox

from bokeh.sampledata.us_states_shp import shp_path

def simplify_features():
    global geo_source
    states_view['geometry'] = states.simplify(simplify_tolerance,
                                              preserve_topology=True)
    geo_source.geojson = states_view.to_json()

def on_slider_change(attr, old, new):
    global simplify_tolerance
    simplify_tolerance = new
    simplify_features()

simplify_tolerance = 0
states = gpd.read_file(shp_path)
states_view = states.copy()
geo_source = GeoJSONDataSource(geojson=states_view.to_json())
bounds = states.total_bounds

simplify_slider = Slider(title='Simplify Tolerance',
                         value=0, start=0, end=3, step=.1)
simplify_slider.on_change('value', on_slider_change)

p = Figure(plot_height=600, plot_width=900,
           x_range=(bounds[0], bounds[2]),
           y_range=(bounds[1], bounds[3]),
           tools='pan,wheel_zoom')

p.patches(xs='xs', ys='ys', alpha=0.9, source=geo_source)
layout = VBox(width=p.plot_width, children=[simplify_slider, p])
curdoc().add_root(layout)
