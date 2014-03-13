from bokeh.plotting import *
import numpy as np

output_file('bollinger.html', title='Bollinger bands (file)')

# Define Bollinger Bands.
upperband = np.random.random_integers(100, 150, size=100)
lowerband = upperband - 100
x_data = np.arange(1, 101)

# Bollinger shading glyph:
band_x = np.append(x_data, x_data[::-1])
band_y = np.append(lowerband, upperband[::-1])

figure(x_axis_type='datetime', tools='pan,wheel_zoom,box_zoom,previewsave,reset,resize')
patch(band_x, band_y, color='#7570B3', fill_alpha=0.2)

# Define plot parameters.
curplot().title = 'Bollinger Bands'
curplot().height = 600
curplot().width = 800
grid().grid_line_alpha = 0.4

show()
