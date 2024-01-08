''' Solution of Schrödinger's equation for the motion of a particle in one
dimension in a parabolic potential well. This example demonstrates the use of
mathtext on ``Label`` and ``Title`` annotations.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.plotting.figure.varea, bokeh.models.Label, bokeh.models.Title
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex

.. _Harmonic oscillator wavefunctions: https://scipython.com/blog/the-harmonic-oscillator-wavefunctions

'''
import numpy as np
from scipy.special import factorial, hermite

from bokeh.models import Label, Range1d, Title
from bokeh.plotting import figure, show

p = figure(width=800, height=600, x_range=Range1d(-6, 6), y_range=Range1d(0, 8), toolbar_location=None)
p.xaxis.axis_label = r"$$q$$"
p.yaxis.visible = False
p.xgrid.visible = False
p.ygrid.visible = False

title = [
    r"Wave function $$\psi_v(q)$$ of first 8 mode solutions of Schrodinger's equation " +
    r"$$-\frac{1}{2}\frac{d^2\psi}{dq^2} + \frac{1}{2}q^2\psi = \frac{E}{\hbar\omega}\psi$$",
    r"Each wave function is labelled with its quantum number $$v$$ and energy $$E_v$$",
    r"in a potential $$V(q) = \frac{q^2}{2}$$ shown by the dashed line.",
]
for text in reversed(title):
    p.add_layout(Title(text=text, text_font_style="normal"), "above")

q = np.linspace(-6, 6, 100)
yscale = 0.75
number_of_modes = 8

for v in range(number_of_modes):
    H_v = hermite(v)
    N_v = (np.pi**0.5 * 2**v * factorial(v))**(-0.5)
    psi = N_v*H_v(q)*np.exp(-q**2/2)
    E_v = v + 0.5  # Use energy level as y-offset.

    y = yscale*psi + E_v
    yupper = np.where(y >= E_v, y, E_v)
    ylower = np.where(y <= E_v, y, E_v)

    p.varea(q, yupper, E_v, fill_color= "#5D3A9B")
    p.varea(q, ylower, E_v, fill_color= "#E66100")
    p.line(q, y, color="red", line_width=2)

    p.add_layout(Label(x=-5.8, y=E_v, y_offset=-21, text=rf"$$v = {v}$$"))
    p.add_layout(Label(x=3.9, y=E_v, y_offset=-25, text=rf"$$E_{v} = ({2*v+1}/2) \hbar\omega$$"))

V = q**2 / 2
p.line(q, V, line_color="black", line_width=2, line_dash="dashed")

show(p)
