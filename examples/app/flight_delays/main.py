import os
import datetime
import numpy as np
import pandas as pd

from bokeh.models import HBox, VBox
from bokeh.io import curdoc
from bokeh.plotting import Figure
from bokeh.models.widgets import Select, Slider
from bokeh.models import ColumnDataSource, HoverTool, Paragraph
from bokeh.palettes import Reds5

import itertools

from bokeh.sampledata.us_states import data as states

COLORS = list(reversed(Reds5))

def load_data():

    # load states
    states.pop("HI", None)
    states.pop("AK", None)
    state_xs = [states[code]["lons"] for code in states]
    state_ys = [states[code]["lats"] for code in states]
    x_chain = list(itertools.chain(*state_xs))

    max_long = max(x_chain)
    min_long = min(x_chain)

    # load airlines delays
    airline_delays_df = pd.read_csv(os.path.join(os.path.dirname(__file__), 'data/airline_delay_causes.csv'))
    airline_delays_df['period'] = airline_delays_df.apply(lambda row: datetime.date(month=row[' month'], year=row['year'], day=1), axis=1)
    airline_delays_df = airline_delays_df[['period', 'airport', 'arr_flights', 'arr_del15', 'carrier_name']]

    # load airport locations
    adf = pd.read_csv(os.path.join(os.path.dirname(__file__), 'data/airports.csv'))
    adf = adf[adf['country'] == 'United States'][['iata/faa', 'latitude', 'longitude', 'name']]
    adf = adf[(adf.longitude < max_long) & (adf.longitude > min_long)]
    adf.set_index('iata/faa', inplace=True)

    return state_xs, state_ys, airline_delays_df, adf

def on_change(attr, old, new):
    update_map()

def update_map():
    p.title = 'US Airport Delays ({}/{})'.format(month.value, year.value)

    date_value = datetime.date(year=year.value, month=month.value, day=1)
    df1 = airline_delays_df[airline_delays_df.period == date_value]

    if carrier.value != 'All':
        df1 = df1[df1.carrier_name == carrier.value]

    df1 = df1.groupby('airport', as_index=False).sum()
    df1.set_index('airport', inplace=True)

    if df1.empty:
        data = {}
        data['color'] = []
        data['x'] = []
        data['y'] = []
        data['size'] = []
        data['name'] = []
        data['late_pct'] = []
        source.data = data
        return

    df1['late_pct'] = df1['arr_del15'] / df1['arr_flights'] * 100
    df1 = df1[np.isfinite(df1.late_pct)]

    percents_late = df1['late_pct'].tolist()
    groups = pd.qcut(percents_late, min(len(COLORS), len(set(percents_late))))
    df1['color'] = [COLORS[l] for l in groups.codes]

    size_groups = pd.qcut(df1['arr_flights'].tolist(), len(sizes))
    df1['size'] = [sizes[l] for l in size_groups.codes]

    df1 = df1.join(airports_df, how='inner')
    data = {}
    data['color'] = df1['color']
    data['x'] = df1['longitude']
    data['y'] = df1['latitude']
    data['size'] = df1['size']
    data['name'] = df1['name']
    data['late_pct'] = df1['late_pct'].map(lambda r: str(int(r)) + '%')
    source.data = data

state_xs, state_ys, airline_delays_df, airports_df = load_data()
sizes = [3, 6, 9, 12, 15]

TIPS = [
    ("Airport", "@name"),
    ("Delay Rate", "@late_pct"),
]

source = ColumnDataSource(data=dict(x=[], y=[], color=[], size=[], name=[]))

# create figure
p = Figure(title="US Airports Delays", plot_width=990, plot_height=570, toolbar_location=None)
p.grid.grid_line_alpha = 0

p.patches(state_xs, state_ys, fill_alpha=0.0, line_color="#884444", line_width=2, line_alpha=0.3)
cr = p.circle('x', 'y', color='color', size='size', source=source, alpha=.7, line_color='black')

p.add_tools(HoverTool(tooltips=TIPS, renderers=[cr]))

# create controls
year = Slider(title="Year", value=2004, start=2004, end=2014, step=1)
year.on_change('value', on_change)

month = Slider(title="Month", value=1, start=1, end=12, step=1)
month.on_change('value', on_change)

carriers = ['All'] + sorted(airline_delays_df['carrier_name'].unique().tolist())
carrier = Select.create(name='Carrier', value='All', options=carriers)
carrier.on_change('value', on_change)

controls_box = HBox(width=990, children=[year, month, carrier])

intro_text = 'The map above shows U.S. airports symbolized by flight delay information for the time period selected above.'
color_text = 'The color of the airport represents its percentage of delayed flights with lighter red for lower percentage of delays and darker red for greater.'
size_text = 'The size of the airport represents the total number for flight arrivals.'
binning_text = 'For both color and size, airports are binned by quintiles.'

text_box = HBox(width=990, children=[Paragraph(text=intro_text), Paragraph(text=color_text), Paragraph(text=size_text), Paragraph(text=binning_text)])

# create plot
plot_box = VBox(width=990, height=700, children=[controls_box, p, text_box])

update_map()

curdoc().add_root(plot_box)
