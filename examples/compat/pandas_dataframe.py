import numpy as np
import pandas as pd

from bokeh import mpl
from bokeh.plotting import output_file, show

index=pd.date_range('1/1/2000', periods=1000)

df = pd.DataFrame(np.random.randn(1000, 4), index=index, columns=list('ABCD'))

df.cumsum().plot(legend=False)

output_file("pandas_dataframe.html", title="pandas_dataframe.py example")

show(mpl.to_bokeh())
