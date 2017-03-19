''' Show a streaming, updating representation of Fourier Series.

The example was inspired by `this video`_.

Use the ``bokeh serve`` command to run the example by executing:

    bokeh serve fourier_animated.py

at your command prompt. Then navigate to the URL

    http://localhost:5006/fourier_animated

in your browser.

.. _this video: https://www.youtube.com/watch?v=LznjC4Lo7lE

'''
from collections import OrderedDict

import numpy as np
from numpy import pi

from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models.sources import ColumnDataSource as CDS
from bokeh.plotting import figure
from bokeh.driving import repeat

N = 100
newx = x = np.linspace(0, 2*pi, N)
shift = 2.2
base_x = x + shift

period = pi/2
palette = ['#08519c', '#3182bd', '#6baed6', '#bdd7e7']

def new_source():
    return dict(
        curve=CDS(dict(x=[], base_x=[], y=[])),
        lines=CDS(dict(line_x=[], line_y=[], radius_x=[], radius_y=[])),
        circle_point=CDS(dict(x=[], y=[], r=[])),
        circleds=CDS(dict(x=[], y=[]))
    )

def create_circle_glyphs(p, color, sources):
    p.circle('x', 'y', size=1., line_color=color, color=None, source=sources['circleds'])
    p.circle('x', 'y', size=5, line_color=color, color=color, source=sources['circle_point'])
    p.line('radius_x', 'radius_y', line_color=color, color=color, alpha=0.5, source=sources['lines'])

def create_plot(foos, title='', r = 1, y_range=None, period = pi/2, cfoos=None):
    if y_range is None:
        y_range=[-2, 2]

    # create new figure
    p = figure(title=title, plot_width=800, plot_height=300, x_range=[-2, 9], y_range=y_range)
    p.xgrid.bounds = (-2, 2)
    p.xaxis.bounds = (-2, 2)

    _sources = []
    cx, cy = 0, 0
    for i, foo in enumerate(foos):
        sources = new_source()
        get_new_sources(x, foo, sources, cfoos[i], cx, cy, i==0)
        cp = sources['circle_point'].data
        cx, cy = cp['x'][0], cp['y'][0]

        if i==0:
            # compute the full fourier eq
            full_y = sum([foo(x) for foo in foos])
            # replace the foo curve with the full fourier eq
            sources['curve'] = CDS(dict(x=x, base_x=base_x, y=full_y))
            # draw the line
            p.line('base_x','y', color="orange", line_width=2, source=sources['curve'])

        if i==len(foos)-1:
            # if it's the last foo let's draw a circle on the head of the curve
            sources['floating_point'] = CDS({'x':[shift], 'y': [cy]})
            p.line('line_x', 'line_y', color=palette[i], line_width=2, source=sources['lines'])
            p.circle('x', 'y', size=10, line_color=palette[i], color=palette[i], source=sources['floating_point'])

        # draw the circle, radius and circle point realted to foo domain
        create_circle_glyphs(p, palette[i], sources)
        _sources.append(sources)

    return p, _sources


def get_new_sources(xs, foo, sources, cfoo, cx=0, cy=0, compute_curve = True):
    if compute_curve:
        ys = foo(xs)
        sources['curve'].data = dict(x=xs, base_x=base_x, y=ys)

    r = foo(period)
    y = foo(xs[0]) + cy
    x = cfoo(xs[0]) + cx

    sources['lines'].data = {
        'line_x': [x, shift], 'line_y': [y, y],
        'radius_x': [0, x], 'radius_y': [0, y]
    }
    sources['circle_point'].data = {'x': [x], 'y': [y], 'r': [r]}
    sources['circleds'].data=dict(
        x = cx + np.cos(np.linspace(0, 2*pi, N)) * r,
        y = cy + np.sin(np.linspace(0, 2*pi, N)) * r,
    )

def update_sources(sources, foos, newx, ind, cfoos):
    cx, cy = 0, 0

    for i, foo in enumerate(foos):
        get_new_sources(newx, foo, sources[i], cfoos[i], cx, cy,
                        compute_curve = i != 0)

        if i == 0:
            full_y = sum([foo(newx) for foo in foos])
            sources[i]['curve'].data = dict(x=newx, base_x=base_x, y=full_y)

        cp = sources[i]['circle_point'].data
        cx, cy = cp['x'][0], cp['y'][0]

        if i == len(foos)-1:
            sources[i]['floating_point'].data['x'] = [shift]
            sources[i]['floating_point'].data['y'] = [cy]

def update_centric_sources(sources, foos, newx, ind, cfoos):
    for i, foo in enumerate(foos):
        get_new_sources(newx, foo, sources[i], cfoos[i])

def create_centric_plot(foos, title='', r = 1, y_range=(-2, 2), period = pi/2, cfoos=None):
    p = figure(title=title, plot_width=800, plot_height=300, x_range=[-2, 9], y_range=y_range)
    p.xgrid.bounds = (-2, 2)
    p.xaxis.bounds = (-2, 2)

    _sources = []
    for i, foo in enumerate(foos):
        sources = new_source()
        get_new_sources(x, foo, sources, cfoos[i])
        _sources.append(sources)

        if i:
            legend = "4sin(%(c)sx)/%(c)spi" % {'c': i*2+1}
        else:
            legend = "4sin(x)/pi"

        p.line('base_x','y', color=palette[i], line_width=2, source=sources['curve'])
        p.line('line_x', 'line_y', color=palette[i], line_width=2,
                source=sources['lines'], legend=legend)

        create_circle_glyphs(p, palette[i], sources)

    p.legend.location = "top_right"
    p.legend.orientation = "horizontal"
    p.legend.padding = 6
    p.legend.margin = 6
    p.legend.spacing = 6

    return p, _sources

# create the series partials
f1 = lambda x: (4*np.sin(x))/pi
f2 = lambda x: (4*np.sin(3*x))/(3*pi)
f3 = lambda x: (4*np.sin(5*x))/(5*pi)
f4 = lambda x: (4*np.sin(7*x))/(7*pi)
cf1 = lambda x: (4*np.cos(x))/pi
cf2 = lambda x: (4*np.cos(3*x))/(3*pi)
cf3 = lambda x: (4*np.cos(5*x))/(5*pi)
cf4 = lambda x: (4*np.cos(7*x))/(7*pi)
fourier = OrderedDict(
    fourier_4 = {
        'f': lambda x: f1(x) + f2(x) + f3(x) + f4(x),
        'fs': [f1, f2, f3, f4],
        'cfs': [cf1, cf2, cf3, cf4]
    },
)

for k, p in fourier.items():
    p['plot'], p['sources'] = create_plot(
        p['fs'], 'Fourier (Sum of the first 4 Harmonic Circles)', r = p['f'](period), cfoos = p['cfs']
    )

for k, p in fourier.items():
    p['cplot'], p['csources'] = create_centric_plot(
        p['fs'], 'Fourier First 4 Harmonics & Harmonic Circles', r = p['f'](period), cfoos = p['cfs']
    )

layout = column(*[f['plot'] for f in fourier.values()] + [f['cplot'] for f in fourier.values()])

@repeat(range(N))
def cb(gind):
    global newx
    oldx = np.delete(newx, 0)
    newx = np.hstack([oldx, [oldx[-1] + 2*pi/N]])

    for k, p in fourier.items():
        update_sources(p['sources'], p['fs'], newx, gind, p['cfs'])
        update_centric_sources(p['csources'], p['fs'], newx, gind, p['cfs'])

curdoc().add_periodic_callback(cb, 100)
curdoc().add_root(layout)
curdoc().title = "Fourier Animated"
