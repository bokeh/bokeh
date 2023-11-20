from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models import CustomJS, InlineStyleSheet, Pane, Slider

hue_value = 0
alpha_value = 0.5

box_style = InlineStyleSheet(css=f"""
:host {{
    width: 200px;
    height: 200px;
    background-color: hsl({hue_value} 100% 50% / {alpha_value});
}}
""")

box = Pane(stylesheets=[box_style])

hue_style = InlineStyleSheet(css="""
.bk-track {
    background: linear-gradient(to right,
        hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%));
}
.bk-span {
    opacity: 0;
}
.bk-handle {
    background-color: hsl(calc(360*var(--value)) 100% 50%);
}
""")

alpha_style = InlineStyleSheet(css="""
:host {
    --hue: 0;
}
:host {
    --track-size: 3em;
    --handle-size: var(--track-size);
}
.bk-track {
    overflow: hidden;
    background:
        linear-gradient(to right, hsl(var(--hue) 100% 50% / 0), hsl(var(--hue) 100% 50% / 1)),
        repeating-conic-gradient(#808080 0% 25%, white 0% 50%) 50% / 20px 20px;
}
.bk-handle {
    border: 1px solid white;
    background-color: transparent;
}
.bk-span {
    opacity: 0;
}
""")

hue = Slider(title="Hue", value=hue_value, start=0, end=360, step=1, stylesheets=[hue_style])
alpha = Slider(title="Alpha", value=alpha_value, start=0, end=1, step=None, stylesheets=[alpha_style, ""])

change_hue = CustomJS(args=dict(alpha=alpha, hue=hue), code="""
export default ({alpha, hue}) => {
    const [base] = alpha.stylesheets
    alpha.stylesheets = [base, `:host { --hue: ${hue.value}; }`]
}
""")
hue.js_on_change("value", change_hue)

change_fill = CustomJS(args=dict(box=box, hue=hue, alpha=alpha), code="""
export default ({box, hue, alpha}) => {
    const color = `hsl(${hue.value} 100% 50% / ${alpha.value})`
    box.styles = {...box.styles, "background-color": color}
}
""")
hue.js_on_change("value", change_fill)
alpha.js_on_change("value", change_fill)

sliders = column([hue, alpha])
layout = row([box, sliders], spacing=10)

show(layout)
