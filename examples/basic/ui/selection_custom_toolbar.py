import numpy as np

from bokeh.io import show
from bokeh.models import BoxSelectTool, Button, CustomJS, PaletteSelect, Panel, Row
from bokeh.palettes import Spectral11
from bokeh.plotting import figure


def plot(N: int):
    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    radii = np.random.random(size=N) * 1.5
    colors = np.random.choice(Spectral11, size=N)

    p = figure(active_scroll="wheel_zoom", lod_threshold=None, title=f"Plot with N={N} circles")
    cr = p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

    return p, cr

p, cr = plot(500)

box_select = BoxSelectTool(persistent=True)
p.add_tools(box_select)

common = dict(margin=0, sizing_mode="stretch_height")

delete = Button(label="Delete", **common)
select = PaletteSelect(
    value=Spectral11[0],
    items=[(color, [color]) for color in Spectral11],
    swatch_width=30,
    **common,
)
clear = Button(label="Clear", **common)

toolbar = Panel(
    position=box_select.overlay.nodes.bottom_left,
    anchor="top_left",
    width=box_select.overlay.nodes.width,
    elements=[
        Row(
            children=[delete, select, clear],
            spacing=5,
        ),
    ],
    stylesheets=[
        """
        :host {
            background-color: rgb(221 221 221 / 0.5);
            padding: 5px;
        }
        """,
    ],
)
box_select.overlay.elements.append(toolbar)

delete.js_on_click(CustomJS(
    args=dict(renderer=cr),
    code="""
export default ({renderer}) => {
    const {entries} = Bokeh.require("core/util/object")

    const {data, selected} = renderer.data_source
    const indices = new Set(selected.indices)

    const new_data = {}
    for (const [name, column] of entries(data)) {
        new_data[name] = column.filter((value, i) => !indices.has(i))
    }

    renderer.data_source.data = new_data
    renderer.data_source.selected.indices = [] // TODO bug in ds update
}
    """,
))

select.js_on_change("value", CustomJS(
    args=dict(renderer=cr, select=select),
    code="""
export default ({renderer, select}) => {
    const {data, selected} = renderer.data_source
    const indices = new Set(selected.indices)
    const selected_color = select.value

    const fill_color = [...data["fill_color"]]
    for (const i of indices) {
        fill_color[i] = selected_color
    }
    renderer.data_source.data = {...data, fill_color}
}
    """,
))

clear.js_on_click(CustomJS(
    args=dict(renderer=cr, overlay=box_select.overlay),
    code="""
export default ({renderer, overlay}) => {
    overlay.visible = false
    renderer.data_source.selected.indices = []
}
    """,
))

show(p)
