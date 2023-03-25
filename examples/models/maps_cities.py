''' A plot showing a map of the world, highlighting cities where the population
is over 5,000 people, made using the ``GMapPlot`` class.

.. bokeh-example-metadata::
    :sampledata: world_cities
    :apis: bokeh.models.Circle, bokeh.models.GMapPlot, bokeh.models.PanTool, bokeh.models.WheelZoomTool
    :refs: :ref:`ug_styling_plots_axes_labels`, :ref:`ug_topics_geo_google_maps`, :ref:`ug_basic_data`
    :keywords: circle, map, label, pantool, gmapplot, document
'''

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (Circle, ColumnDataSource, GMapOptions,
                          GMapPlot, Label, PanTool, WheelZoomTool)
from bokeh.resources import INLINE
from bokeh.sampledata.world_cities import data
from bokeh.util.browser import view

# Google Maps now requires an API key. You can find out how to get one here:
# https://developers.google.com/maps/documentation/javascript/get-api-key
API_KEY = "GOOGLE_API_KEY"

map_options = GMapOptions(lat=15, lng=0, zoom=2)

plot = GMapPlot(
    width=1000, height=500,
    map_options=map_options, api_key=API_KEY, output_backend="webgl",
)

if plot.api_key == "GOOGLE_API_KEY":
    plot.add_layout(Label(x=500, y=320, x_units='screen', y_units='screen',
                          text='Replace GOOGLE_API_KEY with your own key',
                          text_color='red', text_align='center'))

plot.title.text = "Cities of the world with a population over 5,000 people."

circle = Circle(x="lng", y="lat", size=5, line_color=None, fill_color='firebrick', fill_alpha=0.2)
plot.add_glyph(ColumnDataSource(data), circle)
plot.add_tools(PanTool(), WheelZoomTool())

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "maps_cities.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Google Maps - World cities Example"))
    print(f"Wrote {filename}")
    view(filename)
