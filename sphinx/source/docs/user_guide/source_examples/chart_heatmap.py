from bokeh.charts import HeatMap, output_file, show

import pandas as pd

output_file('heatmap.html')

df = pd.DataFrame(
        dict(
            apples=[4, 5, 8],
            bananas=[1, 2, 4],
            pears=[6, 5, 4],
        ),
        index=['2012', '2013', '2014']
    )

p = HeatMap(df, title='Fruits')

show(p)
