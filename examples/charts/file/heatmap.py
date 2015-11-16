
import pandas as pd

from bokeh.charts import HeatMap, bins, output_file, show, vplot
from bokeh.sampledata.autompg import autompg as df
from bokeh.palettes import RdYlGn6
from bokeh.sampledata.unemployment1948 import data

# pandas magic
# df = data[data.columns[:-1]]
# df2 = df.set_index(df[df.columns[0]].astype(str))
# df2.drop(df.columns[0], axis=1, inplace=True)
# df3 = df2.transpose()

# bokeh magic
# hm1 = HeatMap(
#     df3, palette=palette,
#     title="categorical heatmap, pd_input",
#     height=400, width=1000
# )
#
# hm_data = df3.values.T
# hm2 = HeatMap(
#     hm_data, palette=palette, title="Unemployment (Array)",
#     xlabel='Years since 1948', ylabel='Months', height=400, width=1000
# )
#
# simple_df = pd.DataFrame(
#     {'apples':[4,5,8,12,4], 'pears':[6,5,4,8,7], 'bananas':[1,2,4,8,12]},
#     index=['2009', '2010', '2011', '2012', '2013']
# )

fruits = {'fruit': ['apples', 'apples', 'apples', 'apples', 'apples',
                    'pears', 'pears', 'pears', 'pears', 'pears',
                    'bananas', 'bananas', 'bananas', 'bananas', 'bananas'],
          'fruit_count': [4, 5, 8, 12, 4, 6, 5, 4, 8, 7, 1, 2, 4, 8, 12],
          'year': [2009, 2010, 2011, 2012, 2013, 2009, 2010, 2011, 2012, 2013, 2009, 2010,
                   2011, 2012, 2013]}
fruits['year'] = [str(yr) for yr in fruits['year']]

hm1 = HeatMap(df, x=bins('mpg'), y=bins('displ'))

hm2 = HeatMap(df, x=bins('mpg'), y=bins('displ'), values='cyl', stat='mean')

hm3 = HeatMap(df, x=bins('mpg'), y=bins('displ', bin_count=15),
              values='cyl', stat='mean')

hm4 = HeatMap(df, x=bins('mpg'), y='cyl', values='displ', stat='mean')

hm5 = HeatMap(df, y=bins('displ'), x=bins('mpg'), values='cyl', stat='mean',
              spacing_ratio=0.9)

hm6 = HeatMap(df, x=bins('mpg'), y=bins('displ'), stat='mean', values='cyl',
              palette=RdYlGn6)

hm7 = HeatMap(fruits, y='year', x='fruit', values='fruit_count', stat=None)

output_file("heatmap.html")

show(vplot(hm1, hm2, hm3, hm4, hm5, hm6, hm7))
