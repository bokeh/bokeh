from collections import OrderedDict

import pandas as pd

from bokeh.charts import Donut, show, output_file, vplot
from bokeh.charts.utils import df_from_json
#from bokeh.sampledata.olympics2014 import data
from bokeh.sampledata.autompg import autompg
import pandas as pd

# throw the data into a pandas data frame
# df = pd.io.json.json_normalize(data['data'])
#
# # filter by countries with at least one medal and sort
# df = df[df['medals.total'] > 8]
# df = df.sort("medals.total", ascending=False)
# df.ix[df.abbr=='RUS', 'medals.bronze'] = 0.0
#
# # get the countries and we group the data by medal type
# countries = df.abbr.values.tolist()
# gold = df['medals.gold'].astype(float).values
# silver = df['medals.silver'].astype(float).values
# bronze = df['medals.bronze'].astype(float).values
#
# # build a dict containing the grouped data
# medals = OrderedDict()
# medals['bronze'] = bronze
# medals['silver'] = silver
# medals['gold'] = gold
#
# # any of the following commented are also valid Donut inputs
# #medals = list(medals.values())
# #medals = np.array(list(medals.values()))
# #medals = pd.DataFrame(medals)
#
from bokeh.sampledata.olympics2014 import data

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

output_file("donut.html")
show(vplot(d0, d1, d2))
