# -*- coding: utf-8 -*-

from quickstart_examples import *

mu, sigma = 0, 0.5
measured = np.random.normal(mu, sigma, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)
x = np.linspace(-2, 2, 1000)

output_file('histogram.html')

figure(title="Histogram", background_fill="#E8DDCB")
quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649")
xax, yax = axis()
xax.axis_label = 'x'
yax.axis_label = 'Pr(x)'

show()