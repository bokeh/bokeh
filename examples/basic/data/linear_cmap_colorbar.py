''' Map scatter colors to y values and display the same mapping in a color bar.

.. bokeh-example-metadata::
    :title: Map point values to color
    :keywords: linear, cmap, colorbar
    :apis: bokeh.models.ColumnDataSource, bokeh.plotting.figure.add_layout, bokeh.plotting.figure.scatter
    :gallery: A linear colormapper used to drive a colorbar in addition to a glyph's color.
'''

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
