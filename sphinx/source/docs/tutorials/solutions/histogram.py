# -*- coding: utf-8 -*-

import numpy as np
import scipy.special

from bokeh.plotting import figure, output_file, show, VBox

mu, sigma = 0, 0.5       # NOTE: you can tinker with these values if you like

# sample the distribution
measured = np.random.normal(mu, sigma, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(-2, 2, 1000)
pdf = 1/(sigma * np.sqrt(2*np.pi)) * np.exp(-(x-mu)**2 / (2*sigma**2))
cdf = (1+scipy.special.erf((x-mu)/np.sqrt(2*sigma**2)))/2

# EXERCISE: output to a static HTML file
output_file('histogram.html')

# create a new figure
p1 = figure(title="Normal Distribution (μ=0, σ=0.5)",
           background_fill="#E8DDCB", tools="")

# Use the `quad` renderer to display the histogram bars.
p1.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
       fill_color="#036564", line_color="#033649")

# Use `line` renderers to display the PDF and CDF
p1.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p1.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")

# Move the legend to a better place.
# Acceptable values: 'top_left', 'top_right', 'bottom_left', and 'bottom_right'
p1.legend.orientation = "top_left"

# create a new figure
p2 = figure(title="Log Normal Distribution (μ=0, σ=0.5)",
            background_fill="#E8DDCB", tools="")

mu, sigma = 0, 0.5       # NOTE: you can tinker with these values if you like

# sample the distribution
measured = np.random.lognormal(mu, sigma, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 8.0, 1000)
pdf = 1/(x* sigma * np.sqrt(2*np.pi)) * np.exp(-(np.log(x)-mu)**2 / (2*sigma**2))
cdf = (1+scipy.special.erf((np.log(x)-mu)/(np.sqrt(2)*sigma)))/2

# EXERCISE: recreate the first plot for this new data
p2.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
        fill_color="#036564", line_color="#033649")
p2.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p2.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")
p2.legend.orientation = "bottom_right"

# EXERCISE: (optional): Add new plots for the following distributions:
# * Gamma
# * Beta
# * Weibull
# The numerical code is included, you will need to add renderers to the figures
p3 = figure(title="Gamma Distribution (k=1, θ=2)",
            background_fill="#E8DDCB", tools="")

k, theta = 1.0, 2.0

# sample the distribution
measured = np.random.gamma(k, theta, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 20.0, 1000)
pdf = x**(k-1) * np.exp(-x/theta) / (theta**k * scipy.special.gamma(k))
cdf = scipy.special.gammainc(k, x/theta) / scipy.special.gamma(k)

p3.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
        fill_color="#036564", line_color="#033649")
p3.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p3.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")
p3.legend.orientation = "top_left"


p4 = figure(title="Beta Distribution (α=2, β=2)",
            background_fill="#E8DDCB", tools="")

alpha, beta = 2.0, 2.0

# sample the distribution
measured = np.random.beta(alpha, beta, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 1, 1000)
pdf = x**(alpha-1) * (1-x)**(beta-1) / scipy.special.beta(alpha, beta)
cdf = scipy.special.btdtr(alpha, beta, x)

p4.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
       fill_color="#036564", line_color="#033649")
p4.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p4.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")
p4.legend.orientation = "top_left"


p5 = figure(title="Weibull Distribution (λ=1, k=1.25)",
            background_fill="#E8DDCB",tools="")

lam, k = 1, 1.25

# sample the distribution
measured = lam*(-np.log(np.random.uniform(0, 1, 1000)))**(1/k)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 8, 1000)
pdf = (k/lam)*(x/lam)**(k-1) * np.exp(-(x/lam)**k)
cdf = 1 - np.exp(-(x/lam)**k)

p5.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
        fill_color="#036564", line_color="#033649")
p5.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p5.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")
p5.legend.orientation = "top_left"

# show all the plots arrayed in a VBox
show(VBox(p1, p2, p3, p4, p5))
