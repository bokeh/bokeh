''' A scatter plot using data from the `Periodic Table`_. This example
demonstrates using basic hover tooltips and adding labels for individual
points.

.. bokeh-example-metadata::
    :sampledata: periodic_table
    :apis: bokeh.plotting.figure.scatter, bokeh.plotting.figure.text, bokeh.models.sources.ColumnDataSource
    :refs: :ref:`ug_interaction_tools_hover_tool`
    :keywords: hover, labels, scatter

.. _Periodic Table: https://en.wikipedia.org/wiki/Periodic_table

'''
import pandas as pd

from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.sampledata.periodic_table import elements

elements = elements.copy()
elements = elements[elements["atomic number"] <= 82]
elements = elements[~pd.isnull(elements["melting point"])]
mass = [float(x.strip("[]")) for x in elements["atomic mass"]]
elements["atomic mass"] = mass

palette = ["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0",
           "#f7f7f7", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"]

melting_points = elements["melting point"]
low = min(melting_points)
high = max(melting_points)
melting_point_inds = [int(10*(x-low)/(high-low)) for x in melting_points] #gives items in colors a value from 0-10
elements['melting_colors'] = [palette[i] for i in melting_point_inds]

TITLE = "Density vs Atomic Weight of Elements (colored by melting point)"
TOOLS = "hover,pan,wheel_zoom,box_zoom,reset,save"

p = figure(tools=TOOLS, toolbar_location="above", width=1200, title=TITLE)
p.toolbar.logo = "grey"
p.background_fill_color = "#efefef"
p.xaxis.axis_label = "atomic weight (amu)"
p.yaxis.axis_label = "density (g/cm^3)"
p.grid.grid_line_color = "white"
p.hover.tooltips = [
    ("name", "@name"),
    ("symbol:", "@symbol"),
    ("density", "@density"),
    ("atomic weight", "@{atomic mass}"),
    ("melting point", "@{melting point}"),
]

source = ColumnDataSource(elements)

p.scatter("atomic mass", "density", size=12,
          color='melting_colors', line_color="black", alpha=0.9,
          source=source)

p.text(x="atomic mass", y="density", text="symbol", y_offset=-8,
       text_font_size="11px", text_color="#555555", text_align='center',
       source=source)

show(p)
