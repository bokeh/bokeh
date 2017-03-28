from math import pi
import pandas as pd

from bokeh.io import show, output_file
from bokeh.models import ColumnDataSource, HoverTool, LinearColorMapper
from bokeh.plotting import figure
from bokeh.sampledata.unemployment1948 import data

# this is the colormap from the original NYTimes plot
colors = ["#75968f", "#a5bab7", "#c9d9d3", "#e2e2e2", "#dfccce", "#ddb7b1", "#cc7878", "#933b41", "#550b1d"]
mapper = LinearColorMapper(palette=colors)

data = data.set_index('Year')
data.drop('Annual', axis=1, inplace=True)
data.columns.name = 'Month'

df = pd.DataFrame(data.stack(), columns=['rate'])
df = df.reset_index()

year_dict = {year: i for i, year in enumerate(data.index.unique())}
month_dict = {month: i for i, month in enumerate(data.columns.unique())}

# offset to place January at 12 o'clock
offset = pi/2

df['inner_radius'] = df.apply(lambda x: year_dict[x.Year] + month_dict[x.Month]/12, axis=1)
df['outer_radius'] = df['inner_radius'] + 1
df['start_angle'] = [2*pi/12*month_dict[month]+offset for month in df.Month]
df['end_angle'] = [2*pi/12*(month_dict[month]+1)+offset for month in df.Month]

source = ColumnDataSource(df)

TOOLS = "hover,save,pan,box_zoom,wheel_zoom,reset"

p = figure(title="US Unemployment ({0} - {1})".format(df.Year.min(), df.Year.max()),
           x_range=(-df['outer_radius'].max(), df['outer_radius'].max()),
           y_range=(-df['outer_radius'].max(), df['outer_radius'].max()),
           plot_width=700, plot_height=700, tools=TOOLS)

p.axis.visible = False
p.grid.visible = False

p.annular_wedge(x=0, y=0,
                inner_radius='inner_radius', outer_radius='outer_radius',
                start_angle='start_angle', end_angle='end_angle',
                fill_color={'field': 'rate', 'transform': mapper},
                line_color=None,
                source=source)
p.select_one(HoverTool).tooltips = [
     ('date', '@Month @Year'),
     ('rate', '@rate'),
]

output_file("unemployment_polar.html", title="unemployment_polar.py example")

show(p)
