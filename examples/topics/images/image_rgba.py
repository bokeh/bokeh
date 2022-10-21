''' A plot demonstrates rendering images from bare RGBA array data.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.image_rgba
    :refs: :ref:`ug_topics_images`
    :keywords: image, rgba

'''
import numpy as np

from bokeh.plotting import figure, show

N = 20
img = np.empty((N,N), dtype=np.uint32)
view = img.view(dtype=np.uint8).reshape((N, N, 4))
for i in range(N):
    for j in range(N):
        view[i, j, 0] = int(i/N*255)
        view[i, j, 1] = 158
        view[i, j, 2] = int(j/N*255)
        view[i, j, 3] = 255

p = figure(width=400, height=400)
p.x_range.range_padding = p.y_range.range_padding = 0

# must give a vector of images
p.image_rgba(image=[img], x=0, y=0, dw=10, dh=10)

show(p)
