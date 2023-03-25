from bokeh.models import TabPanel, Tabs
from bokeh.plotting import figure, show

p1 = figure(width=300, height=300)
p1.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="navy", alpha=0.5)
tab1 = TabPanel(child=p1, title="circle")

p2 = figure(width=300, height=300)
p2.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=3, color="navy", alpha=0.5)
tab2 = TabPanel(child=p2, title="line")

show(Tabs(tabs=[tab1, tab2]))
