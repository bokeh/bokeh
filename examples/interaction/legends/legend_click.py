from bokeh.core.enums import MarkerType
from bokeh.models import CustomJS
from bokeh.plotting import figure, show

p = figure(width=300, height=300, title="Click on legend entries to change\nmarkers of the corresponding glyphs")

p.scatter(x=[0, 1, 2], y=[1, 2, 3], size=[10, 20, 30], marker="circle", color="red", fill_alpha=0.5, legend_label="Red item")
p.scatter(x=[0, 1, 2], y=[2, 3, 4], size=[10, 20, 30], marker="circle", color="green", fill_alpha=0.5, legend_label="Green item")
p.scatter(x=[0, 1, 2], y=[3, 4, 5], size=[10, 20, 30], marker="circle", color="blue", fill_alpha=0.5, legend_label="Blue item")

callback = CustomJS(
    args=dict(markers=list(MarkerType)),
    code="""
export default ({markers}, {item}) => {
    for (const renderer of item.renderers) {
        const {value: marker} = renderer.glyph.marker
        const i = markers.indexOf(marker)
        const j = (i + 1) % markers.length
        renderer.glyph.marker = {value: markers[j]}
    }
}
    """,
)
p.legend.js_on_click(callback)
p.legend.location = "top_left"

show(p)
