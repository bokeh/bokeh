''' A plot of spectral radiance curves for an ideal radiating blackbody at
various temperatures. This example demonstrates the use of mathtext on axes
and in ``Div`` objects.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.models.Div, bokeh.models.SITickFormatter
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex

'''
import numpy as np

from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import Div, SITickFormatter
from bokeh.palettes import Spectral
from bokeh.plotting import figure, show

p = figure(
    width=650, height=500, toolbar_location=None,
    title="Black body spectral radiance as a function of frequency")
p.y_range.start = 0

def spectral_radiance(nu, T):
    h = 6.626e-34   # Planck constant (Js)
    k = 1.3806e-23  # Boltzmann constant (J/K)
    c = 2.9979e8    # Speed of light in vacuum (m/s)
    return (2*h*nu**3/c**2) / (np.exp(h*nu/(k*T)) - 1.0)

Ts = np.arange(2000, 6001, 500)  # Temperature (K)
palette = Spectral[len(Ts)]
nu = np.linspace(0.1, 1e15, 500)  # Frequency (1/s)

for i, T in enumerate(Ts):
    B_nu = spectral_radiance(nu, T)
    p.line(nu, B_nu, line_width=2,
             legend_label=f"T = {T} K", line_color=palette[i])
p.legend.items = list(reversed(p.legend.items))

# Peak radiance line.
Ts = np.linspace(1900, 6101, 50)
peak_freqs = Ts*5.879e10
peak_radiance = spectral_radiance(peak_freqs, Ts)
p.line(peak_freqs, peak_radiance, line_color="silver",
         line_dash="dashed", line_width=2, legend_label="Peak radiance")

curdoc().theme = 'dark_minimal'
p.xaxis[0].formatter = SITickFormatter(
    unit=r"$$\mathrm{Hz}$$",
    unit_style="except_zero",
)
p.xaxis[0].axis_label = r"$$\nu$$"

p.yaxis[0].formatter = SITickFormatter(
    unit=r"$$\mathrm{W}$$",
    unit_style="except_zero",
)
p.yaxis[0].axis_label = r"$$B_\nu\;\text{per}\;\mathrm{m^2\,sr\,Hz}$$"
p.axis.major_label_standoff = 8

div = Div(text=r"""
A plot of the spectral radiance, defined as a function of the frequency $$\nu$$, is given by the formula
<p \>
$$
\qquad B_\nu(\nu, T) = \frac{2h\nu^3}{c^2} \frac{1}{\exp(h\nu/kT)-1}\ .
$$
""")
show(column(p, div))
