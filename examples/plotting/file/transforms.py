import numpy as np

from bokeh.io import vform, VBoxForm
from bokeh.plotting import figure, show, output_file
from bokeh.models.mappers import LinearColorMapper
from bokeh.models import Slider, CustomJS
from bokeh.models.transforms import Jitter

N = 500
x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)

p = figure(x_range=(0, 10), y_range=(0, 10))


jitter = Jitter(name = 'mytrans')
cm = LinearColorMapper(name = 'themapper', palette = 'Spectral11', transform = jitter)

# must give a vector of image data for image parameter
image = p.image(image=[d], x=0, y=0, dw=10, dh=10, color_mapper = cm, name = 'testimage')

callback = CustomJS(args=dict(image = image, jitter = jitter), code="""
        jitter.set('width', cb_obj.get('value'))
        image.attributes.data_source.forceTrigger()
    """)

slider = Slider(start=0.0, end=4, value=0, step=.1, title="Jitter Width", callback=callback, delay_callback = True)

output_file("image.html", title="image.py example")

layout = VBoxForm(slider, p)
show(layout)
