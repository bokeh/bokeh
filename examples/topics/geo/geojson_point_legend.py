''' Group GeoJSON points by a feature property in a legend.

.. bokeh-example-metadata::
    :sampledata: us_states
    :apis: bokeh.models.GeometryDataSource, bokeh.plotting.figure, bokeh.plotting.show
    :keywords: geojson, scatter, legend
'''

from bokeh.models import GeometryDataSource, HoverTool
from bokeh.plotting import figure, show
from bokeh.sampledata.us_states import data as states
from bokeh.transform import factor_cmap, factor_mark

# Approximate summit coordinates for selected Cascade volcanoes.
volcanoes = [
    ("Mount Baker", -121.81, 48.78, "Washington"),
    ("Glacier Peak", -121.11, 48.11, "Washington"),
    ("Mount Rainier", -121.76, 46.85, "Washington"),
    ("Mount St. Helens", -122.18, 46.20, "Washington"),
    ("Mount Adams", -121.49, 46.20, "Washington"),
    ("Mount Hood", -121.70, 45.37, "Oregon"),
    ("Mount Jefferson", -121.80, 44.67, "Oregon"),
    ("South Sister", -121.77, 44.10, "Oregon"),
    ("Mount Mazama", -122.11, 42.94, "Oregon"),
    ("Mount Shasta", -122.19, 41.41, "California"),
    ("Lassen Peak", -121.51, 40.49, "California"),
]
geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [longitude, latitude]},
            "properties": {"name": name, "state": state},
        }
        for name, longitude, latitude, state in volcanoes
    ],
}
source = GeometryDataSource(geojson)

p = figure(
    title="Volcanoes of the Cascade Range",
    width=640, height=650, x_range=(-126, -116), y_range=(39.5, 50),
    tools="pan,wheel_zoom,reset,save",
    background_fill_color="#e6f0f4",
)
p.axis.visible = False
p.grid.visible = False
p.patches(
    [states[code]["lons"] for code in ("WA", "OR", "CA", "NV", "ID")],
    [states[code]["lats"] for code in ("WA", "OR", "CA", "NV", "ID")],
    fill_color="#f9f6ed", line_color="#aeb9bc",
)
state_names = ["Washington", "Oregon", "California"]
points = p.scatter(
    x="x", y="y", source=source, size=15,
    legend_field="state", line_color="#ffffff",
    marker=factor_mark("state", ["triangle", "circle", "square"], state_names),
    fill_color=factor_cmap("state", ["#ae472e", "#7256a0", "#19806d"], state_names),
)
p.add_tools(HoverTool(renderers=[points], tooltips=[("Volcano", "@name"), ("State", "@state")]))
p.legend.title = "State"
p.legend.location = "bottom_left"

show(p)
