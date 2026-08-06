# https://github.com/bokeh/bokeh/issues/15070

# Bokeh imports
from bokeh.models import BoxZoomTool, CustomJS, PanTool
from bokeh.plotting import figure

pan = PanTool(active=True)
box_zoom = BoxZoomTool()

plot = figure(tools=[pan, box_zoom], width=300, height=300)
plot.scatter(x=[0, 1, 2], y=[0, 1, 2], size=10, fill_color=["red", "green", "blue"])

for tool in (pan, box_zoom):
    tool.js_on_change("active", CustomJS(args=dict(tool=tool), code="""
    export default ({tool}) => { tool.tags = [...tool.tags, tool.active] }
    """))

output = plot
