import pandas as pd

from bokeh.models import NumeralTickFormatter
from bokeh.charts import Bar, Waterfall, output_file, show, vplot, hplot, defaults

output_file("waterfall.html")

data = {
    'category': ['product', 'service', 'service', 'product', 'fixed cost', 'variable cost', 'fixed cost'],
    'value': [123033.43, 12323.2, 57902.84, 85039, -95000, -12384, -84900],
    'value category': ['revenue', 'revenue', 'revenue', 'revenue', 'cost', 'cost', 'cost'],
    'description': ["Power Fix", "Training", "Consulting", "Power Cell", "HeadQuarter", "Marketing", "Hosting Services"]
}
df = pd.DataFrame(data)

bar_plot = Waterfall(df, label='category', values='value', color='value category', title="Waterfall label='category'")
bar_plot._yaxis.formatter = NumeralTickFormatter(format="$0.00")
show(bar_plot)
