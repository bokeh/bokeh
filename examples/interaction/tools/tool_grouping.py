from bokeh.layouts import column, row
from bokeh.models import CustomJS, Div, HoverTool, Switch, TapTool
from bokeh.plotting import figure, show

plot = figure(width=400, height=400, tools=["pan", "box_select", "save", "reset"])

cr1 = plot.scatter([1, 2, 3], [5, 5, 5], size=30, color="red")
cr2 = plot.scatter([1, 2, 3], [4, 4, 4], size=30, color="green")
cr3 = plot.scatter([1, 2, 3], [3, 3, 3], size=30, color="blue")
cr4 = plot.scatter([1, 2, 3], [2, 2, 2], size=30, color="purple")
cr5 = plot.scatter([1, 2, 3], [1, 1, 1], size=30, color="yellow")

plot.add_tools(
    HoverTool(renderers=[cr1], description="Hover over red", group="rgb"),
    HoverTool(renderers=[cr2], description="Hover over green", group="rgb"),
    HoverTool(renderers=[cr3], description="Hover over blue", group="rgb"),
    HoverTool(renderers=[cr4], description="Hover over yellow"),
    HoverTool(renderers=[cr5], description="Hover over purple"),
)

plot.add_tools(
    TapTool(renderers=[cr1], description="Tap over red", group="rgb"),
    TapTool(renderers=[cr2], description="Tap over green", group="rgb"),
    TapTool(renderers=[cr3], description="Tap over blue", group="rgb"),
    TapTool(renderers=[cr4], description="Tap over yellow"),
    TapTool(renderers=[cr5], description="Tap over purple"),
)

text = Div(text="Group tools:")
switch = Switch(active=plot.toolbar.group)
switch.js_on_change("active", CustomJS(args=dict(plot=plot), code="""
export default ({plot}, {active: group}) => {
    plot.toolbar.group = group
}
"""))
layout = column([row([text, switch]), plot])

show(layout)
