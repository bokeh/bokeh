import numpy as np
from bokeh.sampledata.olympics2014 import data

# we get data data
data = {d['abbr']: d['medals'] for d in data['data'] if d['medals']['total'] > 0}

# then, we grouped them properly
countries = sorted(data.keys(), key=lambda x: data[x]['total'], reverse=True)
gold = np.array([data[abbr]['gold'] for abbr in countries], dtype=np.float)
silver = np.array([data[abbr]['silver'] for abbr in countries], dtype=np.float)
bronze = np.array([data[abbr]['bronze'] for abbr in countries], dtype=np.float)

# later, we build a dict containing the grouped data
medals = dict(bronze=bronze, silver=silver, gold=gold)

# here we filled a pandas df
import pandas as pd
df = pd.DataFrame(medals, index=countries)

# and finally we drop the df into our Bar chart
from bokeh.charts import Bar
bar = Bar(df, filename="stacked_bars.html")
bar.title("Stacked bars").xlabel("countries").ylabel("medals")\
   .legend(True).width(600).height(400).stacked().show()