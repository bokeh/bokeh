from bokeh.core.enums import SizingMode
from bokeh.layouts import column
from bokeh.models import Select
from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.iris import flowers as df

colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}
colors = [colormap[x] for x in df.species]

plot = figure(sizing_mode="fixed")

plot.circle(df.petal_length, df.petal_width, color=colors, alpha=0.2, size=10)

select = Select(title="Sizing mode", value="fixed", options=list(SizingMode), width=300)
select.js_link('value', plot, 'sizing_mode')

layout = column(select, plot)
layout.sizing_mode = "stretch_both" # set separately to avoid also setting children

output_file("sizing_mode.html", title="sizing_mode.py example")
show(layout)
