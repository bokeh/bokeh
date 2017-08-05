from bokeh.plotting import figure, output_file, show
from bokeh.models import ColumnDataSource, HoverTool, CustomJS

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

# Add a hover tool, that sets the link data for a hovered circle
code = """
var links = %s;
var data = {'x0': [], 'y0': [], 'x1': [], 'y1': []};
var cdata = circle.data;
var indices = cb_data.index['1d'].indices;
for (i=0; i < indices.length; i++) {
    ind0 = indices[i]
    for (j=0; j < links[ind0].length; j++) {
        ind1 = links[ind0][j];
        data['x0'].push(cdata.x[ind0]);
        data['y0'].push(cdata.y[ind0]);
        data['x1'].push(cdata.x[ind1]);
        data['y1'].push(cdata.y[ind1]);
    }
}
segment.data = data;
""" % links

callback = CustomJS(args={'circle': cr.data_source, 'segment': sr.data_source}, code=code)
p.add_tools(HoverTool(tooltips=None, callback=callback, renderers=[cr]))

show(p)
