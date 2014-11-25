import numpy as np
import pandas as pd
from collections import OrderedDict

# we build some distributions and load them into a dict
mu, sigma = 0, 0.5
normal = np.random.normal(mu, sigma, 1000)
lognormal = np.random.lognormal(mu, sigma, 1000)
dfd = distributions = OrderedDict(normal=normal, lognormal=lognormal)

# then we create a pandas df from the dict
df = pd.DataFrame(distributions)
dfd = df.to_dict()

for k, v in dfd.items():
    dfd[k] = v.values()

# any of the following commented are valid Bar inputs
#df = dfd.values()
#df = tuple(dfd.values())
#df = tuple([tuple(x) for x in dfd.values()])
#df = np.array(dfd.values())
#df = dfd.values()[0]


## and finally we drop the df into out Histogram chart
from bokeh.charts import Histogram
hist = Histogram(df, bins=50, filename="histograms.html")
hist.title("Histograms").ylabel("frequency").legend(True).width(400).height(350).show()