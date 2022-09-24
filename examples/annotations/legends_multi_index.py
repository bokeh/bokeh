from bokeh.models import Legend, LegendItem
from bokeh.plotting import figure, show

p = figure()
r = p.multi_line([[1,2,3], [1,2,3]], [[1,3,2], [3,4,3]],
                 color=["orange", "red"], line_width=4)

legend = Legend(items=[
    LegendItem(label="orange", renderers=[r], index=0),
    LegendItem(label="red", renderers=[r], index=1),
])
p.add_layout(legend)

show(p)
