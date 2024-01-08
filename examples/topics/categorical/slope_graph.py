''' A categorical scatter plot showing the CO2 emissions of selected countries in the years 2000 and 2010. This example
demonstrates using the `segment` glyph.

.. bokeh-example-metadata::
    :sampledata: emissions
    :apis: bokeh.plotting.figure.scatter
    :refs: :ref:`ug_topics_categorical_slope_graph`
    :keywords: segment, scatter

'''
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.sampledata.emissions import data

countries = [
    "Trinidad and Tobago",
    "Qatar",
    "United Arab Emirates",
    "Oman",
    "Bahrain",
    "Singapore",
    "Netherlands Antilles",
    "Kazakhstan",
    "Equatorial Guinea",
    "Kuwait",
]

df = data[data["country"].isin(countries)].reset_index(drop=True)
years = (df["year"] == 2000.0) | (df["year"] == 2010.0)

df = df[years].reset_index(drop=True)
df["year"] = df.year.astype(int)
df["year"] = df.year.astype(str)

# create separate columns for the different years
a = df[df["year"] == "2000"]
b = df[df["year"] == "2010"]
new_df = a.merge(b, on="country")

source = ColumnDataSource(new_df)

p = figure(x_range=("2000", "2010"), y_range=(0, 60), x_axis_location="above", y_axis_label="CO2 emissions (tons / person)")

p.scatter(x="year_x", y="emissions_x", source=source, size=7)

p.scatter(x="year_y", y="emissions_y", source=source, size=7)

p.segment(x0="year_x", y0="emissions_x", x1="year_y", y1="emissions_y", source=source, color="black")

p.text(x="year_y", y="emissions_y", text="country", source=source, x_offset=7, y_offset=8, text_font_size="12px")

p.xaxis.major_tick_line_color = None
p.xaxis.major_tick_out = 0
p.xaxis.axis_line_color = None

p.yaxis.minor_tick_out = 0
p.yaxis.major_tick_in = 0
p.yaxis.ticker = [0, 20, 40, 60]

p.grid.grid_line_color = None
p.outline_line_color = None

show(p)
