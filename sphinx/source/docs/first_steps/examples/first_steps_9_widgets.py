from bokeh.layouts import layout
from bokeh.models import Div, RangeSlider, Spinner
from bokeh.plotting import figure, output_file, show

# prepare some data
x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
y = [4, 5, 5, 7, 2, 6, 4, 9, 1, 3]

# set output to static HTML file
output_file("first_steps.html")

# create plot with circle glyphs
p = figure(x_range=(1,9), plot_width=500, plot_height=250)
points = p.circle(x=x, y=y, size=30, fill_color="#21a7df")

# set up textarea (div)
div = Div(text="""
          <p>Select the circle's size using this control element:</p>
          """,
          width=200, height=30)

# set up spinner
spinner = Spinner(
    title="Circle size",
    low=0,
    high=60,
    step=5,
    value=points.glyph.size,
    width=200,
    )
spinner.js_link('value', points.glyph, 'size')

# set up RangeSlider
range_slider = RangeSlider(
    start=0, end=10,
    value=(p.x_range.start, p.x_range.end),
    step=1, title="Adjust x-axis range"
    )
range_slider.js_link('value', p.x_range, 'start', attr_selector=0)
range_slider.js_link('value', p.x_range, 'end', attr_selector=1)

# create layout
layout = layout([
    [div, spinner],
    [range_slider],
    [p],
])

# show result
show(layout)
