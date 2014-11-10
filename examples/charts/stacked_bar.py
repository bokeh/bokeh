import pandas as pd
import numpy as np
from collections import OrderedDict
# we throw the data into a pandas df
from bokeh.sampledata.olympics2014 import data
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

# and finally we drop the countries and medals dict into our Bar chart
from bokeh.charts import Bar, NewBar, DataAdapter

# Clean dataframe series that we don't care...
df.pop('name')
df.pop('abbr')
df.pop('medals.total')
df.index = countries

# OK
#bar = NewBar(medals, countries, filename="stacked_bar.html")

#TODO: This version has issues with stached bars positions..
#bar = NewBar(df, countries, filename="stacked_bar.html")

# OK
#bar = NewBar(pd.DataFrame(medals), countries, filename="stacked_bar.html")

#TODO: This version has issues with stached bars positions..
#bar = NewBar(df.T.values, countries, filename="stacked_bar.html")

# OK
#bar = NewBar(pd.DataFrame(medals).T.values, countries, filename="stacked_bar.html")

# OK
bar = NewBar(medals.values(), countries, filename="stacked_bar.html")

bar.title("Stacked bars").xlabel("countries").ylabel("medals")\
   .legend(True).width(600).height(400).stacked().show()