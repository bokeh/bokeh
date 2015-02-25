from __future__ import print_function

from math import pi

from bokeh.document import Document
from bokeh.models import ColumnDataSource, Range1d, Plot
from bokeh.models.glyphs import Gear
from bokeh.plotting import show

def pitch_radius(module, teeth):
    return float(module*teeth)/2

def half_tooth(teeth):
    return pi/teeth

line_color = '#606060'
fill_color = ['#ddd0dd', '#d0d0e8', '#ddddd0']

def epicyclic_gear(module, sun_teeth, planet_teeth):
    xdr = Range1d(start=-150, end=150)
    ydr = Range1d(start=-150, end=150)

    plot = Plot(
    title=None, x_range=xdr, y_range=ydr, plot_width=300, plot_height=300,
    h_symmetry=False, v_symmetry=False, min_border=0, toolbar_location=None)

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

epicyclic = epicyclic_gear(5, 24, 12)

doc.add(epicyclic)

show(epicyclic)
