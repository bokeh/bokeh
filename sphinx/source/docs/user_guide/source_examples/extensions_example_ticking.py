from bokeh.io import output_file, show
from bokeh.models import TickFormatter
from bokeh.plotting import figure

JS_CODE = """
TickFormatter = require "models/formatters/tick_formatter"

class MyFormatter extends TickFormatter.Model
  type: "MyFormatter"

  # TickFormatters should implement this method, which accepts a lisst
  # of numbers (ticks) and returns a list of strings
  doFormat: (ticks) ->
    # format the first tick as-is
    formatted = ["#{ticks[0]}"]

    # format the remaining ticks as a difference from the first
    for i in [1...ticks.length]
       formatted.push("+#{(ticks[i]-ticks[0]).toPrecision(2)}")

    return formatted

module.exports =
  Model: MyFormatter
"""

class MyFormatter(TickFormatter):

    __implementation__ = JS_CODE

p = figure()
p.circle([1,2,3,4,6], [5,7,3,2,4])

p.xaxis.formatter = MyFormatter()

show(p)
