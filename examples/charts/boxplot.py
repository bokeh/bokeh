from collections import OrderedDict

import pandas as pd
import numpy as np

from bokeh.sampledata.olympics2014 import data
from bokeh.charts import BoxPlot

# create a DataFrame with the sampe data
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

# any of the following commented are valid BoxPlot inputs
#medals = pd.DataFrame(medals)
#medals = list(medals.values())
#medals = tuple(medals.values())
#medals = np.array(list(medals.values()))

boxplot = BoxPlot(
    medals, marker='circle', outliers=True, title="boxplot test",
    xlabel="medal type", ylabel="medal count", width=600, height=400,
    filename="boxplot.html")
boxplot.show()