from bokeh.core.enums import LocationType as Location
from bokeh.models import Plot, Row, TabPanel, Tabs, Tooltip
from bokeh.models.dom import HTML
from bokeh.plotting import figure, show


def plots(color: str) -> list[Plot]:
    p1 = figure(width=300, height=300)
    p1.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], radius=[0.2, 0.6, 1.0, 1.4, 1.8], color=color, alpha=0.5)

    p2 = figure(width=300, height=300)
    p2.scatter([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, marker=["asterisk", "circle", "diamond", "hex", "inverted_triangle"], color=color, alpha=0.5)

    p3 = figure(width=300, height=300)
    p3.rect([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], width=1, height=1, color=color, alpha=0.5)

    p4 = figure(width=300, height=300)
    p4.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=3, color=color, alpha=0.5)

    return [p1, p2, p3, p4]

def tabs(plots: list[Plot], location: Location):
    return Tabs(
        active=-1,
        tabs=[
            TabPanel(child=plots[0], title="circle", tooltip="This is the first tab."),
            TabPanel(child=plots[1], title="scatter", tooltip=HTML(html="This is the <b>second</b> tab.")),
            TabPanel(child=plots[2], title="rect", tooltip=HTML(html="This is the <b>third</b> tab."), disabled=True),
            TabPanel(child=plots[3], title="line", tooltip=Tooltip(content=HTML(html="This is the <b>forth</b> tab."), position="center_right"), closable=True),
        ],
        tabs_location=location,
    )

tabs0 = tabs(plots("navy"), "above")
tabs1 = tabs(plots("red"), "right")

show(Row(children=[tabs0, tabs1]))
