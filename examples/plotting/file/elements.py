import pandas as pd

from bokeh.models import ColumnDataSource, LabelSet
from bokeh.plotting import figure, show, output_file
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
high= max(melting_points)
melting_point_inds = [int(10*(x-low)/(high-low)) for x in melting_points] #gives items in colors a value from 0-10
elements['melting_colors'] = [palette[i] for i in melting_point_inds]

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"
TITLE = "Density vs Atomic Weight of Elements (colored by melting point)"

p = figure(tools=TOOLS, toolbar_location="above", logo="grey", plot_width=1200, title=TITLE)
p.background_fill_color= "#dddddd"
p.xaxis.axis_label="atomic weight (amu)"
p.yaxis.axis_label="density (g/cm^3)"
p.grid.grid_line_color="white"

source = ColumnDataSource(elements)

p.circle("atomic mass", "density", size=12, source=source,
         color='melting_colors', line_color="black", fill_alpha=0.8)

labels = LabelSet(x="atomic mass", y="density", text="symbol", y_offset=8,
                  text_font_size="8pt", text_color="#555555",
                  source=source, text_align='center')
p.add_layout(labels)

output_file("elements.html", title="elements.py example")

show(p)
