import numpy as np

from bokeh.io import curdoc
from bokeh.models import TeX
from bokeh.palettes import Spectral
from bokeh.plotting import figure, show

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
    fig.line(nu/1e15, B_nu/1e-9, line_width=2, legend_label=f"T = {T} K", line_color=palette[i])

# Peak radiance line.
Ts = np.linspace(1900, 6101, 50)
peak_freqs = Ts*5.879e10
peak_radiance = spectral_radiance(peak_freqs, Ts)
fig.line(peak_freqs/1e15, peak_radiance/1e-9, line_color="silver", line_dash="dashed", line_width=2, legend_label="Peak radiance")

curdoc().theme = 'dark_minimal'
fig.y_range.start = 0
fig.xaxis.axis_label = TeX(text=r"\color{white} \nu \:(10^{15} s^{-1})")
fig.yaxis.axis_label = TeX(
    text=r"\color{white} B_\nu(\nu, T) = \frac{2h\nu^3}{c^2} \frac{1}{\exp(h\nu/kT)-1} \quad(10^{-9} J s m^{-3})")

show(fig)
