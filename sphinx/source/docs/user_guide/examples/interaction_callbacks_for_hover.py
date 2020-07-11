from bokeh.models import ColumnDataSource, CustomJS, HoverTool
from bokeh.plotting import figure, output_file, show

output_file("hover_callback.html")

# define some points and a little graph between them
x = [2, 3, 5, 6, 8, 7]
y = [6, 4, 3, 8, 7, 5]
links = {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 5],
    3: [1, 4],
    4: [1, 3],
    5: [2, 3, 4]
}

p = figure(plot_width=400, plot_height=400, tools="", toolbar_location=None, title='Hover over points')

source = ColumnDataSource({'x0': [], 'y0': [], 'x1': [], 'y1': []})
sr = p.segment(x0='x0', y0='y0', x1='x1', y1='y1', color='olive', alpha=0.6, line_width=3, source=source, )
cr = p.circle(x, y, color='olive', size=30, alpha=0.4, hover_color='olive', hover_alpha=1.0)

# add a hover tool that sets the link data for a hovered circle
code = """
const links = %s
const data = {'x0': [], 'y0': [], 'x1': [], 'y1': []}
const indices = cb_data.index.indices
for (var i = 0; i < indices.length; i++) {
    const start = indices[i]
    for (var j = 0; j < links[start].length; j++) {
        const end = links[start][j]
        data['x0'].push(circle.data.x[start])
        data['y0'].push(circle.data.y[start])
        data['x1'].push(circle.data.x[end])
        data['y1'].push(circle.data.y[end])
    }
}
segment.data = data
""" % links

callback = CustomJS(args={'circle': cr.data_source, 'segment': sr.data_source}, code=code)
p.add_tools(HoverTool(tooltips=None, callback=callback, renderers=[cr]))

show(p)
