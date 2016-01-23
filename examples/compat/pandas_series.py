import numpy as np
import pandas as pd

from bokeh import mpl
from bokeh.plotting import output_file, show

ts = pd.Series(np.random.randn(1000),
               index=pd.date_range('1/1/2000', periods=1000))
ts = ts.cumsum()

p = ts.plot()

output_file("pandas_series.html", title="pandas_series.py example")

show(mpl.to_bokeh())
