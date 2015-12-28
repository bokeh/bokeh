import numpy as np
from bokeh.plotting import figure, show, output_file
from bokeh.models import HoverTool, TapTool, ColumnDataSource

output_file("patches_with_hole.html", title="patches_with_holes.py example")

shapes = [
    {
        'description': 'A single patch with a hole (filled)',
        'xs': [[1, 1.1, 2, 1.9], [1.8, 1.7, 1.2, 1.2]],
        'ys': [[1, 2.0, 2, 1.0], [1.1, 1.9, 1.9, 1.2]],
        'fill_color': 'PowderBlue',
        'line_color': None,
    },
    {
        'description': 'A single patch with a hole (no fill)',
        'xs': [[0, 0.1, 1, 0.9], [0.8, 0.7, 0.2, 0.2]],
        'ys': [[1, 2.0, 2, 1.0], [1.1, 1.9, 1.9, 1.2]],
        'fill_color': None,
        'line_color': 'PowderBlue',
    },
    {
        'description': 'A single solid patch',
        'xs': [3, 3.1, 4, 3.9],
        'ys': [3, 4.0, 4, 3.0],
        'fill_color': 'green',
        'line_color': None,
    },
    {
        'description': 'Two patches with no holes (seperated by np.NaN)',
        'xs': [5, 6, 5.5, np.NaN, 5, 6, 5.5],
        'ys': [3, 4, 4.0, np.NaN, 1, 2, 2.0],
        'fill_color': 'pink',
        'line_color': None,
    },
    {
        'description': 'Two patches, one with a hole, one with no hole',
        'xs': [
            [1, 1.1, 2, 1.9], [1.8, 1.7, 1.2, 1.2],
            np.NaN,
            [3, 3.1, 4, 3.9]
        ],
        'ys': [
            [3, 4.0, 4, 3.0], [3.1, 3.9, 3.9, 3.2],
            np.NaN,
            [1, 2.0, 2, 1.0]
        ],
        'fill_color': 'gold',
        'line_color': None,
    },
]

cds = ColumnDataSource({
    'description': [shape['description'] for shape in shapes],
    'xs': [shape['xs'] for shape in shapes],
    'ys': [shape['ys'] for shape in shapes],
    'fill_colors': [shape['fill_color'] for shape in shapes],
    'line_colors': [shape['line_color'] for shape in shapes],
})


hover = HoverTool(tooltips='@description')
tap = TapTool()
plot = figure(title="Shapes are grouped by color (hover for more info)", tools=[hover, tap])
plot.patches(
    xs='xs', ys='ys', fill_color='fill_colors', line_color='line_colors',
    fill_alpha=0.6, source=cds,
)

show(plot)
