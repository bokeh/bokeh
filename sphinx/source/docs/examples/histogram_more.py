# -*- coding: utf-8 -*-

from quickstart_examples import *
import scipy.special

mu, sigma = 0, 0.5

measured = np.random.normal(mu, sigma, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

x = np.linspace(-2, 2, 1000)
pdf = 1/(sigma * np.sqrt(2*np.pi)) * np.exp(-(x-mu)**2 / (2*sigma**2))
cdf = (1+scipy.special.erf((x-mu)/np.sqrt(2*sigma**2)))/2

output_file('histogram.html')

hold()

figure(title="Normal Distribution (μ=0, σ=0.5)",tools="previewsave",
       background_fill="#E8DDCB")
quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649",)

# Use `line` renderers to display the PDF and CDF
line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")

legend().orientation = "top_left"
xax, yax = axis()
xax.axis_label = 'x'
yax.axis_label = 'Pr(x)'

show()