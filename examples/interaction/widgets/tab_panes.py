from bokeh.models import Row, TabPanel, Tabs, Tooltip
from bokeh.models.dom import HTML
from bokeh.plotting import figure, show


def plots(color: str):
    p1 = figure(width=300, height=300)
    p1.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], radius=[0.2, 0.6, 1.0, 1.4, 1.8], color=color, alpha=0.5)

    p2 = figure(width=300, height=300)
    p2.scatter([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, marker=["asterisk", "circle", "diamond", "hex", "inverted_triangle"], color=color, alpha=0.5)

    p3 = figure(width=300, height=300)
    p3.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=3, color=color, alpha=0.5)

    return [p1, p2, p3]

plots0 = plots("navy")
plots1 = plots("red")

tabs0 = Tabs(
    tabs=[
        TabPanel(child=plots0[0], title="circle", tooltip="This is the first tab."),
        TabPanel(child=plots0[1], title="scatter", tooltip=HTML(html="This is the <b>second</b> tab.")),
        TabPanel(child=plots0[2], title="line", tooltip=Tooltip(content=HTML(html="This is the <b>third</b> tab."), position="center_right"), closable=True),
    ],
    tabs_location="above",
)

tabs1 = Tabs(
    tabs=[
        TabPanel(child=plots1[0], title="circle", tooltip="This is the first tab."),
        TabPanel(child=plots1[1], title="scatter", tooltip=HTML(html="This is the <b>second</b> tab.")),
        TabPanel(child=plots1[2], title="line", tooltip=Tooltip(content=HTML(html="This is the <b>third</b> tab."), position="center_right"), closable=True),
    ],
    tabs_location="right",
)

show(Row(children=[tabs0, tabs1]))
