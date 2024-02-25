import numpy as np

from bokeh.io import show
from bokeh.models import (
    BoxSelectTool,
    CDSView,
    CustomJS,
    GroupFilter,
    PaletteSelect,
    PanTool,
    ResetTool,
    Toolbar,
    ZoomInTool,
    ZoomOutTool,
)
from bokeh.models.tools import ClickButton, OnOffButton
from bokeh.palettes import Spectral11
from bokeh.plotting import figure

view = CDSView(filter=GroupFilter(column_name="fill_color", group=Spectral11))

select = PaletteSelect(
    value="(unfiltered)",
    items=[("(unfiltered)", Spectral11)] + [(color, [color]) for color in Spectral11],
    swatch_width=30,
    stylesheets=[".bk-entry { font-family: monospace; }"], # TODO propagate to menu
)
select.js_on_change("value", CustomJS(
    args=dict(view=view),
    code="""
export default ({view}, select) => {
    const {value, items} = select
    view.filter.group = new Map(items).get(value)
}
""",
))

children = [
    OnOffButton(tool=PanTool()),
    OnOffButton(tool=BoxSelectTool(persistent=True)),
    None,
    select,
    None,
    ClickButton(tool=ZoomInTool()),
    ClickButton(tool=ZoomOutTool()),
    None, # or TODO Divider()
    ClickButton(tool=ResetTool()),
]
tb = Toolbar(children=children)

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.random.choice(Spectral11, size=N)

p = figure(toolbar=tb, toolbar_location="above")
p.circle(x, y, radius=radii, view=view, fill_color=colors, fill_alpha=0.6, line_color=None)

show(p)
