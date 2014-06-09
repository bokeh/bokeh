from __future__ import print_function

from math import pi

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.browserlib import view

from bokeh.objects import ColumnDataSource, Range1d, Plot, Glyph, PanTool, WheelZoomTool, ResetTool
from bokeh.glyphs import Gear

def pitch_radius(module, teeth):
    return float(module*teeth)/2

def half_tooth(teeth):
    return pi/teeth

line_color = '#606060'
fill_color = ['#ddd0dd', '#d0d0e8', '#ddddd0']

def sample_gear():
    xdr = Range1d(start=-30, end=30)
    ydr = Range1d(start=-30, end=30)

    source = ColumnDataSource(data=dict(dummy=[0]))
    plot = Plot(title=None, data_sources=[source], x_range=xdr, y_range=ydr, plot_width=800, plot_height=800)
    plot.tools.extend([PanTool(plot=plot), WheelZoomTool(plot=plot), ResetTool(plot=plot)])

    glyph = Gear(x=0, y=0, module=5, teeth=8, angle=0, shaft_size=0.2, fill_color=fill_color[2], line_color=line_color)
    renderer = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=glyph)
    plot.renderers.append(renderer)

    return plot

def classical_gear(module, large_teeth, small_teeth):
    xdr = Range1d(start=-300, end=150)
    ydr = Range1d(start=-100, end=100)

    source = ColumnDataSource(data=dict(dummy=[0]))
    plot = Plot(title=None, data_sources=[source], x_range=xdr, y_range=ydr, plot_width=800, plot_height=800)
    plot.tools.extend([PanTool(plot=plot), WheelZoomTool(plot=plot), ResetTool(plot=plot)])

    radius = pitch_radius(module, large_teeth)
    angle = 0
    glyph = Gear(x=-radius, y=0, module=module, teeth=large_teeth, angle=angle, fill_color=fill_color[0], line_color=line_color)
    renderer = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=glyph)
    plot.renderers.append(renderer)

    radius = pitch_radius(module, small_teeth)
    angle = half_tooth(small_teeth)
    glyph = Gear(x=radius, y=0, module=module, teeth=small_teeth, angle=angle, fill_color=fill_color[1], line_color=line_color)
    renderer = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=glyph)
    plot.renderers.append(renderer)

    return plot

def epicyclic_gear(module, sun_teeth, planet_teeth):
    xdr = Range1d(start=-150, end=150)
    ydr = Range1d(start=-150, end=150)

    source = ColumnDataSource(data=dict(dummy=[0]))
    plot = Plot(title=None, data_sources=[source], x_range=xdr, y_range=ydr, plot_width=800, plot_height=800)
    plot.tools.extend([PanTool(plot=plot), WheelZoomTool(plot=plot), ResetTool(plot=plot)])

    annulus_teeth = sun_teeth + 2*planet_teeth

    glyph = Gear(x=0, y=0, module=module, teeth=annulus_teeth, angle=0, fill_color=fill_color[0], line_color=line_color, internal=True)
    renderer = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=glyph)
    plot.renderers.append(renderer)

    glyph = Gear(x=0, y=0, module=module, teeth=sun_teeth, angle=0, fill_color=fill_color[2], line_color=line_color)
    renderer = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=glyph)
    plot.renderers.append(renderer)

    sun_radius = pitch_radius(module, sun_teeth)
    planet_radius = pitch_radius(module, planet_teeth)

    radius = sun_radius + planet_radius
    angle = half_tooth(planet_teeth)

    for i, j in [(+1, 0), (0, +1), (-1, 0), (0, -1)]:
        glyph = Gear(x=radius*i, y=radius*j, module=module, teeth=planet_teeth, angle=angle, fill_color=fill_color[1], line_color=line_color)
        renderer = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=glyph)
        plot.renderers.append(renderer)

    return plot

doc = Document()
doc.add(sample_gear())

classical = classical_gear(5, 52, 24)
epicyclic = epicyclic_gear(5, 24, 12)

doc.add(classical, epicyclic)

if __name__ == "__main__":
    filename = "gears.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Gears"))
    print("Wrote %s" % filename)
    view(filename)
