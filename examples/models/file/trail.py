# -*- coding: utf-8 -*-

from __future__ import print_function

from math import sin, cos, atan2, sqrt, radians

import numpy as np
import scipy.ndimage as im

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.util.browser import view

from bokeh.models.glyphs import Line, Patches
from bokeh.models.layouts import Column
from bokeh.models import (
    Plot, GMapPlot, GMapOptions,
    DataRange1d, ColumnDataSource,
    LinearAxis, Grid,
    PanTool, WheelZoomTool, ResetTool)

from bokeh.sampledata.mtb import obiszow_mtb_xcm


def haversin(theta):
    return sin(0.5 * theta) ** 2


def distance(p1, p2):
    """Distance between (lat1, lon1) and (lat2, lon2). """
    R = 6371

    lat1, lon1 = p1
    lat2, lon2 = p2

    phi1 = radians(lat1)
    phi2 = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)

    a = haversin(delta_lat) + cos(phi1) * cos(phi2) * haversin(delta_lon)
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))


def prep_data(dataset):
    df = dataset.copy()

    latlon = list(zip(df.lat, df.lon))
    dist = np.array([distance(latlon[i + 1], latlon[i]) for i in range(len((latlon[:-1])))])

    df["dist"] = np.concatenate(([0], np.cumsum(dist)))

    slope = np.abs(100 * np.diff(df.alt) / (1000 * dist))
    slope[np.where(                 slope <  4) ] = 0 # "green"
    slope[np.where((slope >=  4) & (slope <  6))] = 1 # "yellow"
    slope[np.where((slope >=  6) & (slope < 10))] = 2 # "pink"
    slope[np.where((slope >= 10) & (slope < 15))] = 3 # "orange"
    slope[np.where( slope >= 15                )] = 4 # "red"
    slope = im.median_filter(slope, 6)

    colors = np.empty_like(slope, dtype=object)
    colors[np.where(slope == 0)] = "green"
    colors[np.where(slope == 1)] = "yellow"
    colors[np.where(slope == 2)] = "pink"
    colors[np.where(slope == 3)] = "orange"
    colors[np.where(slope == 4)] = "red"
    df["colors"] = list(colors) + [None]              # NOTE: add [None] just make pandas happy

    return df

name = "Obiszów MTB XCM"

# Google Maps now requires an API key. You can find out how to get one here:
# https://developers.google.com/maps/documentation/javascript/get-api-key
API_KEY = "XXXXXXXXXXX"

def trail_map(data):
    lon = (min(data.lon) + max(data.lon)) / 2
    lat = (min(data.lat) + max(data.lat)) / 2

    map_options = GMapOptions(lng=lon, lat=lat, zoom=13)
    plot = GMapPlot(plot_width=800, plot_height=800, map_options=map_options, api_key=API_KEY)
    plot.title.text = "%s - Trail Map" % name
    plot.x_range = DataRange1d()
    plot.y_range = DataRange1d()
    plot.add_tools(PanTool(), WheelZoomTool(), ResetTool())

    line_source = ColumnDataSource(dict(x=data.lon, y=data.lat, dist=data.dist))
    line = Line(x="x", y="y", line_color="blue", line_width=2)
    plot.add_glyph(line_source, line)

    return plot


def altitude_profile(data):
    plot = Plot(plot_width=800, plot_height=400)
    plot.title.text = "%s - Altitude Profile" % name
    plot.x_range = DataRange1d()
    plot.y_range = DataRange1d(range_padding=0)

    xaxis = LinearAxis(axis_label="Distance (km)")
    plot.add_layout(xaxis, 'below')

    yaxis = LinearAxis(axis_label="Altitude (m)")
    plot.add_layout(yaxis, 'left')

    plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))  # x grid
    plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))  # y grid

    plot.add_tools(PanTool(), WheelZoomTool(), ResetTool())

    X, Y = data.dist, data.alt
    y0 = min(Y)

    patches_source = ColumnDataSource(dict(
        xs=[[X[i], X[i+1], X[i+1], X[i]] for i in range(len(X[:-1])) ],
        ys=[[y0,   y0,     Y[i+1], Y[i]] for i in range(len(Y[:-1])) ],
        color=data.colors[:-1]
    ))
    patches = Patches(xs="xs", ys="ys", fill_color="color", line_color="color")
    plot.add_glyph(patches_source, patches)

    line_source = ColumnDataSource(dict(x=data.dist, y=data.alt))
    line = Line(x='x', y='y', line_color="black", line_width=1)
    plot.add_glyph(line_source, line)

    return plot

data = prep_data(obiszow_mtb_xcm)

trail = trail_map(data)
altitude = altitude_profile(data)

layout = Column(children=[altitude, trail])

doc = Document()
doc.add_root(layout)

if __name__ == "__main__":
    doc.validate()
    filename = "trail.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Trail map and altitude profile"))
    print("Wrote %s" % filename)
    view(filename)
