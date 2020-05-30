# Demonstrate Bokeh's various tile providers with medium-close-in zoom using
# modified tile_providers.py to include OSM, WIKIMEDIA, and ESRI_IMAGERY tile providers.
#
# Usage:
#   python3 bokeh_tile_demo.py


from bokeh.layouts import layout
from bokeh.models.widgets import Div
from bokeh.plotting import figure, output_file, show
from bokeh.tile_providers Vendors, import get_provider

output_file("foo.html")

# helper function for coordinate conversion between lat/lon in decimal degrees to web mercator
# lnglat_to_meters() by @jbednar (James A. Bednar), https://github.com/bokeh/bokeh/issues/10009#issuecomment-628982394
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

def LatLon_to_EN(lat_lon):
    from pyproj import Proj, transform
    lat=lat_lon[0]
    lon=lat_lon[1]
    try:
        #              from: WGS84, lat/lon, EPSG:4326    to: Web Mercator, EPSG:3857 in meters
        easting, northing = transform( Proj('epsg:4326'), Proj('epsg:3857'), lat, lon) # from WGS-84 to Web Mercator Easting/Northing
        return easting, northing # meters
    except:
        return None, None




description = Div(text="""<b><code>bokeh_tile_demo.py</code></b> - Bokeh tile provider examples. Linked Pan and Zoom on all maps!""")

# pick a location and generate a 4-point window around it: bottom-left, upper-right
map_center_lat_lon = ( 30.268801, -97.763347 ) # Lady Bird Lake, Austin Texas

dE = 1000 # (m) Easting  plus-and-minus from map center
dN = 1000 # (m) Northing plus-and-minus from map center
EN = LatLon_to_EN(map_center_lat_lon)
x_range = ( EN[0]-dE , EN[0]+dE ) # (m) Easting  x_lo, x_hi
y_range = ( EN[1]-dN , EN[1]+dN ) # (m) Northing y_lo, y_hi


plot=[0]*Vendors.__len__() # initialize list to store Vendor plots
idx=0
for vendorName in Vendors:
    print("cnt={0}: Vendor={1}".format(idx,vendorName))
    tile_provider = get_provider(vendorName)
    if idx==0: # make the first plot with x_range and y_range point where you want (from above)
        plot[idx] = figure(x_range=x_range, y_range=y_range,
                       x_axis_type="mercator", y_axis_type="mercator",
                       plot_height=200, plot_width=300, title=vendorName)
    
    else: # link x_range and y_range of subsequent plots to match the first
        plot[idx] = figure(x_range=plot[0].x_range, y_range=plot[0].y_range,
                       x_axis_type="mercator", y_axis_type="mercator",
                       plot_height=200, plot_width=300, title=vendorName)
    plot[idx].add_tile(tile_provider)
    idx+=1


## arrange all map views in a grid layout then add to the document
layout = layout([
    [description],
    [plot[0], plot[1], plot[2]],
    [plot[3], plot[4], plot[5]],
    [plot[6], plot[7], plot[8]],
    [plot[9]                  ]])

show(layout)
