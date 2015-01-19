import numpy as np
import pandas as pd
from bokeh import mpl
from bokeh.plotting import show

ts = pd.Series(np.random.randn(1000), index=pd.date_range('1/1/2000', periods=1000))
ts = ts.cumsum()
p = ts.plot()

show(mpl.to_bokeh(name="series"))
