from collections import OrderedDict
import pandas as pd

# we throw the data into a pandas df
from bokeh.sampledata.olympics2014 import data
from bokeh.charts import Bar
from bokeh.plotting import output_file, show

df = pd.io.json.json_normalize(data['data'])

# we filter by countries with at least one medal and sort
df = df[df['medals.total'] > 0]
df = df.sort("medals.total", ascending=False)

# then, we get the countries and we group the data by medal type
countries = df.abbr.values.tolist()
gold = df['medals.gold'].astype(float).values
silver = df['medals.silver'].astype(float).values
bronze = df['medals.bronze'].astype(float).values

# later, we build a dict containing the grouped data
medals = OrderedDict(bronze=bronze, silver=silver, gold=gold)

# any of the following commented are valid Bar inputs
#medals = pd.DataFrame(medals)
#medals = list(medals.values())
output_file("stacked_bar.html")
bar = Bar(medals, countries, title="Stacked bars", filename="stacked_bar.html", stacked=True)
show(bar)