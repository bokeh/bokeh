from bokeh.models import TabPanel, Tabs, Tooltip
from bokeh.models.layouts import Row
from bokeh.plotting import figure, show

p1 = figure(width=300, height=300)
p1.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="navy", alpha=0.5)
tab1 = TabPanel(child=p1, title="circle")

p2 = figure(width=300, height=300)
p2.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=3, color="navy", alpha=0.5)
tab2 = TabPanel(child=p2, title="line")

p3 = figure(width=300, height=300)
p3.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="navy", alpha=0.5)
tab3 = TabPanel(child=p1, title="circle", tooltip=Tooltip(content="test tooltip", position="right"))

p4 = figure(width=300, height=300)
p4.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=3, color="navy", alpha=0.5)
tab4 = TabPanel(child=p2, title="line", tooltip=Tooltip(content="test tooltip", position="right"))

show(Row(Tabs(tabs=[tab1, tab2]), Tabs(tabs=[tab3, tab4])))
