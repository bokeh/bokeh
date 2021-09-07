from bokeh.io import curdoc
from bokeh.models import TeX
from bokeh.palettes import Spectral
from bokeh.plotting import figure, show
import numpy as np

fig = figure(
    width=700, height=500, toolbar_location=None,
    title="Black body spectral radiance as a function of frequency")

def spectral_radiance(nu, T):
    h = 6.626e-34   # Planck constant (Js)
    k = 1.3806e-23  # Boltzman constant (J/K)
    c = 2.9979e8    # Speed of light in vacuum (m/s)
    return (2*h*nu**3/c**2) / (np.exp(h*nu/(k*T)) - 1.0)

Ts = np.arange(2000, 6001, 500)  # Temperature (K)
palette = Spectral[len(Ts)]
nu = np.linspace(0, 1e15, 500)  # Frequency (1/s)

for i, T in enumerate(Ts):
    B_nu = spectral_radiance(nu, T)
    fig.line(nu, B_nu, line_width=2, legend_label=f"T = {T} K", line_color=palette[i])

# Peak radiance line.
Ts = np.linspace(1900, 6101, 50)
peak_freqs = Ts*5.879e10
peak_radiance = spectral_radiance(peak_freqs, Ts)
fig.line(peak_freqs, peak_radiance, line_color="silver", line_dash="dashed", line_width=2, legend_label="Peak radiance")

curdoc().theme = 'dark_minimal'
fig.xaxis.axis_label = TeX(text=r"\color{white} \nu \:(s^{-1})")
fig.yaxis.axis_label = TeX(
    text=r"\color{white} B_\nu(\nu, T) = \frac{2h\nu^3}{c^2} \frac{1}{\exp(h\nu/kT)-1} \quad(J s m^{-3})")
fig.xaxis.formatter.precision = 0
fig.yaxis.formatter.precision = 0

show(fig)
