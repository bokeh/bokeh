from __future__ import absolute_import, print_function

from math import pi

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.util.browser import view

from bokeh.models import Range1d, Plot, PanTool, WheelZoomTool, BoxZoomTool, UndoTool, RedoTool, ResetTool
from gear import Gear

def pitch_radius(module, teeth):
    return float(module*teeth)/2

def half_tooth(teeth):
    return pi/teeth

line_color = '#606060'
fill_color = ['#ddd0dd', '#d0d0e8', '#ddddd0']

def sample_gear():
    xdr = Range1d(start=-30, end=30)
    ydr = Range1d(start=-30, end=30)

    plot = Plot(x_range=xdr, y_range=ydr, plot_width=800, plot_height=800)
    plot.add_tools(PanTool(), WheelZoomTool(), BoxZoomTool(), UndoTool(), RedoTool(), ResetTool())

    glyph = Gear(x=0, y=0, module=5, teeth=8, angle=0, shaft_size=0.2, fill_color=fill_color[2], line_color=line_color)
    plot.add_glyph(glyph)

    return plot

def classical_gear(module, large_teeth, small_teeth):
    xdr = Range1d(start=-300, end=150)
    ydr = Range1d(start=-100, end=100)

    plot = Plot(x_range=xdr, y_range=ydr, plot_width=800, plot_height=800)
    plot.add_tools(PanTool(), WheelZoomTool(), BoxZoomTool(), UndoTool(), RedoTool(), ResetTool())

    radius = pitch_radius(module, large_teeth)
    angle = 0
    glyph = Gear(
        x=-radius, y=0,
        module=module, teeth=large_teeth, angle=angle,
        fill_color=fill_color[0], line_color=line_color
    )
    plot.add_glyph(glyph)

    radius = pitch_radius(module, small_teeth)
    angle = half_tooth(small_teeth)
    glyph = Gear(
        x=radius, y=0,
        module=module, teeth=small_teeth, angle=angle,
        fill_color=fill_color[1], line_color=line_color
    )
    plot.add_glyph(glyph)

    return plot

def epicyclic_gear(module, sun_teeth, planet_teeth):
    xdr = Range1d(start=-150, end=150)
    ydr = Range1d(start=-150, end=150)

    plot = Plot(x_range=xdr, y_range=ydr, plot_width=800, plot_height=800)
    plot.add_tools(PanTool(), WheelZoomTool(), BoxZoomTool(), UndoTool(), RedoTool(), ResetTool())

    annulus_teeth = sun_teeth + 2*planet_teeth

    glyph = Gear(
        x=0, y=0,
        module=module, teeth=annulus_teeth, angle=0,
        fill_color=fill_color[0], line_color=line_color, internal=True
    )
    plot.add_glyph(glyph)

    glyph = Gear(
        x=0, y=0,
        module=module, teeth=sun_teeth, angle=0,
        fill_color=fill_color[2], line_color=line_color
    )
    plot.add_glyph(glyph)

    sun_radius = pitch_radius(module, sun_teeth)
    planet_radius = pitch_radius(module, planet_teeth)

    radius = sun_radius + planet_radius
    angle = half_tooth(planet_teeth)

    for i, j in [(+1, 0), (0, +1), (-1, 0), (0, -1)]:
        glyph = Gear(
            x=radius*i, y=radius*j,
            module=module, teeth=planet_teeth, angle=angle,
            fill_color=fill_color[1], line_color=line_color
        )
        plot.add_glyph(glyph)

    return plot

doc = Document()
doc.add_root(sample_gear())

classical = classical_gear(5, 52, 24)
epicyclic = epicyclic_gear(5, 24, 12)

doc.add_root(classical)
doc.add_root(epicyclic)

if __name__ == "__main__":
    doc.validate()
    filename = "gears.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Gears"))
    print("Wrote %s" % filename)
    view(filename)
