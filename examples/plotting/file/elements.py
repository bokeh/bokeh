import pandas as pd

from bokeh.plotting import *
from bokeh.sampledata import periodic_table

elements = periodic_table.elements
elements = elements[elements["atomic number"] <= 82]
elements = elements[~pd.isnull(elements["melting point"])]
mass = [float(x.strip("[]")) for x in elements["atomic mass"]]
elements["atomic mass"] = mass

palette = list(reversed([
    "#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"
]))

melting_points = elements["melting point"]
low = min(melting_points)
high= max(melting_points)
melting_point_inds = [int(10*(x-low)/(high-low)) for x in melting_points] #gives items in colors a value from 0-10
meltingpointcolors = [palette[i] for i in melting_point_inds]

output_file("elements.html", title="elements.py example")

TOOLS = "pan,wheel_zoom,box_zoom,reset,resize,save"

p = figure(tools=TOOLS, toolbar_location="left", logo="grey", plot_width=1200)
p.title = "Density vs Atomic Weight of Elements (colored by melting point)"
p.background_fill= "#cccccc"

p.circle(elements["atomic mass"], elements["density"], size=12,
       color=meltingpointcolors, line_color="black", fill_alpha=0.8)

p.text(elements["atomic mass"], elements["density"]+0.3,
    text=elements["symbol"],text_color="#333333",
    text_align="center", text_font_size="10pt")

p.xaxis.axis_label="atomic weight (amu)"
p.yaxis.axis_label="density (g/cm^3)"
p.grid.grid_line_color="white"

show(p)
