from bokeh.models import Title
from bokeh.plotting import figure, show, output_file

p = figure(title="Left Title", title_location="left",
           plot_width=300, plot_height=300)
p.circle([1,2], [3,4])

# add extra titles with add_layout(...)
p.add_layout(Title(text="Bottom Centered Title", align="center"), "below")

output_file("title.html")

show(p)
