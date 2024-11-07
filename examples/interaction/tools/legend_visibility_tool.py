import numpy as np

from bokeh.layouts import gridplot
from bokeh.models import CustomAction, CustomJS
from bokeh.plotting import figure, show

x = np.linspace(0, 4*np.pi, 100)
y = np.sin(x)

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"

p1 = figure(title="Legend Example", tools=TOOLS)

p1.scatter(x,   y, legend_label="sin(x)")
p1.scatter(x, 2*y, legend_label="2*sin(x)", color="orange")
p1.scatter(x, 3*y, legend_label="3*sin(x)", color="green")

p1.legend.title = "Markers"

p2 = figure(title="Another Legend Example", tools=TOOLS)

p2.scatter(x, y, legend_label="sin(x)")
p2.line(x, y, legend_label="sin(x)")

p2.line(x, 2*y, legend_label="2*sin(x)",
        line_dash=(4, 4), line_color="orange", line_width=2)

p2.scatter(x, 3*y, legend_label="3*sin(x)",
           marker="square", fill_color=None, line_color="green")
p2.line(x, 3*y, legend_label="3*sin(x)", line_color="green")

p2.legend.title = "Lines"

toggle_legend = CustomAction(
    icon=".bk-tool-icon-list",
    description="Toggle legend",
    callback=CustomJS(args=dict(legends=p1.legend + p2.legend), code="""
export default ({legends}) => {
    for (const legend of legends) {
        legend.visible = !legend.visible
    }
    return legends.every((legend) => legend.visible)
}
"""),
)

gp = gridplot([p1, p2], ncols=2, width=400, height=400)
gp.toolbar.tools.append(toggle_legend)

show(gp)
