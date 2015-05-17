from __future__ import division

import numpy as np

from bokeh.plotting import figure, output_file, show, VBox

# NOTE: if you do have numba installed, uncomment out this import,
# and the 'autojit' lines below (the example will run more quickly).
#from numba import autojit

# These functions generate the Mandelbrot set image. Don't worry if
# you are not familiar with them. The import thing is just to know
# that they create a 2D array of numbers that we can colormap.

#@autojit
def mandel(x, y, max_iters):
    """
    Given the real and imaginary parts of a complex number,
    determine if it is a candidate for membership in the Mandelbrot
    set given a fixed number of iterations.
    """
    c = complex(x, y)
    z = 0.0j
    for i in range(max_iters):
        z = z*z + c
        if (z.real*z.real + z.imag*z.imag) >= 4:
            return i
    return max_iters

#@autojit
def create_fractal(min_x, max_x, min_y, max_y, image, iters):
    height = image.shape[0]
    width = image.shape[1]

    pixel_size_x = (max_x - min_x) / width
    pixel_size_y = (max_y - min_y) / height

    for x in range(width):
        real = min_x + x * pixel_size_x
        for y in range(height):
            imag = min_y + y * pixel_size_y
            color = mandel(real, imag, iters)
            image[y, x] = color

# Define the bounding coordinates to generate the Mandelbrot image in. You
# can play around with these.
min_x = -2.0
max_x = 1.0
min_y = -1.0
max_y = 1.0

# Use the functions above to create a scalar image (2D array of numbers)
img = np.zeros((1024, 1536), dtype = np.uint8)
create_fractal(min_x, max_x, min_y, max_y, img, 20)

# EXERCISE: output static HTML file

# create a figure, setting the x and y ranges to the appropriate data bounds
p1 = figure(title="Mandelbrot", plot_width=900, plot_height=600,
  x_range = [min_x, max_x], y_range = [min_y, max_y])

# EXERCISE: Fill in the missing parameters to use the `image` renderer to
# display the Mandelbrot image color mapped with the palette 'Spectral11'
#
# NOTE: the `image` renderer can display many images at once, so it takes
# **lists** of images, coordinates, and palettes. Remember to supply sequences
# for these parameters, even if you are just supplying one.
p1.image(image=               # image data
         x=                   # lower left x coord
         y=                   # lower left y coord
         dw=                  # *data space* width of image
         dh=                  # *data space* height of image
         palette=             # palette name
)

# create a new figure
p2 = figure(title="RGBA image", x_range = [0,10], y_range = [0,10])

# We can also use the `image_rgba` renderer to display RGBA images that
# we have color mapped ourselves.
N = 20
img = np.empty((N,N), dtype=np.uint32)
view = img.view(dtype=np.uint8).reshape((N, N, 4))
for i in range(N):
    for j in range(N):
        view[i, j, 0] = int(i/N*255) # red
        view[i, j, 1] = 158          # green
        view[i, j, 2] = int(j/N*255) # blue
        view[i, j, 3] = 255          # alpha

# EXERCISE: use `image_rgba` to display the image above. Use the following
# cordinates: (x0,y0) = (0,0)  and (x1,y1) = (10,10). Remember to set the
# x_range and y_range explicitly as above.

# show the plots arrayed in a VBox
show(VBox(p1, p2))

