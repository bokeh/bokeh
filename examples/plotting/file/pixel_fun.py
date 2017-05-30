#Just for fun, taking a jpg image and plotting it pointillistic style on a bokeh canvas using circle glyphs!
#Requires PIL!
import Image
import numpy
import random
from bokeh.plotting import *


def int_to_hex_color(v):
    assert(len(v) == 3)
    return '#%02x%02x%02x' % (v[0], v[1], v[2])

output_file('test.html')
src = Image.open('bluebells.jpg').rotate(270)
src.thumbnail((640, 360), Image.ANTIALIAS)
src = src.convert(mode='RGB')
imageArray = numpy.asarray(src)
#only every 4th pixel
imageArray_SS = numpy.asarray(src)[::4, ::4]
x, y, colorpart = imageArray_SS.shape
xvector = numpy.arange(0, imageArray_SS.shape[0])
yvector = numpy.arange(0, imageArray_SS.shape[1])
xv, yv = numpy.meshgrid(yvector, xvector)
xv = xv.flatten()
yv = yv.flatten()
colorhex = []
radiusarray = []
for xx in xvector:
    for yy in yvector:
        colorRGB = imageArray[xx*4][yy*4].tolist()
        colorhex.append(int_to_hex_color(colorRGB))
        radiusarray.append((float(random.randint(5, 6))/10))

xv = [x + (float(random.randint(-5, 5))/10) for x in xv]
yv = [y + (float(random.randint(-5, 5))/10) for y in yv]
circle(yv, xv, fill_color=colorhex, alpha=0.9, radius=radiusarray, line_alpha=0, line_color=None, plot_width=1280, plot_height=720, dilate=True)
show()
