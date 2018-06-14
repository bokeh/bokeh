from bokeh.plotting import figure, show, output_file
from bokeh.models import Band, ColumnDataSource
from bokeh.palettes import Spectral6
import pandas as pd
import numpy as np
from bokeh.transform import linear_cmap

output_file("styling_linear_mappers.html", title="styling_linear_mappers.py example")

# Create some random data
x = np.random.random(1000) * 2 + 5
y = np.random.normal(size=1000) * 2 + 5

df = pd.DataFrame(data=dict(x=x, y=y)).sort_values(by="x")

mapper = linear_cmap(field_name='y' #Use the field name of the column source
                    ,palette=Spectral6
                    ,low=df.y.min()
                    ,high=df.y.max()
                    )

source = ColumnDataSource(df.reset_index())

p = figure(plot_width=400, plot_height=400)

p.scatter(x='x', y='y', line_color=mapper,color=mapper, fill_alpha=1, size=4, source=source)

p.title.text = "Linear Color Map Based on Y"


show(p)