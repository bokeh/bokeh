''' Click a legend entry to cycle its series through marker shapes.

.. bokeh-example-metadata::
    :title: Change markers from the legend
    :keywords: legend, click, callbacks, marker, CustomJS
    :apis: bokeh.models.CustomJS, bokeh.plotting.figure.scatter
    :gallery: A scatter plot with three colored series whose marker shapes change when their legend entries are clicked.
'''

from bokeh.core.enums import MarkerType
from bokeh.models import CustomJS
from bokeh.plotting import figure, show

p = figure(frame_width=420, frame_height=340, title="Click a legend entry to change its markers")

p.scatter(x=[0, 1, 2], y=[1, 2, 3], size=[10, 20, 30],
          marker="circle", color="red", fill_alpha=0.5, legend_label="Red series")
p.scatter(x=[0, 1, 2], y=[2, 3, 4], size=[10, 20, 30],
          marker="circle", color="green", fill_alpha=0.5, legend_label="Green series")
p.scatter(x=[0, 1, 2], y=[3, 4, 5], size=[10, 20, 30],
          marker="circle", color="blue", fill_alpha=0.5, legend_label="Blue series")

legend = p.legend
legend.glyph_width = 40
legend.glyph_height = 40
legend.label_text_font_size = "12pt"
legend.spacing = 8

# Use the largest point in each series as its legend sample.
for item in legend.items:
    item.index = 2

p.add_layout(legend, "right")

callback = CustomJS(args=dict(markers=list(MarkerType)), code="""
    export default ({markers}, {item}) => {
        for (const renderer of item.renderers) {
            const {value: marker} = renderer.glyph.marker
            const next = (markers.indexOf(marker) + 1) % markers.length
            renderer.glyph.marker = {value: markers[next]}
        }
    }
""")
legend.js_on_click(callback)

show(p)
