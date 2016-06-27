from bokeh.charts import Donut, show, output_file
from bokeh.layouts import column
from bokeh.sampledata.autompg import autompg

import pandas as pd

# simple examples with inferred meaning

# implied index
d1 = Donut([2, 4, 5, 2, 8])

# explicit index
d2 = Donut(pd.Series([2, 4, 5, 2, 8], index=['a', 'b', 'c', 'd', 'e']))

# given a categorical series of data with no aggregation
d3 = Donut(autompg.cyl.astype(str))

# given a categorical series of data with no aggregation
d4 = Donut(autompg.groupby('cyl').displ.mean())

# given a categorical series of data with no aggregation
d5 = Donut(autompg.groupby(['cyl', 'origin']).displ.mean(),
           hover_text='mean')

# no values specified
d6 = Donut(autompg, label='cyl', agg='count')

# explicit examples
d7 = Donut(autompg, label='cyl',
           values='displ', agg='mean')

# nested donut chart for the provided labels, with colors assigned
# by the first level
d8 = Donut(autompg, label=['cyl', 'origin'],
           values='displ', agg='mean')

# show altering the spacing in levels
d9 = Donut(autompg, label=['cyl', 'origin'],
           values='displ', agg='mean', level_spacing=0.15)

# show altering the spacing in levels
d10 = Donut(autompg, label=['cyl', 'origin'],
           values='displ', agg='mean', level_spacing=[0.8, 0.3])

output_file("donut_multi.html", title="donut_multi.py example")

show(column(d1, d2, d3, d4, d5, d6, d7, d8, d9, d10))
