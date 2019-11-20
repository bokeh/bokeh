from bokeh.io import show
from bokeh.models import TickFormatter
from bokeh.plotting import figure
from bokeh.util.compiler import TypeScript

JS_CODE = """
import {TickFormatter} from "models/formatters/tick_formatter"

export class MyFormatter extends TickFormatter {

  // TickFormatters should implement this method, which accepts a list
  // of numbers (ticks) and returns a list of strings
  doFormat(ticks: number[] | string[]): string[] {
    // format the first tick as-is
    const formatted = [`${ticks[0]}`]

    // format the remaining ticks as a difference from the first
    for (let i = 1; i < ticks.length; i++) {
      formatted.push(`+${(Number(ticks[i]) - Number(ticks[0])).toPrecision(2)}`)
    }

    return formatted
  }
}
"""

class MyFormatter(TickFormatter):

    __implementation__ = TypeScript(JS_CODE)

p = figure()
p.circle([1,2,3,4,6], [5,7,3,2,4])

p.xaxis.formatter = MyFormatter()

show(p)
