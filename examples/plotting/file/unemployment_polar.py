from math import pi, sin, cos
import pandas as pd

from bokeh.io import show, output_file
from bokeh.plotting import figure
from bokeh.models import (
    ColumnDataSource,
    HoverTool,
    LinearColorMapper,
    BasicTicker,
    PrintfTickFormatter,
    ColorBar,
    LabelSet,
)
from bokeh.sampledata.unemployment1948 import data

data = data.set_index('Year')
data.drop('Annual', axis=1, inplace=True)
data.columns.name = 'Month'

year_dict = {year: i for i, year in enumerate(data.index)}
month_dict = {month: i for i, month in enumerate(data.columns)}

# reshape to 1D array or rates with a month and year for each row.
df = pd.DataFrame(data.stack(), columns=['rate']).reset_index()

# this is the colormap from the original NYTimes plot
colors = ["#75968f", "#a5bab7", "#c9d9d3", "#e2e2e2", "#dfccce", "#ddb7b1", "#cc7878", "#933b41", "#550b1d"]
mapper = LinearColorMapper(palette=colors, low=df.rate.min(), high=df.rate.max())

# offset to place January at 12 o'clock
offset = pi/2

df['inner_radius'] = df.apply(lambda x: year_dict[x.Year] + month_dict[x.Month]/12, axis=1)
df['outer_radius'] = df['inner_radius'] + 1
df['start_angle'] = [2*pi/12*month_dict[month]+offset for month in df.Month]
df['end_angle'] = [2*pi/12*(month_dict[month]+1)+offset for month in df.Month]

source = ColumnDataSource(df)

TOOLS = "hover,save,pan,wheel_zoom,reset"

# set up figure
p = figure(title="US Unemployment ({0} - {1})".format(df.Year.min(), df.Year.max()),
           x_range=(-df['outer_radius'].max(), df['outer_radius'].max()),
           y_range=(-df['outer_radius'].max(), df['outer_radius'].max()),
           plot_width=700, plot_height=700, tools=TOOLS, toolbar_location='above')

p.axis.visible = False
p.grid.visible = False

p.annular_wedge(x=0, y=0,
                inner_radius='inner_radius', outer_radius='outer_radius',
                start_angle='start_angle', end_angle='end_angle',
                fill_color={'field': 'rate', 'transform': mapper},
                line_color=None,
                source=source)

label_options = dict(background_fill_color='white', background_fill_alpha=.5,
                     text_font_size="10pt")

label_interval = 10
label_years = [str(y) for y in df.Year.unique() if y % label_interval == 0]
label_positions = [df[df['Year'] == int(y)].outer_radius.min() for y in label_years]

label_source = ColumnDataSource(dict(years=label_years, positions=label_positions))
labels = LabelSet(x=0, y='positions', text='years', level='glyph',
                  source=label_source, text_baseline='top', **label_options)
p.add_layout(labels)

label_r = 55
label_months = [m for m in df.Month.unique()]
angles = [df[df['Month'] == m][['start_angle', 'end_angle']].mean().mean() for m in label_months]
label_angles = [a if (a < pi/2 or a > pi*3/2) else a - pi for a in angles]
label_x = [cos(a)*label_r for a in angles]
label_y = [sin(a)*label_r for a in angles]

label_source = ColumnDataSource(dict(months=label_months,
                                     x=label_x,
                                     y=label_y,
                                     angle=label_angles))
labels = LabelSet(x='x', y='y', text='months', level='glyph', angle='angle',
                  source=label_source,
                  text_baseline='middle', text_align='center',
                  **label_options)
p.add_layout(labels)

color_bar = ColorBar(color_mapper=mapper,
                     ticker=BasicTicker(desired_num_ticks=len(colors)),
                     formatter=PrintfTickFormatter(format="%d%%"),
                     label_standoff=8, border_line_color=None, location=(0, 0))
p.add_layout(color_bar, 'right')

p.select_one(HoverTool).tooltips = [
     ('date', '@Month @Year'),
     ('rate', '@rate%'),
]

output_file("unemployment_polar.html", title="unemployment_polar.py example")

show(p)
