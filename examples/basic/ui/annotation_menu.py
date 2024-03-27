import numpy as np

from bokeh.io import show
from bokeh.models import (ActionItem, BoxSelectTool, CheckableItem,
                          CustomJS, DividerItem, Menu)
from bokeh.palettes import Spectral11
from bokeh.plotting import figure

N = 1000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.random.choice(Spectral11, size=N)

plot = figure(active_scroll="wheel_zoom")
cr = plot.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

box_select = BoxSelectTool(persistent=True)
plot.add_tools(box_select)

delete_selected = CustomJS(
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
)

change_color = CustomJS(
    args=dict(renderer=cr),
    code="""
export default ({renderer}, _menu, {item}) => {
    const {data, selected} = renderer.data_source
    const indices = new Set(selected.indices)
    const selected_color = item.label

    const fill_color = [...data["fill_color"]]
    for (const i of indices) {
        fill_color[i] = selected_color
    }
    renderer.data_source.data = {...data, fill_color}
}
    """,
)

change_continuous = CustomJS(
    args=dict(box_select=box_select),
    code="""
export default ({box_select}, _obj, {item}) => {
    const {continuous} = box_select
    box_select.continuous = item.checked = !continuous
}
    """,
)

invert_selection = CustomJS(
    args=dict(renderer=cr),
    code="""
export default ({renderer, overlay}) => {
    renderer.selection_manager.invert()
}
    """,
)

clear_selection = CustomJS(
    args=dict(renderer=cr, overlay=box_select.overlay),
    code="""
export default ({renderer, overlay}) => {
    overlay.visible = false
    renderer.data_source.selected.indices = []
}
    """,
)

menu = Menu(
    items=[
        ActionItem(
            label="Count",
            shortcut="Alt+C",
            disabled=True,
            action=CustomJS(code="""console.log("not implemented")"""),
        ),
        ActionItem(
            label="Delete",
            shortcut="Alt+Shift+D",
            icon="delete",
            action=delete_selected,
        ),
        DividerItem(),
        ActionItem(
            label="Choose color",
            menu=Menu(
                stylesheets=[
                    "\n".join([f".color-{color.removeprefix('#')} {{ background-color: {color}; }}" for color in Spectral11]),
                    ".bk-label { font-family: monospace; }",
                ],
                items=[
                    ActionItem(
                        label=color,
                        icon=f".color-{color.removeprefix('#')}",
                        action=change_color,
                    ) for color in Spectral11
                ],
            ),
        ),
        DividerItem(),
        CheckableItem(
            label="Continuous selection",
            checked=box_select.continuous,
            action=change_continuous,
        ),
        DividerItem(),
        ActionItem(
            icon="invert_selection",
            label="Invert selection",
            action=invert_selection,
        ),
        ActionItem(
            icon="clear_selection",
            label="Clear selection",
            shortcut="Esc",
            action=clear_selection,
        ),
    ],
)
box_select.overlay.context_menu = menu

show(plot)
