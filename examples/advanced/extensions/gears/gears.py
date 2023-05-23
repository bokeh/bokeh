from math import pi

from bokeh.io import show
from bokeh.layouts import column
from bokeh.plotting import figure

from gear import Gear


def pitch_radius(module, teeth):
    return float(module*teeth)/2

def half_tooth(teeth):
    return pi/teeth

line_color = '#606060'
fill_color = ['#ddd0dd', '#d0d0e8', '#ddddd0']

tools = "pan, wheel_zoom, box_zoom, undo, redo, reset"

def individual_gear():
    plot = figure(
        x_range=(-30, 30), y_range=(-30, 30),
        x_axis_type=None, y_axis_type=None,
        width=800, height=800,
        tools=tools,
    )

    glyph = Gear(x=0, y=0, module=5, teeth=8, angle=0, shaft_size=0.2, fill_color=fill_color[2], line_color=line_color)
    plot.add_glyph(glyph)

    return plot

def classical_gear(module, large_teeth, small_teeth):
    plot = figure(
        x_range=(-300, 150), y_range=(-100, 100),
        x_axis_type=None, y_axis_type=None,
        width=800, height=800,
        tools=tools,
    )

    radius = pitch_radius(module, large_teeth)
    angle = 0
    glyph = Gear(
        x=-radius, y=0,
        module=module, teeth=large_teeth, angle=angle,
        fill_color=fill_color[0], line_color=line_color,
    )
    plot.add_glyph(glyph)

    radius = pitch_radius(module, small_teeth)
    angle = half_tooth(small_teeth)
    glyph = Gear(
        x=radius, y=0,
        module=module, teeth=small_teeth, angle=angle,
        fill_color=fill_color[1], line_color=line_color,
    )
    plot.add_glyph(glyph)

    return plot

def epicyclic_gear(module, sun_teeth, planet_teeth):
    plot = figure(
        x_range=(-150, 150), y_range=(-150, 150),
        x_axis_type=None, y_axis_type=None,
        width=800, height=800,
        tools=tools,
    )

    annulus_teeth = sun_teeth + 2*planet_teeth

    glyph = Gear(
        x=0, y=0,
        module=module, teeth=annulus_teeth, angle=0,
        fill_color=fill_color[0], line_color=line_color, internal=True,
    )
    plot.add_glyph(glyph)

    glyph = Gear(
        x=0, y=0,
        module=module, teeth=sun_teeth, angle=0,
        fill_color=fill_color[2], line_color=line_color,
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
            fill_color=fill_color[1], line_color=line_color,
        )
        plot.add_glyph(glyph)

    return plot

individual = individual_gear()
classical  = classical_gear(5, 52, 24)
epicyclic  = epicyclic_gear(5, 24, 12)

show(column(individual, classical, epicyclic))
