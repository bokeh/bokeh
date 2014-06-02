import numpy as np
import pandas as pd
from bokeh import mpl

ts = pd.Series(np.random.randn(1000), index=pd.date_range('1/1/2000', periods=1000))
ts = ts.cumsum()
p = ts.plot()

mpl.to_bokeh(name="series")
