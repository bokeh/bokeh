from collections import OrderedDict

import pandas as pd

from bokeh.charts import Donut, show, output_file, vplot
from bokeh.charts.utils import df_from_json
from bokeh.sampledata.olympics2014 import data
from bokeh.sampledata.autompg import autompg

import pandas as pd

# utilize utility to make it easy to get json/dict data converted to a dataframe
df = df_from_json(data)

# filter by countries with at least one medal and sort by total medals
df = df[df['total'] > 8]
df = df.sort("total", ascending=False)
df = pd.melt(df, id_vars=['abbr'],
             value_vars=['bronze', 'silver', 'gold'],
             value_name='medal_count', var_name='medal')

# original example
d0 = Donut(df, label=['abbr', 'medal'], values='medal_count',
           text_font_size='8pt', hover_text='medal_count')

# nested donut chart for the provided labels, with colors assigned
# by the first level
d1 = Donut(autompg, label=['cyl', 'origin'],
           values='displ', agg='mean')

# show altering the spacing in levels
d2 = Donut(autompg, label=['cyl', 'origin'],
           values='displ', agg='mean', level_spacing=0.15)

# show altering the spacing in levels
d3 = Donut(autompg, label=['cyl', 'origin'],
           values='displ', agg='mean', level_spacing=[0.8, 0.3])

output_file("donut.html")
show(vplot(d0, d1, d2, d3))
