import numpy as np
import requests
import shutil
import pylab

from bokeh.plotting import figure, show, output_file
import bokeh.util.image

# downloading image
url_lena_gray = 'http://www.ece.rice.edu/~wakin/images/lena512.bmp'
response = requests.get(url_lena_gray, stream=True)
with open('lena_gray.bmp', 'wb') as f:
    shutil.copyfileobj(response.raw, f)
del response

img_ = pylab.imread('lena_gray.bmp')
img = bokeh.util.image.convert_gray_to_bokehrbga(img_)

output_file("image_rgba_bis.html", title="image.py example")

p = figure(x_range=[0, 10], y_range=[0, 10])

p.image_rgba(image=[img], x=[0], y=[0], dw=[10], dh=[10])  # image is upside down, it's similar to pylab.imshow(img_, origin='top')
# TODO : image_rgba doesn't support origin keyword for now
show(p)

#p2.image(image=[img], x=[0], y=[0], dw=[10], dh=[10], palette="Spectral11")


