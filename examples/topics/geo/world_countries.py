''' Plot Shapely country boundaries from ``bokeh_sampledata``.

.. bokeh-example-metadata::
    :sampledata: world_countries
    :apis: bokeh.plotting.figure.polygons
    :refs: :ref:`ug_topics_geo_geojson_data`
    :keywords: geometry, shapely, countries, map, hover
'''

from bokeh.palettes import Category10
from bokeh.plotting import figure, show
from bokeh.sampledata.world_countries import records
from bokeh.transform import factor_cmap

countries = records()
continents = sorted({country["continent"] for country in countries})

p = figure(
    width=900,
    height=500,
    x_range=(-180, 180),
    y_range=(-60, 90),
    match_aspect=True,
    title="World countries",
    tools="pan,wheel_zoom,reset,hover",
    tooltips=[
        ("country", "@name"),
        ("continent", "@continent"),
        ("region", "@region"),
        ("ISO code", "@iso_a3"),
    ],
)
p.axis.visible = False
p.grid.visible = False
p.polygons(
    countries,
    fill_color=factor_cmap("continent", Category10[10], continents),
    fill_alpha=0.8,
    line_color="white",
    line_width=0.5,
    hover_line_color="black",
    hover_line_width=2,
)

show(p)
