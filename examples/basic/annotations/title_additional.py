from bokeh.models import Title
from bokeh.plotting import figure, show

p = figure(title="Left Title", title_location="left",
           width=300, height=300)

p.scatter([1, 2], [3, 4])

# add extra titles with add_layout(...)
p.add_layout(Title(text="Bottom Centered Title", align="center"), "below")

show(p)
