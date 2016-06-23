import numpy as np

from bokeh.plotting import figure, show, output_file

# Define Bollinger Bands.
upperband = np.random.random_integers(100, 150, size=100)
lowerband = upperband - 100
x_data = np.arange(1, 101)

# Bollinger shading glyph:
band_x = np.append(x_data, x_data[::-1])
band_y = np.append(lowerband, upperband[::-1])

output_file('bollinger.html', title='Bollinger bands (file)')

p = figure(x_axis_type='datetime', title="Bollinger Bands")
p.grid.grid_line_alpha = 0.4
p.x_range.range_padding = 0
p.plot_height = 600
p.plot_width = 800

p.patch(band_x, band_y, color='#7570B3', fill_alpha=0.2)

show(p)
