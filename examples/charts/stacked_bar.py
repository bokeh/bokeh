import pandas as pd
import numpy as np

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
medals = dict(bronze=bronze, silver=silver, gold=gold)

# and finally we drop the countries and medals dict into our Bar chart
from bokeh.charts import Bar, DataAdapter
#medals = DataObject(medals, force_alias=False)
#medals = DataObject(df) #not working
#medals = DataObject(medals.values(), force_alias=False)
medals = DataAdapter(np.array(medals.values()), force_alias=False)

bar = Bar(medals, countries, filename="stacked_bar.html")
bar.title("Stacked bars").xlabel("countries").ylabel("medals")\
   .legend(True).width(600).height(400).stacked().show()