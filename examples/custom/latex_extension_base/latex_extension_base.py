""" The LaTeX example was derived from: http://matplotlib.org/users/usetex.html. """

import numpy as np
from scipy.special import jv

from bokeh.ext import build
from bokeh.palettes import Spectral4
from bokeh.plotting import figure, output_file, show
from latex_label import LatexLabel

build("latex_label")



output_file('latex_extension.html')

p = figure(title="LaTex Extension Demonstration", plot_width=800, plot_height=350,
           background_fill_color="#fafafa")
p.x_range.range_padding = 0

x = np.arange(0.0, 20.0, 0.02)

for i, n in enumerate([0, 1, 4, 7]):
    p.line(x, jv(n, x), line_width=3, color=Spectral4[i], alpha=0.8, legend_label="𝜈=%d" % n)

text = r"""
\text{Bessel Functions of the First Kind: }
J_\nu = \sum_{m=0}^{\infty}\frac{(-1)^m}{m!\ \Gamma(m+\nu+1)}
\left(\frac{x}{2}\right)^{2m+\nu}
"""

latex = LatexLabel(text=text, x=4.5, y=250,
                   x_units='data', y_units='screen',
                   render_mode='css', text_font_size='11px',
                   background_fill_color="white", border_line_color="lightgrey")
p.add_layout(latex)

show(p)
