''' A pie chart populated by a simple dict of values. This example demonstrates
a cumulative sum transform for computing positions for the wedges.

.. bokeh-example-metadata::
    :title: Build a pie chart from a dictionary
    :keywords: cumsum, pandas, pie, wedge
    :apis: bokeh.transform.cumsum, bokeh.plotting.figure.wedge
    :refs: :ref:`ug_topics_pie`
    :gallery: A pie chart of random data with a legend.

'''
from math import pi

import pandas as pd

from bokeh.palettes import Category20c
from bokeh.plotting import figure, show
from bokeh.transform import cumsum

x = {
    'United States': 157,
    'United Kingdom': 93,
    'Japan': 89,
    'China': 63,
    'Germany': 44,
    'India': 42,
    'Italy': 40,
    'Australia': 35,
    'Brazil': 32,
    'France': 31,
    'Taiwan': 31,
    'Spain': 29,
}

data = pd.Series(x).reset_index(name='value').rename(columns={'index': 'country'})
data['angle'] = data['value']/data['value'].sum() * 2*pi
data['color'] = Category20c[len(x)]

p = figure(height=350, title="Pie Chart", toolbar_location=None,
           tools="hover", tooltips="@country: @value", x_range=(-0.5, 1.0))

p.wedge(x=0, y=1, radius=0.4,
        start_angle=cumsum('angle', include_zero=True), end_angle=cumsum('angle'),
        line_color="white", fill_color='color', legend_field='country', source=data)

p.axes.axis_label = None
p.axes.visible = False
p.grids.grid_line_color = None

show(p)
