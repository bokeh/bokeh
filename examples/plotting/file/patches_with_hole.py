import numpy as np
from bokeh.io import output_file, vplot, show
from bokeh.plotting import figure
from bokeh.models import HoverTool, ColumnDataSource

output_file("patches_with_hole.html", title="patches_with_holes.py example")

shapes = [
    {
        'description': 'A single patch with a hole',
        'xs': [[[1, 1.1, 2, 1.9], [1.8, 1.7, 1.2, 1.2]]],
        'ys': [[[1, 2.0, 2, 1.0], [1.1, 1.9, 1.9, 1.2]]],
        'color': 'PowderBlue',
    },
    {
        'description': 'A single solid patch',
        'xs': [3, 3.1, 4, 3.9],
        'ys': [3, 4.0, 4, 3.0],
        'color': 'green',
    },
    {
        'description': 'Two patches with no holes (seperated by np.NaN)',
        'xs': [5, 6, 5.5, np.NaN, 5, 6, 5.5],
        'ys': [3, 4, 4.0, np.NaN, 1, 2, 2.0],
        'color': 'pink',
    },
    {
        'description': 'Two patches, one with a hole, one with no hole',
        'xs': [
            [[1, 1.1, 2, 1.9], [1.8, 1.7, 1.2, 1.2]], np.NaN, 3, 3.1, 4, 3.9
        ],
        'ys': [
            [[3, 4.0, 4, 3.0], [3.1, 3.9, 3.9, 3.2]], np.NaN, 1, 2.0, 2, 1.0
        ],
        'color': 'gold',
    },
]

cds = ColumnDataSource({
    'description': [shape['description'] for shape in shapes],
    'xs': [shape['xs'] for shape in shapes],
    'ys': [shape['ys'] for shape in shapes],
    'colors': [shape['color'] for shape in shapes],
})


filled_plot = figure(title="With fill (hover for more info)", tools=[HoverTool(tooltips='@description')])
filled_plot.patches(xs='xs', ys='ys', fill_color='colors', fill_alpha=0.6, line_color=None, source=cds)
stroked_plot = figure(title="With stroke (hover for more info)", tools=[HoverTool(tooltips='@description')])
stroked_plot.patches(xs='xs', ys='ys', fill_color=None, line_color='colors', source=cds)

show(vplot(filled_plot, stroked_plot))
