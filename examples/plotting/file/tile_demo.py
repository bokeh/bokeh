# Demonstrate Bokeh's various map tile providers including OSM, WIKIMEDIA,
# and ESRI_IMAGERY tile providers.
#
# All maps are connected with common pan and zoom.
#
# Usage:
#   python3 tile_demo.py

import numpy as np

from bokeh.layouts import layout
from bokeh.models.ranges import DataRange1d
from bokeh.models.widgets import Div
from bokeh.plotting import figure, output_file, show
from bokeh.tile_providers import Vendors, get_provider

output_file("tile_demo.html")

# helper function for coordinate conversion between lat/lon in decimal degrees to web mercator
def lnglat_to_meters(longitude, latitude):
    """
    Projects the given (longitude, latitude) values into Web Mercator
    coordinates (meters East of Greenwich and meters North of the Equator).

    Longitude and latitude can be provided as scalars, Pandas columns,
    or Numpy arrays, and will be returned in the same form.  Lists
    or tuples will be converted to Numpy arrays.

    Examples:
       easting, northing = lnglat_to_meters(-74,40.71)

       easting, northing = lnglat_to_meters(np.array([-74]),np.array([40.71]))

       df=pandas.DataFrame(dict(longitude=np.array([-74]),latitude=np.array([40.71])))
       df.loc[:, 'longitude'], df.loc[:, 'latitude'] = lnglat_to_meters(df.longitude,df.latitude)
    """
    if isinstance(longitude, (list, tuple)):
        longitude = np.array(longitude)
    if isinstance(latitude, (list, tuple)):
        latitude = np.array(latitude)

    origin_shift = np.pi * 6378137
    easting = longitude * origin_shift / 180.0
    northing = np.log(np.tan((90 + latitude) * np.pi / 360.0)) * origin_shift / np.pi
    return (easting, northing)


description = Div(text="""<b><code>tile_demo.py</code></b> - Bokeh tile provider examples. Linked Pan and Zoom on all maps!""")

# pick a location and generate a 4-point window around it: bottom-left, upper-right
lat = 30.268801   # Lady Bird Lake, Austin Texas
lon = -97.763347

EN = lnglat_to_meters(lon,lat)
dE = 1000 # (m) Easting  plus-and-minus from map center
dN = 1000 # (m) Northing plus-and-minus from map center

x_range = DataRange1d(start=EN[0]-dE , end=EN[0]+dE) # (m) Easting  x_lo, x_hi
y_range = DataRange1d(start=EN[1]-dN , end=EN[1]+dN) # (m) Northing y_lo, y_hi

plot = [0]*len(Vendors) # initialize list to store Vendor plots
idx = 0
for vendor_name in Vendors:
    print(f"cnt={idx}: Vendor={vendor_name}")
    tile_provider = get_provider(vendor_name)

    plot[idx] = figure( x_range=x_range, y_range=y_range,
                        x_axis_type="mercator", y_axis_type="mercator",
                        plot_height=200, plot_width=300, title=vendor_name)

    plot[idx].add_tile(tile_provider)
    idx += 1


## arrange all map views in a grid layout
layout = layout([
    [description],
    [plot[0], plot[1], plot[2]],
    [plot[3], plot[4], plot[5]],
    [plot[6], plot[7], plot[8]],
    [plot[9]                  ]])

show(layout)
