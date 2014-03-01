# -*- coding: utf-8 -*-

import numpy as np
import scipy.special

from bokeh.plotting import *
from bokeh.objects import Range1d

mu, sigma = 0, 0.5       # NOTE: you can tinker with these values if you like

# sample the distribution
measured = np.random.normal(mu, sigma, 10000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(-2, 2, 10000)
pdf = 1/(sigma * np.sqrt(2*np.pi)) * np.exp(-(x-mu)**2 / (2*sigma**2))
cdf = (1+scipy.special.erf((x-mu)/np.sqrt(2*sigma**2)))/2

# EXERCISE: output to a static HTML file

# EXERCISE: turn on plot hold

# Use the `quad` renderer to display the histogram bars.
quad(top=hist, bottom=np.zeros(len(hist)), left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649",

     # NOTE: these are only needed on the first renderer
     background_fill="#E8DDCB",
     title="Normal Distribution (μ=0, σ=0.5)",
     tools=""
)

# EXERCISE: supply some style parameters for the PDF and CDF `line` renderers
line(x, pdf, legend="PDF",
     line_color=
     line_width=
     alpha=
)
line(x, cdf, legend="CDF",
     line_color=
     line_width=
     alpha=
)

# Move the legend to a better place.
# Acceptable values: 'top_left', 'top_right', 'bottom_left', and 'bottom_right'
legend().orientation = "top_left"

# EXERCISE: create a new figure

mu, sigma = 0, 0.5       # NOTE: you can tinker with these values if you like

# sample the distribution
measured = np.random.lognormal(mu, sigma, 10000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 8.0, 10000)
pdf = 1/(x* sigma * np.sqrt(2*np.pi)) * np.exp(-(np.log(x)-mu)**2 / (2*sigma**2))
cdf = (1+scipy.special.erf((np.log(x)-mu)/(np.sqrt(2)*sigma)))/2

# EXERCISE: recreate the first plot for this new data

# EXERCISE (optional): Add new plots for the other distributions. Some code
# has be included for the Gamme, Beta, and Weibull distributions, you will
# need to create new figures and renderers.

# code for Gamma Distribution

k, theta = 1.0, 2.0

# sample the distribution
measured = np.random.gamma(k, theta, 10000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 20.0, 10000)
pdf = x**(k-1) * np.exp(-x/theta) / (theta**k * scipy.special.gamma(k))
cdf = scipy.special.gammainc(k, x/theta) / scipy.special.gamma(k)

# code for Beta Distribution

alpha, beta = 2.0, 2.0

# sample the distribution
measured = np.random.beta(alpha, beta, 10000)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 1, 10000)
pdf = x**(alpha-1) * (1-x)**(beta-1) / scipy.special.beta(alpha, beta)
cdf = scipy.special.btdtr(alpha, beta, x)

# code for Weibull Distribution

lam, k = 1, 1.25

# sample the distribution
measured = lam*(-np.log(np.random.uniform(0, 1, 10000)))**(1/k)
hist, edges = np.histogram(measured, density=True, bins=50)

# compute ideal values
x = np.linspace(0, 8, 10000)
pdf = (k/lam)*(x/lam)**(k-1) * np.exp(-(x/lam)**k)
cdf = 1 - np.exp(-(x/lam)**k)

show()