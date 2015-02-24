from collections import OrderedDict

import pandas as pd

from bokeh.charts import Bar, output_file, show
from bokeh.sampledata.olympics2014 import data

df = pd.io.json.json_normalize(data['data'])

# filter by countries with at least one medal and sort
df = df[df['medals.total'] > 0]
df = df.sort("medals.total", ascending=False)

# get the countries and we group the data by medal type
countries = df.abbr.values.tolist()
gold = df['medals.gold'].astype(float).values
silver = df['medals.silver'].astype(float).values
bronze = df['medals.bronze'].astype(float).values

# build a dict containing the grouped data
medals = OrderedDict(bronze=bronze, silver=silver, gold=gold)

# any of the following commented are also alid Bar inputs
#medals = pd.DataFrame(medals)
#medals = list(medals.values())

output_file("stacked_bar.html")

bar = Bar(medals, countries, title="Stacked bars", stacked=True)

show(bar)