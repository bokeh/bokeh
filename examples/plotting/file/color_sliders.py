from bokeh.plotting import figure, hplot, output_file, show
from bokeh.models import  ColumnDataSource, LinearColorMapper, HoverTool
from bokeh.models.actions import Callback
from bokeh.models.widgets import Slider
from bokeh.io import vform
import colorsys

# for plot 2: create colour spectrum of resolution N and brightness I, return as list of decimal RGB value tuples
def generate_color_range(N, I):
    HSV_tuples = [ (x*1.0/N, 0.5, I) for x in range(N) ]
    RGB_tuples = map(lambda x: colorsys.hsv_to_rgb(*x), HSV_tuples)
    for_conversion = []
    for RGB_tuple in RGB_tuples:
        for_conversion.append((int(RGB_tuple[0]*255), int(RGB_tuple[1]*255), int(RGB_tuple[2]*255)))
    hex_colors = [ rgb_to_hex(RGB_tuple) for RGB_tuple in for_conversion ]
    return hex_colors, for_conversion

# convert RGB tuple to hexadecimal code
def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % rgb

# convert hexadecimal to RGB tuple
def hex_to_dec(hex):
    red = ''.join(hex.strip('#')[0:2])
    green = ''.join(hex.strip('#')[2:4])
    blue = ''.join(hex.strip('#')[4:6])
    return (int(red, 16), int(green, 16), int(blue,16))

# plot 1: create a color block with RGB values adjusted with sliders
# initialise a white block for the first plot
x = [0]
y = [0]
red   = 255
green = 255
blue  = 255
hex_color = rgb_to_hex((red,green,blue))

# initialise the text color as black. This will be switched to white if the block color gets dark enough
text_color = '#000000'

# create a data source to enable refreshing of fill & text color
source = ColumnDataSource(data=dict(x = x, y = y, color = [hex_color], text_color = [text_color]))

tools1 = 'reset, save'

# create first plot, as a rect() glyph and centered text label, with fill and text color taken from source
p1 = figure(x_range=(-8, 8), y_range=(-4, 4), plot_width=600, plot_height=300, title=None, tools=tools1)
color_block = p1.rect(x='x', y='y', width=18, height=10, fill_color='color', line_color = 'black', source=source)
hex_code_text = p1.text('x', 'y', text='color', text_color='text_color', alpha=0.6667, text_font_size='36pt', text_baseline='middle', text_align='center', source=source)

# the callback function to update the color of the block and associated label text
# NOTE: the JS functions for converting RGB to hex are taken from the excellent answer
# by Tim Down at http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
callback = Callback(args=dict(source=source), code="""
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }
    var data = source.get('data');
    var RS = red_slider;
    var GS = green_slider;
    var BS = blue_slider;
    color = data['color'];
    var red_from_slider = RS.get('value');
    var green_from_slider = GS.get('value');
    var blue_from_slider = BS.get('value');
    text_color = data['text_color'];
    color[0] = rgbToHex(red_from_slider, green_from_slider, blue_from_slider);
    if ((red_from_slider > 127) || (green_from_slider > 127) || (blue_from_slider > 127)) {
        text_color[0] = '#000000';
    }
    else {
        text_color[0] = '#ffffff';
    }
    source.trigger('change');
""")

# create slider tool objects to control the RGB levels for first plot. Set callback function to allow refresh
red_slider = Slider(start=0, end=255, value=255, step=1, title="R", callback=callback)
green_slider = Slider(start=0, end=255, value=255, step=1, title="G", callback=callback)
blue_slider = Slider(start=0, end=255, value=255, step=1, title="B", callback=callback)
callback.args['red_slider'] = red_slider
callback.args['green_slider'] = green_slider
callback.args['blue_slider'] = blue_slider

# plot 2: create a color spectrum with a hover-over tool to inspect hex codes
brightness = 0.8 # at the moment this is hard-coded. Change if you want brighter/darker colors
crx = list(range(1,1001)) # the resolution is 1000 colors
cry = [ 5 for i in range(len(crx)) ]
crcolor, crRGBs = generate_color_range(1000,brightness) # produce spectrum

# make data source object to allow information to be displayed by hover tool
crsource = ColumnDataSource(data=dict(x = crx, y = cry, crcolor = crcolor, RGBs = crRGBs))

tools2 = 'reset, save, hover'

# create second plot
p2 = figure(x_range=(0,1000), y_range=(0,10), plot_width=600, plot_height=150, tools=tools2, title = 'hover over color')
color_range1 = p2.rect(x='x', y='y', width=1, height=10, color='crcolor', source=crsource)
# set up hover tool to show color hex code and sample swatch
hover = p2.select(dict(type=HoverTool))
hover.tooltips = [
                   ('color', '$color[hex, rgb, swatch]:crcolor'),
                   ('RGB levels', '@RGBs')
                    ]

# get rid of axis details for cleaner look
p1.ygrid.grid_line_color = None
p1.xgrid.grid_line_color = None
p1.axis.axis_line_color  = None
p1.axis.major_label_text_color = None
p1.axis.major_tick_line_color = None
p1.axis.minor_tick_line_color = None

p2.ygrid.grid_line_color = None
p2.xgrid.grid_line_color = None
p2.axis.axis_line_color  = None
p2.axis.major_label_text_color = None
p2.axis.major_tick_line_color = None
p2.axis.minor_tick_line_color = None

layout = hplot(
    vform(red_slider, green_slider, blue_slider),
    vform(p1, p2)
)

output_file("color_sliders.html")
show(layout)
