from bokeh.plotting import figure, show, output_file
from bokeh.models import ColumnDataSource, ColorBar
from bokeh.palettes import Spectral6
from bokeh.transform import linear_cmap

output_file("styling_linear_mappers.html", title="styling_linear_mappers.py example")

x = [1,2,3,4,5,7,8,9,10]
y = [1,2,3,4,5,7,8,9,10]

#Use the field name of the column source
mapper = linear_cmap(field_name='y', palette=Spectral6 ,low=min(y) ,high=max(y))

source = ColumnDataSource(dict(x=x,y=y))

p = figure(plot_width=300, plot_height=300, title="Linear Color Map Based on Y")

p.circle(x='x', y='y', line_color=mapper,color=mapper, fill_alpha=1, size=12, source=source)

color_bar = ColorBar(color_mapper=mapper['transform'], width=8,  location=(0,0))

p.add_layout(color_bar, 'right')

show(p)
