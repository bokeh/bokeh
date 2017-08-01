import numpy as np
from numpy import pi

from bokeh.client import push_session
from bokeh.driving import cosine
from bokeh.plotting import figure, curdoc

x = np.linspace(0, 4*pi, 80)
y = np.sin(x)

p = figure()
r1 = p.line([0, 4*pi], [-1, 1], color="firebrick")
r2 = p.line(x, y, color="navy", line_width=4)

@cosine(w=0.03)
def update(step):
    r2.data_source.data["y"] = y * step
    r2.glyph.line_alpha = 1 - 0.8 * abs(step)

document = curdoc()
document.add_root(p)
document.add_periodic_callback(update, 50)

if __name__ == "__main__":
    print("\nanimating... press ctrl-C to stop")
    session = push_session(document)
    session.show()
    session.loop_until_closed()
