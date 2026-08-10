# https://github.com/bokeh/bokeh/issues/15070

# Bokeh imports
from bokeh.layouts import gridplot
from bokeh.models import BoxZoomTool, PanTool
from bokeh.plotting import figure


def fig():
    # pan sorts first by default_order, but opts out, so box zoom must win the drag
    plot = figure(tools=[PanTool(active=False), BoxZoomTool()], width=300, height=300)
    plot.scatter(x=[0, 1, 2], y=[0, 1, 2], size=10, fill_color=["red", "green", "blue"])
    return plot

fig0 = fig()
fig1 = fig()
fig2 = fig()

# merge_tools wraps each tool in a ToolProxy, so "auto" has to be resolved
# through the proxy down to the tools it holds
gp = gridplot([[fig0], [fig1], [fig2]], merge_tools=True)
output = gp