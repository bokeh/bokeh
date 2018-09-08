from bokeh.plotting import figure, output_file, show
from bokeh.models import Legend, LegendItem

p = figure()
r = p.multi_line([[1,2,3], [1,2,3]], [[1,3,2], [3,4,3]],
                 color=["orange", "red"], line_width=4)

legend = Legend(items=[
    LegendItem(label="orange", renderers=[r], index=0),
    LegendItem(label="red", renderers=[r], index=1),
])
p.add_layout(legend)

output_file("multi_legend.html")

show(p)
