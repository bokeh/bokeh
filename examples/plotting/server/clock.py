# You must first run "bokeh serve" to view this example

from math import pi, cos, sin
import datetime

from bokeh.client import push_session
from bokeh.io import curdoc
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource, LabelSet

# Draw clock face
p = figure(x_range=(-12, 12), y_range=(-12, 12), tools="")
p.axis.visible = False
p.grid.visible = False
p.outline_line_alpha = 0

p.circle(x=0, y=0, radius=11, fill_alpha=0, line_color="#dddddd", line_width=4)

# add hour markers
r = 10
hours = list(range(1, 13))
angles = [-(pi/6)*(hour % 12) + pi/2 for hour in hours]

label_source = ColumnDataSource(dict(
    hours=hours,
    x=[cos(a)*r for a in angles],
    y=[sin(a)*r for a in angles]
    ))

labels = LabelSet(x='x', y='y', text='hours', source=label_source,
                  text_align='center', text_baseline='middle',
                  text_color="#666666", text_font_size="20pt",
                  text_font="Helvetica")
p.add_layout(labels)

# add the seconds, minutes, and hours hand at current time.
start = datetime.datetime.now().time()
ds = ColumnDataSource(dict(angle=[-(pi/6)*((start.hour % 12) + start.minute/60) + pi/2,
                                  -(pi/30)*start.minute + pi/2,
                                  -(pi/30)*start.second + pi/2],
                           color=['black', 'black', 'red'],
                           line_width=[6, 4, 2],
                           length=[6, 9, 9.5]))

p.ray(x=0, y=0, length='length', angle='angle',
      color='color', line_width='line_width', source=ds)

# open a session to keep our local document in sync with server
session = push_session(curdoc())


def update():
    ds.data.update(angle=[ds.data['angle'][0] - ((pi/30)/60)/12,
                          ds.data['angle'][1] - (pi/30)/60,
                          ds.data['angle'][2] - pi/30])


curdoc().add_periodic_callback(update, 1000)


session.show(p)  # open the document in a browser

session.loop_until_closed()  # run forever
