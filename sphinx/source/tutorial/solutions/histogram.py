# -*- coding: utf-8 -*-

import numpy as np
import scipy.special
from bokeh.plotting import *

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

# EXERCISE: turn on plot hold
hold()

# Use the `quad` renderer to display the histogram bars.
quad(top=hist, bottom=np.zeros(len(hist)), left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649",

     # NOTE: these are only needed on the first renderer
     background_fill="#E8DDCB",
     title="Normal Distribution (μ=0, σ=0.5)",
     tools=""
)

# Use `line` renderers to display the PDF and CDF
line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")

# Move the legend to a better place.
# Acceptable values: 'top_left', 'top_right', 'bottom_left', and 'bottom_right'
legend().orientation = "top_left"

# EXERCISE: create a new figure
figure()

mu, sigma = 0, 0.5       # NOTE: you can tinker with these values if you like

# sample the distribution
measured = np.random.lognormal(mu, sigma, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 8.0, 1000)
pdf = 1/(x* sigma * np.sqrt(2*np.pi)) * np.exp(-(np.log(x)-mu)**2 / (2*sigma**2))
cdf = (1+scipy.special.erf((np.log(x)-mu)/(np.sqrt(2)*sigma)))/2

# EXERCISE: recreate the first plot for this new data
quad(top=hist, bottom=np.zeros(len(hist)), left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649", background_fill="#E8DDCB",
     title="Log Normal Distribution (μ=0, σ=0.5)", tools="")
line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")
legend().orientation = "bottom_right"

# EXERCISE (optional): Add new plots for the following distributions:
# * Gamma
# * Beta
# * Weibull
# The numerical code is included, you will need to create new figures.
figure()

k, theta = 1.0, 2.0

# sample the distribution
measured = np.random.gamma(k, theta, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 20.0, 1000)
pdf = x**(k-1) * np.exp(-x/theta) / (theta**k * scipy.special.gamma(k))
cdf = scipy.special.gammainc(k, x/theta) / scipy.special.gamma(k)

quad(top=hist, bottom=np.zeros(len(hist)), left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649", background_fill="#E8DDCB",
     title="Gamma Distribution (k=1, θ=2)", tools="")
line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")
legend().orientation = "top_left"


figure()

alpha, beta = 2.0, 2.0

# sample the distribution
measured = np.random.beta(alpha, beta, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 1, 1000)
pdf = x**(alpha-1) * (1-x)**(beta-1) / scipy.special.beta(alpha, beta)
cdf = scipy.special.btdtr(alpha, beta, x)

quad(top=hist, bottom=np.zeros(len(hist)), left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649", background_fill="#E8DDCB",
     title="Beta Distribution (α=2, β=2)", tools="")
line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")



figure()

lam, k = 1, 1.25

# sample the distribution
measured = lam*(-np.log(np.random.uniform(0, 1, 1000)))**(1/k)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 8, 1000)
pdf = (k/lam)*(x/lam)**(k-1) * np.exp(-(x/lam)**k)
cdf = 1 - np.exp(-(x/lam)**k)

quad(top=hist, bottom=np.zeros(len(hist)), left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649", background_fill="#E8DDCB",
     title="Weibull Distribution (λ=1, k=1.25)", tools="")
line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")
legend().orientation = "top_left"

show()