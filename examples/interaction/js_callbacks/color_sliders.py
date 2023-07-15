''' An interactive plot of colors. This example demonstrates adding widgets and
``CustomJS`` callbacks that can update a plot.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.text, bokeh.layouts.column, bokeh.models.sources.ColumnDataSource, bokeh.models.callbacks.CustomJS, bokeh.models.widgets.sliders.Slider, bokeh.themes.Theme
    :refs: :ref:`ug_interaction_js_callbacks_customjs`
    :keywords: hover, javascript callback, theme, tooltip

''' # noqa: E501
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, CustomJS, Slider
from bokeh.plotting import curdoc, figure, show
from bokeh.themes import Theme

color = R, G, B = (75, 125, 125)
text_color = (255, 255, 255)

# create a data source to enable refreshing of fill & text color
source = ColumnDataSource(data=dict(color=[color], text_color=[text_color]))

# create first plot, as a rect() glyph and centered text label, with fill and text color taken from source
p = figure(x_range=(-8, 8), y_range=(-4, 4),
           width=400, height=300,
           title='move sliders to change', tools='')

p.rect(0, 0, width=18, height=10, fill_color='color',
        line_color = 'black', source=source)

p.text(0, 0, text='color', text_color='text_color',
       alpha=0.6667, text_font_size='48px', text_baseline='middle',
       text_align='center', source=source)

red = Slider(title="R", start=0, end=255, value=R, step=1)
green = Slider(title="G", start=0, end=255, value=G, step=1)
blue = Slider(title="B", start=0, end=255, value=B, step=1)

callback = CustomJS(args=dict(source=source, red=red, blue=blue, green=green), code="""
    function toHex(c) {
        const hex = c.toString(16)
        return hex.length == 1 ? "0" + hex : hex
    }

    const R = red.value | 0
    const G = green.value | 0
    const B = blue.value | 0

    const color = "#" + toHex(R) + toHex(G) + toHex(B)
    const text_color = ((R > 127) || (G > 127) || (B > 127)) ? '#000000' : '#ffffff'
    source.data = { color: [color], text_color: [text_color] }
""")

red.js_on_change('value', callback)
blue.js_on_change('value', callback)
green.js_on_change('value', callback)

# theme everything for a cleaner look
curdoc().theme = Theme(json={
    "attrs": {
        "Plot": { "toolbar_location": None },
        "Grid": { "grid_line_color": None },
        "Axis": {
            "axis_line_color": None,
            "major_label_text_color": None,
            "major_tick_line_color": None,
            "minor_tick_line_color": None,
        },
    },
})

show(column(red, green, blue, p))
