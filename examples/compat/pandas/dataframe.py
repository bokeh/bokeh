import numpy as np
import pandas as pd

from bokeh import mpl
from bokeh.plotting import output_file, show

ts = pd.Series(np.random.randn(1000), index=pd.date_range('1/1/2000', periods=1000))
ts = ts.cumsum()

df = pd.DataFrame(np.random.randn(1000, 4), index=ts.index, columns=list('ABCD'))
df = df.cumsum()
df.plot(legend=False)

output_file("dataframe.html")

show(mpl.to_bokeh())
