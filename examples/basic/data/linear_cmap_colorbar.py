from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.transform import linear_cmap

x = list(range(1, 11))
y = list(range(1, 11))

source = ColumnDataSource(dict(x=x,y=y))

p = figure(width=300, height=300, title="Linear color map based on Y")

# use the field name of the column source
cmap = linear_cmap(field_name='y', palette="Spectral6", low=min(y), high=max(y))

r = p.scatter(x='x', y='y', color=cmap, size=15, source=source)

# create a color bar from the scatter glyph renderer
color_bar = r.construct_color_bar(width=10)

p.add_layout(color_bar, 'right')

show(p)
