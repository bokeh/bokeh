# coding: utf-8

from bokeh.models import ColumnDataSource, NumeralTickFormatter, SingleIntervalTicker
from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.us_marriages_divorces import data

output_file('us_marriages_divorces_hover.html',
            title='144 years of marriage and divorce in the U.S.A.')

# Fill in missing data with a simple linear interpolation
data = data.interpolate(method='linear', axis=0).ffill().bfill()

# Set up the data sources for the lines we'll be plotting.
source = ColumnDataSource(data=dict(
    year=data.Year.values,
    marriages=data.Marriages_per_1000.values,
    divorces=data.Divorces_per_1000.values,
))

# Select the tools that will be available to the chart
TOOLS = 'pan,wheel_zoom,box_zoom,reset,save'

p = figure(tools=TOOLS, plot_width=800, plot_height=500,
           tooltips='<font face="Arial" size="3">@$name{0.0} $name per 1,000 people in @year</font>')

# Customize the chart
p.hover.mode = 'vline'
p.xaxis.ticker = SingleIntervalTicker(interval=10, num_minor_ticks=0)
p.yaxis.formatter = NumeralTickFormatter(format='0.0a')
p.yaxis.axis_label = '# per 1,000 people'
p.title.text = '144 years of marriage and divorce in the U.S.'

# Plot the data
p.line('year', 'marriages', color='#1f77b4', line_width=3, source=source, name="marriages")
p.line('year', 'divorces', color='#ff7f0e', line_width=3, source=source, name="divorces")

show(p)
