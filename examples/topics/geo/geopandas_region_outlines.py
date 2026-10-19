''' Overlay GeoPandas region boundaries on keyless map tiles.

.. bokeh-example-metadata::
    :sampledata: us_counties
    :apis: bokeh.models.GeometryDataSource, bokeh.plotting.figure.add_tile
    :refs: :ref:`ug_topics_geo_geojson_data`
    :keywords: geometry, geopandas, shapely, regions, map, tiles, web mercator
'''

import geopandas as gpd
import xyzservices.providers as xyz
from shapely import get_num_coordinates

from bokeh.models import GeometryDataSource, HoverTool
from bokeh.plotting import figure, show
from bokeh.sampledata.us_counties import records as county_records


region_names = ["Marin", "Contra Costa", "Alameda", "San Mateo", "Santa Clara", "Santa Cruz"]
colors = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#059669", "#0891b2"]
counties = {county["name"]: county for county in county_records(state="CA")}

records = []
for name, color in zip(region_names, colors):
    county = counties[name]
    records.append(county | {
        "boundary_points": get_num_coordinates(county["geometry"]),
        "color": color,
    })

regions = gpd.GeoDataFrame(records, geometry="geometry", crs="EPSG:4326")
regions["geometry_type"] = regions.geometry.geom_type
regions = regions.to_crs("EPSG:3857")

region_source = GeometryDataSource(regions)
labels = regions[["name", "geometry"]].copy()
labels.geometry = regions.representative_point()
label_source = GeometryDataSource(labels)

min_x, min_y, max_x, max_y = regions.total_bounds
p = figure(
    width=850,
    height=600,
    x_range=(min_x - 10_000, max_x + 10_000),
    y_range=(min_y - 10_000, max_y + 10_000),
    x_axis_type="mercator",
    y_axis_type="mercator",
    match_aspect=True,
    title="Bay Area county outlines from GeoPandas",
    tools="pan,wheel_zoom,reset",
    active_scroll="wheel_zoom",
)
p.add_tile(xyz.OpenStreetMap.Mapnik)
region_renderer = p.polygons(
    source=region_source,
    fill_color="color",
    fill_alpha=0.12,
    line_color="color",
    line_width=4,
    hover_fill_alpha=0.28,
)
p.add_tools(HoverTool(
    renderers=[region_renderer],
    tooltips=[
        ("county", "@detailed_name"),
        ("FIPS", "@fips"),
        ("geometry", "@geometry_type"),
        ("boundary points", "@boundary_points{0,0}"),
    ],
))
p.text(
    x="x",
    y="y",
    text="name",
    source=label_source,
    text_align="center",
    text_baseline="middle",
    text_color="#111827",
    text_font_size="12px",
    text_font_style="bold",
    background_fill_color="white",
    background_fill_alpha=0.8,
)

show(p)
