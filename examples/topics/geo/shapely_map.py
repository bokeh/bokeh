''' Overlay projected Shapely geometries on Web Mercator map tiles.

.. bokeh-example-metadata::
    :apis: bokeh.models.GeometryDataSource, bokeh.plotting.figure.add_tile
    :refs: :ref:`ug_topics_geo_geojson_data`
    :keywords: geometry, shapely, map, tiles, web mercator
'''

import numpy as np
import xyzservices.providers as xyz
from shapely import transform
from shapely.geometry import LineString, Point

from bokeh.models import GeometryDataSource, HoverTool
from bokeh.plotting import figure, show


def web_mercator(coordinates: np.ndarray) -> np.ndarray:
    """Project longitude and latitude coordinates to Web Mercator meters."""
    longitude = coordinates[:, 0]
    latitude = np.clip(coordinates[:, 1], -85.05112878, 85.05112878)
    projected = coordinates.copy()
    projected[:, 0] = longitude * np.pi * 6378137 / 180
    projected[:, 1] = np.log(np.tan((90 + latitude) * np.pi / 360)) * 6378137
    return projected


landmarks = [
    ("Conservatory of Flowers", -122.4602, 37.7726, "#2563eb"),
    ("de Young Museum", -122.4687, 37.7715, "#db2777"),
    ("Stow Lake", -122.4770, 37.7694, "#059669"),
    ("Ocean Beach", -122.5093, 37.7725, "#ea580c"),
]

points = [transform(Point(longitude, latitude), web_mercator) for _, longitude, latitude, _ in landmarks]
route = transform(LineString([(longitude, latitude) for _, longitude, latitude, _ in landmarks]), web_mercator)
areas = [point.buffer(220) for point in points]

area_source = GeometryDataSource([
    {"geometry": area, "name": name, "color": color}
    for area, (name, _, _, color) in zip(areas, landmarks)
])
point_source = GeometryDataSource([
    {"geometry": point, "name": name, "color": color}
    for point, (name, _, _, color) in zip(points, landmarks)
])
route_source = GeometryDataSource([
    {"geometry": route, "name": "Park route"},
])

bounds = [route.bounds, *(area.bounds for area in areas)]
min_x = min(bound[0] for bound in bounds)
min_y = min(bound[1] for bound in bounds)
max_x = max(bound[2] for bound in bounds)
max_y = max(bound[3] for bound in bounds)

p = figure(
    width=850,
    height=500,
    x_range=(min_x - 500, max_x + 1_800),
    y_range=(min_y - 500, max_y + 500),
    x_axis_type="mercator",
    y_axis_type="mercator",
    title="Shapely geometries on map tiles",
    tools="pan,wheel_zoom,reset",
    active_scroll="wheel_zoom",
)
p.add_tile(xyz.OpenStreetMap.Mapnik)
p.polygons(
    source=area_source,
    fill_color="color",
    fill_alpha=0.18,
    line_color="color",
    line_width=2,
)
p.multi_line(
    xs="xs",
    ys="ys",
    source=route_source,
    line_color="#334155",
    line_width=4,
    line_alpha=0.85,
)
landmark_renderer = p.scatter(
    x="x",
    y="y",
    source=point_source,
    size=13,
    fill_color="color",
    line_color="white",
    line_width=2,
)
p.add_tools(HoverTool(
    renderers=[landmark_renderer],
    tooltips=[("location", "@name")],
))
p.text(
    x="x",
    y="y",
    text="name",
    source=point_source,
    x_offset=9,
    y_offset=8,
    text_font_size="11px",
    text_color="#1e293b",
)

show(p)
