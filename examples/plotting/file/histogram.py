# -*- coding: utf-8 -*-

import numpy as np
import scipy.special

from bokeh.plotting import figure, show, output_file, vplot

output_file('histogram.html')

p1 = figure(title="Normal Distribution (μ=0, σ=0.5)",tools="save",
       background_fill="#E8DDCB")

mu, sigma = 0, 0.5

measured = np.random.normal(mu, sigma, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

x = np.linspace(-2, 2, 1000)
pdf = 1/(sigma * np.sqrt(2*np.pi)) * np.exp(-(x-mu)**2 / (2*sigma**2))
cdf = (1+scipy.special.erf((x-mu)/np.sqrt(2*sigma**2)))/2

p1.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
     fill_color="#036564", line_color="#033649",\
)
p1.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p1.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")

p1.legend.orientation = "top_left"
p1.xaxis.axis_label = 'x'
p1.yaxis.axis_label = 'Pr(x)'



p2 = figure(title="Log Normal Distribution (μ=0, σ=0.5)", tools="save",
       background_fill="#E8DDCB")

mu, sigma = 0, 0.5

measured = np.random.lognormal(mu, sigma, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

x = np.linspace(0, 8.0, 1000)
pdf = 1/(x* sigma * np.sqrt(2*np.pi)) * np.exp(-(np.log(x)-mu)**2 / (2*sigma**2))
cdf = (1+scipy.special.erf((np.log(x)-mu)/(np.sqrt(2)*sigma)))/2

p2.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
    fill_color="#036564", line_color="#033649")
p2.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p2.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")

p2.legend.orientation = "bottom_right"
p2.xaxis.axis_label = 'x'
p2.yaxis.axis_label = 'Pr(x)'



p3 = figure(title="Gamma Distribution (k=1, θ=2)", tools="save",
       background_fill="#E8DDCB")

k, theta = 1.0, 2.0

measured = np.random.gamma(k, theta, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

x = np.linspace(0, 20.0, 1000)
pdf = x**(k-1) * np.exp(-x/theta) / (theta**k * scipy.special.gamma(k))
cdf = scipy.special.gammainc(k, x/theta) / scipy.special.gamma(k)

p3.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
    fill_color="#036564", line_color="#033649")
p3.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p3.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")

p3.legend.orientation = "top_left"
p3.xaxis.axis_label = 'x'
p3.yaxis.axis_label = 'Pr(x)'



p4 = figure(title="Beta Distribution (α=2, β=2)", tools="save",
       background_fill="#E8DDCB")

alpha, beta = 2.0, 2.0

measured = np.random.beta(alpha, beta, 1000)
hist, edges = np.histogram(measured, density=True, bins=50)

x = np.linspace(0, 1, 1000)
pdf = x**(alpha-1) * (1-x)**(beta-1) / scipy.special.beta(alpha, beta)
cdf = scipy.special.btdtr(alpha, beta, x)

p4.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
    fill_color="#036564", line_color="#033649")
p4.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p4.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")

p4.xaxis.axis_label = 'x'
p4.yaxis.axis_label = 'Pr(x)'



p5 = figure(title="Weibull Distribution (λ=1, k=1.25)", tools="save",
       background_fill="#E8DDCB")

lam, k = 1, 1.25

measured = lam*(-np.log(np.random.uniform(0, 1, 1000)))**(1/k)
hist, edges = np.histogram(measured, density=True, bins=50)

x = np.linspace(0, 8, 1000)
pdf = (k/lam)*(x/lam)**(k-1) * np.exp(-(x/lam)**k)
cdf = 1 - np.exp(-(x/lam)**k)

p5.quad(top=hist, bottom=0, left=edges[:-1], right=edges[1:],
    fill_color="#036564", line_color="#033649")
p5.line(x, pdf, line_color="#D95B43", line_width=8, alpha=0.7, legend="PDF")
p5.line(x, cdf, line_color="white", line_width=2, alpha=0.7, legend="CDF")

p5.legend.orientation = "top_left"
p5.xaxis.axis_label = 'x'
p5.yaxis.axis_label = 'Pr(x)'



show(vplot(p1,p2,p3,p4,p5))
