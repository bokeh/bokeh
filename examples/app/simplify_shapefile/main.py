from __future__ import print_function
from os import path

import geopandas as gpd

from bokeh.plotting import Figure
from bokeh.io import curdoc
from bokeh.models import (GeoJSONDataSource, Slider,
                          VBox, Button, Paragraph, HBox)

from bokeh.sampledata.us_states_shp import shp_path

def simplify_features():
    global geo_source
    states_view['geometry'] = states.simplify(simplify_tolerance,
                                              preserve_topology=True)
    geo_source.geojson = states_view.to_json()

def save_to_shapefile():
    _, input_file = path.split(shp_path)
    input_shp_name = path.splitext(input_file)[0]
    output_shp_name = '{}_simplified_{}.shp'.format(input_shp_name, simplify_tolerance) 
    output_full_path = path.join(path.expanduser('~'), output_shp_name)
    status.text = 'Saved file: {}'.format(output_full_path)

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

save_button = Button(label='Save')
save_button.on_click(save_to_shapefile)

p = Figure(plot_height=600, plot_width=900,
           x_range=(bounds[0], bounds[2]), 
           y_range=(bounds[1], bounds[3]),
           tools='pan,wheel_zoom')

polys = p.patches(xs='xs', ys='ys', alpha=0.9, source=geo_source)
status  = Paragraph(text='')
controls = HBox(width=p.plot_width, children=[simplify_slider, save_button, status])
layout = VBox(width=p.plot_width, children=[controls, p])
curdoc().add_root(layout)
