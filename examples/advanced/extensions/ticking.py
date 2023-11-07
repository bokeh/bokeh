from bokeh.io import show
from bokeh.models import TickFormatter
from bokeh.plotting import figure
from bokeh.util.compiler import TypeScript

CODE = """
import {TickFormatter} from "models/formatters/tick_formatter"

export class MyFormatter extends TickFormatter {
  // accepts a list of numbers (ticks) and returns a list of strings
  doFormat(ticks: string[] | number[]) {
    // format the first tick as-is
    const formatted = [`${ticks[0]}`]

    // format the rest as offsets from the first
    for (let i = 1; i < ticks.length; i++) {
      formatted.push(`+${(Number(ticks[i]) - Number(ticks[0])).toPrecision(2)}`)
    }
    return formatted
  }
}
"""


class MyFormatter(TickFormatter):
    __implementation__ = TypeScript(CODE)


p = figure()
p.scatter([1, 2, 3, 4, 6], [5, 7, 3, 2, 4], size=20)

p.xaxis.formatter = MyFormatter()

show(p)
