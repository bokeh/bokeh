import pandas as pd
import numpy as np
from collections import OrderedDict

from bokeh.sampledata.olympics2014 import data
from bokeh.charts import Donut
from bokeh.plotting import show, output_file

# we throw the data into a pandas df
df = pd.io.json.json_normalize(data['data'])
# filter by countries with at least one medal and sort
df = df[df['medals.total'] > 8]
df = df.sort("medals.total", ascending=False)

# then, we get the countries and we group the data by medal type
countries = df.abbr.values.tolist()
gold = df['medals.gold'].astype(float).values
silver = df['medals.silver'].astype(float).values
bronze = df['medals.bronze'].astype(float).values

# later, we build a dict containing the grouped data
medals = OrderedDict()
medals['bronze'] = bronze
medals['silver'] = silver
medals['gold'] = gold

# any of the following commented are valid Donut inputs
# medals = list(medals.values())
# medals = np.array(list(medals.values()))
# medals = pd.DataFrame(medals)
output_file("donut.html")
donut = Donut(medals, countries, filename="donut.html")
show(donut) # or donut.show()
