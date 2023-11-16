''' Simulation of Duffing oscillator which is harmonic motion with a
sinusoidal driving force and damping. It exhibits chaotic behaviour for some
combinations of driving and damping parameters. This example demonstrates the
use of mathtext on ``Div``, ``Paragraph`` and ``Slider`` objects, as well as
axis labels, and also streaming data via a ``ColumnDataSource``.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.scatter, bokeh.plotting.figure.line, bokeh.models.sources.ColumnDataSource.stream,
        bokeh.models.Div, bokeh.models.Paragraph, bokeh.models.Slider
    :refs: :ref:`ug_styling_mathtext`
    :keywords: mathtext, latex

'''
import numpy as np

from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, Div, Paragraph, Range1d, Slider
from bokeh.plotting import curdoc, figure

delta = 0.25
gamma = 0.5
omega = 1.35
timesteps_per_period = 100
timesteps_per_update = 100
timesteps_per_plot = 2
rollover = 5000

dt = 2*np.pi / (omega*timesteps_per_period)
alpha = delta / (2*dt)
beta = 1 / dt**2
n = 0
t = 0
xprev = 0
x = 0

def dV_dx(x):
    return x**3 - x

def reset(new_delta, new_gamma, new_omega):
    global delta, gamma, omega, dt, t, xprev, x, n, alpha
    delta = new_delta
    gamma = new_gamma
    omega = new_omega
    dt = 2*np.pi/omega / timesteps_per_period
    alpha = delta / (2*dt)
    n = 0
    t = 0
    xprev = 0
    x = 0

    cds0.data = dict(x=[0], xdot=[0])
    cds1.data = dict(x=[], xdot=[])

    line.data_source = cds0
    circle.data_source = cds1

def slider_callback(_attr, _old, _new):
    reset(delta_slider.value, gamma_slider.value, omega_slider.value)

def stream():
    x, xdot = update()
    dict_ = dict(x=x, xdot=xdot)
    cds0.stream(dict_, rollover=rollover)
    if n % timesteps_per_period == 0:
        cds1.stream(dict(x=x[-1:], xdot=xdot[-1:]))

def update():
    global x, xprev, t, n
    ret_x = []
    ret_xdot = []
    for _ in range(timesteps_per_update):
        xnext = (2*beta*x + (alpha - beta)*xprev - dV_dx(x) + gamma*np.cos(omega*t)) / (alpha+beta)
        n += 1
        t += dt
        xdot = (xnext - xprev) / (2*dt)
        xprev = x
        x = xnext
        if n % timesteps_per_plot == 0:
            ret_x.append(x)
            ret_xdot.append(xdot)
    return ret_x, ret_xdot

ps = []
for i in range(2):
    p = figure(
        width=600, height=600, x_range=Range1d(-2.0, 2.0), y_range=Range1d(-2.0, 2.0),
        toolbar_location=None, background_fill_color="#f6f6f6",
    )
    p.xaxis.axis_label = r"$$x \text{ (m)}$$"
    p.yaxis.axis_label = r"$$\frac{dx}{dt} \text{ (m/s)}$$"
    ps.append(p)

ps[0].title = "Phase diagram"
ps[1].title = "Poincaré diagram"

cds0 = ColumnDataSource(data=dict(x=[0], xdot=[0]))
cds1 = ColumnDataSource(data=dict(x=[], xdot=[]))

line = ps[0].line(source=cds0, x="x", y="xdot", alpha=0.5)
circle = ps[1].scatter(source=cds1, x="x", y="xdot", line_alpha=0, fill_alpha=0.5)

delta_slider = Slider(start=0, end=0.6, value=delta, step=0.05, title=r"$$\delta \text{ (damping factor, 1/s)}$$")
gamma_slider = Slider(start=0, end=0.6, value=gamma, step=0.05, title=r"$$\gamma \text{ (amplitude of forcing, m/s}^2)$$")
omega_slider = Slider(start=0.5, end=3.0, value=omega, step=0.05, title=r"$$\omega \text{ (frequency of forcing, 1/s)}$$")

for slider in [delta_slider, gamma_slider, omega_slider]:
    slider.on_change("value", slider_callback)

big = {"font-size": "150%"}
col = [
    Div(text="Duffing oscillator", styles=big),
    Div(text=r"$$\frac{d^2x}{dt^2} + \delta \frac{dx}{dt} - \frac{dV}{dx} = \gamma \cos \omega t,$$", styles=big),
    Div(text=r"where $$\frac{dV}{dx} = -x^3 + x$$", styles=big),
    Paragraph(text="Equation is integrated forward in time using implicit finite difference method."),
    Paragraph(text=r"$$x_i$$ is the value of $$x$$ at time $$t_i = i \Delta t$$ for integer $$i$$ and fixed timestep $$\Delta t$$."),
    Paragraph(text=r"$$x_{i+1}$$ is determined from $$x_{i-1}$$ and $$x_i$$ using"),
    Paragraph(text=r"$$x_{i+1} = \frac{2\beta x_i + (\alpha-\beta) x_{i-1} - \frac{dV}{dx}(x_i) + \gamma \cos \omega t_i}{\alpha+\beta}$$"),
    Paragraph(text=r"where $$\alpha = \frac{\delta}{2\Delta t}$$ and $$\beta = \frac{1}{\Delta t^2}$$"),
    delta_slider,
    gamma_slider,
    omega_slider,
]

doc = curdoc()
doc.add_periodic_callback(stream, 20)
doc.add_root(row(column(col), ps[0], ps[1]))
