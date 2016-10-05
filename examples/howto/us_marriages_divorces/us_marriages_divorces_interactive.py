# coding: utf-8

# Plotting U.S. marriage and divorce statistics
#
# Example code by Randal S. Olson (http://www.randalolson.com)

from bokeh.plotting import figure, show, output_file, ColumnDataSource
from bokeh.models import HoverTool, NumeralTickFormatter
from bokeh.models import SingleIntervalTicker, LinearAxis

# Since the data set is loaded in the bokeh data repository, we can do this:

from bokeh.sampledata.us_marriages_divorces import data

md_data = data.copy()

# Fill in missing data with a simple linear interpolation
md_data = md_data.interpolate(method='linear', axis=0).ffill().bfill()

# Tell Bokeh where to save the interactive chart
output_file('us_marriages_divorces_per_capita.html',
            title='144 years of marriage and divorce in the U.S.A.')

# Set up the data sources for the lines we'll be plotting.
# We need separate data sources for each line because we're
# displaying different data in the hover tool.

source_marriages = ColumnDataSource(
    data=dict(
        # x-axis (Years) for the chart
        x=md_data.Year.values,
        # y-axis (Marriages per capita) for the chart
        y=md_data.Marriages_per_1000.values,
        # The string version of the y-value that is displayed in the hover box
        y_text=md_data.Marriages_per_1000.apply(
            lambda x: '{}'.format(round(x, 1))),
        # Extra descriptive text that is displayed in the hover box
        desc=['marriages per 1,000 people'] * len(md_data),
    )
)

source_divorces = ColumnDataSource(
    data=dict(
        # x-axis (Years) for the chart
        x=md_data.Year.values,
        # y-axis (Marriages per capita) for the chart
        y=md_data.Divorces_per_1000.values,
        # The string version of the y-value that is displayed in the hover box
        y_text=md_data.Divorces_per_1000.apply(
            lambda x: '{}'.format(round(x, 1))),
        # Extra descriptive text that is displayed in the hover box
        desc=['divorces and annulments per 1,000 people'] * len(md_data),
    )
)

# Use HTML to mark up the tooltip that displays over the chart
# Note that the variables in the data sources (above) are referenced with a @
hover = HoverTool(
    tooltips='<font face="Arial" size="3">@y_text @desc in @x</font>',
    mode='vline')

# Select the tools that will be available to the chart
TOOLS = ['pan,wheel_zoom,box_zoom,reset,save'] + [hover]

bplot = figure(tools=TOOLS, width=800, height=500, x_axis_type=None)

# Create a custom x-axis with 10-year intervals
ticker = SingleIntervalTicker(interval=10, num_minor_ticks=0)
xaxis = LinearAxis(ticker=ticker)
bplot.add_layout(xaxis, 'below')

# Customize the y-axis
bplot.yaxis.formatter = NumeralTickFormatter(format='0.0a')
bplot.yaxis.axis_label = '# per 1,000 people'

# Provide a descriptive title for the chart
bplot.title.text = '144 years of marriage and divorce in the U.S.'

# Finally, plot the data!
# Note that the data source determines what is plotted and what shows in
# the tooltips
bplot.line('x', 'y', color='#1f77b4', line_width=3, source=source_marriages)
bplot.line('x', 'y', color='#ff7f0e', line_width=3, source=source_divorces)

show(bplot)
