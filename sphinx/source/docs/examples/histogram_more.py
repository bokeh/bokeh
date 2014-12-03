# -*- coding: utf-8 -*-
import numpy as np
import scipy.special
from bokeh.plotting import figure, output_file, show

# prepare data
mu, sigma = 0, 0.5
measured = np.random.normal(mu, sigma, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)
x = np.linspace(-2, 2, 1000)
pdf = 1/(sigma * np.sqrt(2*np.pi)) * np.exp(-(x-mu)**2 / (2*sigma**2))
cdf = (1+scipy.special.erf((x-mu)/np.sqrt(2*sigma**2)))/2

# output to static HTML file
output_file('histogram.html')

# prepare the histogram
p = figure(title="Normal Distribution (μ=0, σ=0.5)",tools="previewsave",
       background_fill="#E8DDCB")
p.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649",)

# Use `line` renderers to display the PDF and CDF
p.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")

# customize axes
p.legend.orientation = "top_left"
xa, ya = p.axis
xa.axis_label = 'x'
ya.axis_label = 'Pr(x)'

show()