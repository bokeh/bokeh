from bokeh.plotting import Figure
from bokeh.io import curdoc
from bokeh.core.properties import (String, List)
from bokeh.models import Range1d
from bokeh.models.tiles import MercatorTileSource
from bokeh.tile_providers import STAMEN_TONER

class RandomTileSource(MercatorTileSource):
    __implementation__ = """
    _ = require "underscore"
    Util = require "util/util"
    MercatorTileSource = require "renderer/tile/mercator_tile_source"
    class RandomTileSource extends MercatorTileSource
      type: "RandomTileSource"
      get_image_url: (x, y, z) ->
        urls = @get('urls')
        url = urls[Math.floor(Math.random() * urls.length)]
        image_url = @string_lookup_replace(url, @get('extra_url_vars'))
        [x, y, z] = @tms_to_wmts(x, y, z)
        return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)
    module.exports =
      Model: RandomTileSource
    """
    urls = List(String)

def create_plot():
    axis_range = [-10000000, 10000000]
    x_range = Range1d(start=axis_range[0], end=axis_range[1], bounds=None)
    y_range = Range1d(start=axis_range[0], end=axis_range[1], bounds=None)
    p = Figure(tools='pan,wheel_zoom', x_range=x_range, y_range=y_range, plot_height=800, plot_width=800)
    p.axis.visible = False
    tile_source = RandomTileSource()
    tile_source.urls = []
    tile_source.attribution = STAMEN_TONER.attribution
    tile_source.urls.append(STAMEN_TONER.url)
    tile_source.urls.append('http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png')
    tile_source.urls.append('http://otile1.mqcdn.com/tiles/1.0.0/sat/{Z}/{X}/{Y}.jpg')
    p.add_tile(tile_source)
    return p

p = create_plot()
curdoc().add_root(p)
