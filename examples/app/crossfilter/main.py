import pandas as pd

from bokeh.layouts import row, widgetbox
from bokeh.models import Select
from bokeh.palettes import Spectral5
from bokeh.plotting import curdoc, figure
from bokeh.sampledata.autompg import autompg

df = autompg.copy()

SIZES = list(range(6, 22, 3))
COLORS = Spectral5
ORIGINS = ['North America', 'Europe', 'Asia']

# data cleanup
df.cyl = [str(x) for x in df.cyl]
df.origin = [ORIGINS[x-1] for x in df.origin]

df['year'] = [str(x) for x in df.yr]
del df['yr']

df['mfr'] = [x.split()[0] for x in df.name]
df.loc[df.mfr=='chevy', 'mfr'] = 'chevrolet'
df.loc[df.mfr=='chevroelt', 'mfr'] = 'chevrolet'
df.loc[df.mfr=='maxda', 'mfr'] = 'mazda'
df.loc[df.mfr=='mercedes-benz', 'mfr'] = 'mercedes'
df.loc[df.mfr=='toyouta', 'mfr'] = 'toyota'
df.loc[df.mfr=='vokswagen', 'mfr'] = 'volkswagen'
df.loc[df.mfr=='vw', 'mfr'] = 'volkswagen'
del df['name']

columns = sorted(df.columns)
discrete = [x for x in columns if df[x].dtype == object]
continuous = [x for x in columns if x not in discrete]
quantileable = [x for x in continuous if len(df[x].unique()) > 20]


def create_figure():
    xs = df[x.value].values
    ys = df[y.value].values
    x_title = x.value.title()
    y_title = y.value.title()

    kw = dict()
    if x.value in discrete:
        kw['x_range'] = sorted(set(xs))
    if y.value in discrete:
        kw['y_range'] = sorted(set(ys))
    kw['title'] = "%s vs %s" % (x_title, y_title)

    p = figure(plot_height=600, plot_width=800, tools='pan,box_zoom,reset', **kw)
    p.xaxis.axis_label = x_title
    p.yaxis.axis_label = y_title

    if x.value in discrete:
        p.xaxis.major_label_orientation = pd.np.pi / 4

    sz = 9
    if size.value != 'None':
        groups = pd.qcut(df[size.value].values, len(SIZES))
        sz = [SIZES[xx] for xx in groups.codes]

    c = "#31AADE"
    if color.value != 'None':
        groups = pd.qcut(df[color.value].values, len(COLORS))
        c = [COLORS[xx] for xx in groups.codes]
    p.circle(x=xs, y=ys, color=c, size=sz, line_color="white", alpha=0.6, hover_color='white', hover_alpha=0.5)

    return p


def update(attr, old, new):
    layout.children[1] = create_figure()


x = Select(title='X-Axis', value='mpg', options=columns)
x.on_change('value', update)

y = Select(title='Y-Axis', value='hp', options=columns)
y.on_change('value', update)

size = Select(title='Size', value='None', options=['None'] + quantileable)
size.on_change('value', update)

color = Select(title='Color', value='None', options=['None'] + quantileable)
color.on_change('value', update)

controls = widgetbox([x, y, color, size], width=200)
layout = row(controls, create_figure())

curdoc().add_root(layout)
curdoc().title = "Crossfilter"
