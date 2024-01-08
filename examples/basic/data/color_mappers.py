''' A color mapping plot with color spectrum scale. The example plots demonstrates
log mapping and linear mapping with different color palette.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.scatter, bokeh.models.ColumnDataSource, bokeh.models.ColorBar, bokeh.models.mappers.LinearColorMapper, bokeh.models.mappers.LogColorMapper
    :refs: :ref:`ug_topics_images_colormapped`
    :keywords: color, tools, scatter, data_map

''' # noqa: E501
import numpy as np

from bokeh.layouts import column, gridplot
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.transform import linear_cmap, log_cmap

x = np.random.random(size=2000) * 1000
y = np.random.normal(size=2000) * 2 + 5
source = ColumnDataSource(dict(x=x, y=y))

def make_plot(mapper, palette):
    cmap = mapper("x", palette=palette, low=1, high=1000)
    axis_type = mapper.__name__.split("_")[0] # linear or log

    p = figure(x_range=(1, 1000), title=f"{palette} with {mapper.__name__}",
               toolbar_location=None, tools="", x_axis_type=axis_type)

    r = p.scatter('x', 'y', alpha=0.8, source=source, color=cmap)

    color_bar = r.construct_color_bar(padding=0,
                                      ticker=p.xaxis.ticker,
                                      formatter=p.xaxis.formatter)
    p.add_layout(color_bar, 'below')

    return p

p1 = make_plot(linear_cmap, "Viridis256")
p2 = make_plot(log_cmap, "Viridis256")
p3 = make_plot(linear_cmap, "Viridis6")
p4 = make_plot(log_cmap, "Viridis6")

p5 = figure(x_range=(1, 1000), width=800, height=300, toolbar_location=None, tools="",
            title="Viridis256 with linear_cmap, low/high = 200/800 = pink/grey")
cmap = linear_cmap("x", palette="Viridis256", low=200, high=800,
                   low_color="pink", high_color="darkgrey")
p5.scatter(x='x', y='y', alpha=0.8, source=source, color=cmap)

grid =  gridplot([[p1, p2], [p3, p4]], width=400, height=300, toolbar_location=None)
show(column(grid, p5))
