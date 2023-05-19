from bokeh.core.properties import Color, Float, List, Override, String
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (Callback, Circle, ColumnDataSource, LinearAxis,
                          PanTool, Plot, TapTool, WheelZoomTool)
from bokeh.util.browser import view
from bokeh.util.compiler import TypeScript


class Popup(Callback):

    __implementation__ = "popup.ts"

    message = String("", help="""
    Message to display in a popup window. This can be a template string,
    which will be formatted with data from the data source.
    """)

class MyPlot(Plot):

    __implementation__ = TypeScript("""
import {Plot, PlotView} from "models/plots/plot"
import * as p from "core/properties"
import "./custom.less"

export class MyPlotView extends PlotView {
  declare model: MyPlot

  render(): void {
    super.render()
    this.el.classList.add("bk-my-plot")

    const angle = `${this.model.gradient_angle}deg`

    let offset = 0
    const colors = []
    const step = this.model.gradient_step

    for (const color of this.model.gradient_colors) {
      colors.push(`${color} ${offset}px`)
      offset += step
      colors.push(`${color} ${offset}px`)
    }

    this.el.style.backgroundImage = `repeating-linear-gradient(${angle}, ${colors.join(', ')})`
  }
}

export namespace MyPlot {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Plot.Props & {
    gradient_angle: p.Property<number>
    gradient_step: p.Property<number>
    gradient_colors: p.Property<string[]>
  }
}

export interface MyPlot extends MyPlot.Attrs {
  width: number | null
  height: number | null
}

export class MyPlot extends Plot {
  declare properties: MyPlot.Props
  declare __view_type__: MyPlotView

  static {
    this.prototype.default_view = MyPlotView

    this.define<MyPlot.Props>(({Number, String, Array}) => ({
      gradient_angle:  [ Number, 0 ],
      gradient_step:   [ Number, 20 ],
      gradient_colors: [ Array(String), ["white", "lightgray"] ],
    }))

    this.override<MyPlot.Props>({
      background_fill_alpha: 0.0,
      border_fill_alpha: 0.0,
    })
  }
}
""")

    gradient_angle = Float(default=0)
    gradient_step = Float(default=20)
    gradient_colors = List(Color, default=["white", "gray"])

    background_fill_alpha = Override(default=0.0)
    border_fill_alpha = Override(default=0.0)

source = ColumnDataSource(
    data = dict(
        x = [1, 2, 3, 4, 4,   5, 5],
        y = [5, 4, 3, 2, 2.1, 1, 1.1],
        color = ["rgb(0, 100, 120)", "green", "blue", "#2c7fb8", "#2c7fb8", "rgba(120, 230, 150, 0.5)", "rgba(120, 230, 150, 0.5)"],
    ),
)

plot = MyPlot(gradient_angle=45)

circle = Circle(x="x", y="y", radius=0.2, fill_color="color", line_color="black")
circle_renderer = plot.add_glyph(source, circle)

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

tap = TapTool(renderers=[circle_renderer], callback=Popup(message="Selected color: @color"))
plot.add_tools(PanTool(), WheelZoomTool(), tap)

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "custom.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, title="Demonstration of user-defined models"))
    print(f"Wrote {filename}")
    view(filename)
