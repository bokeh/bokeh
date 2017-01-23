from math import pi

import pandas as pd

from bokeh.models.formatters import TickFormatter, String, List
from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.stocks import MSFT

# create a custom model for a new tick formatter
class DateGapTickFormatter(TickFormatter):
    ''' A custom TickFormatter useful for skipping dates

    Axis labels are taken from an array of date strings
    (e.g. ['Sep 01', 'Sep 02', ...]) passed to the ``date_labels``
    property.

    '''
    date_labels = List(String, help="""
    An array of date strings to map integer date indices to.
    """)

    __implementation__ = """
        import {Model} from "model"
        import * as p from "core/properties"

        export class DateGapTickFormatter extends Model
          type: 'DateGapTickFormatter'

          doFormat: (ticks) ->
            date_labels = @date_labels
            return (date_labels[tick] ? "" for tick in ticks)

          @define {
            date_labels: [ p.Any ]
          }
    """

df = pd.DataFrame(MSFT)[:50]

# xaxis date labels used in the custom TickFormatter
date_labels = [date.strftime('%b %d') for date in pd.to_datetime(df["date"])]

inc = df.close > df.open
dec = df.open > df.close
w = 0.5

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

p = figure(tools=TOOLS, plot_width=1000, title="MSFT Candlestick with Custom X-Axis")
p.xaxis.major_label_orientation = pi/4
p.grid[0].ticker.desired_num_ticks = 6

# use the custom TickFormatter. You must always define date_labels
p.xaxis.formatter = DateGapTickFormatter(date_labels=date_labels)

# x coordinates must be integers. If, for example, df.index are
# datetimes, you should replace them with a integer sequence
p.segment(df.index, df.high, df.index, df.low, color="black")
p.vbar(df.index[inc], w, df.open[inc], df.close[inc], fill_color="#D5E1DD", line_color="black")
p.vbar(df.index[dec], w, df.open[dec], df.close[dec], fill_color="#F2583E", line_color="black")

output_file("custom_datetime_axis.html", title="custom_datetime_axis.py example")

show(p)  # open a browser
