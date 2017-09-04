from bokeh.layouts import column
from bokeh.models import CustomJS, Slider
from bokeh.plotting import figure, show, output_file

aligns    = ["left", "center", "right"]
baselines = ["bottom", "middle", "top" ]

p = figure(x_range=aligns, y_range=baselines, plot_width=800, plot_height=600,
           title="Variations of multi-line text", toolbar_location=None)

p.background_fill_color = "lightgrey"
p.xaxis.axis_label = "align"
p.yaxis.axis_label = "baseline"
p.axis.major_label_text_font_size = "18px"
p.axis.major_label_text_font_style = "bold"

p.xgrid.grid_line_color = None
p.ygrid.grid_line_color = None

texts = [

'''one''',

'''two
lines''',

'''lines
here:
3''',

'''here
are
4
lines'''

]

def xs(cat):
    return [(cat, -0.3), (cat, -0.1), (cat, 0.1), (cat, 0.3)]

def ys(cat):
    return [cat] * 4

renderers = {}
i = 0

for a in aligns:
    for b in baselines:
        r = p.text(xs(a), ys(b), texts, text_align=a, text_baseline=b,
                   text_font_size="14px", text_line_height=1.2)
        renderers["r" + str(i)] = r
        i += 1

slider = Slider(title="Text Angle", start=0, end=45, step=1, value=0)
slider.js_on_change('value', CustomJS(args=renderers, code="""
    rs = [r0, r1, r2 , r3, r4, r5, r6, r7, r8];
    for (i=0; i<9; i++) {
        rs[i].glyph.angle = {value: cb_obj.value, units: "deg"}
    }
"""))

output_file("text.html")
show(column(p, slider))
