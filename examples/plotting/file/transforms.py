import numpy as np

from bokeh.io import VBoxForm
from bokeh.plotting import figure, show, output_file
from bokeh.models.mappers import LinearColorMapperTransform
from bokeh.models import Slider, CustomJS
from bokeh.models.transforms import Jitter

N = 500
x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)
d = np.sin(xx)*np.cos(yy)

p = figure(x_range=(0, 10), y_range=(0, 10))

jitter = Jitter(interval = 0.2)
cm = LinearColorMapperTransform(palette = 'Spectral11', transform = jitter)

# must give a vector of image data for image parameter
image = p.image(image=[d], x=0, y=0, dw=10, dh=10, color_mapper = cm)

callback = CustomJS(args=dict(image = image, jitter = jitter), code="""
        jitter.set('interval', cb_obj.get('value'))
        image.attributes.data_source.forceTrigger()
    """)

slider = Slider(start=0, end=4, value=jitter.interval, step=.1, title="Jitter Width", callback=callback)

output_file("image.html", title="image.py example")

layout = VBoxForm(slider, p)
show(layout)
