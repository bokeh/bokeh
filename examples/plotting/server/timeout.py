import sys

import numpy as np

from bokeh.client import push_session
from bokeh.palettes import RdYlBu3
from bokeh.plotting import figure, curdoc

N = 50

p = figure(x_range=(0, 100), y_range=(0, 100), toolbar_location=None)

p.border_fill_color = 'black'
p.background_fill_color = 'black'
p.outline_line_color = None
p.grid.grid_line_color = None

p.rect(x=50, y=50, width=80, height=80,
       line_alpha=0.5, line_color="darkgrey", fill_color=None)

r = p.text(x=[], y=[], text=[], text_color=[],
           text_font_size="20pt", text_baseline="middle", text_align="center")

def make_callback(i):
    ds = r.data_source

    def func():
        if i == N-1:
            ds.data['x'].append(50)
            ds.data['y'].append(95)
            ds.data['text'].append("DONE")
            ds.data['text_color'].append("white")
        else:
            ds.data['x'].append(np.random.random()*70 + 15)
            ds.data['y'].append(np.random.random()*70 + 15)
            ds.data['text_color'].append(RdYlBu3[i%3])
            ds.data['text'].append(str(i))
        ds.trigger('data', ds.data, ds.data)
    func.interval = i * 100

    return func

callbacks = [make_callback(i) for i in range(N)]

document = curdoc()
document.add_root(p)
for callback in callbacks:
    document.add_timeout_callback(callback, callback.interval)
document.add_timeout_callback(sys.exit, (N+4)*100)

if __name__ == "__main__":
    print("\npress ctrl-C to exit")
    session = push_session(document)
    session.show()
    session.loop_until_closed()
