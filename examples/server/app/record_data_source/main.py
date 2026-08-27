import math
from typing import Any

from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import DataView, GroupFilter, HoverTool, Slider
from bokeh.plotting import figure

from .record_data_source import RecordDataSource


ASTEROIDS = [
    ("Apophis", 0.92, 0.31, 370, True),
    ("Bennu", 1.13, 1.20, 490, True),
    ("Eros", 1.46, 0.22, 16_840, False),
    ("Didymos", 1.64, 0.38, 780, True),
    ("Itokawa", 1.32, 1.71, 330, False),
    ("Ryugu", 1.19, 2.45, 900, False),
]


def records_at(day: int) -> list[dict[str, Any]]:
    records = []
    for name, radius, phase, diameter, hazardous in ASTEROIDS:
        angle = phase + day/(80*radius)
        records.append({
            "name": name,
            "position": {
                "x": radius*math.cos(angle),
                "y": radius*math.sin(angle),
                "z": 0.18*math.sin(2*angle),
            },
            "diameter": diameter,
            "marker_size": 10 + 4*math.log10(diameter),
            "hazardous": hazardous,
            "color": "#ef476f" if hazardous else "#118ab2",
        })
    return records

source = RecordDataSource()
source.update(records=records_at(0))

plot = figure(
    width=760,
    height=560,
    x_range=(-1.9, 1.9),
    y_range=(-1.9, 1.9),
    match_aspect=True,
    title="Illustrative near-Earth object orbits from nested records",
    tools="pan,wheel_zoom,reset,tap",
)
plot.scatter(
    x="position.x",
    y="position.y",
    size="marker_size",
    color="color",
    alpha=0.8,
    source=source,
)
plot.scatter(
    x="position.x",
    y="position.y",
    size="marker_size",
    marker="triangle",
    fill_color=None,
    line_color="#ffd166",
    line_width=3,
    source=source,
    view=DataView(filter=GroupFilter(field_name="hazardous", group=True)),
)
plot.circle(x=0, y=0, radius=0.055, fill_color="#ffd166", line_color=None)
plot.add_tools(HoverTool(tooltips=[
    ("object", "@name"),
    ("diameter", "@diameter{0,0} m"),
    ("x, y", "(@{position.x}{0.000}, @{position.y}{0.000}) AU"),
    ("z", "@{position.z}{0.000} AU"),
    ("potentially hazardous", "@hazardous"),
]))

day = Slider(start=0, end=365, value=0, step=1, title="Days from epoch")


def update_records(attr: str, old: int, new: int) -> None:
    source.update(records=records_at(new))

day.on_change("value", update_records)

curdoc().add_root(column(plot, day))
curdoc().title = "RecordDataSource"
