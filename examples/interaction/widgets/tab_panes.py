from bokeh.models import TabPanel, Tabs, Tooltip
from bokeh.models.layouts import Row
from bokeh.plotting import figure, show

p1 = figure(width=300, height=300)
p1.scatter([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="navy", alpha=0.5)

p2 = figure(width=300, height=300)
p2.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=3, color="navy", alpha=0.5)

p3 = figure(width=300, height=300)
p3.scatter([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="navy", alpha=0.5)

p4 = figure(width=300, height=300)
p4.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=3, color="navy", alpha=0.5)

tabs0 = Tabs(tabs=[
    TabPanel(child=p1, title="circle"),
    TabPanel(child=p2, title="line"),
])

tabs1 = Tabs(tabs=[
    TabPanel(child=p1, title="circle", tooltip=Tooltip(content="This is the first tab.", position="bottom_center")),
    TabPanel(child=p2, title="line", tooltip=Tooltip(content="This is the second tab.", position="bottom_center")),
])

show(Row(tabs0, tabs1))
