from collections import OrderedDict

from bokeh.plotting import *
from bokeh.models import HoverTool, ColumnDataSource
from bokeh.sampledata import periodic_table


elements = periodic_table.elements[periodic_table.elements["group"] != "-"]

group_range = [str(x) for x in range(1,19)]
period_range = [str(x) for x in reversed(sorted(set(elements["period"])))]

colormap = {
    "alkali metal"         : "#a6cee3",
    "alkaline earth metal" : "#1f78b4",
    "halogen"              : "#fdbf6f",
    "metal"                : "#b2df8a",
    "metalloid"            : "#33a02c",
    "noble gas"            : "#bbbb88",
    "nonmetal"             : "#baa2a6",
    "transition metal"     : "#e08e79",
}

source = ColumnDataSource(
    data=dict(
        group=[str(x) for x in elements["group"]],
        period=[str(y) for y in elements["period"]],
        symx=[str(x)+":0.1" for x in elements["group"]],
        numbery=[str(x)+":0.8" for x in elements["period"]],
        massy=[str(x)+":0.15" for x in elements["period"]],
        namey=[str(x)+":0.3" for x in elements["period"]],
        sym=elements["symbol"],
        name=elements["name"],
        cpk=elements["CPK"],
        atomic_number=elements["atomic number"],
        electronic=elements["electronic configuration"],
        mass=elements["atomic mass"],
        type=elements["metal"],
        type_color=[colormap[x] for x in elements["metal"]],
    )
)

output_file("periodic.html")

TOOLS = "resize,hover,save"

p = figure(title="Periodic Table", tools=TOOLS,
    x_range=group_range, y_range=period_range)
p.plot_width = 1200
p.toolbar_location = "left"

p.rect("group", "period", 0.9, 0.9, source=source,
    fill_alpha=0.6, color="type_color")

text_props = {
    "source": source,
    "angle": 0,
    "color": "black",
    "text_align": "left",
    "text_baseline": "middle"
}

p.text(x=dict(field="symx", units="data"),
    y=dict(field="period", units="data"),
    text=dict(field="sym", units="data"),
    text_font_style="bold", text_font_size="15pt", **text_props)

p.text(x=dict(field="symx", units="data"),
    y=dict(field="numbery", units="data"),
    text=dict(field="atomic_number", units="data"),
    text_font_size="9pt", **text_props)

p.text(x=dict(field="symx", units="data"),
    y=dict(field="namey", units="data"),
    text=dict(field="name", units="data"),
    text_font_size="6pt", **text_props)

p.text(x=dict(field="symx", units="data"),
    y=dict(field="massy", units="data"),
    text=dict(field="mass", units="data"),
    text_font_size="5pt", **text_props)

p.grid.grid_line_color = None

hover = p.select(dict(type=HoverTool))
hover.tooltips = OrderedDict([
    ("name", "@name"),
    ("atomic number", "@atomic_number"),
    ("type", "@type"),
    ("atomic mass", "@mass"),
    ("CPK color", "$color[hex, swatch]:cpk"),
    ("electronic configuration", "@electronic"),
])

show(p)
